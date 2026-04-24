'use client';

import { useEffect, useState } from 'react';
import { getAllMerchants, updateMerchant, MerchantProfile } from '@/lib/services/merchants';
import { 
  Store, 
  ShieldCheck, 
  ExternalLink, 
  Loader2, 
  ArrowLeft, 
  Plus, 
  Globe, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  MoreVertical,
  Mail,
  Phone,
  Settings,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import { deleteMerchant } from '@/lib/services/merchants';
import StatusModal, { ModalType } from '@/components/common/StatusModal';
import styles from '../admin.module.css';

export default function AdminMerchantsPage() {
  const [merchants, setMerchants] = useState<MerchantProfile[]>([]);
  const [loading, setLoading] = useState(true);
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

  const fetchMerchants = async () => {
    setLoading(true);
    const data = await getAllMerchants();
    setMerchants(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchMerchants();
  }, []);

  const handleStatusToggle = (merchant: MerchantProfile) => {
    const newStatus = merchant.status === 'active' ? 'suspended' : 'active';
    const action = newStatus === 'active' ? 'Activar' : 'Suspender';

    setModal({
      isOpen: true,
      type: 'confirm',
      title: `${action} Comercio`,
      message: `¿Estás seguro de que deseas ${action.toLowerCase()} el comercio "${merchant.name}"? Los productos de este comercio dejarán de estar visibles si lo suspendes.`,
      onConfirm: async () => {
        const success = await updateMerchant(merchant.id, { status: newStatus });
        if (success) {
          setModal({
            isOpen: true,
            type: 'success',
            title: 'Éxito',
            message: `El comercio ha sido ${newStatus === 'active' ? 'activado' : 'suspendido'}.`
          });
          fetchMerchants();
        }
      }
    });
  };

  const handleDelete = (merchant: MerchantProfile) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Eliminar Comercio',
      message: `¿Estás ABSOLUTAMENTE SEGURO de eliminar "${merchant.name}"? Esta acción es irreversible y borrará todos los datos asociados.`,
      onConfirm: async () => {
        const success = await deleteMerchant(merchant.id);
        if (success) {
          setModal({
            isOpen: true,
            type: 'success',
            title: 'Eliminado',
            message: 'El comercio ha sido eliminado del ecosistema.'
          });
          fetchMerchants();
        }
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <span style={{ color: '#2ecc71', background: 'rgba(46, 204, 113, 0.1)', padding: '4px 8px', fontSize: '0.7rem', fontWeight: 700, borderRadius: '4px' }}>ACTIVO</span>;
      case 'suspended': return <span style={{ color: '#e74c3c', background: 'rgba(231, 76, 60, 0.1)', padding: '4px 8px', fontSize: '0.7rem', fontWeight: 700, borderRadius: '4px' }}>SUSPENDIDO</span>;
      default: return <span style={{ color: 'var(--brand-accent)', background: 'rgba(197, 160, 89, 0.1)', padding: '4px 8px', fontSize: '0.7rem', fontWeight: 700, borderRadius: '4px' }}>PENDIENTE</span>;
    }
  };

  return (
    <div className={`${styles.adminPage} container animate`}>
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/admin" className={styles.viewBtn}>
            <ArrowLeft size={18} />
          </Link>
          <h1>Ecosistema <span className={styles.accent}>Marketplace</span></h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/admin/merchants/plans" className={styles.viewBtn} style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={18} /> Modelos de Negocio
          </Link>
          <Link href="/admin/merchants/new" className={styles.approveBtn}>
            <Plus size={18} /> Afiliar Comercio
          </Link>
        </div>
      </header>

      <div className={styles.tableContainer}>
        {loading ? (
          <div style={{ padding: '100px', textAlign: 'center' }}>
            <Loader2 className="spin" size={40} />
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Comercio</th>
                <th>País / Zona</th>
                <th>Suscripción</th>
                <th>Estado</th>
                <th>Datos de Contacto</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {merchants.length > 0 ? merchants.map(m => (
                <tr key={m.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        background: 'var(--bg-tertiary)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: 'var(--brand-accent)',
                        border: '1px solid var(--border)'
                      }}>
                        <Store size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{m.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>/{m.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <select 
                        value={m.timezone || 'America/Costa_Rica'}
                        onChange={async (e) => {
                          const success = await updateMerchant(m.id, { timezone: e.target.value });
                          if (success) fetchMerchants();
                        }}
                        className={styles.filterInput}
                        style={{ padding: '6px 10px', fontSize: '0.75rem', width: 'auto' }}
                      >
                        <option value="America/Costa_Rica">🇨🇷 Costa Rica</option>
                        <option value="America/Panama">🇵🇦 Panamá</option>
                        <option value="America/Managua">🇳🇮 Nicaragua</option>
                        <option value="America/Guatemala">🇬🇹 Guatemala</option>
                        <option value="America/El_Salvador">🇸🇻 El Salvador</option>
                        <option value="America/Tegucigalpa">🇭🇳 Honduras</option>
                        <option value="America/Mexico_City">🇲🇽 México</option>
                        <option value="America/Bogota">🇨🇴 Colombia</option>
                      </select>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>
                      Plan {m.subscriptionType}
                    </span>
                  </td>
                  <td>{getStatusBadge(m.status)}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <Mail size={12} /> {m.contact.email}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <Phone size={12} /> {m.contact.phone}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className={styles.viewBtn} 
                        style={{ padding: '8px' }}
                        title="Ver Tienda"
                        onClick={() => window.open(`/${m.slug}`, '_blank')}
                      >
                        <Globe size={16} />
                      </button>
                      <button 
                        className={styles.viewBtn} 
                        style={{ 
                          padding: '8px',
                          color: m.status === 'active' ? '#e74c3c' : '#2ecc71',
                          borderColor: m.status === 'active' ? 'rgba(231, 76, 60, 0.2)' : 'rgba(46, 204, 113, 0.2)'
                         }}
                        onClick={() => handleStatusToggle(m)}
                        title={m.status === 'active' ? 'Suspender' : 'Activar'}
                      >
                         {m.status === 'active' ? <XCircle size={16} /> : <CheckCircle size={16} />}
                      </button>
                      <button 
                        className={styles.viewBtn} 
                        style={{ 
                          padding: '8px',
                          color: '#ff4d4d',
                          borderColor: 'rgba(255, 77, 77, 0.2)'
                         }}
                        onClick={() => handleDelete(m)}
                        title="Eliminar Comercio"
                      >
                         <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    <Store size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
                    <p>No hay comercios afiliados registrados aún.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <StatusModal 
        isOpen={modal.isOpen}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={() => setModal({ ...modal, isOpen: false })}
        onConfirm={modal.onConfirm}
      />
    </div>
  );
}
