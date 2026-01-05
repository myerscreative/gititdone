import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Only initialize Firebase on the client side (for static export compatibility)
function initializeFirebase() {
  if (typeof window === 'undefined') {
    // Return dummy objects during SSR/build - these should never be used
    return {
      db: null as unknown as Firestore,
      auth: null as unknown as Auth,
    };
  }
  
  // Debug: Log config values (API key will be visible in client bundle - this is expected for Firebase)
  console.log('Firebase Config Check:', {
    hasApiKey: !!firebaseConfig.apiKey,
    hasProjectId: !!firebaseConfig.projectId,
    hasAuthDomain: !!firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
  });
  
  // Validate config exists before initializing
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error('❌ Firebase config is missing. Check your environment variables.');
    console.error('Missing values:', {
      apiKey: !firebaseConfig.apiKey,
      projectId: !firebaseConfig.projectId,
      authDomain: !firebaseConfig.authDomain,
    });
    return {
      db: null as unknown as Firestore,
      auth: null as unknown as Auth,
    };
  }
  
  try {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const db = getFirestore(app);
    const auth = getAuth(app);
    
    console.log('✅ Firebase initialized successfully');
    return { db, auth };
  } catch (error: any) {
    console.error('❌ Firebase initialization error:', error);
    console.error('Error details:', {
      code: error?.code,
      message: error?.message,
      stack: error?.stack,
    });
    return {
      db: null as unknown as Firestore,
      auth: null as unknown as Auth,
    };
  }
}

const { db, auth } = initializeFirebase();

export { db, auth };
