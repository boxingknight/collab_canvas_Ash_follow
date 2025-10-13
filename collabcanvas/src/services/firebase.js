import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';

// CRITICAL DEBUG: Log all environment variables
console.log('🔍 Environment Check:', {
  nodeEnv: import.meta.env.MODE,
  allEnvKeys: Object.keys(import.meta.env),
  hasViteFirebaseApiKey: 'VITE_FIREBASE_API_KEY' in import.meta.env,
  hasViteFirebaseProjectId: 'VITE_FIREBASE_PROJECT_ID' in import.meta.env
});

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Log config (without sensitive data) for debugging
console.log('🔥 Firebase Config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  hasApiKey: !!firebaseConfig.apiKey,
  hasAppId: !!firebaseConfig.appId,
  // Log actual values to see if they're undefined
  rawValues: {
    apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 10)}...` : 'UNDEFINED',
    projectId: firebaseConfig.projectId || 'UNDEFINED',
    authDomain: firebaseConfig.authDomain || 'UNDEFINED',
    appId: firebaseConfig.appId ? `${firebaseConfig.appId.substring(0, 20)}...` : 'UNDEFINED'
  }
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const rtdb = getDatabase(app);  // Realtime Database
export const auth = getAuth(app);

console.log('Firebase initialized:', {
  appName: app.name,
  firestoreInitialized: !!db,
  realtimeDatabaseInitialized: !!rtdb,
  authInitialized: !!auth
});

// Set auth persistence to LOCAL (persists even when browser is closed)
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Error setting auth persistence:', error);
});

export default app;
