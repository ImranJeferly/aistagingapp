import { 
  collection, 
  doc, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface UploadRecord {
  id?: string;
  userId: string;
  uploadedAt: Timestamp;
  imageSize: number;
  imageName: string;
  status: 'completed' | 'failed' | 'processing';
  isInitialDocument?: boolean;
}

export const DAILY_UPLOAD_LIMIT = 3;

export const addUploadRecord = async (uploadData: Omit<UploadRecord, 'id'>): Promise<void> => {
  try {
    // Store upload records in the user's uploads subcollection
    const uploadsRef = collection(db, 'users', uploadData.userId, 'uploads');
    await addDoc(uploadsRef, uploadData);
  } catch (error) {
    console.error('Error adding upload record:', error);
    throw error;
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

export const getRemainingUploads = async (userId: string): Promise<number> => {
  try {
    const todayUploads = await getUserUploadsToday(userId);
    const remaining = Math.max(0, DAILY_UPLOAD_LIMIT - todayUploads.length);
    return remaining;
  } catch (error) {
    console.error('Error getting remaining uploads:', error);
    // Return full limit for new users or when there's an error
    return DAILY_UPLOAD_LIMIT;
  }
};

export const canUserUpload = async (userId: string): Promise<boolean> => {
  try {
    const remaining = await getRemainingUploads(userId);
    return remaining > 0;
  } catch (error) {
    console.error('Error checking upload permission:', error);
    return false;
  }
};
