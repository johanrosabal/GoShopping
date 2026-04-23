import { getMerchantBySlug } from "@/lib/services/merchants";
import { getProducts } from "@/lib/services/products";
import { notFound } from "next/navigation";
import { Store, ShoppingBag, MapPin, Instagram, Facebook, LayoutGrid, ShieldCheck, Package } from "lucide-react";
import Link from "next/link";
import styles from "../page.module.css"; // Reuse home styles

export default async function MerchantStorePage({ params }: { params: { merchantSlug: string } }) {
  const { merchantSlug } = params;
  
  // 1. Fetch Merchant
  const merchant = await getMerchantBySlug(merchantSlug);
  
  if (!merchant || merchant.status !== 'active') {
    notFound();
  }

  // 2. Fetch Merchant Products
  const allProducts = await getProducts();
  const merchantProducts = allProducts.filter(p => p.merchantId === merchant.id && p.isActive !== false);

  return (
    <div className={styles.page}>
      <header className={styles.hero} style={{ height: '50vh', minHeight: '400px' }}>
        <div className={styles.heroBackground}>
          <img 
            src={merchant.bannerUrl || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop'} 
            alt={merchant.name} 
            className={styles.heroImage}
          />
          <div className={styles.heroOverlay} style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.8) 100%)' }}></div>
        </div>

        <div className="container" style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', alignItems: 'flex-end', paddingBottom: '60px' }}>
          <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
            <div style={{ 
              width: '120px', 
              height: '120px', 
              background: 'white', 
              borderRadius: '12px', 
              padding: '12px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {merchant.logoUrl ? (
                <img src={merchant.logoUrl} alt={merchant.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              ) : (
                <Store size={60} color="var(--brand-accent)" />
              )}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <span className={styles.badge} style={{ marginBottom: 0, background: 'var(--brand-accent)', color: 'black' }}>Socio Verificado</span>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {merchant.contact.instagram && <Link href={merchant.contact.instagram} style={{ color: 'white' }}><Instagram size={18} /></Link>}
                  {merchant.contact.facebook && <Link href={merchant.contact.facebook} style={{ color: 'white' }}><Facebook size={18} /></Link>}
                </div>
              </div>
              <h1 style={{ fontSize: '3rem', margin: 0, fontWeight: 900 }}>{merchant.name}</h1>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', marginTop: '4px', maxWidth: '600px' }}>
                {merchant.description || 'Descubre la excelencia artesanal y curaduría exclusiva de nuestro socio comercial.'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container" style={{ padding: '80px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <LayoutGrid size={24} color="var(--brand-accent)" />
            <h2 style={{ fontSize: '1.8rem', margin: 0 }}>Colección <span className={styles.accent}>Exclusiva</span></h2>
          </div>
          <span style={{ color: 'var(--text-tertiary)' }}>{merchantProducts.length} Productos Disponibles</span>
        </div>

        {merchantProducts.length > 0 ? (
          <div className={styles.productGrid}>
            {merchantProducts.map(product => (
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
                    <span style={{ fontSize: '0.7rem', color: 'var(--brand-accent)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{product.category}</span>
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
        ) : (
          <div style={{ padding: '100px', textAlign: 'center', background: 'var(--bg-secondary)', border: '1px dashed var(--border)' }}>
            <Package size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
            <p style={{ color: 'var(--text-tertiary)' }}>Este comercio aún no ha publicado productos en su vitrina digital.</p>
          </div>
        )}
      </main>
    </div>
  );
}
