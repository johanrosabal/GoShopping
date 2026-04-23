import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  increment,
  getDocs,
  where
} from 'firebase/firestore';
import { db } from '../firebase';
import { createNotification } from './notifications';
import { deleteFile } from './storage';

export interface ChatMessage {
  id?: string;
  text: string;
  senderId: string;
  senderRole: 'client' | 'admin';
  imageUrl?: string;
  createdAt: any;
}

export interface ChatSession {
  id: string; // unique chatId (e.g. general_UID or order_ORDERID)
  userId: string;
  userName: string;
  lastMessage: string;
  lastMessageAt: any;
  unreadCountAdmin: number;
  unreadCountClient: number;
  status: 'active' | 'resolved';
  type: 'general' | 'order';
  orderId?: string;
  orderNumber?: string;
}

const CHATS_COLLECTION = 'chats';
const MESSAGES_SUBCOLLECTION = 'messages';

/**
 * Sends a message and updates/creates the chat session
 */
export const sendMessage = async ({
  chatId,
  userId,
  userName,
  text,
  role,
  imageUrl,
  orderId,
  orderNumber
}: {
  chatId: string;
  userId: string;
  userName: string;
  text: string;
  role: 'client' | 'admin';
  imageUrl?: string;
  orderId?: string;
  orderNumber?: string;
}) => {
  try {
    const chatRef = doc(db, CHATS_COLLECTION, chatId);
    const messagesRef = collection(db, CHATS_COLLECTION, chatId, MESSAGES_SUBCOLLECTION);

    // 1. Add the message
    const messageData: any = {
      text,
      senderId: userId,
      senderRole: role,
      createdAt: serverTimestamp()
    };
    if (imageUrl) messageData.imageUrl = imageUrl;

    await addDoc(messagesRef, messageData);

    // 2. Update chat session metadata
    const chatData: any = {
      userId,
      userName,
      lastMessage: text || (imageUrl ? '📷 Imagen' : ''),
      lastMessageAt: serverTimestamp(),
      status: 'active',
      type: orderId ? 'order' : 'general',
      unreadCountAdmin: role === 'client' ? increment(1) : increment(0),
      unreadCountClient: role === 'admin' ? increment(1) : increment(0)
    };

    if (orderId) chatData.orderId = orderId;
    if (orderNumber) chatData.orderNumber = orderNumber;

    await setDoc(chatRef, chatData, { merge: true });

    await setDoc(chatRef, chatData, { merge: true });

    // 3. Create a notification (non-blocking)
    if (role === 'admin') {
      const subject = orderNumber ? `Pedido #${orderNumber}` : 'Consulta General';
      createNotification({
        userId,
        title: `Respuesta Soporte (${subject})`,
        message: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
        type: 'info',
        link: `/profile?tab=chat&chatId=${chatId}`
      }).catch(err => console.error("Non-blocking notification error:", err));
    }

    return true;
  } catch (error) {
    console.error('Error sending message:', error);
    return false;
  }
};

/**
 * Subscribes to messages of a specific chat session
 */
export const subscribeToMessages = (chatId: string, callback: (messages: ChatMessage[]) => void) => {
  const messagesRef = collection(db, CHATS_COLLECTION, chatId, MESSAGES_SUBCOLLECTION);
  const q = query(messagesRef, orderBy('createdAt', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ChatMessage[];
    callback(messages);
  });
};

/**
 * Subscribes to all active chats (for Admin Dashboard)
 */
export const subscribeToAllChats = (callback: (chats: ChatSession[]) => void) => {
  const chatsRef = collection(db, CHATS_COLLECTION);
  const q = query(chatsRef, orderBy('lastMessageAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const chats = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ChatSession[];
    callback(chats);
  });
};

/**
 * Subscribes to a user's chats
 */
export const subscribeToUserChats = (userId: string, callback: (chats: ChatSession[]) => void) => {
  const chatsRef = collection(db, CHATS_COLLECTION);
  const q = query(
    chatsRef, 
    where('userId', '==', userId)
  );

  return onSnapshot(q, (snapshot) => {
    const chats = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ChatSession[];
    // Sort in memory to avoid needing a composite index
    const sortedChats = chats.sort((a, b) => {
      const timeA = a.lastMessageAt?.toMillis() || 0;
      const timeB = b.lastMessageAt?.toMillis() || 0;
      return timeB - timeA;
    });
    callback(sortedChats);
  });
};

/**
 * Resets unread count for a role in a specific chat
 */
export const markChatAsRead = async (chatId: string, role: 'client' | 'admin') => {
  try {
    const chatRef = doc(db, CHATS_COLLECTION, chatId);
    await updateDoc(chatRef, {
      [role === 'client' ? 'unreadCountClient' : 'unreadCountAdmin']: 0
    });
    return true;
  } catch (error) {
    console.error('Error marking chat as read:', error);
    return false;
  }
};

/**
 * Resolves a chat and cleans up images
 */
export const resolveChat = async (chatId: string) => {
  try {
    const chatRef = doc(db, CHATS_COLLECTION, chatId);
    const messagesRef = collection(db, CHATS_COLLECTION, chatId, MESSAGES_SUBCOLLECTION);

    // 1. Mark as resolved
    await updateDoc(chatRef, { status: 'resolved' });

    // 2. Find all messages with images and delete them from Storage
    const snapshot = await getDocs(messagesRef);
    const deletePromises = snapshot.docs
      .map(doc => doc.data() as ChatMessage)
      .filter(msg => msg.imageUrl)
      .map(msg => deleteFile(msg.imageUrl!));

    await Promise.all(deletePromises);

    return true;
  } catch (error) {
    console.error('Error resolving chat:', error);
    return false;
  }
};
