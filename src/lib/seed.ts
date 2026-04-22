import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const MOCK_PRODUCTS = [
  {
    name: 'Elite Chrono Watch v4',
    description: 'Reloj de lujo con cristal de zafiro y movimiento automático suizo. Resistente al agua hasta 100m.',
    price: 899,
    category: 'Relojes',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800',
    stock: 15,
    rating: 4.9,
    featured: true
  },
  {
    name: 'Sonic Master Studio',
    description: 'Auriculares de estudio con cancelación activa de ruido y sonido espacial envolvente.',
    price: 349,
    category: 'Audio',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800',
    stock: 25,
    rating: 4.8,
    featured: true
  },
  {
    name: 'Lens Pro Cinema 35mm',
    description: 'Lente de cine profesional con apertura f/1.4 para un bokeh cinematográfico incomparable.',
    price: 1599,
    category: 'Fotografía',
    imageUrl: 'https://images.unsplash.com/photo-1581591524425-c7e0978865fc?auto=format&fit=crop&q=80&w=800',
    stock: 8,
    rating: 5.0,
    featured: false
  },
  {
    name: 'MacBook Air M3 Elite',
    description: 'La computadora más delgada y potente, ahora con el chip M3 para un rendimiento extremo.',
    price: 1299,
    category: 'Tecnología',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=800',
    stock: 12,
    rating: 4.9,
    featured: true
  },
  {
    name: 'Teclado Mecánico Custom',
    description: 'Teclado mecánico con switches lubricados a mano y teclas de PBT de doble inyección.',
    price: 189,
    category: 'Tecnología',
    imageUrl: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&q=80&w=800',
    stock: 30,
    rating: 4.7,
    featured: false
  }
];

export const seedProducts = async () => {
  try {
    const productsRef = collection(db, 'products');
    for (const product of MOCK_PRODUCTS) {
      await addDoc(productsRef, {
        ...product,
        createdAt: serverTimestamp()
      });
    }
    console.log("Database seeded successfully!");
    return true;
  } catch (error) {
    console.error("Error seeding database:", error);
    return false;
  }
};
