'use client';

import { useEffect, useState, use } from 'react';
import { ShoppingBag, ArrowLeft, Star, ShieldCheck, Zap, Info, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getProductById, getEffectivePrice, Product } from '@/lib/services/products';
import { useCart } from '@/context/CartContext';
import AddToListButton from '@/components/catalog/AddToListButton';
import styles from '../ProductDetail.module.css';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string>('');
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const data = await getProductById(id);
      setProduct(data);
      if (data) setActiveImage(data.imageUrl);
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className={styles.page} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="spin" size={48} color="var(--brand-accent)" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className={styles.page} style={{ textAlign: 'center', paddingTop: '100px' }}>
        <h1 style={{ fontSize: '4rem' }}>404</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>El producto solicitado no existe en nuestra colección curada.</p>
        <Link href="/catalog" className={styles.backBtn}>
          <ArrowLeft size={18} /> Volver al Catálogo
        </Link>
      </div>
    );
  }

  const effectivePrice = getEffectivePrice(product);
  const hasDiscount = effectivePrice < product.price;
  const isOutOfStock = product.stock <= 0;

  return (
    <div className={styles.page}>
      <div className="container animate">
        <Link href="/catalog" className={styles.backBtn}>
          <ArrowLeft size={18} /> Volver al Catálogo de Excelencia
        </Link>

        <div className={styles.container}>
          {/* Gallery Section */}
          <div className={styles.imageSection}>
            <div className={styles.mainImage}>
              <img src={activeImage || product.imageUrl} alt={product.name} />
              {hasDiscount && (
                <div style={{ position: 'absolute', top: '20px', left: '20px', background: 'var(--status-error)', color: 'white', padding: '8px 16px', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>
                  Oferta Exclusiva
                </div>
              )}
            </div>
            
            {product.images && product.images.length > 1 && (
              <div className={styles.thumbnails}>
                {product.images.map((img, idx) => (
                  <div 
                    key={idx} 
                    className={`${styles.thumbnail} ${activeImage === img ? styles.activeThumbnail : ''}`}
                    onClick={() => setActiveImage(img)}
                  >
                    <img src={img} alt={`${product.name} thumbnail ${idx + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className={styles.infoSection}>
            <div className={styles.category}>{product.category}</div>
            <h1 className={styles.title}>{product.name}</h1>
            
            <div className={styles.rating}>
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  size={18} 
                  fill={i < Math.floor(product.rating) ? "var(--brand-accent)" : "transparent"} 
                  color="var(--brand-accent)" 
                />
              ))}
              <span style={{ marginLeft: '12px', color: 'var(--text-secondary)' }}>{product.rating} / 5.0</span>
            </div>

            <div className={styles.priceContainer}>
              <span className={styles.currentPrice}>₡{effectivePrice.toLocaleString()}</span>
              {hasDiscount && (
                <span className={styles.originalPrice}>₡{product.price.toLocaleString()}</span>
              )}
            </div>

            <div 
              className={styles.description} 
              dangerouslySetInnerHTML={{ __html: product.description }}
            />

            <div className={styles.metaGrid}>
              <div className={styles.metaItem}>
                <label>Estado</label>
                <span style={{ color: isOutOfStock ? 'var(--status-error)' : 'var(--status-success)' }}>
                  {isOutOfStock ? 'Agotado' : 'Disponible en Stock'}
                </span>
              </div>
              <div className={styles.metaItem}>
                <label>Envío</label>
                <span>Express VIP (24h)</span>
              </div>
              <div className={styles.metaItem}>
                <label>Autenticidad</label>
                <span>Certificada Go-Shopping</span>
              </div>
              <div className={styles.metaItem}>
                <label>Garantía</label>
                <span>12 meses oficial</span>
              </div>
            </div>

            <div className={styles.actions}>
              <button 
                className={styles.addToCartBtn}
                onClick={() => addToCart(product)}
                disabled={isOutOfStock}
              >
                <ShoppingBag size={22} />
                {isOutOfStock ? 'Producto Agotado' : 'Añadir a la Selección'}
              </button>
              <AddToListButton 
                productId={product.id} 
                variant="full" 
                className={styles.addToCartBtn} 
              />
            </div>

            <div style={{ display: 'grid', gap: '16px', marginTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                <ShieldCheck size={16} /> Pago 100% seguro y encriptado
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                <Zap size={16} /> Entrega garantizada por red propia
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
