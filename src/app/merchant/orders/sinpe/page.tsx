'use client';

import { useAuth } from '@/context/AuthContext';
import SinpeValidationList from '@/components/admin/SinpeValidationList';
import Link from 'next/link';
import { ArrowLeft, Loader2, Store, ShoppingBag, Package, Settings, LogOut, LayoutDashboard, ShieldCheck } from 'lucide-react';
import styles from '@/app/merchant/dashboard/merchant.module.css';

export default function MerchantSinpePage() {
  const { user, userData, logout, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', color: '#D4AF37' }}>
        <Loader2 className="spin" size={40} />
      </div>
    );
  }

  const merchantId = userData?.merchantId;

  return (
    <div className={styles.dashboardContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Store className={styles.brandIcon} />
          <h2>Elite <span className={styles.accent}>Merchant</span></h2>
        </div>
        
        <nav className={styles.nav}>
          <Link href="/merchant/dashboard" className={styles.navLink}>
            <LayoutDashboard size={20} /> Panel Principal
          </Link>
          <Link href="/merchant/products" className={styles.navLink}>
            <Package size={20} /> Mis Productos
          </Link>
          <Link href="/merchant/orders" className={styles.navLink}>
            <ShoppingBag size={20} /> Pedidos
          </Link>
          <Link href="/merchant/orders/sinpe" className={styles.navLinkActive}>
            <ShieldCheck size={20} /> Validación SINPE
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Link href="/merchant/dashboard" className={styles.backBtn} style={{ 
               width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', 
               display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)'
            }}>
              <ArrowLeft size={20} />
            </Link>
            <h1 style={{ margin: 0 }}>Validación <span style={{ color: 'var(--brand-accent)' }}>SINPE</span></h1>
          </div>
        </header>

        <div style={{ marginTop: '32px' }}>
          <SinpeValidationList 
            merchantId={merchantId} 
            title="Mis Pagos por Validar" 
          />
        </div>
      </main>
    </div>
  );
}
