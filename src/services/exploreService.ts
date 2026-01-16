import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  getDocs, 
  getDoc,
  doc, 
  updateDoc, 
  orderBy, 
  limit,
  Timestamp,
  where,
  collectionGroup,
  documentId
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
  userEmail?: string;
  userName?: string;
  isGuest?: boolean;
  refPath: string;
}

export const exploreService = {
  // Get all staged images for admin
  getAllStagedImages: async (limitCount = 100): Promise<StagedImage[]> => {
    try {
      // 1. Fetch User Uploads (using Collection Group)
      const userUploadsQuery = query(
        collectionGroup(db, "uploads"),
        orderBy("uploadedAt", "desc"),
        limit(limitCount)
      );
      
      // 2. Fetch Guest Uploads
      const guestUploadsQuery = query(
        collection(db, "guest_uploads"),
        orderBy("uploadedAt", "desc"),
        limit(limitCount)
      );

      const [userSnapshot, guestSnapshot] = await Promise.all([
        getDocs(userUploadsQuery),
        getDocs(guestUploadsQuery)
      ]);

      const userImages = userSnapshot.docs.map(doc => {
          const data = doc.data();
          let created = data.uploadedAt;
          // Handle loose timestamp types
          if (!created && data.createdAt) created = data.createdAt;

          return {
            id: doc.id,
            userId: data.userId,
            imageUrl: data.stagedImageUrl,
            originalImageUrl: data.originalImageUrl,
            roomType: data.roomType,
            designStyle: data.style,
            createdAt: created,
            exploreStatus: data.exploreStatus || 'pending',
            isGuest: false,
            refPath: doc.ref.path
          } as StagedImage;
      });

      const guestImages = guestSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: 'Guest', 
            imageUrl: data.stagedImageUrl,
            originalImageUrl: data.originalImageUrl,
            roomType: data.roomType,
            designStyle: data.style,
            createdAt: data.uploadedAt,
            exploreStatus: data.exploreStatus || 'pending',
            isGuest: true,
            refPath: doc.ref.path,
            userName: 'Guest'
          } as StagedImage;
      });

      // Fetch user details
      const userIds = [...new Set(userImages.map(img => img.userId))];
      const userMap = new Map<string, string>();
      
      await Promise.all(userIds.map(async (uid) => {
          if(!uid) return;
          try {
              const userSnap = await getDoc(doc(db, "users", uid));
              if(userSnap.exists()) {
                  const userData = userSnap.data();
                  const fullName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
                  userMap.set(uid, fullName || userData.displayName || uid);
              }
          } catch (e) {
              console.error("Error fetching user details:", e);
          }
      }));

      const enrichedUserImages = userImages.map(img => ({
          ...img,
          userName: userMap.get(img.userId) || img.userName || img.userId
      }));

      // Merge and Sort
      const allImages = [...enrichedUserImages, ...guestImages].sort((a, b) => {
         const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : (a.createdAt as any).seconds * 1000 || 0;
         const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : (b.createdAt as any).seconds * 1000 || 0;
         return dateB - dateA;
      });

      return allImages.slice(0, limitCount);
    } catch (error) {
      console.error("Error fetching staged images:", error);
      return [];
    }
  },

  // Get specific status
  getStagedImagesByStatus: async (status: ExploreStatus, limitCount = 50): Promise<StagedImage[]> => {
    try {
      // 1. User Uploads with Status
      const userQ = query(
        collectionGroup(db, "uploads"),
        where("exploreStatus", "==", status),
        orderBy("uploadedAt", "desc"),
        limit(limitCount)
      );

      // 2. Guest Uploads with Status
      const guestQ = query(
        collection(db, "guest_uploads"),
        where("exploreStatus", "==", status),
        orderBy("uploadedAt", "desc"),
        limit(limitCount)
      );

      const [userSnapshot, guestSnapshot] = await Promise.all([
        getDocs(userQ),
        getDocs(guestQ)
      ]);

      const userImages = userSnapshot.docs.map(doc => {
          const data = doc.data();
          let created = data.uploadedAt;
          if (!created && data.createdAt) created = data.createdAt;

          return {
            id: doc.id,
            userId: data.userId,
            imageUrl: data.stagedImageUrl,
            originalImageUrl: data.originalImageUrl,
            createdAt: created,
            exploreStatus: data.exploreStatus || 'pending',
            isGuest: false,
            refPath: doc.ref.path,
            userName: data.userName
          } as StagedImage;
      });

      const guestImages = guestSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: 'Guest',
            imageUrl: data.stagedImageUrl,
            originalImageUrl: data.originalImageUrl,
            createdAt: data.uploadedAt,
            exploreStatus: data.exploreStatus || 'pending',
            isGuest: true,
            refPath: doc.ref.path,
            userName: 'Guest User'
          } as StagedImage;
      });

      // Merge and sort
      const allImages = [...userImages, ...guestImages].sort((a, b) => {
         const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : (a.createdAt as any).seconds * 1000 || 0;
         const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : (b.createdAt as any).seconds * 1000 || 0;
         return dateB - dateA;
      });

      return allImages.slice(0, limitCount);
    } catch (error) {
      console.error(`Error fetching ${status} images:`, error);
      return [];
    }
  },

  getPublicImageById: async (id: string): Promise<StagedImage | null> => {
    try {
      // 1. Check Guest Uploads
      // Use documentId() query to avoid permission issues with getDoc() on non-existent docs
      const guestQ = query(
        collection(db, 'guest_uploads'),
        where(documentId(), '==', id),
        limit(1)
      );
      const guestSnap = await getDocs(guestQ);
      
      if (!guestSnap.empty) {
        const doc = guestSnap.docs[0];
        const data = doc.data();
        // Check approval status in code
        if (data.exploreStatus === 'approved') {
             let created = data.uploadedAt;
             if (!created && data.createdAt) created = data.createdAt;
             return {
                id: doc.id,
                userId: 'Guest',
                imageUrl: data.stagedImageUrl,
                originalImageUrl: data.originalImageUrl,
                createdAt: created,
                exploreStatus: data.exploreStatus,
                isGuest: true,
                refPath: doc.ref.path,
                userName: 'Guest User',
                roomType: data.roomType,
                designStyle: data.style
             } as StagedImage;
        }
      }

      // 2. Check User Uploads via Collection Group
      // Remove exploreStatus filter from query to avoid index/permission complexity, 
      // rely on 'allow read: if true' rule and check status in code.
      const userQ = query(
        collectionGroup(db, 'uploads'),
        where('id', '==', id),
        limit(1)
      );
      
      const userSnap = await getDocs(userQ);
      if (!userSnap.empty) {
        const doc = userSnap.docs[0];
        const data = doc.data();
        
        if (data.exploreStatus === 'approved') {
            let created = data.uploadedAt;
            if (!created && data.createdAt) created = data.createdAt;
            return {
                id: doc.id,
                userId: data.userId,
                imageUrl: data.stagedImageUrl,
                originalImageUrl: data.originalImageUrl,
                createdAt: created,
                exploreStatus: data.exploreStatus,
                isGuest: false,
                refPath: doc.ref.path,
                userName: data.userName,
                roomType: data.roomType,
                designStyle: data.style
             } as StagedImage;
        }
      }

      return null;
    } catch (error) {
      console.error("Error fetching public image details:", error);
      return null;
    }
  },

  updateExploreStatus: async (refPath: string, status: ExploreStatus) => {
    try {
      if (!refPath) throw new Error("Missing reference path for update");
      const imageRef = doc(db, refPath);
      await updateDoc(imageRef, {
        exploreStatus: status,
      });
    } catch (error) {
       console.error("Error updating status:", error);
       throw error;
    }
  }
};
