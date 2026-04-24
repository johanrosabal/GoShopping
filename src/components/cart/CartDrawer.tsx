'use client';

import { useEffect, useState } from 'react';
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight, Info, Store } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { getEffectivePrice } from '@/lib/services/products';
import { getMerchantById, MerchantProfile } from '@/lib/services/merchants';
import { formatCurrency } from '@/lib/utils/currency';
import styles from './CartDrawer.module.css';

export default function CartDrawer() {
  const { cart, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, cartTotal } = useCart();
  const [merchants, setMerchants] = useState<Record<string, MerchantProfile | { name: string }>>({
    'go-shopping-main': { name: 'GoShopping Oficial' }
  });

  // Fetch merchant names for items in cart
  useEffect(() => {
    const fetchMerchants = async () => {
      const uniqueMerchantIds = Array.from(new Set(cart.map(item => item.merchantId || 'go-shopping-main')));
      
      const newMerchants = { ...merchants };
      let changed = false;

      for (const id of uniqueMerchantIds) {
        if (!newMerchants[id] && id !== 'go-shopping-main') {
          const mData = await getMerchantById(id);
          if (mData) {
            newMerchants[id] = mData;
            changed = true;
          }
        }
      }

      if (changed) {
        setMerchants(newMerchants);
      }
    };

    if (isCartOpen && cart.length > 0) {
      fetchMerchants();
    }
  }, [cart, isCartOpen]);

  if (!isCartOpen) return null;

  // Group items by merchant
  const groupedItems = cart.reduce((groups, item) => {
    const mId = item.merchantId || 'go-shopping-main';
    if (!groups[mId]) groups[mId] = [];
    groups[mId].push(item);
    return groups;
  }, {} as Record<string, typeof cart>);

  const merchantIds = Object.keys(groupedItems);
  const isMultiMerchant = merchantIds.length > 1;

  return (
    <div className={styles.overlay} onClick={() => setIsCartOpen(false)}>
      <div className={styles.drawer} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
             <ShoppingBag size={20} color="var(--brand-accent)" />
             <h2>Tu Selección Elite</h2>
          </div>
          <button className={styles.closeBtn} onClick={() => setIsCartOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.content}>
          {cart.length === 0 ? (
            <div className={styles.empty}>
              <ShoppingBag size={64} strokeWidth={1} />
              <p>Tu selección está vacía</p>
              <button className={styles.continueBtn} onClick={() => setIsCartOpen(false)}>
                Explorar Catálogo
              </button>
            </div>
          ) : (
            <div className={styles.itemsWrapper}>
              {isMultiMerchant && (
                <div className={styles.multiMerchantWarning}>
                  <Info size={16} />
                  <p>Tu selección incluye múltiples comercios. Se procesarán checkouts individuales por cada tienda.</p>
                </div>
              )}

              {merchantIds.map(mId => (
                <div key={mId} className={styles.merchantGroup}>
                  <div className={styles.merchantHeader}>
                    <Store size={14} />
                    <span>{merchants[mId]?.name?.toUpperCase() || 'CARGANDO COMERCIO...'}</span>
                  </div>
                  
                  <div className={styles.groupItems}>
                    {groupedItems[mId].map(item => (
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
                          <p className={styles.itemPrice}>₡{formatCurrency(getEffectivePrice(item))}</p>
                          
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
                              ₡{formatCurrency(getEffectivePrice(item) * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.totalRow}>
              <span>Total Selección</span>
              <span className={styles.totalPrice}>₡{formatCurrency(cartTotal)}</span>
            </div>
            <p className={styles.shippingInfo}>Impuestos y envío calculados por comercio al finalizar.</p>
            {merchantIds.length > 1 ? (
              <Link 
                href={`/checkout?merchantId=${merchantIds[0]}`} 
                className={styles.checkoutBtn}
                onClick={() => setIsCartOpen(false)}
              >
                Continuar con Primer Comercio <ArrowRight size={20} />
              </Link>
            ) : (
              <Link 
                href="/checkout" 
                className={styles.checkoutBtn}
                onClick={() => setIsCartOpen(false)}
              >
                Finalizar Pedido <ArrowRight size={20} />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
