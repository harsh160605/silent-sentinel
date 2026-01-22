import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

let app = null;
let auth = null;
let db = null;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const initializeFirebase = () => {
  if (!app) {
    try {
      // Check if we have valid config
      if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'AIzaSyDemoKey123456789') {
        console.warn('⚠️ Firebase not configured or using demo key. Using demo mode. Set environment variables in Netlify/Vercel.');
        return { app: null, auth: null, db: null };
      }

      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);

      // Enable offline persistence
      enableIndexedDbPersistence(db).catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn('Persistence failed: Multiple tabs open');
        } else if (err.code === 'unimplemented') {
          console.warn('Persistence not available in this browser');
        }
      });
    } catch (error) {
      console.error('Firebase initialization failed:', error);
      return { app: null, auth: null, db: null };
    }
  }

  return { app, auth, db };
};

export const getFirebaseAuth = () => {
  if (!auth) {
    const { auth: initializedAuth } = initializeFirebase();
    return initializedAuth;
  }
  return auth;
};

export const getFirebaseDb = () => {
  if (!db) {
    const { db: initializedDb } = initializeFirebase();
    return initializedDb;
  }
  return db;
};

// Anonymous authentication helper with retry logic
export const signInAnonymouslyHelper = async (maxRetries = 3) => {
  const auth = getFirebaseAuth();
  if (!auth) {
    console.warn('Auth not initialized. Skipping anonymous sign-in.');
    return { uid: 'demo-user', isAnonymous: true };
  }

  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const userCredential = await signInAnonymously(auth);
      return userCredential.user;
    } catch (error) {
      lastError = error;
      console.warn(`Anonymous auth attempt ${attempt}/${maxRetries} failed:`, error.code);

      // If it's a network error, wait and retry
      if (error.code === 'auth/network-request-failed' && attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
        continue;
      }

      // For other errors, don't retry
      break;
    }
  }

  // If all retries failed, return demo user instead of crashing
  console.error('Anonymous auth failed after all retries:', lastError);
  console.warn('Falling back to demo user mode');
  return { uid: 'demo-user', isAnonymous: true, isDemo: true };
};

// Auth state observer helper
export const observeAuthState = (callback) => {
  const auth = getFirebaseAuth();
  if (!auth) {
    console.warn('Auth not initialized. observeAuthState will not fire.');
    return () => { }; // return empty unsubscribe
  }
  return onAuthStateChanged(auth, callback);
};

