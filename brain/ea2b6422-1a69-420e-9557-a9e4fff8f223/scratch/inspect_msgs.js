
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, orderBy } = require('firebase/firestore');

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

async function inspectMessages() {
  const chatId = 'order_FcGYX0V8tEfOvBzMZohn';
  console.log(`--- INSPECCIONANDO MENSAJES DE ${chatId} ---`);
  try {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    snapshot.forEach(doc => {
      const d = doc.data();
      console.log(`[MSG] Role: ${d.senderRole}, Text: ${d.text}`);
    });

  } catch (error) {
    console.error("Error:", error);
  }
}

inspectMessages();
