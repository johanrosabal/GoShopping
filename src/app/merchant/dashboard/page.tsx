'use client';

import { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Package, 
  ArrowRight, 
  Store, 
  TrendingUp, 
  Clock, 
  MessageSquare,
  Globe,
  Settings,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getMerchantById, MerchantProfile } from '@/lib/services/merchants';
import styles from '../../admin/admin.module.css'; // Reusing admin styles

export default function MerchantDashboard() {
  const { userData } = useAuth();
  const [merchant, setMerchant] = useState<MerchantProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userData?.merchantId) {
      getMerchantById(userData.merchantId).then(data => {
        setMerchant(data);
        setLoading(false);
      });
    }
  }, [userData]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '100px', textAlign: 'center' }}>
        <Store className="spin" size={40} color="#8b5cf6" />
        <p style={{ marginTop: '20px', color: 'var(--text-secondary)' }}>Cargando portal de socio...</p>
      </div>
    );
  }

  const modules = [
    {
      title: 'Mis Pedidos',
      desc: 'Gestiona tus ventas y tickets locales.',
      icon: <ShoppingBag size={32} />,
      color: '#f59e0b',
      link: '/merchant/orders'
    },
    {
      title: 'Mi Inventario',
      desc: 'Control de tus productos y existencias.',
      icon: <Package size={32} />,
      color: 'var(--brand-accent)',
      link: '/merchant/products'
    },
    {
      title: 'Soporte Directo',
      desc: 'Chats con tus clientes.',
      icon: <MessageSquare size={32} />,
      color: '#3498db',
      link: '/merchant/chats'
    },
    {
      title: 'Configuración de Tienda',
      desc: 'Branding, Redes y Pagos.',
      icon: <Settings size={32} />,
      color: '#8b5cf6',
      link: '/merchant/settings'
    }
  ];

  return (
    <div className={`${styles.adminPage} container`}>
      <header className={`${styles.header} animate`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#8b5cf6', marginBottom: '16px' }}>
          <Store size={20} />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Portal de Socio Elite</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem' }}>
              Dashboard: <span style={{ color: '#8b5cf6' }}>{merchant?.name}</span>
            </h1>
            <p style={{ color: 'var(--text-tertiary)', marginTop: '8px', fontSize: '1.1rem' }}>
              Gestión centralizada para tu negocio en Go-Shopping.
            </p>
          </div>
          <Link href={`/${merchant?.slug}`} target="_blank" className={styles.approveBtn} style={{ background: '#8b5cf6' }}>
            <Globe size={18} /> Ver mi Tienda Pública
          </Link>
        </div>
      </header>

      {/* KPI Section (Simplified for now) */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <TrendingUp size={24} />
          </div>
          <div className={styles.statInfo}>
            <h4>Estado Suscripción</h4>
            <div className={styles.statValue} style={{ fontSize: '1.5rem', color: '#10b981' }}>{merchant?.subscriptionType.toUpperCase()}</div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Próximo pago: Proximamente</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
            <Clock size={24} />
          </div>
          <div className={styles.statInfo}>
            <h4>Pedidos del Mes</h4>
            <div className={styles.statValue} style={{ fontSize: '1.5rem' }}>0</div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Ventas directas</p>
          </div>
        </div>
      </div>

      <div className={styles.modulesGrid}>
        {modules.map((mod, idx) => (
          <Link key={idx} href={mod.link} className={`${styles.moduleCard} animate`} style={{ animationDelay: `${idx * 0.1}s` }}>
            <div className={styles.moduleIcon} style={{ background: `${mod.color}15`, color: mod.color }}>
              {mod.icon}
            </div>
            <div className={styles.moduleInfo}>
              <h3>{mod.title}</h3>
              <p>{mod.desc}</p>
            </div>
            <ArrowRight size={20} className={styles.arrow} />
          </Link>
        ))}
      </div>
    </div>
  );
}
