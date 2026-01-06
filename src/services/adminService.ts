import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query, Timestamp, getCountFromServer, collectionGroup, where, doc, getDoc } from 'firebase/firestore';

export interface UserData {
  uid: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  photoURL?: string;
  plan?: string;
  createdAt?: Timestamp | { seconds: number; nanoseconds: number } | string;
  updatedAt?: Timestamp | { seconds: number; nanoseconds: number } | string;
  lastActive?: Timestamp | { seconds: number; nanoseconds: number } | string;
  uploadCount?: number;
}

export interface FeedbackReport {
  id: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  isGuest: boolean;
  type: 'thumbs-up' | 'thumbs-down';
  comment?: string;
  originalImageUrl?: string;
  stagedImageUrl?: string;
  createdAt?: Timestamp | { seconds: number; nanoseconds: number } | string;
  feedbackSubmittedAt: Timestamp | { seconds: number; nanoseconds: number } | string;
}

export const adminService = {
  async getUserUploadCount(userId: string): Promise<number> {
    try {
      const coll = collection(db, 'users', userId, 'uploads');
      const snapshot = await getCountFromServer(coll);
      return snapshot.data().count;
    } catch (e) {
      console.warn(`Failed to get upload count for ${userId}`, e);
      return 0;
    }
  },

  async getAllUsers(): Promise<UserData[]> {
    try {
      // Create a query against the users collection
      // We might want to order by createdAt desc to see newest users first
      // Note: This requires an index if the collection is large and we filter, 
      // but simpler queries usually work or auto-prompt for index creation.
      const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(usersQuery);
      
      const users = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      } as UserData));

      // Parallel fetch counts (might be rate limited if many users, paging recommended in future)
      const usersWithCounts = await Promise.all(users.map(async u => {
         const count = await adminService.getUserUploadCount(u.uid);
         return { ...u, uploadCount: count };
      }));

      return usersWithCounts;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  async getFeedbackReports(): Promise<FeedbackReport[]> {
    try {
      // 1. Fetch guest feedback
      const guestQuery = query(
        collection(db, 'guest_uploads'), 
        where('feedback', 'in', ['thumbs-up', 'thumbs-down'])
      );
      
      // 2. Fetch user feedback via Collection Group
      const userQuery = query(
        collectionGroup(db, 'uploads'),
        where('feedback', 'in', ['thumbs-up', 'thumbs-down'])
      );

      const [guestSnapshot, userSnapshot] = await Promise.all([
        getDocs(guestQuery),
        getDocs(userQuery)
      ]);

      // Fetch User Details for User Reports
      const userIds = new Set<string>();
      userSnapshot.docs.forEach(doc => {
        const userId = doc.data().userId;
        if (userId) userIds.add(userId);
      });

      const userMap = new Map<string, UserData>();
      if (userIds.size > 0) {
        await Promise.all(Array.from(userIds).map(async (uid) => {
          try {
             const snap = await getDoc(doc(db, 'users', uid));
             if (snap.exists()) {
               userMap.set(uid, { uid, ...snap.data() } as UserData);
             }
          } catch (e) {
             console.error(`Failed to fetch details for user ${uid}`, e);
          }
        }));
      }

      const guestReports: FeedbackReport[] = guestSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          isGuest: true,
          type: data.feedback,
          comment: data.feedbackComment,
          createdAt: data.uploadedAt, // Use uploadedAt for creation
          feedbackSubmittedAt: data.feedbackSubmittedAt || data.uploadedAt,
          originalImageUrl: data.originalImageUrl,
          stagedImageUrl: data.stagedImageUrl
        };
      });

      const userReports: FeedbackReport[] = userSnapshot.docs.map(doc => {
        const data = doc.data();
        const userData = userMap.get(data.userId);
        const name = userData ? (userData.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim()) : 'Unknown User';
        
        return {
          id: doc.id,
          userId: data.userId,
          userEmail: userData?.email,
          userName: name || data.userId, 
          isGuest: false,
          type: data.feedback,
          comment: data.feedbackComment,
          createdAt: data.uploadedAt,
          feedbackSubmittedAt: data.feedbackSubmittedAt || data.uploadedAt,
          originalImageUrl: data.originalImageUrl,
          stagedImageUrl: data.stagedImageUrl
        };
      });

      const allReports = [...guestReports, ...userReports].sort((a, b) => {
        const getMillis = (t: any) => {
            if (!t) return 0;
            if (t instanceof Timestamp) return t.toMillis();
            if (t.seconds) return t.seconds * 1000;
            return new Date(t).getTime();
        };

        return getMillis(b.feedbackSubmittedAt) - getMillis(a.feedbackSubmittedAt);
      });

      return allReports;
    } catch (error) {
      console.error('Error fetching feedback reports:', error);
      return [];
    }
  }
};

