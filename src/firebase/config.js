import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

/**
 * Firebase Project Configuration
 * Project ID: refinishing-3ffac
 */
export const firebaseConfig = {
  apiKey: "AIzaSyDR9bI1yujFif30JOoSS828DBrJx9ecet8",
  authDomain: "refinishing-3ffac.firebaseapp.com",
  projectId: "refinishing-3ffac",
  storageBucket: "refinishing-3ffac.firebasestorage.app",
  messagingSenderId: "529233312363",
  appId: "1:529233312363:web:ea4b69ed5bafc0cf110f2e",
  measurementId: "G-M92RGYKH89"
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore & Firebase Auth
export const db = getFirestore(app);
export const auth = getAuth(app);
