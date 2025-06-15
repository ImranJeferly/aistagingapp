import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
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
      
      const userData = {
        uid: user.uid,
        email,
        displayName: displayName || '',
        photoURL: photoURL || '',
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
      console.log('User document already exists');
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
    
    // Create user document in Firestore
    await createUserDocument(userCredential.user, {
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`,
      authProvider: 'email'
    });
    
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
