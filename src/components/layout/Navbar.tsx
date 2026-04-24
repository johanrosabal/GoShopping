'use client';
import Link from 'next/link';
import { ShoppingCart, LogOut, Search, Menu, LogIn, ShieldCheck, Store } from 'lucide-react';
import styles from './Navbar.module.css';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import Sidebar from './Sidebar';
import { useState } from 'react';

export default function Navbar() {
  const { user, userData, logout, isAdmin, isMerchant } = useAuth();
  const { cartCount, setIsCartOpen } = useCart();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <nav className={styles.navbar}>
      <div className={`${styles.container} container`}>
        <div className={styles.left}>
          <Link href="/" className={styles.logo}>
            Go<span className={styles.accent}>Shopping</span>
          </Link>
        </div>
        
        <div className={styles.center}>
          <div className={styles.searchBar}>
            <Search size={18} className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Buscar productos de elite..." 
              suppressHydrationWarning
            />
          </div>
        </div>

        <div className={styles.right}>
          <ThemeToggle />

          {user ? (
            <div className={styles.userSection}>
              <span className={styles.userName}>Hola, {user.displayName?.split(' ')[0] || 'Usuario'}</span>
              <button className={styles.iconBtn} onClick={logout} title="Cerrar Sesión">
                <LogOut size={22} />
              </button>
            </div>
          ) : (
            <Link href="/login" className={styles.iconBtn} title="Iniciar Sesión">
              <LogIn size={22} />
            </Link>
          )}

          <button 
            className={styles.cartBtn} 
            onClick={() => setIsCartOpen(true)}
            suppressHydrationWarning
          >
            <ShoppingCart size={22} />
            {cartCount > 0 && <span className={styles.cartCount}>{cartCount}</span>}
          </button>

          {isAdmin && (
            <Link href="/admin" className={styles.iconBtn} title="Portal Administrador">
              <ShieldCheck size={22} color="var(--brand-accent)" />
            </Link>
          )}
          
          {isMerchant && (
            <Link href="/merchant/dashboard" className={styles.iconBtn} title="Panel de Socio">
              <Store size={22} color="#8b5cf6" />
            </Link>
          )}

          <button 
            className={styles.menuBtn} 
            onClick={() => setIsSidebarOpen(true)}
            suppressHydrationWarning
          >
            <Menu size={22} />
          </button>
        </div>
      </div>
      
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </nav>
  );
}
