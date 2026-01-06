import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) {
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  // robust extraction of the private key
  if (privateKey) {
    // 1. Handle JSON stringified input (common in some configs)
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        const keyToParse = privateKey;
        try {
            // Try processing as a string literal to handle escaped characters correctly
            privateKey = JSON.parse(keyToParse);
        } catch (e) {
            // Fallback: manual stripping if parse fails
            privateKey = keyToParse.slice(1, -1);
        }
    }

    // 2. Handle literal \n sequences (often from .env files or clipboard)
    privateKey = privateKey!.replace(/\\n/g, '\n');
  }

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
    console.warn('Firebase Admin not initialized: Missing FIREBASE_PRIVATE_KEY or FIREBASE_CLIENT_EMAIL');
  }
}

const adminDb = getApps().length ? getFirestore() : null;
const adminAuth = getApps().length ? getAuth() : null;

export { adminDb, adminAuth };
