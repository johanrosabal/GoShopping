'use client';

import React from 'react';
import { Star, ShoppingCart, Eye, Package } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Product, getEffectivePrice } from '@/lib/services/products';
import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/lib/utils/currency';
import AddToListButton from './AddToListButton';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const effectivePrice = getEffectivePrice(product);
  const hasDiscount = effectivePrice < product.price;

  return (
    <div className={styles.card}>
      <Link href={`/product/${product.id}`} className={styles.imageLink}>
        <div className={styles.imageContainer}>
          {product.imageUrl ? (
            <Image 
              src={product.imageUrl} 
              alt={product.name} 
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className={styles.productImage} 
            />
          ) : (
            <div className={styles.imagePlaceholder}>
              <Package size={40} opacity={0.2} />
            </div>
          )}
          
          <span className={styles.categoryBadge}>{product.category}</span>
          
          {hasDiscount && (
            <span className={styles.saleBadge}>OFERTA</span>
          )}

          <div className={styles.imageOverlay}>
            <Eye size={24} />
            <span>VER DETALLES ELITE</span>
          </div>
        </div>
      </Link>

      <div className={styles.content}>
        <Link href={`/product/${product.id}`} className={styles.titleLink}>
          <h3 className={styles.title}>{product.name}</h3>
        </Link>
        
        <div className={styles.rating}>
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              size={12} 
              fill={i < Math.floor(product.rating) ? "var(--brand-accent)" : "transparent"} 
              color="var(--brand-accent)" 
            />
          ))}
          <span className={styles.ratingText}>({product.rating})</span>
        </div>

        <div className={styles.priceRow}>
          <div className={styles.priceInfo}>
            <span className={styles.price}>₡{formatCurrency(effectivePrice)}</span>
            {hasDiscount && (
              <span className={styles.oldPrice}>₡{formatCurrency(product.price)}</span>
            )}
          </div>
        </div>

        <div className={styles.actions}>
          <button 
            className={styles.addBtn} 
            onClick={(e) => {
              e.preventDefault();
              addToCart(product);
            }}
            title="Añadir a mi selección"
          >
            <ShoppingCart size={16} />
            <span>AÑADIR</span>
          </button>
          
          <AddToListButton 
            productId={product.id} 
            className={styles.listBtn} 
          />
        </div>
      </div>
    </div>
  );
}
