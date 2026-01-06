import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query, Timestamp, getCountFromServer } from 'firebase/firestore';

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
  }
};

