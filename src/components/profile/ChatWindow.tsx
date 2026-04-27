import { useState, useEffect, useRef } from 'react';
import { Send, Image as ImageIcon, X, Loader2, MessageSquare, CheckCircle, Clock, Store, ShieldCheck } from 'lucide-react';
import { sendMessage, subscribeToMessages, ChatMessage, markChatAsRead, ChatSession } from '@/lib/services/chat';
import { uploadFile } from '@/lib/services/storage';
import styles from './ChatWindow.module.css';

interface ChatWindowProps {
  chatId: string;
  userId: string;
  userName: string;
  orderId?: string;
  orderNumber?: string;
  merchantName?: string;
  merchantId?: string;
  onBack?: () => void; // For mobile or list view
}

export default function ChatWindow({ chatId, userId, userName, orderId, orderNumber, merchantName, merchantId, onBack }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to messages
  useEffect(() => {
    if (!chatId) return;

    const unsubscribe = subscribeToMessages(chatId, (msgs) => {
      setMessages(msgs);
      // Mark as read for client if needed
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg && lastMsg.senderRole === 'admin') {
        markChatAsRead(chatId, 'client');
      }
    });

    return () => unsubscribe();
  }, [chatId]);

  // Scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if ((!inputText.trim() && !selectedImage) || isSending) return;

    setIsSending(true);
    let imageUrl = undefined;

    try {
      if (selectedImage) {
        imageUrl = await uploadFile(`chats/${chatId}/${Date.now()}-${selectedImage.name}`, selectedImage);
      }

      await sendMessage({
        chatId,
        userId,
        userName,
        text: inputText,
        role: 'client',
        imageUrl,
        orderId,
        orderNumber,
        merchantName,
        merchantId
      });
      
      setInputText('');
      setSelectedImage(null);
      setImagePreview(null);
    } catch (error) {
      console.error("Error in chat flow:", error);
    } finally {
      setIsSending(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={styles.chatContainer}>
      {/* Optional Context Header */}
      {(orderNumber || merchantName || onBack) && (
        <div style={{ padding: '12px 20px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onBack && <button onClick={onBack} className={styles.actionBtn} style={{ border: 'none' }}><X size={18} /></button>}
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, fontSize: '0.9rem' }}>
              {orderNumber ? `Consulta sobre Pedido #${orderNumber}` : 'Chat de Soporte'}
            </h4>
            {merchantName && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                <Store size={12} style={{ color: 'var(--brand-accent)' }} />
                <span>Conversando con: <strong>{merchantName}</strong></span>
              </div>
            )}
            <div style={{ fontSize: '0.7rem', color: 'var(--brand-accent)', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase', fontWeight: 800, marginTop: '2px' }}>
              <CheckCircle size={10} /> Sesión V.I.P. Activa
            </div>
          </div>
        </div>
      )}

      <div className={styles.messagesList}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
            <MessageSquare size={48} style={{ marginBottom: '16px', color: 'var(--brand-accent)' }} />
            <p>Inicia esta conversación con nuestro equipo.</p>
            {orderNumber && <p style={{ fontSize: '0.8rem', marginTop: '8px' }}>Tu caso sobre el Pedido #{orderNumber} será atendido prioritariamente.</p>}
          </div>
        ) : (
          messages.map((msg, index) => (
            <div 
              key={msg.id || index} 
              className={styles.messageWrapper}
              style={{ 
                alignSelf: msg.senderRole === 'client' ? 'flex-end' : 'flex-start',
                alignItems: msg.senderRole === 'client' ? 'flex-end' : 'flex-start',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                marginBottom: '12px'
              }}
            >
              <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginBottom: '4px', fontWeight: 700 }}>
                {msg.senderRole === 'admin' ? '🛡️ VENDEDOR ELITE' : msg.userName || 'Cliente'}
              </div>
              <div 
                className={styles.bubble}
                style={{
                  background: msg.senderRole === 'client' ? 'var(--brand-accent)' : '#1e293b',
                  color: msg.senderRole === 'client' ? '#000' : '#fff',
                  border: msg.senderRole === 'admin' ? '1px solid #334155' : 'none',
                  borderRadius: '16px',
                  borderBottomRightRadius: msg.senderRole === 'client' ? '2px' : '16px',
                  borderBottomLeftRadius: msg.senderRole === 'admin' ? '2px' : '16px',
                  padding: '10px 16px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
                  maxWidth: '85%'
                }}
              >
                {msg.text && <p style={{ margin: 0, fontWeight: 500 }}>{msg.text}</p>}
                {msg.imageUrl && (
                  <img src={msg.imageUrl} alt="Adjunto" className={styles.imageAttachment} onClick={() => window.open(msg.imageUrl, '_blank')} />
                )}
              </div>
              <span className={styles.time} style={{ textAlign: msg.senderRole === 'client' ? 'right' : 'left', fontSize: '0.6rem', marginTop: '4px' }}>
                {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'} 
                <span style={{ marginLeft: '8px', opacity: 0.3 }}>[v2.1-{msg.senderRole}]</span>
              </span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {imagePreview && (
        <div className={styles.imagePreview}>
          <img src={imagePreview} alt="Preview" className={styles.previewThumb} />
          <div style={{ flex: 1, fontSize: '0.85rem' }}>Imagen para el caso</div>
          <button className={styles.actionBtn} onClick={clearImage}>
            <X size={18} />
          </button>
        </div>
      )}

      <div className={styles.inputArea}>
        <input 
          type="file" 
          hidden 
          ref={fileInputRef} 
          accept="image/*" 
          onChange={handleImageSelect} 
        />
        <button 
          className={styles.actionBtn} 
          onClick={() => fileInputRef.current?.click()}
          title="Adjuntar Imagen"
        >
          <ImageIcon size={20} />
        </button>
        
        <textarea 
          className={styles.textArea}
          placeholder="Escribe tu mensaje..."
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
          disabled={(!inputText.trim() && !selectedImage) || isSending}
        >
          {isSending ? <Loader2 className="spin" size={20} /> : <Send size={20} />}
        </button>
      </div>
    </div>
  );
}
