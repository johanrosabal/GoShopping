import admin from 'firebase-admin';

const key = process.env.ADMIN_SDK_KEY;

if (!key) {
  throw new Error('La variable de entorno ADMIN_SDK_KEY no está definida. Por favor, revisa tu archivo .env');
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(key);
  // Reparación de saltos de línea en la llave privada
  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }
} catch (e) {
  throw new Error('Error al parsear ADMIN_SDK_KEY. Asegúrate de que sea un JSON válido.');
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

const adminDb = admin.firestore();
const adminAuth = admin.auth();
const adminStorage = admin.storage();

export { adminDb, adminAuth, adminStorage };
