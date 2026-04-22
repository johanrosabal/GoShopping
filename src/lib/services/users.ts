import { 
  collection, 
  getDocs, 
  getDoc,
  query, 
  orderBy, 
  doc, 
  setDoc,
  updateDoc 
} from 'firebase/firestore';
import { db } from '../firebase';

export interface UserAddress {
  id: string;
  alias: string; // Casa, Oficina, etc.
  detail: string;
  mapsUrl?: string; // URL de Google Maps
  isDefault: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'client';
  phone?: string;
  whatsapp?: string;
  addresses?: UserAddress[];
  createdAt?: any;
}

const USERS_COLLECTION = 'users';

export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, orderBy('email', 'asc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    })) as UserProfile[];
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};

export const getUserProfile = async (uid: string) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return { uid, ...snap.data() } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    // Use setDoc with merge: true to avoid errors if the doc doesn't exist yet
    await setDoc(userRef, data, { merge: true });
    return true;
  } catch (error) {
    console.error("Error updating user profile:", error);
    return false;
  }
};

export const updateUserRole = async (uid: string, newRole: 'admin' | 'client') => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, { role: newRole });
    return true;
  } catch (error) {
    console.error("Error updating user role:", error);
    return false;
  }
};
