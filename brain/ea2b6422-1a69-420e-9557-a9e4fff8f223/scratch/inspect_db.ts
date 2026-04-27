
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function inspect() {
  console.log("--- MERCHANTS ---");
  const merchantsSnapshot = await getDocs(collection(db, 'merchants'));
  merchantsSnapshot.forEach(doc => {
    console.log(`ID: ${doc.id}, Name: ${doc.data().name}, Owner: ${doc.data().ownerUid}`);
  });

  console.log("\n--- CHATS ---");
  const chatsSnapshot = await getDocs(collection(db, 'chats'));
  chatsSnapshot.forEach(doc => {
    const d = doc.data();
    console.log(`ID: ${doc.id}, MerchantId: ${d.merchantId}, MerchantName: ${d.merchantName}, User: ${d.userName}, LastMsg: ${d.lastMessage}`);
  });
}

inspect();
