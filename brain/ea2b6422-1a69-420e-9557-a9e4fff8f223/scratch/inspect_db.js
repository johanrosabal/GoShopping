
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyA4IGXFVFFD7Ap4G2qNamTNxlIUhbry_eg",
  authDomain: "go-shopping-cr.firebaseapp.com",
  projectId: "go-shopping-cr",
  storageBucket: "go-shopping-cr.firebasestorage.app",
  messagingSenderId: "1064835429613",
  appId: "1:1064835429613:web:cf9fba20e4d5dcbe0c88e4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function inspect() {
  console.log("--- BUSCANDO CHATS ---");
  try {
    const chatsSnapshot = await getDocs(collection(db, 'chats'));
    console.log(`Total de chats encontrados: ${chatsSnapshot.size}`);
    
    chatsSnapshot.forEach(doc => {
      const d = doc.data();
      console.log(`[CHAT] ID: ${doc.id}`);
      console.log(`       User: ${d.userName} (${d.userId})`);
      console.log(`       MerchantId: ${d.merchantId}`);
      console.log(`       MerchantName: ${d.merchantName}`);
      console.log(`       LastMsg: ${d.lastMessage}`);
      console.log('-----------------------------------');
    });

    console.log("\n--- BUSCANDO COMERCIOS ---");
    const merchantsSnapshot = await getDocs(collection(db, 'merchants'));
    merchantsSnapshot.forEach(doc => {
      const d = doc.data();
      console.log(`[MERCHANT] ID: ${doc.id}, Name: ${d.name}, Owner: ${d.ownerUid}`);
    });
    
    console.log("\n--- BUSCANDO USUARIOS ---");
    const usersSnapshot = await getDocs(collection(db, 'users'));
    usersSnapshot.forEach(doc => {
      const d = doc.data();
      if (d.displayName === 'Joe' || d.email === 'socio.blanco.box@gmail.com') {
          console.log(`[USER] ID: ${doc.id}, Name: ${d.displayName}, Email: ${d.email}, MID: ${d.merchantId}`);
      }
    });

  } catch (error) {
    console.error("Error en inspección:", error);
  }
}

inspect();
