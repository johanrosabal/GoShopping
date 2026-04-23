const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function seedMerchant() {
  const merchantData = {
    name: 'Relojería Elite CR',
    slug: 'relojeria-elite',
    ownerUid: 'SYSTEM', // Temporary or real UID
    status: 'active',
    subscriptionType: 'elite',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    paymentConfig: {
      paypalEmail: 'ventas@relojeriaelite.cr',
      sinpeNumber: '88887777',
      sinpeOwner: 'Juan Perez'
    },
    contact: {
      email: 'juan@relojeriaelite.cr',
      phone: '2233-4455',
      whatsapp: '50688887777'
    }
  };

  const docRef = await db.collection('merchants').add(merchantData);
  console.log('Test Merchant seeded with ID:', docRef.id);
  
  // Update a test user with merchant role
  // (Optional: you'd need a real UID here)
}

seedMerchant().then(() => process.exit(0));
