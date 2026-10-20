import { supabase } from '../supabase/config';
import { INITIAL_USERS } from '../data/mockData';
import { Storage } from '../utils/storage';
import { adminService } from './adminService';

export const authService = {
  /**
   * Log in user using credentials (supports mock demo credentials & Supabase Auth)
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
      // Check if this account has been deactivated in the DB (non-fatal if DB unreachable)
      const isActive = await adminService.checkIsActive(foundUser.id);
      if (isActive === false) {
        return { success: false, error: 'Your account has been deactivated. Please contact an Administrator.' };
      }

      const userSession = {
        id: foundUser.id,
        username: foundUser.username,
        name: foundUser.name,
        role: foundUser.role,
        department: foundUser.department,
        loginAt: new Date().toISOString()
      };
      Storage.setCurrentUser(userSession);

      // Best effort sync session to Supabase users table and record login timestamp
      try {
        await supabase
          .from('users')
          .upsert(
            {
              id: foundUser.id,
              username: foundUser.username,
              name: foundUser.name,
              role: foundUser.role,
              department: foundUser.department,
              loginAt: new Date().toISOString()
            },
            { onConflict: 'id' }
          );
      } catch (e) {
        // Continue silently if offline
      }

      return { success: true, user: userSession };
    }

    // 2. Check Supabase users table so any user created via Admin can log in from ANY device
    try {
      const { data: dbUser } = await supabase
        .from('users')
        .select('*')
        .eq('username', trimmedUser)
        .maybeSingle();

      if (dbUser) {
        if (dbUser.is_active === false) {
          return { success: false, error: 'Your account has been deactivated. Please contact an Administrator.' };
        }

        // Check password if stored, or allow demo password format
        if (dbUser.password_hash && dbUser.password_hash !== password) {
          return { success: false, error: 'Invalid password. Please check your credentials.' };
        }

        const userSession = {
          id: dbUser.id,
          username: dbUser.username,
          name: dbUser.name || dbUser.username,
          role: (dbUser.role || 'VIEWER').toUpperCase(),
          department: dbUser.department || 'Refinishing Dept',
          loginAt: new Date().toISOString()
        };
        Storage.setCurrentUser(userSession);

        try {
          await supabase.from('users').update({ loginAt: new Date().toISOString() }).eq('id', dbUser.id);
        } catch (_) {}

        return { success: true, user: userSession };
      }
    } catch (e) {
      // Continue to Supabase Auth check
    }

    // 2. If entered an email format, attempt Supabase Auth
    if (trimmedUser.includes('@')) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedUser,
          password
        });

        if (error) throw error;

        const sbUser = data.user;

        // Try to fetch custom role from Supabase users table
        let role = 'VIEWER';
        let department = 'Refinishing Dept';
        try {
          const { data: userData } = await supabase
            .from('users')
            .select('role, department')
            .eq('id', sbUser.id)
            .single();
          if (userData) {
            role = userData.role || role;
            department = userData.department || department;
          }
        } catch (e) {}

        const userSession = {
          id: sbUser.id,
          username: sbUser.email,
          name: sbUser.user_metadata?.name || sbUser.email.split('@')[0],
          role,
          department,
          loginAt: new Date().toISOString()
        };
        Storage.setCurrentUser(userSession);
        return { success: true, user: userSession };
      } catch (err) {
        return {
          success: false,
          error: `Supabase Auth error: ${err.message}`
        };
      }
    }

    return {
      success: false,
      error: 'Invalid username or password. Demo: admin / admin123 · entry / entry123 · viewer / viewer123'
    };
  },

  /**
   * Log out currently logged in user
   */
  async logout() {
    try {
      await supabase.auth.signOut();
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
  },

  /**
   * Role check helper: Is Administrator role?
   */
  isAdmin(user) {
    return user && user.role === 'ADMIN';
  }
};
