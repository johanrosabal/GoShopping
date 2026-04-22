import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  getDoc, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  images: string[];
  videoUrl?: string;
  category: string;
  stock: number;
  minStock: number;
  cost: number;
  taxPercentage: number;
  featured: boolean;
  onSale: boolean;
  salePrice: number;
  saleStartsAt: string;
  saleExpiresAt: string;
  rating: number;
  isActive: boolean;
  createdAt: any;
  updatedAt?: any;
}

const PRODUCTS_COLLECTION = 'products';

export const getProducts = async () => {
  try {
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    const q = query(productsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

export const getProductsByCategory = async (category: string) => {
  try {
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    const q = query(
      productsRef, 
      where('category', '==', category),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];
  } catch (error) {
    console.error(`Error fetching products for category ${category}:`, error);
    return [];
  }
};

export const getProductById = async (id: string) => {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Product;
    }
    return null;
  } catch (error) {
    console.error("Error fetching product by id:", error);
    return null;
  }
};

export const addProduct = async (
  productData: Partial<Product>, 
  imageFiles: File[] = [], 
  videoFile?: File
) => {
  try {
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
    const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
    const { storage } = await import('../firebase');

    let imageUrls: string[] = [];
    let videoUrl = '';

    // 1. Upload Images in Parallel
    if (imageFiles.length > 0) {
      const uploadPromises = imageFiles.map(async (file, index) => {
        const storageRef = ref(storage, `products/${Date.now()}-img-${index}-${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        return getDownloadURL(snapshot.ref);
      });
      imageUrls = await Promise.all(uploadPromises);
    }

    // 2. Upload Video if exists
    if (videoFile) {
      const videoRef = ref(storage, `products/${Date.now()}-vid-${videoFile.name}`);
      const snapshot = await uploadBytes(videoRef, videoFile);
      videoUrl = await getDownloadURL(snapshot.ref);
    }

    // 3. Create the product in Firestore
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    const docRef = await addDoc(productsRef, {
      ...productData,
      imageUrl: imageUrls[0] || '', // First image is main
      images: imageUrls,
      videoUrl: videoUrl || null,
      stock: productData.stock || 0,
      minStock: productData.minStock || 0,
      cost: productData.cost || 0,
      taxPercentage: productData.taxPercentage || 0,
      featured: productData.featured || false,
      onSale: productData.onSale || false,
      salePrice: productData.salePrice || 0,
      saleStartsAt: productData.saleStartsAt || '',
      saleExpiresAt: productData.saleExpiresAt || '',
      rating: productData.rating || 5.0,
      isActive: true,
      createdAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error("Error adding product:", error);
    throw error;
  }
};

export const deleteProduct = async (id: string) => {
  try {
    const { doc, deleteDoc } = await import('firebase/firestore');
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting product:", error);
    return false;
  }
};

export const updateProduct = async (
  id: string, 
  productData: Partial<Product>,
  newImageFiles: File[] = [],
  remainingImageUrls: string[] = [],
  newVideoFile?: File
) => {
  try {
    const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
    const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
    const { storage } = await import('../firebase');

    let updatedData = { ...productData, updatedAt: serverTimestamp() };

    let finalImageUrls = [...remainingImageUrls];
    
    // 1. If there are new images, upload them
    if (newImageFiles.length > 0) {
      const uploadPromises = newImageFiles.map(async (file, index) => {
        const storageRef = ref(storage, `products/${Date.now()}-img-${index}-${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        return getDownloadURL(snapshot.ref);
      });
      const uploadedUrls = await Promise.all(uploadPromises);
      finalImageUrls = [...finalImageUrls, ...uploadedUrls];
    }

    // Always update images and main imageUrl
    if (finalImageUrls.length > 0) {
      updatedData.imageUrl = finalImageUrls[0];
      (updatedData as any).images = finalImageUrls;
    }

    // 2. If there is a new video
    if (newVideoFile) {
      const videoRef = ref(storage, `products/${Date.now()}-vid-${newVideoFile.name}`);
      const snapshot = await uploadBytes(videoRef, newVideoFile);
      updatedData.videoUrl = await getDownloadURL(snapshot.ref);
    }

    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    await updateDoc(docRef, updatedData);
    return true;
  } catch (error) {
    console.error("Error updating product:", error);
    return false;
  }
};

export const updateProductStatus = async (id: string, isActive: boolean) => {
  try {
    const { doc, updateDoc } = await import('firebase/firestore');
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    await updateDoc(docRef, { isActive });
    return true;
  } catch (error) {
    console.error("Error updating product status:", error);
    return false;
  }
};

export const getEffectivePrice = (product: Product): number => {
  if (!product.onSale || !product.salePrice || !product.saleExpiresAt || !product.saleStartsAt) return product.price;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const start = new Date(product.saleStartsAt + 'T00:00:00');
  const expiry = new Date(product.saleExpiresAt + 'T23:59:59'); 
  
  if (today >= start && today <= expiry) {
    return product.salePrice;
  }
  
  return product.price;
};
