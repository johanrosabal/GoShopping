'use client';
import Link from 'next/link';
import { Mail, Phone, MapPin, Globe, Camera, Send, Link as LinkIcon } from 'lucide-react';
import { useAuth } from "@/context/AuthContext";
import { SiteSettings, DEFAULT_SETTINGS, subscribeToSettings } from '@/lib/services/settings';
import { useEffect, useState } from 'react';
import styles from './Footer.module.css';

export default function Footer() {
  const { isAdmin } = useAuth();
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const unsubscribe = subscribeToSettings((data) => {
      setSettings(data);
    });
    return () => unsubscribe();
  }, []);

  return (
    <footer className={styles.footer}>
      <div className={`${styles.container} container`}>
        <div className={styles.section}>
          <Link href="/" className={styles.logo}>
            Go<span className={styles.accent}>Shopping</span>
          </Link>
          <div className={styles.tagline}>{settings.tagline}</div>
          <p className={styles.desc}>
            {settings.footerDescription}
          </p>
          <div className={styles.socials}>
            <a href={settings.instagram} target="_blank" rel="noopener noreferrer"><Camera size={20} /></a>
            <a href={settings.website} target="_blank" rel="noopener noreferrer"><Globe size={20} /></a>
            <a href={settings.telegram} target="_blank" rel="noopener noreferrer"><Send size={20} /></a>
          </div>
        </div>

        <div className={styles.section}>
          <h3>Explorar</h3>
          <ul>
            <li><Link href="/catalog">Catálogo</Link></li>
            <li><Link href="/vender">Vender Productos</Link></li>
            <li><Link href="/ofertas">Ofertas</Link></li>
            {isAdmin && <li className={styles.adminLink}><Link href="/admin">Panel de Control</Link></li>}
          </ul>
        </div>

        <div className={styles.section}>
          <h3>Contacto</h3>
          <ul className={styles.contactList}>
            <li><Mail size={16} /> {settings.contactEmail}</li>
            <li><Phone size={16} /> {settings.contactPhone}</li>
            <li><MapPin size={16} /> {settings.contactAddress}</li>
          </ul>
        </div>
      </div>
      <div className={styles.bottom}>
        <p>&copy; 2026 Go-Shopping. Todos los derechos reservados.</p>
        <p>Pagos seguros con <span className={styles.highlight}>PayPal</span> y <span className={styles.highlight}>SINPE Móvil</span></p>
      </div>
    </footer>
  );
}
