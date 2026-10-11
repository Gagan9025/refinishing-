import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { INITIAL_USERS } from '../data/mockData';
import { Storage } from '../utils/storage';

export const authService = {
  /**
   * Log in user using credentials (supports mock demo credentials & Firebase Auth)
   * @param {string} username 
   * @param {string} password 
   * @returns {Promise<{success: boolean, user?: object, error?: string}>}
   */
  async login(username, password) {
    const trimmedUser = (username || '').trim().toLowerCase();

    // 1. Check local demo accounts first for instant access
    const foundUser = INITIAL_USERS.find(
      (u) => u.username.toLowerCase() === trimmedUser && u.password === password
    );

    if (foundUser) {
      const userSession = {
        id: foundUser.id,
        username: foundUser.username,
        name: foundUser.name,
        role: foundUser.role,
        department: foundUser.department,
        loginAt: new Date().toISOString()
      };
      Storage.setCurrentUser(userSession);

      // Best effort sync session to Firestore
      try {
        const userDocRef = doc(db, 'users', foundUser.id);
        await setDoc(userDocRef, { ...userSession, lastActiveAt: new Date().toISOString() }, { merge: true });
      } catch (e) {
        // Continue silently if offline
      }

      return { success: true, user: userSession };
    }

    // 2. If entered an email format, attempt Firebase Auth
    if (trimmedUser.includes('@')) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, trimmedUser, password);
        const fbUser = userCredential.user;

        // Try to fetch custom role from Firestore users collection
        let role = 'VIEWER';
        let department = 'Refinishing Dept';
        try {
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            role = data.role || role;
            department = data.department || department;
          }
        } catch (e) {}

        const userSession = {
          id: fbUser.uid,
          username: fbUser.email,
          name: fbUser.displayName || fbUser.email.split('@')[0],
          role: role,
          department: department,
          loginAt: new Date().toISOString()
        };
        Storage.setCurrentUser(userSession);
        return { success: true, user: userSession };
      } catch (err) {
        return {
          success: false,
          error: `Firebase Auth error: ${err.message}`
        };
      }
    }

    return {
      success: false,
      error: 'Invalid username or password. Use demo credentials (entry / entry123 or viewer / viewer123).'
    };
  },

  /**
   * Log out currently logged in user
   */
  async logout() {
    try {
      await signOut(auth);
    } catch (e) {}
    Storage.clearCurrentUser();
    return { success: true };
  },

  /**
   * Get current authenticated user session
   */
  getCurrentUser() {
    return Storage.getCurrentUser();
  },

  /**
   * Role check helper: Is Data Entry role?
   */
  canEdit(user) {
    return user && user.role === 'DATA ENTRY';
  },

  /**
   * Role check helper: Is Viewer role?
   */
  isViewer(user) {
    return user && user.role === 'VIEWER';
  }
};
