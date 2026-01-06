import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  if (privateKey && process.env.FIREBASE_CLIENT_EMAIL) {
    try {
      initializeApp({
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        })
      });
      console.log('Firebase Admin initialized successfully');
    } catch (error) {
      console.error('Firebase Admin initialization failed:', error);
    }
  } else {
    // Fallback for build time or when keys aren't present
    // This allows the app to build but runtime features needing admin will fail
    console.warn('Firebase Admin not initialized: Missing FIREBASE_PRIVATE_KEY or FIREBASE_CLIENT_EMAIL');
  }
}

const adminDb = getApps().length ? getFirestore() : null;
const adminAuth = getApps().length ? getAuth() : null;

export { adminDb, adminAuth };
