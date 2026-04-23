'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  subscribeToAllChats, 
  subscribeToMessages, 
  sendMessage, 
  markChatAsRead, 
  resolveChat,
  ChatSession, 
  ChatMessage 
} from '@/lib/services/chat';
import { 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  User as UserIcon, 
  Send, 
  Image as ImageIcon, 
  Loader2,
  BellRing,
  Tag
} from 'lucide-react';
import { uploadFile } from '@/lib/services/storage';
import styles from './AdminChats.module.css';
import chatStyles from '@/components/profile/ChatWindow.module.css';
import adminStyles from '../admin.module.css';

export default function AdminChatsPage() {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to all chats - Only depends on initial mount
  useEffect(() => {
    const unsubscribe = subscribeToAllChats((updatedChats) => {
      setChats(updatedChats);
    });

    return () => unsubscribe();
  }, []);

  // Update selected chat data from the chats list without triggering re-subscription
  useEffect(() => {
    if (selectedChat) {
      const updatedSelected = chats.find(c => c.id === selectedChat.id);
      if (updatedSelected && JSON.stringify(updatedSelected) !== JSON.stringify(selectedChat)) {
        setSelectedChat(updatedSelected);
      }
    }
  }, [chats, selectedChat]);

  // Subscribe to messages of selected chat - Depend only on chatId
  useEffect(() => {
    if (!selectedChat?.id) {
      setMessages([]);
      return;
    }

    const unsubscribe = subscribeToMessages(selectedChat.id, (msgs) => {
      setMessages(msgs);
      markChatAsRead(selectedChat.id, 'admin');
    });

    return () => unsubscribe();
  }, [selectedChat?.id]);

  // Scroll to bottom only when NEW messages are added (not on initial load or re-renders)
  const prevMessagesCount = useRef(0);
  useEffect(() => {
    if (messages.length > prevMessagesCount.current && messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      }
    }
    prevMessagesCount.current = messages.length;
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || isSending || !selectedChat) return;

    setIsSending(true);

    try {
      const textToSend = inputText.trim();
      setInputText(''); // Clear immediately for better UX
      
      const success = await sendMessage({
        chatId: selectedChat.id,
        userId: selectedChat.userId,
        userName: selectedChat.userName,
        text: textToSend,
        role: 'admin',
        orderId: selectedChat.orderId,
        orderNumber: selectedChat.orderNumber
      });
      
      if (!success) {
        // Option: Restore text if it failed
        // setInputText(textToSend); 
        console.error("Message failed to send to Firestore");
      }
    } catch (error) {
      console.error("Error in admin chat component:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedChat || !window.confirm('¿Estás seguro de marcar este caso como RESUELTO?')) return;
    
    try {
      await resolveChat(selectedChat.id);
    } catch (error) {
      console.error("Error resolving chat:", error);
    }
  };

  return (
    <div className={adminStyles.adminPage}>
      <div className="container">
        <div className={adminStyles.header}>
          <h1>Consola de <span className={adminStyles.accent}>Soporte por Casos</span></h1>
          <p style={{ color: 'var(--text-tertiary)' }}>Atención contextualizada por pedido y consultas generales.</p>
        </div>

        <div className={styles.adminContainer}>
          {/* Chat List */}
          <aside className={styles.chatList}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
              <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Conversaciones</h3>
            </div>
            {chats.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', opacity: 0.4 }}>
                <Clock size={32} style={{ marginBottom: '12px' }} />
                <p style={{ fontSize: '0.85rem' }}>Buscando chats activos...</p>
              </div>
            ) : (
              chats.map(chat => (
                <div 
                  key={chat.id} 
                  className={`${styles.chatItem} ${selectedChat?.id === chat.id ? styles.active : ''}`}
                  onClick={() => setSelectedChat(chat)}
                >
                  <div className={styles.chatItemHeader}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {chat.userName}
                      {chat.type === 'order' && <Tag size={12} color="var(--brand-accent)" />}
                    </h4>
                    {chat.unreadCountAdmin > 0 && (
                      <span className={styles.unreadBadge}>{chat.unreadCountAdmin}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className={styles.lastMsg}>{chat.lastMessage}</div>
                    {chat.type === 'order' && (
                      <span style={{ fontSize: '0.65rem', color: 'var(--brand-accent)', fontWeight: 700 }}>
                        #{chat.orderNumber}
                      </span>
                    )}
                  </div>
                  {chat.unreadCountAdmin > 0 && <div className={styles.notifDot} />}
                </div>
              ))
            )}
          </aside>

          {/* Chat View */}
          <main className={styles.chatView}>
            {selectedChat ? (
              <>
                <div className={styles.chatHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--brand-accent)', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                      {selectedChat.userName[0]}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                        {selectedChat.userName}
                        {selectedChat.type === 'order' && <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginLeft: '8px' }}>- Pedido #{selectedChat.orderNumber}</span>}
                      </h3>
                      <div className={styles.statusIndicator}>
                        {selectedChat.status === 'active' ? (
                          <><Clock size={12} className={styles.statusActive} /> Activo</>
                        ) : (
                          <><CheckCircle size={12} className={styles.statusResolved} /> Resuelto</>
                        )}
                      </div>
                    </div>
                  </div>
                  {selectedChat.status === 'active' && (
                    <button className={styles.resolveBtn} onClick={handleResolve}>
                      <CheckCircle size={16} /> Resolver Caso
                    </button>
                  )}
                </div>

                <div className={styles.messagesList} style={{ flex: 1 }}>
                  {messages.map((msg, index) => (
                    <div 
                      key={msg.id || index} 
                      className={`${styles.messageWrapper} ${msg.senderRole === 'admin' ? styles.adminMessageWrapper : styles.clientMessageWrapper}`}
                    >
                      <div className={styles.bubble}>
                        {msg.text && <p>{msg.text}</p>}
                        {msg.imageUrl && (
                          <img 
                            src={msg.imageUrl} 
                            alt="Adjunto" 
                            className={styles.imageAttachment} 
                            onClick={() => window.open(msg.imageUrl, '_blank')} 
                          />
                        )}
                      </div>
                      <span className={styles.time}>
                        {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                      </span>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className={styles.inputArea}>
                  <textarea 
                    className={styles.textArea}
                    placeholder="Escribe una respuesta profesional..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    disabled={isSending}
                  />
                  <button 
                    className={`${styles.actionBtn} ${styles.sendBtn}`} 
                    onClick={handleSend}
                    disabled={!inputText.trim() || isSending}
                  >
                    {isSending ? <Loader2 className="spin" size={20} /> : <Send size={20} />}
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.emptyState}>
                <MessageSquare size={80} style={{ marginBottom: '24px' }} />
                <h2>Gestión de Soporte V.I.P.</h2>
                <p>Selecciona un caso para brindar asistencia personalizada.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
