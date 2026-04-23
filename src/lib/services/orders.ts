import { collection, addDoc, serverTimestamp, getDoc, doc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { CartItem } from '@/context/CartContext';
import { createNotification } from './notifications';

export interface OrderData {
  userId?: string;
  orderNumber?: string;
  customerName: string;
  email: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: 'paypal' | 'sinpe';
  status: 'pending' | 'completed' | 'failed';
  sinpeVoucherUrl?: string;
  transactionId?: string;
  payerEmail?: string;
  notes?: string;
  merchantId?: string;
  createdAt?: any;
  updatedAt?: any;
}

const ORDERS_COLLECTION = 'orders';

export const createOrder = async (orderData: OrderData, voucherFile?: File) => {
  try {
    // Generate a 6-digit random order number
    const orderNumber = Math.floor(100000 + Math.random() * 900000).toString();

    let finalOrderData = {
      ...orderData,
      orderNumber,
      merchantId: orderData.merchantId || 'go-shopping-main',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // 1. Create the order in Firestore first to get an ID
    const ordersRef = collection(db, ORDERS_COLLECTION);
    const docRef = await addDoc(ordersRef, finalOrderData);
    const orderId = docRef.id;

    // 2. If SINPE, upload the voucher
    if (orderData.paymentMethod === 'sinpe' && voucherFile) {
      const storageRef = ref(storage, `vouchers/${orderId}-${voucherFile.name}`);
      const snapshot = await uploadBytes(storageRef, voucherFile);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Update order with voucher URL
      const { doc, updateDoc } = await import('firebase/firestore');
      const orderDocRef = doc(db, ORDERS_COLLECTION, orderId);
      await updateDoc(orderDocRef, {
        sinpeVoucherUrl: downloadURL,
        status: 'pending' // Still pending until admin reviews voucher
      });
    }

    // 3. Notify user if authenticated
    if (orderData.userId) {
      await createNotification({
        userId: orderData.userId,
        title: '¡Pedido Recibido!',
        message: `Tu pedido #${orderNumber} ha sido registrado con éxito. Estaremos validando los detalles pronto.`,
        type: 'success',
        link: `/profile`
      });
    }

    return orderId;
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
};

export const getAllOrders = async () => {
  try {
    const { getDocs, query, orderBy } = await import('firebase/firestore');
    const ordersRef = collection(db, ORDERS_COLLECTION);
    const q = query(ordersRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as any
    } as OrderData & { id: string }));
  } catch (error) {
    console.error("Error fetching all orders:", error);
    return [];
  }
};

export const getOrdersByMerchant = async (merchantId: string) => {
  try {
    const ordersRef = collection(db, ORDERS_COLLECTION);
    const q = query(
      ordersRef, 
      where('merchantId', '==', merchantId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as any
    })) as (OrderData & { id: string })[];
  } catch (error) {
    console.error(`Error fetching orders for merchant ${merchantId}:`, error);
    return [];
  }
};

const getDocs = async (q: any) => {
  const { getDocs: firestoreGetDocs } = await import('firebase/firestore');
  return await firestoreGetDocs(q);
};

export const getUserOrders = async (userId: string) => {
  try {
    const { getDocs, query, where, orderBy } = await import('firebase/firestore');
    const ordersRef = collection(db, ORDERS_COLLECTION);
    const q = query(
      ordersRef, 
      where('userId', '==', userId), 
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as any
    } as OrderData & { id: string }));
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return [];
  }
};

export const subscribeToUserOrders = (userId: string, callback: (orders: (OrderData & { id: string })[]) => void) => {
  const ordersRef = collection(db, ORDERS_COLLECTION);
  const q = query(ordersRef, where('userId', '==', userId));
  
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as any
    } as OrderData & { id: string }));
    
    // Sort in-memory to avoid index requirements
    const sortedOrders = orders.sort((a: any, b: any) => {
      const timeA = a.createdAt?.toMillis?.() || 0;
      const timeB = b.createdAt?.toMillis?.() || 0;
      return timeB - timeA;
    });
    
    callback(sortedOrders);
  }, (error) => {
    console.error("Error subscribing to user orders:", error);
  });
};

export const subscribeToAllOrders = (callback: (orders: (OrderData & { id: string })[]) => void) => {
  const ordersRef = collection(db, ORDERS_COLLECTION);
  
  return onSnapshot(ordersRef, (snapshot) => {
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as OrderData & { id: string }));
    
    // Sort in-memory
    const sortedOrders = orders.sort((a: any, b: any) => {
      const timeA = a.createdAt?.toMillis?.() || 0;
      const timeB = b.createdAt?.toMillis?.() || 0;
      return timeB - timeA;
    });
    
    callback(sortedOrders);
  }, (error) => {
    console.error("Error subscribing to all orders:", error);
  });
};

export const updateOrderStatus = async (orderId: string, status: string) => {
  try {
    const { updateDoc } = await import('firebase/firestore');
    const orderDocRef = doc(db, ORDERS_COLLECTION, orderId);
    
    // Fetch order to get userId and orderNumber
    const orderSnap = await getDoc(orderDocRef);
    const orderData = orderSnap.data();

    await updateDoc(orderDocRef, {
      status,
      updatedAt: serverTimestamp()
    });

    // Notify user
    if (orderData?.userId) {
      const statusMap: Record<string, string> = {
        'completed': 'ha sido completado con éxito',
        'pending': 'está pendiente de revisión',
        'failed': 'ha tenido un problema en el procesamiento',
        'shipped': 'ha sido despachado y está en camino'
      };

      await createNotification({
        userId: orderData.userId,
        title: 'Actualización de Pedido',
        message: `Tu pedido #${orderData.orderNumber} ${statusMap[status] || 'ha cambiado de estado'}.`,
        type: status === 'completed' ? 'success' : 'info',
        link: `/profile`
      });
    }

    return true;
  } catch (error) {
    console.error("Error updating order status:", error);
    return false;
  }
};
