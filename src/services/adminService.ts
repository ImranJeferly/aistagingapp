import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query, Timestamp } from 'firebase/firestore';

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
}

export const adminService = {
  async getAllUsers(): Promise<UserData[]> {
    try {
      // Create a query against the users collection
      // We might want to order by createdAt desc to see newest users first
      // Note: This requires an index if the collection is large and we filter, 
      // but simpler queries usually work or auto-prompt for index creation.
      const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(usersQuery);
      
      return snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      } as UserData));
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }
};
