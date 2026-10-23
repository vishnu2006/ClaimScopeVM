import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  browserLocalPersistence,
  setPersistence,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDj1NYHO2Co6GN4IEne2nl9ELVT0-MrwQ8',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'claimscope-878fc.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'claimscope-878fc',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'claimscope-878fc.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '171819028235',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:171819028235:web:e0f8f768bd3b97dae1dc0e',
};

// Check if credentials are provided
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let googleProvider: GoogleAuthProvider | undefined;

if (typeof window !== 'undefined') {
  if (isFirebaseConfigured) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    // Explicitly enforce browser local persistence across tabs and sessions
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.warn('Firebase setPersistence error:', err);
    });
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
  } else {
    console.warn(
      'ClaimScope: Firebase credentials not found in environment variables. Authentication running in demo/unconfigured mode.'
    );
  }
}

export { app, auth, googleProvider };
