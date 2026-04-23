import { db } from '../firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  orderBy,
  writeBatch
} from 'firebase/firestore';

export interface MarketplacePlan {
  id: string;
  name: string;
  price: string;
  color: string;
  iconName: string; // lucide icon name as string
  features: string[];
  commission: string;
  productLimit: number;
  orderIndex: number;
  allowedPayments: ('paypal' | 'sinpe')[];
}

const PLANS_COLLECTION = 'marketplace_plans';

export const getMarketplacePlans = async (): Promise<MarketplacePlan[]> => {
  try {
    const plansRef = collection(db, PLANS_COLLECTION);
    const q = query(plansRef, orderBy('orderIndex', 'asc'));
    const snapshot = await getDocs(q);
    
    // If no plans exist yet, we seed the defaults
    if (snapshot.empty) {
      await seedDefaultPlans();
      return getMarketplacePlans();
    }

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MarketplacePlan[];
  } catch (error) {
    console.error("Error fetching plans:", error);
    return [];
  }
};

export const updateMarketplacePlan = async (id: string, data: Partial<MarketplacePlan>): Promise<boolean> => {
  try {
    const planRef = doc(db, PLANS_COLLECTION, id);
    await setDoc(planRef, data, { merge: true });
    return true;
  } catch (error) {
    console.error("Error updating plan:", error);
    return false;
  }
};

/**
 * Updates multiple plans in a single atomic batch
 */
export const updateAllMarketplacePlans = async (plans: MarketplacePlan[]): Promise<boolean> => {
  try {
    const batch = writeBatch(db);
    
    for (const plan of plans) {
      const planRef = doc(db, PLANS_COLLECTION, plan.id);
      const { id, ...data } = plan; 
      batch.set(planRef, data, { merge: true });
    }
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error updating all plans:", error);
    return false;
  }
};

export const deleteMarketplacePlan = async (id: string): Promise<boolean> => {
  try {
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, PLANS_COLLECTION, id));
    return true;
  } catch (error) {
    console.error("Error deleting plan:", error);
    return false;
  }
};

const seedDefaultPlans = async (): Promise<void> => {
  const defaults: MarketplacePlan[] = [
    {
      id: 'standard',
      name: 'Standard Plan',
      price: '44.44',
      color: '#94a3b8',
      iconName: 'Zap',
      features: ['Hasta 100 productos', 'Solo SINPE Móvil', 'Soporte 48h', 'Inventario Básico'],
      commission: '0%',
      productLimit: 100,
      orderIndex: 0,
      allowedPayments: ['sinpe']
    },
    {
      id: 'premium',
      name: 'Premium Business',
      price: '80',
      color: '#C5A059',
      iconName: 'Award',
      features: ['Hasta 500 productos', 'SINPE + PayPal', 'Soporte 12h', 'Puestos Destacados'],
      commission: '0%',
      productLimit: 500,
      orderIndex: 1,
      allowedPayments: ['sinpe', 'paypal']
    },
    {
      id: 'elite',
      name: 'Elite Enterprise',
      price: '150',
      color: '#8b5cf6',
      iconName: 'Crown',
      features: ['Productos Ilimitados', 'Todas las Pasarelas', 'Concierge 24/7', 'Hero Section (Home)'],
      commission: '0%',
      productLimit: 999999,
      orderIndex: 2,
      allowedPayments: ['sinpe', 'paypal']
    }
  ];

  for (const plan of defaults) {
    const { id, ...rest } = plan;
    await setDoc(doc(db, PLANS_COLLECTION, id), rest);
  }
};
