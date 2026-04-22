'use client';

import { X, Home, ShoppingBag, Info, Phone, Package, ShieldCheck, LogIn, LogOut, User, Heart } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { subscribeToNotifications, Notification } from '@/lib/services/notifications';
import { useState, useEffect } from 'react';
import styles from './Sidebar.module.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout, isAdmin } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToNotifications(user.uid, (notifs) => {
        setUnreadCount(notifs.filter(n => !n.read).length);
      });
      return () => unsubscribe();
    }
  }, [user]);

  return (
    <>
      {/* Overlay */}
      <div 
        className={`${styles.overlay} ${isOpen ? styles.active : ''}`} 
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.header}>
          <div className={styles.logo}>
            Go<span className={styles.accent}>Shopping</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <nav className={styles.nav}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Navegación</h3>
            <Link href="/" className={styles.navLink} onClick={onClose}>
              <Home size={20} /> Inicio
            </Link>
            <Link href="/catalog" className={styles.navLink} onClick={onClose}>
              <ShoppingBag size={20} /> Catálogo
            </Link>
            {user && (
              <Link href="/profile?tab=lists" className={styles.navLink} onClick={onClose}>
                <Heart size={20} /> Mis Listas Elite
              </Link>
            )}
            <Link href="/admin/orders" className={styles.navLink} onClick={onClose}>
              <Package size={20} /> Mis Pedidos
            </Link>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Cuenta</h3>
            {user ? (
              <>
                <Link href="/profile" className={styles.navLink} onClick={onClose}>
                  <User size={20} />
                  <span>Mi Perfil</span>
                  {unreadCount > 0 && (
                    <span style={{ 
                      marginLeft: 'auto', 
                      background: 'var(--brand-accent)', 
                      color: 'black', 
                      fontSize: '0.65rem', 
                      fontWeight: 800, 
                      padding: '2px 6px',
                      borderRadius: '10px'
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </Link>
                {isAdmin && (
                  <Link href="/admin" className={styles.navLink} onClick={onClose}>
                    <ShieldCheck size={20} color="var(--brand-accent)" /> Panel Admin
                  </Link>
                )}
                <button className={styles.navLink} onClick={() => { logout(); onClose(); }} style={{ border: 'none', background: 'transparent', width: '100%', cursor: 'pointer' }}>
                  <LogOut size={20} /> Cerrar Sesión
                </button>
              </>
            ) : (
              <Link href="/login" className={styles.navLink} onClick={onClose}>
                <LogIn size={20} /> Iniciar Sesión
              </Link>
            )}
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Información</h3>
            <Link href="/about" className={styles.navLink} onClick={onClose}>
              <Info size={20} /> Sobre Nosotros
            </Link>
            <Link href="/contact" className={styles.navLink} onClick={onClose}>
              <Phone size={20} /> Contacto
            </Link>
          </div>
        </nav>

        <div className={styles.footer}>
          <p>© 2024 Go-Shopping Elite</p>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>Definiendo la excelencia en compras.</p>
        </div>
      </aside>
    </>
  );
}
