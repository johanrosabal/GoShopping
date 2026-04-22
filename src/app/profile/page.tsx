'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getUserProfile, updateUserProfile, UserProfile, UserAddress } from '@/lib/services/users';
import { subscribeToNotifications, markAsRead, Notification } from '@/lib/services/notifications';
import { formatCostaRicaPhone } from '@/lib/utils/mask';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
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
  Info
} from 'lucide-react';
import ShoppingListManager from '@/components/profile/ShoppingListManager';
import StatusModal from '@/components/common/StatusModal';
import styles from './Profile.module.css';

const AddressMap = dynamic(() => import('@/components/profile/AddressMap'), { 
  ssr: false,
  loading: () => <div style={{ height: '300px', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando mapa...</div>
});

export default function ProfilePage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'notifications' | 'lists'>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: 'success' as any, title: '', message: '' });

  // Sync tab with URL parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'lists') setActiveTab('lists');
    else if (tab === 'addresses') setActiveTab('addresses');
    else if (tab === 'notifications') setActiveTab('notifications');
    else if (tab === 'profile') setActiveTab('profile');
  }, [searchParams]);

  // Address edit state
  const [newAddress, setNewAddress] = useState({ alias: '', detail: '', mapsUrl: '' });
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  
  // Map center from GPS
  const [mapCenter, setMapCenter] = useState<[number, number]>([9.9333, -84.0833]);

  useEffect(() => {
    if (user) {
      const loadData = async () => {
        const data = await getUserProfile(user.uid);
        if (data) setProfile(data);
        setLoading(false);
      };
      loadData();

      // Subscribe to real-time notifications
      const unsubscribe = subscribeToNotifications(user.uid, (data) => {
        setNotifications(data);
      });

      return () => unsubscribe();
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

  const handleMarkRead = async (id: string) => {
    await markAsRead(id);
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
            className={`${styles.tabBtn} ${activeTab === 'addresses' ? styles.active : ''}`}
            onClick={() => setActiveTab('addresses')}
          >
            <MapPin size={20} /> Direcciones de Entrega
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

          {activeTab === 'lists' && (
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
                      onClick={() => handleMarkRead(notif.id)}
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
