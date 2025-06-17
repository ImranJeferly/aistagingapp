import { 
  collection, 
  doc, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getDailyLimit, getMonthlyLimit, type PricingTier } from './pricingService';

export interface UploadRecord {
  id?: string;
  userId: string;
  uploadedAt: Timestamp;
  imageSize: number;
  imageName: string;
  status: 'completed';
  isInitialDocument?: boolean;
  style: string; // Store the selected style
  roomType: string; // Store the selected room type
}

// Get user tier from Firestore user document
export const getUserTier = async (userId: string): Promise<PricingTier> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const plan = userData.plan;
      
      // Validate that the plan is a valid PricingTier
      if (plan === 'free' || plan === 'basic' || plan === 'pro') {
        return plan;
      }
    }
    
    // Default to free tier if user document doesn't exist or plan is invalid
    return 'free';
  } catch (error) {
    console.error('Error fetching user tier from Firestore:', error);
    // Return free tier as fallback on error
    return 'free';
  }
};

export const getUserDailyLimit = async (userId: string): Promise<number> => {
  const tier = await getUserTier(userId);
  return getDailyLimit(tier);
};

export const getUserMonthlyLimit = async (userId: string): Promise<number> => {
  const tier = await getUserTier(userId);
  return getMonthlyLimit(tier);
};

export const addCompletedUploadRecord = async (uploadData: Omit<UploadRecord, 'id' | 'status'>): Promise<string> => {
  try {
    // Store upload records in the user's uploads subcollection - only for completed uploads
    const uploadsRef = collection(db, 'users', uploadData.userId, 'uploads');
    const docRef = await addDoc(uploadsRef, {
      ...uploadData,
      status: 'completed' as const
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding upload record:', error);
    throw error;
  }
};

export const getUserTotalUploads = async (userId: string): Promise<UploadRecord[]> => {
  try {
    // Query all completed uploads for the user (for free tier lifetime limit)
    const uploadsRef = collection(db, 'users', userId, 'uploads');
    const q = query(
      uploadsRef,
      where('status', '==', 'completed')
    );
    
    const querySnapshot = await getDocs(q);
    
    // Filter out initialization document
    const uploads = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      } as UploadRecord))
      .filter(upload => upload.id !== 'init');
    
    return uploads;
  } catch (error) {
    console.error('Error getting total user uploads:', error);
    return [];
  }
};

export const getUserUploadsThisMonth = async (userId: string): Promise<UploadRecord[]> => {
  try {
    // Calculate start of current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Query the user's uploads subcollection for this month
    const uploadsRef = collection(db, 'users', userId, 'uploads');
    const q = query(
      uploadsRef,
      where('uploadedAt', '>=', Timestamp.fromDate(startOfMonth)),
      where('status', '==', 'completed')
    );
    
    const querySnapshot = await getDocs(q);
    
    // Filter out initialization document in code instead of query
    const uploads = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      } as UploadRecord))
      .filter(upload => !upload.isInitialDocument);
    
    return uploads;
  } catch (error) {
    console.error('Error getting user monthly uploads:', error);
    // Return empty array instead of throwing - new users might not have uploads collection yet
    return [];
  }
};

export const getUserUploadsToday = async (userId: string): Promise<UploadRecord[]> => {
  try {
    // Calculate 24 hours ago
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    
    // Query the user's uploads subcollection with simplified query
    const uploadsRef = collection(db, 'users', userId, 'uploads');
    const q = query(
      uploadsRef,
      where('uploadedAt', '>=', Timestamp.fromDate(twentyFourHoursAgo)),
      where('status', '==', 'completed')
    );
    
    const querySnapshot = await getDocs(q);
    
    // Filter out initialization document in code instead of query
    const uploads = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      } as UploadRecord))
      .filter(upload => !upload.isInitialDocument);
    
    return uploads;
  } catch (error) {
    console.error('Error getting user uploads:', error);
    // Return empty array instead of throwing - new users might not have uploads collection yet
    return [];
  }
};

export const getRemainingUploads = async (userId: string): Promise<{ daily: number; monthly: number }> => {
  try {
    const tier = await getUserTier(userId);
    const [todayUploads, dailyLimit, monthlyLimit] = await Promise.all([
      getUserUploadsToday(userId),
      getUserDailyLimit(userId),
      getUserMonthlyLimit(userId)
    ]);
    
    let monthlyUploads: UploadRecord[];
    
    // For free tier, use total uploads (lifetime limit)
    // For paid tiers, use monthly uploads
    if (tier === 'free') {
      monthlyUploads = await getUserTotalUploads(userId);
    } else {
      monthlyUploads = await getUserUploadsThisMonth(userId);
    }
    
    const dailyRemaining = Math.max(0, dailyLimit - todayUploads.length);
    const monthlyRemaining = Math.max(0, monthlyLimit - monthlyUploads.length);
    
    return {
      daily: dailyRemaining,
      monthly: monthlyRemaining
    };
  } catch (error) {
    console.error('Error getting remaining uploads:', error);
    // Return free tier limits for new users or when there's an error
    return {
      daily: 999, // Updated to match new free tier daily limit
      monthly: 5  // Updated to match new free tier total limit
    };
  }
};

export const canUserUpload = async (userId: string): Promise<boolean> => {
  try {
    const remaining = await getRemainingUploads(userId);
    const tier = await getUserTier(userId);
    
    // For all tiers now, check monthly/total limit
    // Free tier: monthly represents total lifetime uploads (5 max)
    // Paid tiers: monthly represents monthly uploads
    return remaining.monthly > 0;
  } catch (error) {
    console.error('Error checking upload permission:', error);
    return false;
  }
};

export const getAllUserUploads = async (userId: string): Promise<UploadRecord[]> => {
  try {
    const uploadsRef = collection(db, 'users', userId, 'uploads');
    const q = query(
      uploadsRef,
      where('status', '==', 'completed'),
      orderBy('uploadedAt', 'desc'),
      limit(50) // Limit to 50 most recent uploads
    );
    
    const querySnapshot = await getDocs(q);
    
    const uploads = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      } as UploadRecord))
      .filter(upload => !upload.isInitialDocument);
    
    return uploads;
  } catch (error) {
    console.error('Error getting all user uploads:', error);
    // Return empty array instead of throwing
    return [];
  }
};

// Update user plan/tier in Firestore
export const updateUserPlan = async (userId: string, newPlan: PricingTier): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      plan: newPlan,
      updatedAt: serverTimestamp()
    });
    console.log(`User ${userId} plan updated to: ${newPlan}`);
  } catch (error) {
    console.error('Error updating user plan:', error);
    throw error;
  }
};

// Test function to change a user's plan (useful for testing)
export const setTestUserPlan = async (userId: string, plan: PricingTier): Promise<void> => {
  await updateUserPlan(userId, plan);
  console.log(`Test: User ${userId} plan changed to: ${plan}`);
};
