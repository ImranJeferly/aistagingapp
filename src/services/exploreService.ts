import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  updateDoc, 
  orderBy, 
  limit,
  Timestamp,
  where
} from "firebase/firestore";

export type ExploreStatus = 'pending' | 'approved' | 'rejected';

export interface StagedImage {
  id: string;
  userId: string;
  imageUrl: string;
  originalImageUrl?: string;
  roomType?: string;
  designStyle?: string;
  createdAt: Timestamp | Date; // handle both for flexibility
  exploreStatus?: ExploreStatus;
  userEmail?: string; // If we denormalize this, otherwise we might need to fetch user
  userName?: string;
}

export const exploreService = {
  // Get all staged images for admin (with pagination limit ideally, but simple for now)
  getAllStagedImages: async (limitCount = 50): Promise<StagedImage[]> => {
    try {
      const q = query(
        collection(db, "staged-images"),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Ensure exploreStatus is set
        exploreStatus: doc.data().exploreStatus || 'pending'
      } as StagedImage));
    } catch (error) {
      console.error("Error fetching staged images:", error);
      return [];
    }
  },

  // Get specific status
  getStagedImagesByStatus: async (status: ExploreStatus, limitCount = 50): Promise<StagedImage[]> => {
    try {
        // Note: This requires an index if combining orderBy and where
        // For now sorting client side if index is missing might be safer if we encounter errors, 
        // but let's try strict query first.
      const q = query(
        collection(db, "staged-images"),
        where("exploreStatus", "==", status),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as StagedImage));
    } catch (error) {
      console.error(`Error fetching ${status} images:`, error);
      return [];
    }
  },

  updateExploreStatus: async (imageId: string, status: ExploreStatus) => {
    try {
      const imageRef = doc(db, "staged-images", imageId);
      await updateDoc(imageRef, {
        exploreStatus: status,
        updatedAt: Timestamp.now()
      });
      return true;
    } catch (error) {
      console.error("Error updating explore status:", error);
      throw error;
    }
  }
};
