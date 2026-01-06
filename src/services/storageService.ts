import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Uploads a file (File or Blob) to Firebase Storage and returns the download URL.
 * 
 * @param file The file or blob to upload
 * @param path The path in storage (e.g., 'uploads/userId')
 * @returns The download URL of the uploaded file
 */
export const uploadFileToStorage = async (file: File | Blob, path: string): Promise<string> => {
  try {
    const filename = `${uuidv4()}`; // Unique filename
    const storageRef = ref(storage, `${path}/${filename}`);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error("Error uploading file to storage:", error);
    throw error;
  }
};
