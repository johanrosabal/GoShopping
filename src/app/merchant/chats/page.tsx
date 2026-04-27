'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  subscribeToMerchantChats, 
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
  Tag,
  ArrowLeft,
  X,
  Store,
  ShieldCheck,
  LayoutDashboard,
  ShoppingBag,
  LogOut,
  Package,
  Settings,
  Menu as MenuIcon
} from 'lucide-react';
import styles from '@/app/admin/chats/AdminChats.module.css';
import chatStyles from '@/components/profile/ChatWindow.module.css';
import merchantDashboardStyles from '@/app/merchant/dashboard/merchant.module.css';
import Link from 'next/link';

export default function MerchantChatsPage() {
  const { userData, loading: authLoading, logout } = useAuth();
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [merchant, setMerchant] = useState<any>(null);
  const [merchantId, setMerchantId] = useState<string | undefined>(userData?.merchantId);
  const [loading, setLoading] = useState(true);

  // Handle merchantId discovery and loading
  useEffect(() => {
    const resolveMerchantId = async () => {
      if (authLoading) return;
      
      let mId = userData?.merchantId;
      let mData = null;
      
      try {
        const { getMerchantByOwnerUid, getMerchantById } = await import('@/lib/services/merchants');
        
        if (mId) {
          mData = await getMerchantById(mId);
        } else if (userData?.uid) {
          mData = await getMerchantByOwnerUid(userData.uid);
          if (mData) {
            mId = mData.id;
          }
        }
      } catch (e) {
        console.error("Chat auto-discovery failed:", e);
      }
      
      setMerchant(mData);
      setMerchantId(mId);
      setLoading(false);
    };

    resolveMerchantId();
  }, [userData, authLoading]);

  // Subscribe to merchant's chats
  useEffect(() => {
    if (!merchantId) return;

    const unsubscribe = subscribeToMerchantChats(
      merchantId, 
      (updatedChats) => {
        setChats(updatedChats);
      },
      merchant?.name // Pass name as fallback
    );

    return () => unsubscribe();
  }, [merchantId, merchant?.name]);

  // Update selected chat data
  useEffect(() => {
    if (selectedChat) {
      const updatedSelected = chats.find(c => c.id === selectedChat.id);
      if (updatedSelected && JSON.stringify(updatedSelected) !== JSON.stringify(selectedChat)) {
        setSelectedChat(updatedSelected);
      }
    }
  }, [chats, selectedChat]);

  // Subscribe to messages
  useEffect(() => {
    if (!selectedChat?.id) {
      setMessages([]);
      return;
    }

    const unsubscribe = subscribeToMessages(selectedChat.id, (msgs) => {
      setMessages(msgs);
      markChatAsRead(selectedChat.id, 'admin'); // Merchant acts as admin role for chat logic
    });

    return () => unsubscribe();
  }, [selectedChat?.id]);

  // Scroll to bottom
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          processImageFile(file);
        }
      }
    }
  };

  const processImageFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen es demasiado grande (máx 5MB)");
      return;
    }
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async () => {
    if ((!inputText.trim() && !selectedImage) || isSending || !selectedChat) return;

    setIsSending(true);
    try {
      let imageUrl = undefined;
      
      // 1. Upload image if selected
      if (selectedImage) {
        const { uploadChatImage } = await import('@/lib/services/storage');
        imageUrl = await uploadChatImage(selectedImage, selectedChat.id);
      }

      const textToSend = inputText.trim();
      setInputText('');
      clearImage();
      
      await sendMessage({
        chatId: selectedChat.id,
        userId: userData?.uid || '',
        userName: selectedChat.userName, 
        text: textToSend,
        role: 'admin', 
        imageUrl,
        orderId: selectedChat.orderId,
        orderNumber: selectedChat.orderNumber,
        merchantId: merchantId,
        merchantName: selectedChat.merchantName
      });
    } catch (error) {
      console.error("Error in merchant chat:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedChat || !window.confirm('¿Marcar este caso como RESUELTO?')) return;
    try {
      await resolveChat(selectedChat.id);
    } catch (error) {
      console.error("Error resolving chat:", error);
    }
  };

  if (authLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', color: '#D4AF37' }}>
        <Loader2 className="spin" size={40} />
      </div>
    );
  }

  return (
    <div className={merchantDashboardStyles.dashboardContainer}>
      <aside className={`${merchantDashboardStyles.sidebar} ${sidebarOpen ? merchantDashboardStyles.sidebarOpen : ''}`}>
        <button 
          className={merchantDashboardStyles.closeMobileMenu} 
          onClick={() => setSidebarOpen(false)}
        >
          <X size={24} />
        </button>
        <div className={merchantDashboardStyles.sidebarHeader}>
          <Store className={merchantDashboardStyles.brandIcon} />
          <h2>Elite <span className={merchantDashboardStyles.accent}>Merchant</span></h2>
        </div>
        
        <nav className={merchantDashboardStyles.nav}>
          <Link href="/merchant/dashboard" className={merchantDashboardStyles.navLink}>
            <LayoutDashboard size={20} /> Panel Principal
          </Link>
          <Link href="/merchant/orders" className={merchantDashboardStyles.navLink}>
             <ShoppingBag size={20} /> Mis Pedidos
          </Link>
          <Link href="/merchant/orders/sinpe" className={merchantDashboardStyles.navLink}>
            <ShieldCheck size={20} /> Validación SINPE
          </Link>
          <Link href="/merchant/chats" className={merchantDashboardStyles.navLinkActive}>
            <MessageSquare size={20} /> Soporte Chat
          </Link>
        </nav>

        <button onClick={logout} className={merchantDashboardStyles.logoutBtn}>
          <LogOut size={20} /> Cerrar Sesión
        </button>
      </aside>

      <main className={merchantDashboardStyles.content} style={{ 
        padding: 0, 
        overflow: 'hidden', 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        flex: 1
      }}>
        {/* Mobile Header Toggle */}
        <div style={{ 
          display: 'none', 
          padding: '16px 20px', 
          background: '#0a0a0a', 
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          alignItems: 'center',
          gap: '12px',
          zIndex: 30
        }} className="mobile-header-toggle">
          <button 
            onClick={() => setSidebarOpen(true)}
            style={{ background: 'transparent', border: 'none', color: '#D4AF37' }}
          >
            <MenuIcon size={24} />
          </button>
          <h2 style={{ fontSize: '1rem', margin: 0 }}>Elite <span className={merchantDashboardStyles.accent}>Merchant</span></h2>
        </div>
        <div className={`${styles.adminContainer} ${selectedChat ? styles.showChat : ''}`} style={{ 
          flex: 1,
          display: 'grid',
          border: 'none', 
          margin: 0,
          height: '100%',
          overflow: 'hidden'
        }}>
          {/* Chat List */}
          <aside className={styles.chatList} style={{ background: 'var(--bg-primary)' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Soporte <span className={merchantDashboardStyles.accent}>Clientes</span></h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>Gestiona las consultas de tus compradores.</p>
            </div>
            {chats.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', opacity: 0.3 }}>
                <MessageSquare size={48} style={{ marginBottom: '16px' }} />
                <p>No tienes chats activos en este momento.</p>
              </div>
            ) : (
              chats.map(chat => (
                <div 
                  key={chat.id} 
                  className={`${styles.chatItem} ${selectedChat?.id === chat.id ? styles.active : ''}`}
                  onClick={() => setSelectedChat(chat)}
                  style={{ borderLeft: '3px solid transparent' }}
                >
                  <div className={styles.chatItemHeader}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}>
                      <UserIcon size={14} style={{ color: 'var(--brand-accent)' }} />
                      {chat.userName} 
                    </h4>
                    {chat.unreadCountAdmin > 0 && (
                      <span className={styles.unreadBadge}>{chat.unreadCountAdmin}</span>
                    )}
                  </div>
                  <div className={styles.lastMsg} style={{ marginTop: '4px' }}>{chat.lastMessage}</div>
                  <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {chat.type === 'order' ? (
                      <span style={{ fontSize: '0.65rem', color: 'var(--brand-accent)', fontWeight: 800, background: 'rgba(212,175,55,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                        PEDIDO #{chat.orderNumber}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 700 }}>
                        CONSULTA GENERAL
                      </span>
                    )}
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>
                      {chat.lastMessageAt?.toDate ? chat.lastMessageAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Reciente'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </aside>

          {/* Chat View */}
          <main className={styles.chatView} style={{ 
            background: '#080808',
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%', 
            overflow: 'hidden',
            position: 'relative',
            flex: 1
          }}>
            {selectedChat ? (
              <>
                <div className={styles.chatHeader} style={{ 
                  background: 'var(--bg-primary)', 
                  borderBottom: '1px solid var(--border)', 
                  padding: '12px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '0' }}>
                    <button className={styles.mobileBackBtn} onClick={() => setSelectedChat(null)} style={{ padding: '8px' }}>
                      <ArrowLeft size={20} />
                    </button>
                    <div style={{ 
                      width: '36px', 
                      height: '36px', 
                      borderRadius: '50%', 
                      background: 'var(--brand-accent)', 
                      color: 'black', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontWeight: '800', 
                      fontSize: '1rem',
                      flexShrink: 0
                    }}>
                      {selectedChat.userName[0]}
                    </div>
                    <div style={{ overflow: 'hidden', flex: 1 }}>
                      <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {selectedChat.userName} 
                      </h3>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', background: 'rgba(255,255,255,0.05)', padding: '2px 4px', borderRadius: '3px' }}>CLIENTE ELITE</span>
                        {selectedChat.type === 'order' && (
                          <span style={{ color: 'var(--brand-accent)', fontWeight: 700, fontSize: '0.7rem' }}>
                            #{selectedChat.orderNumber}
                          </span>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.65rem', color: '#10b981' }}>
                          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981' }} /> ACTIVA
                        </div>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={handleResolve} 
                    style={{ 
                      background: 'rgba(16, 185, 129, 0.1)', 
                      border: '1px solid rgba(16, 185, 129, 0.2)', 
                      color: '#10b981',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      marginLeft: 'auto'
                    }}
                  >
                    <CheckCircle size={14} /> Cerrar Caso
                  </button>
                </div>

                <div className={styles.messagesList} style={{ 
                  flex: 1, 
                  height: 0, 
                  minHeight: 0, 
                  overflowY: 'auto', 
                  padding: '30px',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {messages.map((msg, index) => (
                    <div 
                      key={msg.id || index} 
                      className={msg.senderRole === 'admin' ? styles.adminMessageWrapper : styles.clientMessageWrapper}
                      style={{ 
                        alignSelf: msg.senderRole?.toLowerCase() === 'admin' ? 'flex-end' : 'flex-start',
                        display: 'flex',
                        flexDirection: 'column',
                        width: 'fit-content',
                        maxWidth: '80%',
                        marginLeft: msg.senderRole?.toLowerCase() === 'admin' ? 'auto' : '0',
                        marginRight: msg.senderRole?.toLowerCase() === 'admin' ? '0' : 'auto',
                        alignItems: msg.senderRole?.toLowerCase() === 'admin' ? 'flex-end' : 'flex-start',
                        marginBottom: '20px'
                      }}
                    >
                      <div style={{ 
                        fontSize: '0.65rem', 
                        fontWeight: 800, 
                        marginBottom: '4px', 
                        marginLeft: msg.senderRole === 'admin' ? '0' : '12px',
                        marginRight: msg.senderRole === 'admin' ? '12px' : '0',
                        textAlign: msg.senderRole === 'admin' ? 'right' : 'left',
                        color: msg.senderRole === 'admin' ? 'var(--brand-accent)' : 'var(--text-tertiary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        {msg.senderRole?.toLowerCase() === 'admin' ? 'YO (Comercio)' : selectedChat.userName} 
                      </div>
                      <div className={styles.bubble} style={{ 
                        background: msg.senderRole?.toLowerCase() === 'admin' ? '#1a1a1a' : 'var(--brand-accent)',
                        color: msg.senderRole?.toLowerCase() === 'admin' ? '#fff' : '#000',
                        border: msg.senderRole?.toLowerCase() === 'admin' ? '1px solid rgba(212, 175, 55, 0.3)' : 'none',
                        borderRadius: '20px',
                        borderBottomRightRadius: msg.senderRole?.toLowerCase() === 'admin' ? '4px' : '20px',
                        borderBottomLeftRadius: msg.senderRole?.toLowerCase() === 'admin' ? '20px' : '4px'
                      }}>
                        {msg.text && <p style={{ margin: 0, fontWeight: 500 }}>{msg.text}</p>}
                        {msg.imageUrl && (
                          <img src={msg.imageUrl} alt="Adjunto" className={styles.imageAttachment} style={{ marginTop: msg.text ? '12px' : 0 }} />
                        )}
                      </div>
                      <span className={styles.time} style={{ fontSize: '0.65rem', textAlign: msg.senderRole === 'admin' ? 'right' : 'left' }}>
                        {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                      </span>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {imagePreview && (
                  <div style={{ 
                    padding: '12px 30px', 
                    background: 'rgba(212,175,55,0.05)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    borderTop: '1px solid var(--border)'
                  }}>
                    <img src={imagePreview} alt="Preview" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                    <div style={{ flex: 1, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Imagen adjunta lista para enviar</div>
                    <button onClick={clearImage} style={{ background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer' }}>
                      <X size={18} />
                    </button>
                  </div>
                )}

                <div className={styles.inputArea} style={{ 
                  padding: '20px 30px', 
                  background: 'var(--bg-secondary)', 
                  borderTop: '2px solid var(--brand-accent)',
                  display: 'flex',
                  gap: '15px',
                  alignItems: 'flex-end',
                  position: 'sticky',
                  bottom: 0,
                  zIndex: 10,
                  width: '100%'
                }}>
                  <input 
                    type="file" 
                    hidden 
                    ref={fileInputRef} 
                    accept="image/*" 
                    onChange={handleImageSelect} 
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    style={{ 
                      background: 'rgba(255,255,255,0.05)', 
                      border: 'none', 
                      color: 'var(--brand-accent)', 
                      width: '44px', 
                      height: '44px', 
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      marginBottom: '8px'
                    }}
                    title="Adjuntar Imagen"
                  >
                    <ImageIcon size={22} />
                  </button>
                  <textarea 
                    className={styles.textArea}
                    placeholder={`Escribe un mensaje a ${selectedChat.userName}...`}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onPaste={handlePaste}
                    style={{ 
                      background: 'rgba(255,255,255,0.03)', 
                      border: '1px solid var(--border)', 
                      borderRadius: '12px', 
                      padding: '16px',
                      flex: 1,
                      minHeight: '60px',
                      maxHeight: '200px',
                      color: 'white'
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <button 
                    className={`${styles.actionBtn} ${styles.sendBtn}`} 
                    onClick={handleSend}
                    disabled={(!inputText.trim() && !selectedImage) || isSending}
                    style={{ 
                      width: '60px', 
                      height: '60px', 
                      borderRadius: '12px',
                      background: 'var(--brand-accent)',
                      color: 'black',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {isSending ? <Loader2 className="spin" size={24} /> : <Send size={26} />}
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.emptyState}>
                <div style={{ 
                  width: '120px', 
                  height: '120px', 
                  borderRadius: '50%', 
                  background: 'rgba(212,175,55,0.05)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginBottom: '32px'
                }}>
                  <MessageSquare size={50} style={{ color: 'var(--brand-accent)' }} />
                </div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>Centro de <span className={merchantDashboardStyles.accent}>Soporte</span></h2>
                <p style={{ maxWidth: '400px', margin: '16px auto', color: 'var(--text-tertiary)' }}>
                  Brinda asistencia personalizada a tus clientes Elite y resuelve sus dudas sobre pedidos específicos.
                </p>
              </div>
            )}
          </main>
        </div>
      </main>
    </div>
  );
}
