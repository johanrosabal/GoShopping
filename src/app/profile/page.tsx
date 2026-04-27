'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getUserProfile, updateUserProfile, UserProfile, UserAddress } from '@/lib/services/users';
import { getUserOrders, OrderData, subscribeToUserOrders } from '@/lib/services/orders';
import { subscribeToNotifications, markAsRead, Notification } from '@/lib/services/notifications';
import { ChatSession, subscribeToUserChats } from '@/lib/services/chat';
import { formatCostaRicaPhone } from '@/lib/utils/mask';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  User, 
  MapPin, 
  Bell, 
  Phone, 
  MessageSquare, 
  Save, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Loader2, 
  X,
  Mail,
  Clock,
  LocateFixed,
  ExternalLink,
  Pencil,
  List,
  Search,
  Info,
  ShoppingBag,
  Package,
  ArrowRight,
  Tag,
  Store
} from 'lucide-react';
import ShoppingListManager from '@/components/profile/ShoppingListManager';
import ChatWindow from '@/components/profile/ChatWindow';
import StatusModal, { ModalType } from '@/components/common/StatusModal';
import styles from './Profile.module.css';

const AddressMap = dynamic(() => import('@/components/profile/AddressMap'), { 
  ssr: false,
  loading: () => <div style={{ height: '300px', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando mapa...</div>
});

function ProfileContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'notifications' | 'lists' | 'orders' | 'chat'>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<(OrderData & { id: string })[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userChats, setUserChats] = useState<ChatSession[]>([]);
  const [selectedChatContext, setSelectedChatContext] = useState<{ chatId: string, orderId?: string, orderNumber?: string, merchantName?: string, merchantId?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: ModalType;
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({ 
    isOpen: false, 
    type: 'success', 
    title: '', 
    message: '' 
  });

  // Sync tab and specific chat from URL parameters - Only on searchParams change or mount
  useEffect(() => {
    const tab = searchParams.get('tab');
    const chatId = searchParams.get('chatId');

    if (tab === 'lists') setActiveTab('lists');
    else if (tab === 'addresses') setActiveTab('addresses');
    else if (tab === 'notifications') setActiveTab('notifications');
    else if (tab === 'orders') setActiveTab('orders');
    else if (tab === 'chat') {
      setActiveTab('chat');
      // If we have a chatId in URL but no context selected yet, try to find it
      if (chatId && !selectedChatContext) {
        const existingChat = userChats.find(c => c.id === chatId);
        if (existingChat) {
          setSelectedChatContext({
            chatId: existingChat.id,
            orderId: existingChat.orderId,
            orderNumber: existingChat.orderNumber,
            merchantName: existingChat.merchantName,
            merchantId: existingChat.merchantId
          });
        } else {
          // Fallback: Infer from chatId if possible
          const isOrderChat = chatId.startsWith('order_');
          setSelectedChatContext({
            chatId,
            orderId: isOrderChat ? chatId.replace('order_', '') : undefined,
            orderNumber: isOrderChat ? '...' : undefined
          });
        }
      }
    }
    else if (tab === 'profile') setActiveTab('profile');
  }, [searchParams]); // Removed userChats from dependency to avoid resetting on every message

  // Address edit state
  const [newAddress, setNewAddress] = useState({ alias: '', detail: '', mapsUrl: '' });
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  
  // Map center from GPS
  const [mapCenter, setMapCenter] = useState<[number, number]>([9.9333, -84.0833]);

  useEffect(() => {
    if (user) {
      const loadProfile = async () => {
        const profileData = await getUserProfile(user.uid);
        if (profileData) setProfile(profileData);
        // We set loading false here because orders list has its own subscription
      };
      loadProfile();

      // Subscribe to real-time orders
      const unsubscribeOrders = subscribeToUserOrders(user.uid, (data) => {
        setOrders(data);
        setLoading(false);
      });

      // Subscribe to real-time notifications
      const unsubscribeNotifications = subscribeToNotifications(user.uid, (data) => {
        setNotifications(data);
      });

      // Subscribirse a los chats del usuario
      const unsubscribeChats = subscribeToUserChats(user.uid, (chats) => {
        setUserChats(chats);
      });

      return () => {
        unsubscribeOrders();
        unsubscribeNotifications();
        unsubscribeChats();
      };
    }
  }, [user]);

  // Debounce map sync to avoid rapid re-renders during typing
  useEffect(() => {
    if (newAddress.mapsUrl && newAddress.mapsUrl.length > 10) {
      const timer = setTimeout(() => {
        syncMapFromUrl(newAddress.mapsUrl);
      }, 800); // 800ms debounce
      return () => clearTimeout(timer);
    }
  }, [newAddress.mapsUrl]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    setSaving(true);
    const success = await updateUserProfile(user.uid, {
      displayName: profile.displayName,
      phone: profile.phone,
      whatsapp: profile.whatsapp
    });
    setSaving(false);
    if (success) {
      setModal({ isOpen: true, type: 'success', title: 'Perfil Actualizado', message: 'Tus datos de contacto han sido guardados con éxito.' });
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setModal({ isOpen: true, type: 'error', title: 'GPS no soportado', message: 'Tu navegador no soporta geolocalización.' });
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
        setNewAddress({ ...newAddress, mapsUrl: url });
        setMapCenter([latitude, longitude]);
        setLocating(false);
      },
      (error) => {
        console.error("GPS Error:", error);
        setLocating(false);
        setModal({ isOpen: true, type: 'error', title: 'Error de GPS', message: 'No pudimos obtener tu ubicación. Por favor asegúrate de dar los permisos necesarios.' });
      }
    );
  };
  
  const handleGeocodeAddress = async () => {
    const originalDetail = newAddress.detail.trim();
    if (!originalDetail) return;
    
    setIsGeocoding(true);
    
    // Split by commas to try broader searches if specific fails
    const parts = originalDetail.split(',').map(p => p.trim()).filter(Boolean);
    let found = false;
    
    try {
      // Cascade search loop: try the full string, then remove the last part and try again
      for (let i = parts.length; i > 0; i--) {
        const currentQueryParts = parts.slice(0, i);
        const queryText = currentQueryParts.join(', ');
        const query = encodeURIComponent(`${queryText}, Costa Rica`);
        
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
        const data = await response.json();
        
        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          const latitude = parseFloat(lat);
          const longitude = parseFloat(lon);
          
          setMapCenter([latitude, longitude]);
          const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
          setNewAddress({ ...newAddress, mapsUrl: url });
          
          const isExact = i === parts.length;
          
          setModal({ 
            isOpen: true, 
            type: isExact ? 'success' : 'warning', 
            title: isExact ? 'Ubicación Encontrada' : 'Aproximación Encontrada', 
            message: isExact 
              ? `El mapa se ha desplazado a: ${data[0].display_name}`
              : `No pudimos hallar el punto exacto, pero te ubicamos en la zona de: ${queryText}. Por favor ajusta el pin en el mapa.` 
          });
          
          found = true;
          break; // Exit loop on first result
        }
      }
      
      if (!found) {
        setModal({ 
          isOpen: true, 
          type: 'warning', 
          title: 'Sin Resultados', 
          message: 'No pudimos encontrar esa dirección ni la zona general. Intenta con nombres de calles o distritos conocidos.' 
        });
      }
    } catch (error) {
      console.error("Geocoding Error:", error);
      setModal({ 
        isOpen: true, 
        type: 'error', 
        title: 'Error de Búsqueda', 
        message: 'Hubo un fallo al contactar el servicio de mapas.' 
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleEditAddress = (addr: UserAddress) => {
    setNewAddress({
      alias: addr.alias,
      detail: addr.detail,
      mapsUrl: addr.mapsUrl || ''
    });
    setEditingAddressId(addr.id);
    
    // Initial sync of the map if URL exists
    if (addr.mapsUrl) {
      syncMapFromUrl(addr.mapsUrl);
    }
    
    setShowAddressForm(true);
  };

  const syncMapFromUrl = (url: string) => {
    try {
      const decodedUrl = decodeURIComponent(url);
      
      // Pattern 1: Modern Google Maps (@lat,lng)
      const atPattern = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
      const atMatch = decodedUrl.match(atPattern);
      if (atMatch && atMatch.length >= 3) {
        setMapCenter([parseFloat(atMatch[1]), parseFloat(atMatch[2])]);
        return;
      }

      // Pattern 2: Search parameter (q=lat,lng) - support , or %2C
      const qPattern = /[?&]q=(-?\d+\.\d+)(?:,|%2C)(-?\d+\.\d+)/;
      const qMatch = decodedUrl.match(qPattern);
      if (qMatch && qMatch.length >= 3) {
        setMapCenter([parseFloat(qMatch[1]), parseFloat(qMatch[2])]);
        return;
      }

      // Pattern 3: Raw coordinates in the string (lat, lng)
      const rawPattern = /(-?\d+\.\d+),\s*(-?\d+\.\d+)/;
      const rawMatch = decodedUrl.match(rawPattern);
      if (rawMatch && rawMatch.length >= 3) {
        setMapCenter([parseFloat(rawMatch[1]), parseFloat(rawMatch[2])]);
        return;
      }
    } catch (e) {
      console.error("Error parsing map coords:", e);
    }
  };

  const handleMapLocationChange = useCallback((lat: number, lng: number) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    setNewAddress(prev => ({ ...prev, mapsUrl: url }));
  }, []);

  const handleAddAddress = async () => {
    if (!user || !profile || !newAddress.alias || !newAddress.detail) return;
    
    let updatedAddresses = [];
    
    if (editingAddressId) {
      // Update existing
      updatedAddresses = (profile.addresses || []).map(addr => 
        addr.id === editingAddressId 
          ? { ...addr, alias: newAddress.alias, detail: newAddress.detail, mapsUrl: newAddress.mapsUrl }
          : addr
      );
    } else {
      // Create new
      const address: UserAddress = {
        id: Math.random().toString(36).substr(2, 9),
        alias: newAddress.alias,
        detail: newAddress.detail,
        mapsUrl: newAddress.mapsUrl,
        isDefault: (profile.addresses?.length || 0) === 0
      };
      updatedAddresses = [...(profile.addresses || []), address];
    }
    
    const success = await updateUserProfile(user.uid, { addresses: updatedAddresses });
    if (success) {
      setProfile({ ...profile, addresses: updatedAddresses });
      setNewAddress({ alias: '', detail: '', mapsUrl: '' });
      setEditingAddressId(null);
      setShowAddressForm(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!user || !profile) return;
    const updatedAddresses = profile.addresses?.filter(a => a.id !== id) || [];
    const success = await updateUserProfile(user.uid, { addresses: updatedAddresses });
    if (success) setProfile({ ...profile, addresses: updatedAddresses });
  };

  const handleMarkRead = async (notif: Notification) => {
    // 1. Mark as read immediately in background
    markAsRead(notif.id).catch(err => console.error("Error marking read:", err));
    
    // 2. Direct navigation if it's a chat link
    if (notif.link && notif.link.includes('chatId=')) {
      // Direct string parsing to be super safe
      const chatIdParam = notif.link.split('chatId=')[1];
      const chatId = chatIdParam ? chatIdParam.split('&')[0] : null;
      
      if (chatId) {
        console.log("Direct Nav to chatId:", chatId);
        setActiveTab('chat');
        const isOrderChat = chatId.startsWith('order_');
        setSelectedChatContext({
          chatId,
          orderId: isOrderChat ? chatId.replace('order_', '') : undefined,
          orderNumber: isOrderChat ? '...' : undefined
        });
        
        // Update URL
        router.push(notif.link);
        return;
      }
    }
    
    // 3. Fallback for other links
    if (notif.link) {
      router.push(notif.link);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <Loader2 className="spin" size={40} color="var(--brand-accent)" />
      </div>
    );
  }

  return (
    <div className={`${styles.profilePage} container animate`}>
      <header className={styles.header}>
        <h1>Mi Perfil <span className={styles.accent}>Elite</span></h1>
        <p>Gestiona tu información personal y mantente al tanto de tus compras exclusivas.</p>
      </header>

      <div className={styles.layout}>
        {/* Navigation Tabs */}
        <aside className={styles.tabs}>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'profile' ? styles.active : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={20} /> Datos Personales
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'notifications' ? styles.active : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell size={20} /> 
            Notificaciones
            {notifications.filter(n => !n.read).length > 0 && (
              <span className={styles.defaultBadge} style={{ marginLeft: 'auto' }}>
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'orders' ? styles.active : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <Package size={20} /> Mis Pedidos
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'chat' ? styles.active : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <MessageSquare size={20} /> Soporte V.I.P.
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'addresses' ? styles.active : ''}`}
            onClick={() => setActiveTab('addresses')}
          >
            <MapPin size={20} /> Direcciones de Entrega
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'lists' ? styles.active : ''}`}
            onClick={() => setActiveTab('lists')}
          >
            <List size={20} /> Mis Listas Elite
          </button>
        </aside>

        {/* Tab Content */}
        <main className={styles.content}>
          
          {activeTab === 'profile' && profile && (
            <form onSubmit={handleUpdateProfile}>
              <div className={styles.sectionHeader}>
                <h2><User className={styles.accent} /> Datos de Contacto</h2>
                <button type="submit" className={styles.saveBtn} disabled={saving}>
                  {saving ? <Loader2 className="spin" size={18} /> : <Save size={18} />} Guardar Cambios
                </button>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.inputGroup}>
                  <label>Nombre Completo</label>
                  <div className={styles.inputWrapper}>
                    <User size={18} />
                    <input 
                      type="text" 
                      value={profile.displayName} 
                      onChange={e => setProfile({ ...profile, displayName: e.target.value })}
                    />
                  </div>
                </div>
                <div className={styles.inputGroup}>
                  <label>Email (No editable)</label>
                  <div className={styles.inputWrapper}>
                    <Mail size={18} />
                    <input type="email" value={profile.email} disabled />
                  </div>
                </div>
                <div className={styles.inputGroup}>
                  <label>Teléfono Celular</label>
                  <div className={styles.inputWrapper}>
                    <Phone size={18} />
                    <input 
                      type="text" 
                      placeholder="+506 0000-0000"
                      value={profile.phone || ''} 
                      onChange={e => setProfile({ ...profile, phone: formatCostaRicaPhone(e.target.value) })}
                    />
                  </div>
                </div>
                <div className={styles.inputGroup}>
                  <label>WhatsApp (Alertas)</label>
                  <div className={styles.inputWrapper}>
                    <MessageSquare size={18} />
                    <input 
                      type="text" 
                      placeholder="+506 0000-0000"
                      value={profile.whatsapp || ''} 
                      onChange={e => setProfile({ ...profile, whatsapp: formatCostaRicaPhone(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
            </form>
          )}

          {activeTab === 'lists' && user && (
            <ShoppingListManager userId={user.uid} />
          )}

          {activeTab === 'addresses' && profile && (
            <>
              <div className={styles.sectionHeader}>
                <h2><MapPin className={styles.accent} /> Mis Ubicaciones</h2>
                <button className={styles.addBtn} onClick={() => setShowAddressForm(true)}>
                  <Plus size={18} /> Agregar Dirección
                </button>
              </div>

              {showAddressForm && (
                <div className={styles.addressCard} style={{ borderStyle: 'dashed', flexDirection: 'column', gap: '20px' }}>
                  <div className={styles.sectionHeader} style={{ marginBottom: '10px' }}>
                    <h3 style={{ fontSize: '1.1rem' }}>{editingAddressId ? 'Editar Dirección' : 'Nueva Dirección'}</h3>
                  </div>
                  <div className={styles.formGrid} style={{ width: '100%' }}>
                    <div className={styles.inputGroup}>
                      <label>Etiqueta (ej: Casa, Oficina)</label>
                      <input 
                        type="text" 
                        className={styles.inputWrapper} style={{ padding: '12px' }}
                        value={newAddress.alias}
                        onChange={e => setNewAddress({ ...newAddress, alias: e.target.value })}
                        placeholder="Nombre de la ubicación"
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>Detalle de Dirección</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input 
                          type="text" 
                          className={styles.inputWrapper} style={{ padding: '12px', flex: 1 }}
                          value={newAddress.detail}
                          onChange={e => setNewAddress({ ...newAddress, detail: e.target.value })}
                          onKeyDown={e => e.key === 'Enter' && handleGeocodeAddress()}
                          placeholder="Calle, número, referencias..."
                        />
                        <button 
                          className={styles.gpsBtn} 
                          onClick={handleGeocodeAddress}
                          disabled={isGeocoding || !newAddress.detail.trim()}
                          title="Ubicar en el mapa"
                        >
                          {isGeocoding ? <Loader2 className="spin" size={20} /> : <Search size={20} />}
                        </button>
                      </div>
                    </div>
                    <div className={styles.inputGroup}>
                      <label>URL de Google Maps (Opcional)</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input 
                          type="text" 
                          className={styles.inputWrapper} style={{ padding: '12px', flex: 1 }}
                          value={newAddress.mapsUrl}
                          onChange={e => {
                            const newUrl = e.target.value;
                            setNewAddress({ ...newAddress, mapsUrl: newUrl });
                            if (newUrl.length > 10) syncMapFromUrl(newUrl);
                          }}
                          placeholder="https://maps.google.com/..."
                        />
                        <button 
                          className={styles.gpsBtn} 
                          onClick={handleGetLocation}
                          disabled={locating}
                          title="Obtener ubicación actual"
                        >
                          {locating ? <Loader2 className="spin" size={20} /> : <LocateFixed size={20} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className={styles.mapControlsHint}>
                    <Info size={20} />
                    <div>
                      <p><strong>¿Cómo marcar tu ubicación exacta?</strong></p>
                      <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <li>1. Escribe el nombre de tu barrio, local o señas en el cuadro de arriba y presiona la <strong>lupa 🔍</strong>.</li>
                        <li>2. Si el punto no cayó en el lugar exacto, puedes <strong>mantener presionado el marcador dorado</strong> y moverlo con el dedo o mouse hasta tu puerta.</li>
                        <li>3. También puedes tocar cualquier parte del mapa para mover el marcador allí inmediatamente.</li>
                      </ul>
                    </div>
                  </div>

                  <AddressMap 
                    initialCenter={mapCenter} 
                    onLocationChange={handleMapLocationChange} 
                  />

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button className={styles.saveBtn} onClick={handleAddAddress}>
                      {editingAddressId ? 'Guardar Cambios' : 'Agregar Dirección'}
                    </button>
                    <button 
                      className={styles.cancelBtn} 
                      onClick={() => {
                        setShowAddressForm(false);
                        setEditingAddressId(null);
                        setNewAddress({ alias: '', detail: '', mapsUrl: '' });
                      }} 
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {profile.addresses?.length === 0 && !showAddressForm && (
                <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
                  <MapPin size={48} style={{ marginBottom: '16px' }} />
                  <p>Aún no has guardado direcciones de entrega.</p>
                </div>
              )}

              {profile.addresses?.map(addr => (
                <div key={addr.id} className={styles.addressCard}>
                  <div className={styles.addressInfo}>
                    <h4>
                      {addr.alias} 
                      {addr.isDefault && <span className={styles.defaultBadge}>Predeterminada</span>}
                    </h4>
                    <p>{addr.detail}</p>
                    {addr.mapsUrl && (
                      <a href={addr.mapsUrl} target="_blank" rel="noopener noreferrer" className={styles.mapLink}>
                        <MapPin size={14} /> Ver en Google Maps <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      className={styles.deleteBtn} 
                      style={{ color: 'var(--brand-accent)' }} 
                      onClick={() => handleEditAddress(addr)}
                    >
                      <Pencil size={18} />
                    </button>
                    <button className={styles.deleteBtn} onClick={() => handleDeleteAddress(addr.id)}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}

          {activeTab === 'notifications' && (
            <>
              <div className={styles.sectionHeader}>
                <h2><Bell className={styles.accent} /> Centro de Notificaciones</h2>
              </div>

              {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
                  <Bell size={48} style={{ marginBottom: '16px' }} />
                  <p>Tu bandeja de notificaciones está impecable.</p>
                </div>
              ) : (
                <div className={styles.notificationList}>
                  {notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      className={`${styles.notificationItem} ${!notif.read ? styles.unread : ''}`}
                      onClick={() => handleMarkRead(notif)}
                    >
                      <div className={styles.notifIcon}>
                        {notif.type === 'order' && <ShoppingBag size={20} color="var(--brand-accent)" />}
                        {notif.type === 'info' && <Clock size={20} />}
                        {notif.type === 'success' && <CheckCircle size={20} color="#44ff44" />}
                      </div>
                      <div className={styles.notifContent}>
                        <h4>{notif.title}</h4>
                        <p>{notif.message}</p>
                        <div className={styles.notifTime}>
                           Justo ahora
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'orders' && (
            <div className="animate">
              <div className={styles.sectionHeader}>
                <h2><Package className={styles.accent} /> Historial de Compras</h2>
              </div>
              
              {orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', opacity: 0.5 }}>
                  <Package size={48} style={{ marginBottom: '16px' }} />
                  <p>Aún no has realizado pedidos elite.</p>
                  <Link href="/catalog" className={styles.btnPrimary} style={{ marginTop: '20px', display: 'inline-block' }}>
                    Empezar a Comprar
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {orders.map(order => (
                    <div key={order.id} className={styles.addressCard} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '12px' }}>
                        <div>
                          <h4 style={{ margin: 0 }}>Pedido #{order.orderNumber}</h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                            <Store size={14} style={{ color: 'var(--brand-accent)' }} />
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {order.merchantName || 'GoShopping Oficial'}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                            Realizado el {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('es-CR', { dateStyle: 'short', timeStyle: 'short' }) : 'Recientemente'}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--brand-accent)', fontWeight: 600, textTransform: 'uppercase', marginTop: '2px' }}>
                            Pago vía: {order.paymentMethod === 'paypal' ? 'PayPal' : 'SINPE Móvil'}
                          </p>
                        </div>
                        <span className={`${styles.defaultBadge} ${styles['status_' + order.status]}`} style={{ 
                          background: order.status === 'completed' ? '#10b98120' : order.status === 'pending' ? '#f59e0b20' : '#ef444420',
                          color: order.status === 'completed' ? '#10b981' : order.status === 'pending' ? '#f59e0b' : '#ef4444',
                          border: 'none',
                          padding: '4px 12px'
                        }}>
                          {order.status === 'pending' ? 'Pendiente' : order.status === 'completed' ? 'Pagado / Listo' : 'Fallido'}
                        </span>
                      </div>

                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem' }}>{order.items.length} {order.items.length === 1 ? 'artículo' : 'artículos'}</span>
                          <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--border)' }}></span>
                          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--brand-accent)' }}>₡{order.total.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => {
                              setSelectedChatContext({
                                chatId: `order_${order.id}`,
                                orderId: order.id,
                                orderNumber: order.orderNumber,
                                merchantName: order.merchantName,
                                merchantId: order.merchantId
                              });
                              setActiveTab('chat');
                            }}
                            className={styles.addBtn}
                            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                          >
                            <MessageSquare size={14} /> Soporte V.I.P.
                          </button>
                          <button 
                            onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                            className={styles.tabBtn}
                            style={{ fontSize: '0.8rem', padding: '6px 12px', margin: 0, width: 'auto', background: 'rgba(255,255,255,0.05)' }}
                          >
                            {expandedOrderId === order.id ? 'Ocultar info' : 'Ver Verificación'}
                          </button>
                        </div>
                      </div>

                      {expandedOrderId === order.id && (
                        <div style={{ width: '100%', marginTop: '20px', padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', animation: 'fadeIn 0.3s ease' }}>
                          <h5 style={{ textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.1em', color: 'var(--brand-accent)', marginBottom: '16px' }}>
                            Detalles del Pedido
                          </h5>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                            {order.items.map((item, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                <span>{item.name} x{item.quantity}</span>
                                <span style={{ color: 'var(--text-secondary)' }}>₡{(item.price * item.quantity).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>

                          <h5 style={{ textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.1em', color: 'var(--brand-accent)', marginBottom: '12px' }}>
                            Información de Pago
                          </h5>
                          {order.paymentMethod === 'paypal' ? (
                            <div style={{ background: 'var(--bg-secondary)', padding: '15px', border: '1px solid var(--border)', fontSize: '0.85rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ opacity: 0.6 }}>ID Transacción:</span>
                                <span>{order.transactionId || 'Confirmado automáticamente'}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ opacity: 0.6 }}>Pagado desde:</span>
                                <span>{order.payerEmail || 'PayPal Account'}</span>
                              </div>
                            </div>
                          ) : (
                            <div style={{ background: 'var(--bg-secondary)', padding: '15px', border: '1px solid var(--border)', fontSize: '0.85rem' }}>
                              <p style={{ margin: '0 0 10px 0', opacity: 0.8 }}>SINPE Móvil - Comprobante adjunto</p>
                              {order.sinpeVoucherUrl ? (
                                <a href={order.sinpeVoucherUrl} target="_blank" rel="noopener noreferrer">
                                  <img 
                                    src={order.sinpeVoucherUrl} 
                                    alt="Comprobante" 
                                    style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border)' }} 
                                  />
                                </a>
                              ) : (
                                <p style={{ color: '#f59e0b', fontSize: '0.75rem' }}>Bajo revisión del equipo administrativo.</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'chat' && user && (
            <div className="animate">
              <div className={styles.sectionHeader}>
                <h2><MessageSquare className={styles.accent} /> Soporte V.I.P. Directo</h2>
                {selectedChatContext && (
                  <button className={styles.addBtn} onClick={() => setSelectedChatContext(null)}>
                    <ArrowRight size={16} /> Ver mis casos
                  </button>
                )}
              </div>
              
              {!selectedChatContext ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* General Chat Button */}
                  <div 
                    className={styles.addressCard} 
                    style={{ cursor: 'pointer', borderColor: 'var(--brand-accent)' }}
                    onClick={() => setSelectedChatContext({ chatId: `general_${user.uid}` })}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{ background: 'var(--brand-accent)', color: 'black', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MessageSquare size={20} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0 }}>Canal de Soporte General</h4>
                        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Consultas sobre envíos, stock o información general.</p>
                      </div>
                    </div>
                  </div>

                  {/* Orders Chats List */}
                  {userChats.filter(c => c.type === 'order' && c.status === 'active').length > 0 && (
                    <div style={{ marginTop: '20px' }}>
                      <h3 style={{ fontSize: '1rem', marginBottom: '16px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Casos de Pedidos Activos</h3>
                      {userChats.filter(c => c.type === 'order' && c.status === 'active').map(chat => (
                        <div 
                          key={chat.id} 
                          className={styles.addressCard} 
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedChatContext({ 
                            chatId: chat.id, 
                            orderId: chat.orderId, 
                            orderNumber: chat.orderNumber,
                            merchantName: chat.merchantName,
                            merchantId: chat.merchantId
                          })}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <Tag size={18} color="var(--brand-accent)" />
                              <div>
                                <h4 style={{ margin: 0 }}>Pedido #{chat.orderNumber}</h4>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Cliente: {chat.userName}</span>
                                  {chat.merchantName && (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--brand-accent)', fontWeight: 600 }}>Tienda: {chat.merchantName}</span>
                                  )}
                                </div>
                                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>{chat.lastMessage}</p>
                              </div>
                            </div>
                            {chat.unreadCountClient > 0 && (
                              <span className={styles.defaultBadge}>{chat.unreadCountClient}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <ChatWindow 
                  chatId={selectedChatContext.chatId} 
                  userId={user.uid} 
                  userName={profile.displayName}
                  orderId={selectedChatContext.orderId}
                  orderNumber={selectedChatContext.orderNumber}
                  merchantName={selectedChatContext.merchantName}
                  merchantId={selectedChatContext.merchantId}
                  onBack={userChats.length > 1 ? () => setSelectedChatContext(null) : undefined}
                />
              )}
            </div>
          )}

        </main>
      </div>

      <StatusModal 
        isOpen={modal.isOpen}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={() => setModal({ ...modal, isOpen: false })}
      />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <Loader2 className="spin" size={40} color="var(--brand-accent)" />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
