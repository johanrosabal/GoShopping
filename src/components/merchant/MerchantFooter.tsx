import React from 'react';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Instagram, 
  Facebook, 
  MessageCircle,
  Store,
  ChevronRight
} from 'lucide-react';
import { MerchantProfile } from '@/lib/services/merchants';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import styles from './MerchantFooter.module.css';


interface MerchantFooterProps {
  merchant: MerchantProfile;
  mapCenter: [number, number];
}

export default function MerchantFooter({ merchant, mapCenter }: MerchantFooterProps) {
  const format12h = (time24: string) => {
    if (!time24) return "";
    try {
      const [h, m] = time24.split(':').map(Number);
      if (isNaN(h) || isNaN(m)) return time24;
      const period = h >= 12 ? 'PM' : 'AM';
      const hour12 = h % 12 || 12;
      return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
    } catch (e) {
      return time24;
    }
  };

  const days = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Brand Info */}
          <div className={styles.brandSection}>
            <div className={styles.goShoppingLogo}>
              Go<span className={styles.accent}>Shopping</span>
            </div>
            <div className={styles.tagline}>LA DEFINICIÓN DE EXCELENCIA</div>
            
            <div className={styles.merchantInfo}>
              <div className={styles.brandHeader}>
                <Store size={24} color="var(--brand-accent)" />
                <h2 className={styles.brandName}>{merchant.name.toUpperCase()}</h2>
              </div>
              <p className={styles.manifesto}>
                {merchant.description || 'Comprometidos con la excelencia y el servicio personalizado para ofrecerte la mejor experiencia de compra elite.'}
              </p>
            </div>

            <div className={styles.socials}>
              {merchant.contact.instagram && (merchant.socialConfig?.showInstagram ?? true) && (
                <a href={merchant.contact.instagram} target="_blank" className={styles.socialLink}>
                  <Instagram size={20} />
                </a>
              )}
              {merchant.contact.facebook && (merchant.socialConfig?.showFacebook ?? true) && (
                <a href={merchant.contact.facebook} target="_blank" className={styles.socialLink}>
                  <Facebook size={20} />
                </a>
              )}
            </div>

            <div className={styles.paymentMethods}>
              <p style={{ fontSize: '0.65rem', letterSpacing: '0.1em', opacity: 0.6, marginBottom: '12px' }}>MÉTODOS DE PAGO ACEPTADOS</p>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                {/* PayPal Logo */}
                <div style={{ height: '32px', opacity: 0.8 }}>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" style={{ height: '100%', filter: 'brightness(0) invert(1)' }} />
                </div>
                {/* SINPE MOVIL Logo */}
                <div style={{ height: '110px', opacity: 1, display: 'flex', alignItems: 'center', marginLeft: '15px' }}>
                  <img 
                    src="/images/sinpe-logo.png" 
                    alt="SINPE MÓVIL" 
                    style={{ 
                      height: '100%', 
                      filter: 'invert(1) brightness(1.2)' 
                    }} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Operating Hours */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <Clock size={18} /> HORARIOS
            </h3>
            <div className={styles.hoursList}>
              {days.map(day => {
                const hours = merchant.operatingHours[day.key];
                return (
                  <div key={day.key} className={styles.hourRow} style={{ opacity: hours?.isOpen ? 1 : 0.4 }}>
                    <span className={styles.dayName}>{day.label}</span>
                    <span className={styles.timeRange}>
                      {hours?.isOpen ? `${format12h(hours.open)} — ${format12h(hours.close)}` : 'Cerrado'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contact & Location */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <MapPin size={18} /> CONTACTO Y UBICACIÓN
            </h3>
            <div className={styles.contactList}>
              <div className={styles.contactItem}>
                <Mail size={16} />
                <a href={`mailto:${merchant.contact.email}`}>{merchant.contact.email}</a>
              </div>
              {merchant.contact.phone && (merchant.socialConfig?.showPhone ?? true) && (
                <div className={styles.contactItem}>
                  <Phone size={16} />
                  <a href={`tel:${merchant.contact.phone}`}>{merchant.contact.phone}</a>
                  {merchant.contact.whatsapp && (merchant.socialConfig?.showWhatsapp ?? true) && (
                    <a 
                      href={`https://wa.me/${merchant.contact.whatsapp}`} 
                      target="_blank" 
                      style={{ 
                        marginLeft: '8px', 
                        display: 'flex', 
                        alignItems: 'center',
                        color: '#25D366'
                      }}
                      title="Contactar por WhatsApp"
                    >
                      <MessageCircle size={18} fill="#25D366" color="white" />
                    </a>
                  )}
                </div>
              )}
              <div className={styles.contactItem} style={{ alignItems: 'flex-start' }}>
                <MapPin size={16} style={{ marginTop: '4px' }} />
                <div style={{ width: '100%' }}>
                  <p>{merchant.legalData.physicalAddress}</p>
                  <p style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '4px' }}>
                    {merchant.legalData.district}, {merchant.legalData.canton}, {merchant.legalData.province}
                  </p>
                  
                  <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <p style={{ fontSize: '0.65rem', letterSpacing: '0.1em', opacity: 0.6, marginBottom: '4px' }}>CÓMO LLEGAR</p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <a 
                        href={merchant.legalData.mapsUrl} 
                        target="_blank" 
                        className={styles.navigationBtn}
                      >
                        GOOGLE MAPS
                      </a>
                      <a 
                        href={`https://waze.com/ul?ll=${mapCenter[0]},${mapCenter[1]}&navigate=yes`} 
                        target="_blank" 
                        className={styles.navigationBtn}
                      >
                        WAZE
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.bottomBar}>
          <p>© {new Date().getFullYear()} {merchant.name}. Todos los derechos reservados.</p>
          <div className={styles.poweredBy}>
            PROXIMAMENTE <span style={{ color: 'var(--brand-accent)' }}>GO-SHOPPING</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
