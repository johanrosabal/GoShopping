import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, serverTimestamp, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

export interface Category {
  id: string;
  name: string;
  imageUrl?: string;
  tagline?: string;
  displayTitle?: string;
  isPremium?: boolean;
  createdAt: any;
}

const CATEGORIES_COLLECTION = 'categories';

export const getCategories = async () => {
  try {
    const categoriesRef = collection(db, CATEGORIES_COLLECTION);
    const q = query(categoriesRef, orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Category[];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};

export const addCategory = async (name: string, data?: Partial<Category>, imageFile?: File) => {
  try {
    let imageUrl = data?.imageUrl || '';
    
    const categoriesRef = collection(db, CATEGORIES_COLLECTION);
    const docRef = await addDoc(categoriesRef, {
      name,
      tagline: data?.tagline || '',
      displayTitle: data?.displayTitle || name,
      isPremium: data?.isPremium || false,
      createdAt: serverTimestamp()
    });

    if (imageFile) {
      const storageRef = ref(storage, `categories/${docRef.id}-${imageFile.name}`);
      const snapshot = await uploadBytes(storageRef, imageFile);
      imageUrl = await getDownloadURL(snapshot.ref);
      
      await updateDoc(doc(db, CATEGORIES_COLLECTION, docRef.id), { imageUrl });
    }

    return docRef.id;
  } catch (error) {
    console.error("Error adding category:", error);
    throw error;
  }
};

export const updateCategory = async (id: string, data: Partial<Category>, imageFile?: File) => {
  try {
    let updateData = { ...data };
    
    if (imageFile) {
      const storageRef = ref(storage, `categories/${id}-${imageFile.name}`);
      const snapshot = await uploadBytes(storageRef, imageFile);
      const imageUrl = await getDownloadURL(snapshot.ref);
      updateData.imageUrl = imageUrl;
    }
    
    const categoryDoc = doc(db, CATEGORIES_COLLECTION, id);
    await updateDoc(categoryDoc, updateData);
    return true;
  } catch (error) {
    console.error("Error updating category:", error);
    throw error;
  }
};

export const deleteCategory = async (id: string, name: string) => {
  try {
    const { getDocs, query, where, limit } = await import('firebase/firestore');
    
    // 1. Check if there are products with this category
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('category', '==', name), limit(1));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      throw new Error(`No se puede eliminar: La categoría "${name}" todavía tiene productos asociados.`);
    }

    // 2. Proceed with delete
    const categoryDoc = doc(db, CATEGORIES_COLLECTION, id);
    await deleteDoc(categoryDoc);
    return true;
  } catch (error) {
    console.error("Error deleting category:", error);
    throw error; // Throw so UI can capture describing message
  }
};

// Help seed initial categories if none exist
export const seedInitialCategories = async () => {
  const existing = await getCategories();
  if (existing.length === 0) {
    const initials = [
      'Colección Platinum',
      'Relojería de Autor',
      'Fragancias Imperial',
      'Accesorios Signature',
      'Tecnología Executive'
    ];
    for (const cat of initials) {
      await addCategory(cat);
    }
    return true;
  }
  return false;
};
