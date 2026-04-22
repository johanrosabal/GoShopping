import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { CartItem } from '@/context/CartContext';

const CARTS_COLLECTION = 'carts';

export const saveCartToCloud = async (userId: string, items: CartItem[]) => {
  try {
    const docRef = doc(db, CARTS_COLLECTION, userId);
    await setDoc(docRef, {
      items,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error("Error saving cart to cloud:", error);
    return false;
  }
};

export const getCartFromCloud = async (userId: string) => {
  try {
    const docRef = doc(db, CARTS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data().items as CartItem[];
    }
    return null;
  } catch (error) {
    console.error("Error getting cart from cloud:", error);
    return null;
  }
};
