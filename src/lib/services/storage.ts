import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';

/**
 * Uploads a file to a specific path in Firebase Storage and returns the download URL
 */
export const uploadFile = async (path: string, file: File): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Deletes a file from Firebase Storage given its download URL or path
 */
export const deleteFile = async (urlOrPath: string): Promise<boolean> => {
  try {
    // If it's a full URL, we need to handle it differently or use refFromURL
    // For simplicity, we'll assume it's the path or use the URL directly
    const storageRef = ref(storage, urlOrPath);
    await deleteObject(storageRef);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};
