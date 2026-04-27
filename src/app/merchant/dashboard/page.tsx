'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Store, 
  Package, 
  ShoppingBag, 
  Settings, 
  LayoutDashboard, 
  LogOut,
  ChevronRight,
  TrendingUp,
  Users,
  Coins,
  Globe,
  Clock,
  ShieldCheck,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { getMerchantByOwnerUid, getMerchantById } from '@/lib/services/merchants';
import styles from './merchant.module.css';

export default function MerchantDashboard() {
  const { user, userData, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [merchant, setMerchant] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Update clock every minute
  useEffect(() => {
    const updateClock = () => {
      const tz = merchant?.timezone || "America/Costa_Rica";
      try {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: tz,
          hour: '2-digit', minute: '2-digit', hour12: true
        });
        setCurrentTime(formatter.format(new Date()));
      } catch (e) {
        console.error("Clock update error:", e);
      }
    };

    updateClock();
    const interval = setInterval(updateClock, 30000); // Actualizar cada 30 seg
    return () => clearInterval(interval);
  }, [merchant]);

  const tzMap: any = {
    "America/Costa_Rica": "CR",
    "America/Panama": "PA",
    "America/Managua": "NI",
    "America/Guatemala": "GT",
    "America/El_Salvador": "SV",
    "America/Tegucigalpa": "HN",
    "America/Mexico_City": "MX",
    "America/Bogota": "CO"
  };
  const tzCode = tzMap[merchant?.timezone || "America/Costa_Rica"] || "CR";

  const isOpenNow = (m: any) => {
    if (!m || !m.operatingHours) return false;
    
    try {
      const tz = m.timezone || "America/Costa_Rica";
      
      // Obtener partes de la fecha de forma ultra-robusta
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', hour12: false
      });
      
      const parts = formatter.formatToParts(new Date());
      const p: any = {};
      parts.forEach(({type, value}) => p[type] = value);
      
      const now = new Date(p.year, p.month - 1, p.day, p.hour, p.minute);
      const dayIndex = now.getDay(); 
      
      const dayMaps = [
        ['sun', 'dom'], ['mon', 'lun'], ['tue', 'mar'], 
        ['wed', 'mie'], ['thu', 'jue'], ['fri', 'vie'], ['sat', 'sab']
      ];
      
      const targets = dayMaps[dayIndex];
      const hourKey = Object.keys(m.operatingHours).find(key => {
        const k = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return targets.some(t => k.includes(t));
      });

      const hours = hourKey ? m.operatingHours[hourKey] : null;
      if (!hours) return false;

      const isOpenFlag = String(hours.isOpen) === 'true';
      if (!isOpenFlag) return false;

      if (!hours.open || !hours.close) return true;

      const toMin = (t: string) => {
        const numbers = t.match(/\d+/g);
        if (!numbers || numbers.length < 1) return 0;
        const h = parseInt(numbers[0]);
        const m = parseInt(numbers[1] || '0');
        return h * 60 + m;
      };

      const cur = (parseInt(p.hour) * 60) + parseInt(p.minute);
      const op = toMin(hours.open);
      const cl = toMin(hours.close);

      if (cl < op) return cur >= op || cur <= cl;
      return cur >= op && cur <= cl;
    } catch (e) {
      return true;
    }
  };

  const isOnline = merchant ? isOpenNow(merchant) : false;

  useEffect(() => {
    const init = async () => {
      if (authLoading) return;
      
      if (!user) {
        router.push('/login');
        return;
      }

      if (userData?.role !== 'merchant_admin' && userData?.role !== 'admin' && userData?.role !== 'merchant_seller') {
        router.push('/');
        return;
      }

      try {
        let mData = null;
        
        // 1. Try by merchantId from profile
        if (userData?.merchantId) {
          mData = await getMerchantById(userData.merchantId);
        }
        
        // 2. Auto-recovery: Try by owner UID
        if (!mData && userData?.uid) {
          mData = await getMerchantByOwnerUid(userData.uid);
        }

        if (mData) {
          setMerchant(mData);
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [user, userData, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', color: '#D4AF37' }}>
        Cargando Panel Elite...
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Store className={styles.brandIcon} />
          <h2>Elite <span className={styles.accent}>Merchant</span></h2>
        </div>
        
        <nav className={styles.nav}>
          <Link href="/merchant/dashboard" className={styles.navLinkActive}>
            <LayoutDashboard size={20} /> Panel Principal
          </Link>
          <Link href="/merchant/products" className={styles.navLink}>
            <Package size={20} /> Mis Productos
          </Link>
          <Link href="/merchant/orders" className={styles.navLink}>
            <ShoppingBag size={20} /> Pedidos
          </Link>
          <Link href="/merchant/settings" className={styles.navLink}>
            <Settings size={20} /> Configuración
          </Link>
        </nav>

        <button onClick={logout} className={styles.logoutBtn}>
          <LogOut size={20} /> Cerrar Sesión
        </button>
      </aside>

      <main className={styles.content}>
        <header className={styles.contentHeader}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
          <div>
            <h1 className={styles.welcomeTitle}>Bienvenido, <span style={{ color: 'var(--brand-accent)' }}>{userData?.displayName || 'Merchant'}</span></h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <p style={{ color: 'var(--text-tertiary)', margin: 0 }}>Gestionando {merchant?.name}</p>
              {merchant && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  padding: '4px 10px', 
                  borderRadius: '20px', 
                  background: isOnline ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${isOnline ? '#22c55e' : '#ef4444'}`,
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  color: isOnline ? '#22c55e' : '#ef4444',
                  letterSpacing: '0.05em'
                }}>
                  <div style={{ 
                    width: '6px', 
                    height: '6px', 
                    borderRadius: '50%', 
                    background: isOnline ? '#22c55e' : '#ef4444',
                    boxShadow: isOnline ? '0 0 10px #22c55e' : 'none'
                  }} />
                  {isOnline ? 'TIENDA ONLINE' : 'TIENDA OFFLINE'}
                </div>
              )}
              {currentTime && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  color: 'var(--text-tertiary)',
                  fontSize: '0.75rem',
                  marginLeft: '8px',
                  background: 'rgba(255,255,255,0.03)',
                  padding: '4px 10px',
                  borderRadius: '6px'
                }}>
                  <Clock size={12} style={{ color: 'var(--brand-accent)' }} />
                  <span style={{ fontWeight: 600 }}>{currentTime}</span>
                  <span style={{ opacity: 0.5, fontSize: '0.65rem' }}> ({tzCode})</span>
                </div>
              )}
            </div>
          </div>
          <div className={styles.merchantBadge}>
            SOCIO ELITE
          </div>
        </div>
        </header>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}><Coins /></div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Ventas del Mes</span>
              <span className={styles.statValue}>₡0</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}><ShoppingBag /></div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Pedidos Nuevos</span>
              <span className={styles.statValue}>0</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}><Package /></div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Productos Activos</span>
              <span className={styles.statValue}>0</span>
            </div>
          </div>
        </div>

        <div className={styles.quickActions}>
          <h2>Acciones Rápidas</h2>
          <div className={styles.actionGrid}>
            <Link href="/merchant/products/new" className={styles.actionCard}>
              <div className={styles.actionInner}>
                <Package size={24} />
                <h3>Agregar Producto</h3>
                <p>Publica un nuevo artículo en tu catálogo.</p>
              </div>
              <ChevronRight size={20} />
            </Link>

            <Link href="/merchant/orders/sinpe" className={styles.actionCard}>
              <div className={styles.actionInner}>
                <ShieldCheck size={24} style={{ color: '#10b981' }} />
                <h3>Validar Pagos SINPE</h3>
                <p>Aprueba transferencias bancarias pendientes.</p>
              </div>
              <ChevronRight size={20} />
            </Link>

            <Link href="/merchant/chats" className={styles.actionCard}>
              <div className={styles.actionInner}>
                <MessageSquare size={24} style={{ color: 'var(--brand-accent)' }} />
                <h3>Soporte Chat</h3>
                <p>Responde consultas de tus clientes Elite.</p>
              </div>
              <ChevronRight size={20} />
            </Link>

            <Link href={`/${merchant?.slug || ''}`} className={styles.actionCard} target="_blank">
              <div className={styles.actionInner}>
                <Globe size={24} />
                <h3>Ver mi Tienda</h3>
                <p>Previsualiza cómo ven tus clientes la landing page.</p>
              </div>
              <ChevronRight size={20} />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
