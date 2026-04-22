import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  query, 
  where, 
  getDocs,
  orderBy,
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../firebase';

export interface ShoppingList {
  id: string;
  userId: string;
  name: string;
  items: string[]; // Product IDs
  createdAt: any;
}

const LISTS_COLLECTION = 'shoppingLists';

export const getShoppingLists = async (userId: string) => {
  try {
    const q = query(
      collection(db, LISTS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ShoppingList[];
  } catch (error) {
    console.error("Error fetching shopping lists:", error);
    return [];
  }
};

export const createShoppingList = async (userId: string, name: string) => {
  try {
    const docRef = await addDoc(collection(db, LISTS_COLLECTION), {
      userId,
      name,
      items: [],
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating shopping list:", error);
    return null;
  }
};

export const addItemToShoppingList = async (listId: string, productId: string) => {
  try {
    const listRef = doc(db, LISTS_COLLECTION, listId);
    await updateDoc(listRef, {
      items: arrayUnion(productId)
    });
    return true;
  } catch (error) {
    console.error("Error adding item to list:", error);
    return false;
  }
};

export const removeItemFromShoppingList = async (listId: string, productId: string) => {
  try {
    const listRef = doc(db, LISTS_COLLECTION, listId);
    await updateDoc(listRef, {
      items: arrayRemove(productId)
    });
    return true;
  } catch (error) {
    console.error("Error removing item from list:", error);
    return false;
  }
};

export const deleteShoppingList = async (listId: string) => {
  try {
    await deleteDoc(doc(db, LISTS_COLLECTION, listId));
    return true;
  } catch (error) {
    console.error("Error deleting list:", error);
    return false;
  }
};
