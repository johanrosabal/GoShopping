
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc } = require('firebase/firestore');

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

async function restore() {
  console.log("--- RESTAURANDO NOMBRE DE OSCAR ---");
  try {
    const chatRef = doc(db, 'chats', 'order_FcGYX0V8tEfOvBzMZohn');
    await updateDoc(chatRef, {
      userName: 'Oscar Rosabal Hernandez'
    });
    console.log("¡Nombre restaurado con éxito!");
  } catch (error) {
    console.error("Error:", error);
  }
}

restore();
