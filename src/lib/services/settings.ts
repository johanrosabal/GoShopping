import { db } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot, collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';

export interface SiteSettings {
  tagline: string;
  footerDescription: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  instagram: string;
  website: string;
  telegram: string;
  aboutTitle: string;
  aboutHeader: string;
  aboutContent: string;
  sinpePhone: string;
  sinpeOwner: string;
  paypalSandboxClientId: string;
  paypalLiveClientId: string;
  paypalMode: 'sandbox' | 'live';
  paypalEnabled: boolean;
  usdExchangeRate: number;
  heroBackgroundImageUrl: string;
  heroHighlightImageUrl: string;
  heroBadge: string;
  heroTitle: string;
  heroDescription: string;
}

export interface ExchangeRateEntry {
  id?: string;
  rate: number;
  timestamp: any;
  createdBy?: string;
}

const SETTINGS_COLLECTION = 'settings';
const EXCHANGE_RATES_COLLECTION = 'exchange_rates';
const GLOBAL_DOC_ID = 'global';

// Default values to prevent UI breaks
export const DEFAULT_SETTINGS: SiteSettings = {
  tagline: 'La Definición de Excelencia',
  footerDescription: 'Tu destino definitivo para productos de lujo y tecnología de vanguardia. Calidad garantizada y entregas ultra-rápidas.',
  contactEmail: 'info@go-shopping.com',
  contactPhone: '+506 4000-0000',
  contactAddress: 'San José, Costa Rica',
  instagram: 'https://instagram.com/',
  website: 'https://go-shopping.com',
  telegram: 'https://t.me/',
  aboutTitle: 'Nuestra Filosofía de Excelencia',
  aboutHeader: 'Definiendo el estándar del lujo y la exclusividad en cada detalle.',
  aboutContent: '<p>En Go-Shopping, creemos que comprar no es solo una transacción, sino una experiencia de curaduría. Seleccionamos cada pieza con un ojo crítico para garantizar que solo lo extraordinario llegue a tus manos.</p><p>Nuestra misión es democratizar el acceso al diseño de autor y la tecnología de vanguardia, manteniendo siempre un servicio personalizado nivel Executive.</p>',
  sinpePhone: '+506 8888-8888',
  sinpeOwner: 'Comercio Elite S.A.',
  paypalSandboxClientId: '',
  paypalLiveClientId: '',
  paypalMode: 'sandbox',
  paypalEnabled: false,
  usdExchangeRate: 540,
  heroBackgroundImageUrl: '/images/home/hero_elite.png',
  heroHighlightImageUrl: '/images/home/hero_highlight.png',
  heroBadge: 'Nueva Temporada 2026',
  heroTitle: 'La Definición de Excellence',
  heroDescription: 'Curaduría exclusiva de piezas tecnológicas y de autor diseñadas para quienes no aceptan menos que lo extraordinario.'
};

export const getSiteSettings = async (): Promise<SiteSettings> => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, GLOBAL_DOC_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { ...DEFAULT_SETTINGS, ...docSnap.data() } as SiteSettings;
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error("Error fetching site settings:", error);
    return DEFAULT_SETTINGS;
  }
};

export const updateSiteSettings = async (settings: SiteSettings): Promise<boolean> => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, GLOBAL_DOC_ID);
    await setDoc(docRef, {
      ...settings,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error("Error updating site settings:", error);
    return false;
  }
};

// Real-time listener for site-wide updates
export const subscribeToSettings = (callback: (settings: SiteSettings) => void) => {
  const docRef = doc(db, SETTINGS_COLLECTION, GLOBAL_DOC_ID);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ ...DEFAULT_SETTINGS, ...docSnap.data() } as SiteSettings);
    } else {
      callback(DEFAULT_SETTINGS);
    }
  });
};

// Exchange Rate History Functions
export const addExchangeRateEntry = async (rate: number): Promise<boolean> => {
  try {
    const ratesRef = collection(db, EXCHANGE_RATES_COLLECTION);
    await addDoc(ratesRef, {
      rate,
      timestamp: serverTimestamp(),
      createdBy: 'admin' // Could be updated with actual user id
    });
    
    // Also update the global setting for quick access
    const settings = await getSiteSettings();
    await updateSiteSettings({ ...settings, usdExchangeRate: rate });
    
    return true;
  } catch (error) {
    console.error("Error adding exchange rate entry:", error);
    return false;
  }
};

export const subscribeToExchangeRateHistory = (callback: (history: ExchangeRateEntry[]) => void) => {
  const ratesRef = collection(db, EXCHANGE_RATES_COLLECTION);
  const q = query(ratesRef, orderBy('timestamp', 'desc'), limit(10));
  
  return onSnapshot(q, (snapshot) => {
    const history = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ExchangeRateEntry[];
    callback(history);
  });
};
