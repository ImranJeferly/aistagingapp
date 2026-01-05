import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  getDocs, 
  query, 
  orderBy, 
  serverTimestamp,
  getDoc,
  where
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { db, storage } from '../lib/firebase';

export interface BlogPost {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  published: boolean;
  publishedAt?: any;
  createdAt?: any;
  updatedAt?: any;
  authorId?: string;
}

const COLLECTION_NAME = 'blogs';

export const uploadBlogImage = async (file: File): Promise<string> => {
  if (!file) throw new Error('No file provided');
  
  // Create a unique filename
  const timestamp = Date.now();
  const filename = `blogs/${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
  const storageRef = ref(storage, filename);
  
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  
  return downloadURL;
};

export const createBlogPost = async (data: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>) => {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    publishedAt: data.published ? serverTimestamp() : null
  });
  
  return docRef.id;
};

export const getBlogPosts = async () => {
  const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as BlogPost[];
};

export const getBlogPost = async (id: string) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as BlogPost;
  } else {
    return null;
  }
};

export const getPublishedPosts = async () => {
  const q = query(
    collection(db, COLLECTION_NAME), 
    where('published', '==', true),
    orderBy('publishedAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as BlogPost[];
};

export const updateBlogPost = async (id: string, data: Partial<BlogPost>) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
};

export const deleteBlogPost = async (id: string) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};
