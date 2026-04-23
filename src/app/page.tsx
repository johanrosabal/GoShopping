import { ShoppingBag, Star, ShieldCheck, Zap, ArrowRight, ImageIcon } from "lucide-react";
import { getProducts } from "@/lib/services/products";
import { getCategories } from "@/lib/services/categories";
import { getSiteSettings } from "@/lib/services/settings";
import Link from "next/link";
import styles from "./page.module.css";

export default async function Home() {
  // Fetch featured products
  const allProducts = await getProducts();
  const featuredProducts = allProducts
    .filter(p => p.featured && p.isActive !== false)
    .slice(0, 4);

  // Fetch premium categories
  const categories = await getCategories();
  const premiumCategories = categories
    .filter(c => c.isPremium)
    .slice(0, 3); // Limit to top 3 for the lookbook
 
  // Fetch site settings for dynamic Hero
  const settings = await getSiteSettings();

  // Highlight logic for the title (last word)
  const titleParts = settings.heroTitle.split(' ');
  const mainTitle = titleParts.slice(0, -1).join(' ');
  const highlightedWord = titleParts[titleParts.length - 1];

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        
        {/* Cinematic Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroBackground}>
            <img 
              src={settings.heroBackgroundImageUrl} 
              alt="Elite Luxury Background" 
              className={styles.heroImage}
            />
            <div className={styles.heroOverlay}></div>
          </div>
          
          <div className="container" style={{ position: 'relative', zIndex: 10 }}>
            <div className={styles.heroContent}>
              <div className="animate">
                <span className={styles.badge}>{settings.heroBadge}</span>
                <h1 className={styles.heroTitle}>
                  {mainTitle} <span className={styles.textHighlight}>{highlightedWord}</span>
                </h1>
                <p className={styles.heroDesc}>
                  {settings.heroDescription}
                </p>
                <div className={styles.heroActions}>
                  <Link href="/catalog" className={styles.btnPrimary}>
                    Explorar Catálogo
                  </Link>
                  <Link href="/about" className={styles.btnSecondary}>
                    Nuestra Filosofía
                  </Link>
                </div>
              </div>

              <div className={`${styles.heroVisual} animate`} style={{ animationDelay: '0.4s' }}>
                <img 
                  src={settings.heroHighlightImageUrl} 
                  alt="Elite Technology Highlight" 
                />
              </div>
            </div>
          </div>
        </section>

        {/* Brand Features Section (Trust Bar) */}
        <section className="container">
          <div className={styles.features}>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>
                <Zap size={40} />
              </div>
              <h3>Entrega Inmediata</h3>
              <p>Logística de vanguardia garantizando envíos el mismo día dentro del Gran Área Metropolitana.</p>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>
                <ShieldCheck size={40} />
              </div>
              <h3>Garantía de Autenticidad</h3>
              <p>Cada pieza es sometida a un riguroso proceso de verificación por especialistas antes de su entrega.</p>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>
                <Star size={40} />
              </div>
              <h3>Soporte Executive</h3>
              <p>Atención personalizada multicanal para una experiencia de post-venta al nivel de su inversión.</p>
            </div>
          </div>
        </section>

        {/* Featured Categories Lookbook */}
        {premiumCategories.length > 0 && (
          <section className={styles.categories}>
            <div className="container">
              <div className={styles.sectionTitle}>
                <span>Colecciones Curadas</span>
                <h2>Categorías Premium</h2>
              </div>
              
              <div className={styles.categoryGrid}>
                {premiumCategories.map(cat => (
                  <Link key={cat.id} href={`/catalog?category=${cat.name}`} className={styles.categoryItem} style={{ textDecoration: 'none' }}>
                    {cat.imageUrl ? (
                      <img src={cat.imageUrl} alt={cat.name} />
                    ) : (
                      <div style={{ height: '350px', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
                        <ImageIcon size={48} />
                      </div>
                    )}
                    <div className={styles.categoryContent}>
                      <span>{cat.tagline || 'Essential Collection'}</span>
                      <h3>{cat.displayTitle || cat.name}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Featured Selection */}
        {featuredProducts.length > 0 && (
          <section className={styles.featured}>
            <div className="container">
              <div className={styles.sectionTitle} style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <span>Piezas Maestras</span>
                  <h2>Selección Elite</h2>
                </div>
                <Link href="/catalog" style={{ color: 'var(--brand-accent)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', marginBottom: '12px' }}>
                  Ver todo <ArrowRight size={16} />
                </Link>
              </div>

              <div className={styles.productGrid}>
                {featuredProducts.map(product => (
                  <Link key={product.id} href={`/product/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', overflow: 'hidden', transition: 'all 0.3s' }} className="animate hover-up">
                      <div style={{ height: '300px', background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                        <img 
                          src={product.imageUrl} 
                          alt={product.name} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--brand-accent)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{product.category}</span>
                          {product.merchantId && product.merchantId !== 'go-shopping-main' && (
                            <span style={{ 
                              fontSize: '0.55rem', 
                              color: '#8b5cf6', 
                              border: '1px solid #8b5cf633', 
                              padding: '2px 6px',
                              fontWeight: 700,
                              letterSpacing: '0.05em'
                            }}>SOCIO ELITE</span>
                          )}
                        </div>
                        <h3 style={{ margin: '8px 0', fontSize: '1.2rem' }}>{product.name}</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                          <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>₡{product.price.toLocaleString()}</span>
                          <ShoppingBag size={18} color="var(--brand-accent)" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
