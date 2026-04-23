import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  updateDoc, 
  doc, 
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'info' | 'success' | 'warning';
  read: boolean;
  createdAt: any;
  link?: string;
}

const NOTIFICATIONS_COLLECTION = 'notifications';

export const createNotification = async (data: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
  try {
    const notifRef = collection(db, NOTIFICATIONS_COLLECTION);
    await addDoc(notifRef, {
      ...data,
      read: false,
      createdAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Error creating notification:", error);
    return false;
  }
};

export const getNotifications = async (userId: string) => {
  try {
    const notifRef = collection(db, NOTIFICATIONS_COLLECTION);
    const q = query(
      notifRef, 
      where('userId', '==', userId), 
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Notification[];
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
};

export const markAsRead = async (notificationId: string) => {
  try {
    const notifDoc = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(notifDoc, { read: true });
    return true;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return false;
  }
};

export const subscribeToNotifications = (userId: string, callback: (notifications: Notification[]) => void) => {
  const notifRef = collection(db, NOTIFICATIONS_COLLECTION);
  const q = query(
    notifRef, 
    where('userId', '==', userId)
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Notification[];
    
    // Sort in memory to avoid composite index requirement
    const sorted = notifications.sort((a, b) => {
      const timeA = a.createdAt?.toMillis() || 0;
      const timeB = b.createdAt?.toMillis() || 0;
      return timeB - timeA;
    });
    
    callback(sorted);
  });
};
