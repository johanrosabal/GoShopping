'use client';

import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { getEffectivePrice } from '@/lib/services/products';
import styles from './CartDrawer.module.css';

export default function CartDrawer() {
  const { cart, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, cartTotal } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className={styles.overlay} onClick={() => setIsCartOpen(false)}>
      <div className={styles.drawer} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Tu Carrito</h2>
          <button className={styles.closeBtn} onClick={() => setIsCartOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.content}>
          {cart.length === 0 ? (
            <div className={styles.empty}>
              <ShoppingBag size={64} strokeWidth={1} />
              <p>Tu carrito está vacío</p>
              <button className={styles.continueBtn} onClick={() => setIsCartOpen(false)}>
                Seguir comprando
              </button>
            </div>
          ) : (
            <div className={styles.items}>
              {cart.map(item => (
                <div key={item.id} className={styles.item}>
                  <div className={styles.itemImage}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} />
                    ) : (
                      <div className={styles.placeholder}></div>
                    )}
                  </div>
                  <div className={styles.itemInfo}>
                    <div className={styles.itemHeader}>
                      <h3>{item.name}</h3>
                      <button className={styles.removeBtn} onClick={() => removeFromCart(item.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <p className={styles.itemPrice}>₡{getEffectivePrice(item).toLocaleString()}</p>
                      {getEffectivePrice(item) < item.price && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textDecoration: 'line-through' }}>
                          ₡{item.price.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className={styles.itemFooter}>
                      <div className={styles.quantityControls}>
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                          <Minus size={14} />
                        </button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className={styles.subtotal}>
                        ₡{(getEffectivePrice(item) * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.totalRow}>
              <span>Subtotal</span>
              <span>₡{cartTotal.toLocaleString()}</span>
            </div>
            <p className={styles.shippingInfo}>Impuestos y envío calculados al finalizar.</p>
            <Link 
              href="/checkout" 
              className={styles.checkoutBtn}
              onClick={() => setIsCartOpen(false)}
            >
              Completar Pedido <ArrowRight size={20} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
