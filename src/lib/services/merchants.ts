import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  serverTimestamp,
  deleteDoc,
  runTransaction
} from 'firebase/firestore';
import { db } from '../firebase';

export interface MerchantProfile {
  id: string;
  merchantNumber: string; // Ej: 000001
  name: string;
  slug: string;
  logoUrl?: string;
  bannerUrl?: string;
  description?: string;
  ownerUid: string;
  status: 'active' | 'suspended' | 'pending';
  subscriptionType: string;
  promotedBy?: string; // UID del Agente Promotor
  createdAt: any;
  updatedAt: any;
  
  // Payment Config
  paymentConfig: {
    paypalEmail?: string;
    sinpeNumber?: string;
    sinpeOwner?: string;
  };
  
  // Legal and Physical Data
  legalData: {
    legalName: string;      // Nombre del propietario o razón social
    legalId: string;        // Cédula Jurídica o Física
    physicalAddress: string; // Señas exactas
    mapsUrl?: string;       // URL de Google Maps o Waze
    province: string;
    canton: string;
    district: string;
    country: string;
  };
  
  // Internal Notes for Admin
  internalNotes?: string;
  
  // Operating Hours
  operatingHours: {
    [key: string]: {
      isOpen: boolean;
      open: string;
      close: string;
    }
  };
  
  // Contacts
  contact: {
    contactName: string;   // Persona de contacto
    email: string;
    phone: string;
    whatsapp?: string;
    instagram?: string;
    facebook?: string;
  };
}

const MERCHANTS_COLLECTION = 'merchants';
const COUNTERS_COLLECTION = 'counters';

/**
 * Gets and increments the merchant counter atomically
 */
export const getNextMerchantNumber = async (): Promise<string> => {
  const counterRef = doc(db, COUNTERS_COLLECTION, 'merchants');
  
  return await runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(counterRef);
    let nextCount = 1;
    
    if (counterSnap.exists()) {
      nextCount = counterSnap.data().current + 1;
    }
    
    transaction.set(counterRef, { current: nextCount });
    
    // Format to 000000 (6 digits)
    return nextCount.toString().padStart(6, '0');
  });
};

/**
 * Gets the predicted next merchant number for display (non-atomic, just for UI)
 */
export const getPredictedNextMerchantNumber = async (): Promise<string> => {
  const counterRef = doc(db, COUNTERS_COLLECTION, 'merchants');
  const counterSnap = await getDoc(counterRef);
  let nextCount = 1;
  
  if (counterSnap.exists()) {
    nextCount = counterSnap.data().current + 1;
  }
  
  return nextCount.toString().padStart(6, '0');
};

export const createMerchant = async (data: Omit<MerchantProfile, 'id' | 'createdAt' | 'updatedAt' | 'merchantNumber'>, promoterUid?: string) => {
  try {
    const merchantNumber = await getNextMerchantNumber();
    const merchantRef = doc(collection(db, MERCHANTS_COLLECTION));
    
    const newMerchant = {
      ...data,
      id: merchantRef.id,
      merchantNumber,
      promotedBy: promoterUid || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(merchantRef, newMerchant);
    return merchantRef.id;
  } catch (error) {
    console.error("Error creating merchant:", error);
    throw error;
  }
};

export const getMerchantBySlug = async (slug: string) => {
  try {
    const merchantsRef = collection(db, MERCHANTS_COLLECTION);
    const q = query(merchantsRef, where('slug', '==', slug));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].data() as MerchantProfile;
    }
    return null;
  } catch (error) {
    console.error("Error fetching merchant by slug:", error);
    return null;
  }
};

export const getMerchantById = async (id: string) => {
  try {
    const merchantRef = doc(db, MERCHANTS_COLLECTION, id);
    const snap = await getDoc(merchantRef);
    if (snap.exists()) {
      return snap.data() as MerchantProfile;
    }
    return null;
  } catch (error) {
    console.error("Error fetching merchant by ID:", error);
    return null;
  }
};

export const getAllMerchants = async () => {
  try {
    const merchantsRef = collection(db, MERCHANTS_COLLECTION);
    const snap = await getDocs(merchantsRef);
    return snap.docs.map(doc => doc.data() as MerchantProfile);
  } catch (error) {
    console.error("Error fetching all merchants:", error);
    return [];
  }
};

export const updateMerchant = async (id: string, data: Partial<MerchantProfile>) => {
  try {
    const merchantRef = doc(db, MERCHANTS_COLLECTION, id);
    await updateDoc(merchantRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Error updating merchant:", error);
    return false;
  }
};
