import admin from 'firebase-admin';

const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!key) {
  throw new Error('La variable de entorno FIREBASE_SERVICE_ACCOUNT_KEY no está definida. Por favor, revisa tu archivo .env');
}

const serviceAccount = JSON.parse(key);

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
