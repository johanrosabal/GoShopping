'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getUserProfile, UserProfile, updateUserRole } from '@/lib/services/users';
import { getUserOrders, OrderData } from '@/lib/services/orders';
import { subscribeToUserChats, ChatSession, sendMessage } from '@/lib/services/chat';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  User as UserIcon, 
  MapPin, 
  ShoppingBag, 
  Loader2, 
  ExternalLink,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  Ticket
} from 'lucide-react';
import Link from 'next/link';
import StatusModal, { ModalType } from '@/components/common/StatusModal';
import styles from '../../admin.module.css';

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<(OrderData & { id: string })[]>([]);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: ModalType;
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({ 
    isOpen: false, 
    type: 'info', 
    title: '', 
    message: '' 
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      const profile = await getUserProfile(id as string);
      if (profile) {
        setUser(profile);
        const userOrders = await getUserOrders(id as string);
        setOrders(userOrders);
      }
      setLoading(false);
    };

    fetchData();

    const unsubscribeChats = subscribeToUserChats(id as string, (data) => {
      setChats(data);
    });

    return () => unsubscribeChats();
  }, [id]);

  const handleRoleChange = async (newRole: UserProfile['role']) => {
    if (!user) return;
    setSaving(true);
    const success = await updateUserRole(user.uid, newRole);
    if (success) {
      setUser({ ...user, role: newRole });
      setModal({
        isOpen: true,
        type: 'success',
        title: 'Éxito',
        message: 'Rango de usuario actualizado correctamente.'
      });
    } else {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudo actualizar el rango.'
      });
    }
    setSaving(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <span style={{ color: '#2ecc71', background: 'rgba(46, 204, 113, 0.1)', padding: '4px 8px', fontSize: '0.7rem', fontWeight: 700, borderRadius: '4px' }}>COMPLETADO</span>;
      case 'failed': return <span style={{ color: '#e74c3c', background: 'rgba(231, 76, 60, 0.1)', padding: '4px 8px', fontSize: '0.7rem', fontWeight: 700, borderRadius: '4px' }}>FALLIDO</span>;
      default: return <span style={{ color: 'var(--brand-accent)', background: 'rgba(197, 160, 89, 0.1)', padding: '4px 8px', fontSize: '0.7rem', fontWeight: 700, borderRadius: '4px' }}>PENDIENTE</span>;
    }
  };

  if (loading) {
    return (
      <div className={`${styles.adminPage} container`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 className="spin" size={48} color="var(--brand-accent)" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`${styles.adminPage} container`} style={{ textAlign: 'center', padding: '100px' }}>
        <XCircle size={64} color="var(--status-error)" style={{ marginBottom: '24px' }} />
        <h2>Usuario no encontrado</h2>
        <button className={styles.viewBtn} onClick={() => router.back()} style={{ marginTop: '24px' }}>
          Volver atrás
        </button>
      </div>
    );
  }

  return (
    <div className={`${styles.adminPage} container animate`}>
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => router.back()} className={styles.viewBtn}>
            <ArrowLeft size={18} />
          </button>
          <h1>Perfil de <span className={styles.accent}>Usuario</span></h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select 
            className={styles.filterInput}
            value={user.role}
            onChange={(e) => handleRoleChange(e.target.value as any)}
            disabled={saving}
            style={{ 
              width: 'auto', 
              background: 'var(--bg-tertiary)', 
              fontWeight: 600,
              color: user.role === 'admin' ? 'var(--brand-accent)' : 'var(--text-primary)'
            }}
          >
            <option value="client">Cliente Estándar</option>
            <option value="vendedor">Vendedor POS</option>
            <option value="admin">Administrador Global</option>
          </select>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px', marginTop: '32px' }}>
        {/* Left Column: Profile Info */}
        <div style={{ display: 'grid', gap: '32px', alignContent: 'start' }}>
          <div className={styles.tableContainer} style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ 
              width: '120px', 
              height: '120px', 
              borderRadius: '50%', 
              background: 'var(--bg-tertiary)', 
              margin: '0 auto 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--brand-accent)',
              boxShadow: '0 0 20px rgba(197, 160, 89, 0.2)'
            }}>
              {user.role === 'admin' ? <Shield size={64} color="var(--brand-accent)" /> : <UserIcon size={64} color="var(--text-tertiary)" />}
            </div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{user.displayName || 'Sin Nombre'}</h2>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                <Mail size={14} />
                {user.email}
              </div>

              <div style={{ marginTop: '24px' }}>
                <Link 
                  href={`/admin/chats?userId=${user.uid}`}
                  className={styles.approveBtn}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                >
                  <MessageSquare size={18} /> Chat de Soporte
                </Link>
              </div>
            
            <div style={{ display: 'grid', gap: '16px', marginTop: '40px', textAlign: 'left', borderTop: '1px solid var(--border)', paddingTop: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Clock size={16} color="var(--brand-accent)" />
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Miembro desde</div>
                  <div style={{ fontSize: '0.9rem' }}>{user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'Desconocido'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Phone size={16} color="var(--brand-accent)" />
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Teléfono</div>
                  <div style={{ fontSize: '0.9rem' }}>{user.phone || 'No registrado'}</div>
                </div>
              </div>
               {user.whatsapp && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <MessageSquare size={16} color="#25D366" />
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>WhatsApp</div>
                    <div style={{ fontSize: '0.9rem' }}>{user.whatsapp}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Addresses */}
          <div className={styles.tableContainer} style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <MapPin size={20} color="var(--brand-accent)" />
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Direcciones Guardadas</h3>
            </div>
            {user.addresses && user.addresses.length > 0 ? (
              <div style={{ display: 'grid', gap: '16px' }}>
                {user.addresses.map((addr, idx) => (
                  <div key={idx} style={{ padding: '16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--brand-accent)' }}>{addr.alias}</span>
                      {addr.isDefault && <CheckCircle size={14} color="#2ecc71" />}
                    </div>
                    <p style={{ fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>{addr.detail}</p>
                    {addr.mapsUrl && (
                      <a href={addr.mapsUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', marginTop: '12px', color: 'var(--brand-accent)', textDecoration: 'none' }}>
                        Ver en Google Maps <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px' }}>
                No hay direcciones registradas.
              </p>
            )}
          </div>

          {/* Case History */}
          <div className={styles.tableContainer} style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Ticket size={20} color="var(--brand-accent)" />
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Historial de Casos</h3>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{chats.length} tickets</span>
            </div>

            {chats.length > 0 ? (
              <div style={{ display: 'grid', gap: '12px' }}>
                {chats.map(chat => (
                  <Link 
                    key={chat.id} 
                    href={`/admin/chats?chatId=${chat.id}`}
                    style={{ 
                      padding: '16px', 
                      background: 'var(--bg-tertiary)', 
                      border: '1px solid var(--border)', 
                      borderRadius: '8px',
                      textDecoration: 'none',
                      color: 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      transition: 'transform 0.2s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateX(5px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                  >
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      background: chat.status === 'active' ? 'rgba(46, 204, 113, 0.1)' : 'var(--bg-secondary)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}>
                      <MessageSquare size={18} color={chat.status === 'active' ? '#2ecc71' : 'var(--text-tertiary)'} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {chat.type === 'order' ? `Pedido #${chat.orderNumber}` : 'Consulta General'}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                          {chat.lastMessageAt ? new Date(chat.lastMessageAt.seconds * 1000).toLocaleDateString() : '---'}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {chat.lastMessage}
                      </p>
                    </div>
                    {chat.unreadCountAdmin > 0 && (
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--brand-accent)' }} />
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px' }}>
                No hay historial de soporte.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Orders & Activity */}
        <div style={{ display: 'grid', gap: '32px', alignContent: 'start' }}>
          <div className={styles.tableContainer} style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ShoppingBag size={20} color="var(--brand-accent)" />
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Historial de Compras</h3>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{orders.length} pedidos totales</span>
            </div>

            {orders.length > 0 ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Orden</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th>Total</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id}>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--brand-accent)' }}>#{order.orderNumber}</span>
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>
                        {order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : '---'}
                      </td>
                      <td>{getStatusBadge(order.status)}</td>
                      <td style={{ fontWeight: 600 }}>₡{order.total.toLocaleString()}</td>
                      <td>
                        <Link href={`/admin/orders/${order.id}`} className={styles.viewBtn} style={{ padding: '6px 10px' }}>
                          <ExternalLink size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '60px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border)' }}>
                <ShoppingBag size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
                <p style={{ color: 'var(--text-tertiary)' }}>Este usuario aún no ha realizado compras.</p>
              </div>
            )}
          </div>

          {/* Stats / Quick Info */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div className={styles.tableContainer} style={{ padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--brand-accent)' }}>{orders.length}</div>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginTop: '4px' }}>Pedidos</div>
            </div>
            <div className={styles.tableContainer} style={{ padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2ecc71' }}>₡{orders.reduce((acc, current) => acc + (current.status === 'completed' ? current.total : 0), 0).toLocaleString()}</div>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginTop: '4px' }}>Inversión Total</div>
            </div>
            <div className={styles.tableContainer} style={{ padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{user.addresses?.length || 0}</div>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginTop: '4px' }}>Ubicaciones</div>
            </div>
          </div>
        </div>
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
