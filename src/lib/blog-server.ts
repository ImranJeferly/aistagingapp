import { adminDb } from './firebase-admin';

export async function getBlogPostServer(id: string) {
  if (!adminDb) {
    console.error('Admin DB not initialized');
    return null;
  }
  
  try {
    const docRef = adminDb.collection('blog_posts').doc(id);
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        // Convert Timestamp to ISO string for serialization
        publishedAt: data?.publishedAt?.toDate ? data.publishedAt.toDate().toISOString() : data?.publishedAt,
        updatedAt: data?.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data?.updatedAt,
      } as any;
    }
  } catch (error) {
    console.error('Error fetching blog post:', error);
  }
  return null;
}