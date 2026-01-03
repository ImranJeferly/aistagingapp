import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  sendEmailVerification,
  User,
  UserCredential
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export interface UserData {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  photoURL?: string;
  plan: 'free' | 'basic' | 'pro'; // Add plan field
  ipAddress?: string;
  ipRestricted?: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Password validation
export const validatePassword = (password: string): string[] => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/(?=.*[@$!%*?&])/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)');
  }
  
  return errors;
};

// Create user document in Firestore
export const createUserDocument = async (user: User, additionalData?: any): Promise<void> => {
  if (!user) return;
  
  const userRef = doc(db, 'users', user.uid);
  
  try {
    const userSnapshot = await getDoc(userRef);
    
    if (!userSnapshot.exists()) {
      const { displayName, email, photoURL } = user;
      const createdAt = serverTimestamp();
      const updatedAt = serverTimestamp();
      
      // Try to parse first and last name from display name if not provided
      let firstName = additionalData?.firstName || '';
      let lastName = additionalData?.lastName || '';
      
      if (!firstName && !lastName && displayName) {
        const nameParts = displayName.split(' ');
        if (nameParts.length > 0) {
          firstName = nameParts[0];
          lastName = nameParts.slice(1).join(' ');
        }
      }

      const userData = {
        uid: user.uid,
        email,
        displayName: displayName || '',
        photoURL: photoURL || '',
        firstName,
        lastName,
        plan: 'free', // Default to free tier for new users
        createdAt,
        updatedAt,
        ...additionalData
      };
      
      await setDoc(userRef, userData);
        // Create uploads subcollection with an initial document to ensure the subcollection exists
      const uploadsRef = collection(db, 'users', user.uid, 'uploads');
      await addDoc(uploadsRef, {
        type: 'initialization',
        createdAt: serverTimestamp(),
        isInitialDocument: true,
        status: 'initialization', // Ensure this doesn't match 'completed' status
        uploadedAt: serverTimestamp() // Add uploadedAt but with initialization status
      });
      
      console.log('User document and uploads subcollection created successfully');
    } else {
      // Document exists - check for missing data or additional data to merge
      const currentData = userSnapshot.data();
      const updates: any = {};
      
      // 1. Check for missing basic fields that we can get from Auth User
      if (!currentData.email && user.email) updates.email = user.email;
      if (!currentData.displayName && user.displayName) updates.displayName = user.displayName;
      if (!currentData.photoURL && user.photoURL) updates.photoURL = user.photoURL;
      
      // 2. Check for missing names if we have a display name
      if ((!currentData.firstName || !currentData.lastName) && user.displayName) {
        const nameParts = user.displayName.split(' ');
        if (!currentData.firstName && nameParts.length > 0) {
          updates.firstName = nameParts[0];
        }
        if (!currentData.lastName && nameParts.length > 1) {
          updates.lastName = nameParts.slice(1).join(' ');
        }
      }

      // 3. Merge additional data if provided
      if (additionalData) {
        Object.assign(updates, additionalData);
      }

      // 4. Apply updates if any
      if (Object.keys(updates).length > 0) {
        console.log('Updating user document with missing/additional data');
        updates.updatedAt = serverTimestamp();
        await setDoc(userRef, updates, { merge: true });
      } else {
        console.log('User document already exists and is up to date');
      }
    }
  } catch (error: any) {
    console.error('Error creating user document:', error);
    if (error.code === 'permission-denied') {
      throw new Error('Permission denied. Please check Firestore security rules.');
    }
    throw error;
  }
};

// Register with email and password
export const registerWithEmailAndPassword = async (userData: RegisterData): Promise<UserCredential> => {
  const { email, password, firstName, lastName } = userData;
  
  // Validate password
  const passwordErrors = validatePassword(password);
  if (passwordErrors.length > 0) {
    throw new Error(passwordErrors.join('. '));
  }
  
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update auth profile
    await updateProfile(userCredential.user, {
      displayName: `${firstName} ${lastName}`
    });

    // Create user document in Firestore
    await createUserDocument(userCredential.user, {
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`,
      authProvider: 'email'
    });

    // Send verification code (via API)
    try {
      const token = await userCredential.user.getIdToken();
      await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: userCredential.user.email,
          userId: userCredential.user.uid
        })
      });
    } catch (err) {
      console.error('Failed to send initial verification code:', err);
      // Don't fail registration if email sending fails, user can resend later
    }
    
    return userCredential;
  } catch (error: any) {
    console.error('Error registering user:', error);
    throw new Error(getFirebaseErrorMessage(error.code));
  }
};

// Login with email and password
export const loginWithEmailAndPassword = async (email: string, password: string): Promise<UserCredential> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error: any) {
    console.error('Error logging in:', error);
    throw new Error(getFirebaseErrorMessage(error.code));
  }
};

// Login with Google
export const loginWithGoogle = async (): Promise<UserCredential> => {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    
    // Create user document if it doesn't exist
    await createUserDocument(userCredential.user, {
      authProvider: 'google'
    });
    
    return userCredential;
  } catch (error: any) {
    console.error('Error logging in with Google:', error);
    throw new Error(getFirebaseErrorMessage(error.code));
  }
};

// Logout
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

// Get user data from Firestore
export const getUserData = async (uid: string): Promise<UserData | null> => {
  if (!uid) return null;
  
  try {
    const userRef = doc(db, 'users', uid);
    const userSnapshot = await getDoc(userRef);
    
    if (userSnapshot.exists()) {
      return userSnapshot.data() as UserData;
    } else {
      console.log('No user document found');
      return null;
    }
  } catch (error: any) {
    console.error('Error getting user data:', error);
    if (error.code === 'permission-denied') {
      console.error('Permission denied when fetching user data');
    }
    return null;
  }
};

// Update user data in Firestore
export const updateUserData = async (uid: string, data: Partial<UserData>): Promise<void> => {
  if (!uid) return;
  
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error: any) {
    console.error('Error updating user data:', error);
    throw error;
  }
};

// Helper function to get user-friendly error messages
const getFirebaseErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password is too weak.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/operation-not-allowed':
      return 'Operation not allowed.';
    case 'auth/popup-closed-by-user':
      return 'Authentication popup was closed.';
    case 'auth/popup-blocked':
      return 'Authentication popup was blocked by the browser.';
    default:
      return 'An error occurred during authentication.';
  }
};
