import { 
  collection, 
  getDocs, 
  getDoc,
  query, 
  orderBy, 
  doc, 
  setDoc,
  updateDoc,
  where 
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
  role: 'admin' | 'client' | 'vendedor' | 'agent' | 'merchant_admin' | 'merchant_seller';
  merchantId?: string; // Relation to the merchants collection
  phone?: string;
  whatsapp?: string;
  addresses?: UserAddress[];
  isActive?: boolean;
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

export const getUserByEmail = async (email: string) => {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { uid: doc.id, ...doc.data() } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user by email:", error);
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
export const updateUser = updateUserProfile;

export const updateUserRole = async (uid: string, newRole: UserProfile['role']) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, { role: newRole });
    return true;
  } catch (error) {
    console.error("Error updating user role:", error);
    return false;
  }
};

export const toggleUserStatus = async (uid: string, currentStatus: boolean) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, { isActive: !currentStatus });
    return true;
  } catch (error) {
    console.error("Error toggling user status:", error);
    return false;
  }
};

export const deleteUser = async (uid: string) => {
  try {
    const { getDocs, query, where, collection } = await import('firebase/firestore');
    
    // 1. Check for orders
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('userId', '==', uid));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      throw new Error("SEGURIDAD: No se puede eliminar un usuario con historial de compras. Considera bloquearlo en su lugar.");
    }

    // 2. Delete
    const userRef = doc(db, USERS_COLLECTION, uid);
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(userRef);
    return true;
  } catch (error: any) {
    console.error("Error deleting user:", error);
    throw error;
  }
};
