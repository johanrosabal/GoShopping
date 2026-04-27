'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getMerchantBySlug, MerchantProfile } from '@/lib/services/merchants';
import { getProductsByMerchant, Product, getEffectivePrice } from '@/lib/services/products';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Globe, 
  Instagram, 
  Facebook, 
  MessageCircle,
  Share2,
  ShieldCheck,
  ChevronRight,
  Loader2,
  AlertCircle,
  Store,
  ExternalLink,
  Briefcase,
  Package,
  ShoppingBag,
  Zap,
  Star
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import MerchantFooter from '@/components/merchant/MerchantFooter';
import ProductCard from '@/components/catalog/ProductCard';
import styles from './merchant.module.css';

// Importación dinámica para evitar error de 'window is not defined' en SSR
const AddressMap = dynamic(() => import('@/components/profile/AddressMap'), { 
  ssr: false,
  loading: () => <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)' }}><Loader2 className="spin" size={24} /></div>
});

export default function MerchantLandingPage() {
  const params = useParams();
  const slug = params.merchantSlug as string;
  const [merchant, setMerchant] = useState<MerchantProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([9.9333, -84.0833]);

  useEffect(() => {
    const loadData = async () => {
      // Timeout de seguridad para evitar carga infinita
      const timeoutId = setTimeout(() => {
        if (loading) {
          setError('La conexión con el servidor está tardando más de lo esperado. Por favor, verifica tu conexión.');
          setLoading(false);
        }
      }, 8000);

      try {
        setLoading(true);
        const data = await getMerchantBySlug(slug);
        if (data) {
          setMerchant(data);
          const merchantProducts = await getProductsByMerchant(data.id);
          setProducts(merchantProducts.filter(p => p.isActive));

          if (data.legalData.mapsUrl) {
            const coordMatch = data.legalData.mapsUrl.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
            if (coordMatch) {
              setMapCenter([parseFloat(coordMatch[1]), parseFloat(coordMatch[2])]);
            }
          }
        } else {
          setError('Comercio no encontrado');
        }
      } catch (err) {
        console.error(err);
        setError('Error al sincronizar con los servicios de elite');
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };
    loadData();
  }, [slug]);

  if (loading) {
    return (
      <div className={styles.splashContainer}>
        <div className={styles.splashContent}>
          <div className={styles.splashBrand}>
            Go<span className={styles.accent}>Shopping</span>
          </div>
          <div className={styles.splashDivider} />
          <h2 className={styles.splashMerchantName}>
            {slug.replace(/-/g, ' ').toUpperCase()}
          </h2>
          <div className={styles.splashStatus}>
            <Loader2 className="spin" size={18} color="var(--brand-accent)" />
            <span>Sincronizando Boutique...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !merchant) {
    return (
      <div className={styles.errorContainer}>
        <AlertCircle size={64} color="#ff4d4d" />
        <h1>Ups! Algo salió mal</h1>
        <p>{error || 'No pudimos encontrar este comercio.'}</p>
        <button onClick={() => window.location.href = '/'}>Volver al Inicio</button>
      </div>
    );
  }

  // Helper to check if open
  const isOpenNow = () => {
    if (!merchant || !merchant.operatingHours) return false;
    
    try {
      const tz = merchant.timezone || "America/Costa_Rica";
      
      // Obtener partes de la fecha de forma ultra-robusta
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', hour12: false
      });
      
      const parts = formatter.formatToParts(new Date());
      const p: any = {};
      parts.forEach(({type, value}) => p[type] = value);
      
      // Crear objeto fecha basado en las partes (evita errores de parseo de string)
      const now = new Date(p.year, p.month - 1, p.day, p.hour, p.minute);
      const dayIndex = now.getDay(); 
      
      const dayMaps = [
        ['sun', 'dom'], ['mon', 'lun'], ['tue', 'mar'], 
        ['wed', 'mie'], ['thu', 'jue'], ['fri', 'vie'], ['sat', 'sab']
      ];
      
      const targets = dayMaps[dayIndex];
      const hourKey = Object.keys(merchant.operatingHours).find(key => {
        const k = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return targets.some(t => k.includes(t));
      });

      const hours = hourKey ? merchant.operatingHours[hourKey] : null;
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
      console.error("Status check error:", e);
      return true;
    }
  };

  const isCurrentlyOpen = isOpenNow();

  return (
    <main className={styles.main}>
      {/* Sub Top Navigation */}
      <nav className={styles.subPageNav}>
        <div className={styles.navContainer}>
          <a href="#inicio" className={`${styles.navLink} ${styles.navLinkActive}`}>Inicio</a>
          <a href="#catalogo" className={styles.navLink}>Catálogo</a>
          <a href="#ubicacion" className={styles.navLink}>Ubicación</a>
          <a href="#contacto" className={styles.navLink}>Contacto</a>
        </div>
      </nav>

      {/* Cinematic Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBackground}>
          {merchant.bannerUrl ? (
            <Image 
              src={merchant.bannerUrl} 
              alt="" 
              fill 
              sizes="100vw"
              className={styles.heroBackgroundImage}
            />
          ) : (
            <div className={styles.bannerPlaceholder} />
          )}
          <div className={styles.heroOverlay} />
        </div>

        <div className={styles.heroContent}>
          <div className={styles.logoWrapper}>
            {merchant.logoUrl ? (
              <Image src={merchant.logoUrl} alt={merchant.name} width={240} height={240} className={styles.logo} />
            ) : (
              <div className={styles.logoPlaceholder}><Store size={60} /></div>
            )}
          </div>

          <div className={styles.statusBadge} style={{ background: isCurrentlyOpen ? '#10b981' : '#ef4444' }}>
            {isCurrentlyOpen ? 'ABIERTO' : 'CERRADO'}
          </div>

          <div className={styles.merchantHeader}>
            <h1>{merchant.name.toUpperCase()}</h1>
            <div className={styles.locationSummary}>
              <span>{merchant.legalData.province}</span>
              <span style={{ opacity: 0.3 }}>•</span>
              <span>{merchant.legalData.canton}</span>
            </div>
          </div>

          <div className={styles.heroManifesto}>
            <span className={styles.sectionBadge}>Nuestra Esencia</span>
            <p className={styles.heroDescription}>
              {merchant.description || 'Bienvenido a una experiencia de compra exclusiva. Este comercio se distingue por su compromiso con la excelencia y el servicio personalizado.'}
            </p>
            
            <div className={styles.heroActions}>
              {merchant.contact.whatsapp && (merchant.socialConfig?.showWhatsapp ?? true) && (
                <a href={`https://wa.me/${merchant.contact.whatsapp}`} target="_blank" className={`${styles.btn} ${styles.btnWhatsapp}`}>
                  <MessageCircle size={20} />
                  WhatsApp Boutique
                </a>
              )}
              <button className={`${styles.btn} ${styles.btnShare}`}>
                <Share2 size={18} />
                Compartir Perfil
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Left: Boutique Details */}
          <div className={styles.contentColumn}>
            <div id="catalogo" className={styles.sectionHeader}>
              <span className={styles.sectionBadge}>Piezas Maestras</span>
              <h2 className={styles.sectionTitle}>
                Selección Elite
              </h2>
            </div>

            {products.length > 0 ? (
              <div className={styles.productGrid}>
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className={styles.productsPlaceholder}>
                <div style={{ color: '#D4AF37', marginBottom: '30px' }}><Briefcase size={40} /></div>
                <h3>Próximamente</h3>
                <p>Nuestras colecciones exclusivas estarán disponibles muy pronto.</p>
              </div>
            )}
          </div>

          {/* Right: Space for future side widgets if needed, or empty for minimalist look */}
          <aside className={styles.sideColumn}>
            {/* Se eliminaron Horarios, Mapa y Certificado ya que ahora están en el footer */}
          </aside>
        </div>
      </div>

      <section className={styles.trustSection}>
        <div className={styles.container}>
          <div className={styles.features}>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>
                <Zap size={32} />
              </div>
              <h3>Entrega Inmediata</h3>
              <p>Logística de vanguardia garantizando envíos el mismo día dentro del Gran Área Metropolitana.</p>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>
                <ShieldCheck size={32} />
              </div>
              <h3>Garantía de Autenticidad</h3>
              <p>Cada pieza es sometida a un riguroso proceso de verificación por especialistas antes de su entrega.</p>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>
                <Star size={32} />
              </div>
              <h3>Soporte Executive</h3>
              <p>Atención personalizada multicanal para una experiencia de post-venta al nivel de su inversión.</p>
            </div>
          </div>
        </div>
      </section>

      <MerchantFooter merchant={merchant} mapCenter={mapCenter} />
    </main>
  );
}
