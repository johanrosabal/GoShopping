import { db } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

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
}

const SETTINGS_COLLECTION = 'settings';
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
  sinpeOwner: 'Comercio Elite S.A.'
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
