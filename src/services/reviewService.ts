import { 
  collection, 
  doc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  text: string;
  status: 'pending' | 'approved' | 'rejected';
  featured: boolean;
  createdAt: any;
}

const COLLECTION_NAME = 'reviews';

export async function getAllReviews(): Promise<Review[]> {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Review));
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
}

export async function updateReviewStatus(id: string, status: 'pending' | 'approved' | 'rejected') {
  try {
    const reviewRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(reviewRef, { status });
    return true;
  } catch (error) {
    console.error('Error updating review status:', error);
    throw error;
  }
}

export async function toggleReviewFeature(id: string, featured: boolean) {
  try {
    const reviewRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(reviewRef, { featured });
    return true;
  } catch (error) {
    console.error('Error toggling feature status:', error);
    throw error;
  }
}

export async function deleteReview(id: string) {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    return true;
  } catch (error) {
    console.error('Error deleting review:', error);
    throw error;
  }
}

// Helper to create a dummy review for testing
export async function createMockReview() {
    try {
        await addDoc(collection(db, COLLECTION_NAME), {
            userId: 'test-user',
            userName: 'Test User',
            rating: 5,
            text: 'This AI staging tool is incredible! Saved me hours of work.',
            status: 'pending',
            featured: false,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error creating mock review:', error);
    }
}
