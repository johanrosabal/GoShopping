'use client';

import { useState, useEffect } from 'react';
import { Trash2, ShoppingCart, Loader2, Package, ArrowRight, ExternalLink, RefreshCw } from 'lucide-react';
import { getShoppingLists, removeItemFromShoppingList, deleteShoppingList, ShoppingList } from '@/lib/services/shoppingLists';
import { getProducts, Product } from '@/lib/services/products';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import styles from './ShoppingListManager.module.css';

interface ShoppingListManagerProps {
  userId: string;
}

export default function ShoppingListManager({ userId }: ShoppingListManagerProps) {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { addToCart } = useCart();

  const loadData = async () => {
    setLoading(true);
    const [listsData, productsData] = await Promise.all([
      getShoppingLists(userId),
      getProducts()
    ]);
    
    // Create a lookup map for products
    const productMap: Record<string, Product> = {};
    productsData.forEach(p => {
      productMap[p.id] = p;
    });

    setLists(listsData);
    setProducts(productMap);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  const handleRemoveItem = async (listId: string, productId: string) => {
    setActionLoading(`${listId}-${productId}`);
    const success = await removeItemFromShoppingList(listId, productId);
    if (success) {
      setLists(lists.map(l => 
        l.id === listId ? { ...l, items: l.items.filter(id => id !== productId) } : l
      ));
    }
    setActionLoading(null);
  };

  const handleDeleteList = async (listId: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta lista de excelencia?')) return;
    setActionLoading(listId);
    const success = await deleteShoppingList(listId);
    if (success) {
      setLists(lists.filter(l => l.id !== listId));
    }
    setActionLoading(null);
  };

  const handleAddListToCart = (list: ShoppingList) => {
    list.items.forEach(id => {
      const product = products[id];
      if (product && product.stock > 0) {
        addToCart(product);
      }
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Loader2 className="spin" size={48} color="var(--brand-accent)" />
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Recuperando tus selecciones privadas...</p>
      </div>
    );
  }

  if (lists.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Package size={64} color="var(--border)" style={{ marginBottom: '24px' }} />
        <h2>Sin Listas Elite</h2>
        <p>Aún no has creado colecciones personalizadas de productos.</p>
        <Link href="/catalog" className={styles.addToCartList} style={{ display: 'inline-flex', textDecoration: 'none' }}>
          Explorar Catálogo <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', letterSpacing: '0.05em' }}>Mis <span className={styles.accent} style={{ color: 'var(--brand-accent)' }}>Listas Elite</span></h2>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>Organiza y planea tus próximas adquisiciones de excelencia.</p>
        </div>
        <button onClick={loadData} className={styles.actionBtn} title="Refrescar">
          <RefreshCw size={18} />
        </button>
      </header>

      {lists.map(list => (
        <div key={list.id} className={styles.listCard}>
          <div className={styles.listHeader}>
            <div className={styles.listInfo}>
              <h3>{list.name}</h3>
              <div className={styles.listStats}>
                {list.items.length} artículos • Creada el {new Date(list.createdAt?.toDate ? list.createdAt.toDate() : list.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div className={styles.headerActions}>
               <button 
                 className={`${styles.actionBtn} ${styles.deleteBtn}`} 
                 onClick={() => handleDeleteList(list.id)}
                 disabled={actionLoading === list.id}
               >
                 {actionLoading === list.id ? <Loader2 className="spin" size={16} /> : <Trash2 size={18} />}
               </button>
            </div>
          </div>

          <div className={styles.itemsGrid}>
            {list.items.map(productId => {
              const product = products[productId];
              if (!product) return null;

              return (
                <div key={productId} className={styles.itemCard}>
                  <img src={product.imageUrl} alt={product.name} className={styles.itemImage} />
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>{product.name}</span>
                    <span className={styles.itemPrice}>₡{product.price.toLocaleString()}</span>
                    <Link href={`/product/${productId}`} className={styles.listStats} style={{ display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', marginTop: '4px' }}>
                      Ver Detalles <ExternalLink size={10} />
                    </Link>
                  </div>
                  <button 
                    className={styles.removeItem} 
                    onClick={() => handleRemoveItem(list.id, productId)}
                    disabled={actionLoading === `${list.id}-${productId}`}
                  >
                    {actionLoading === `${list.id}-${productId}` ? <Loader2 className="spin" size={14} /> : <Trash2 size={16} />}
                  </button>
                </div>
              );
            })}
            {list.items.length === 0 && (
                <div className={styles.emptyList}>
                  Esta lista está esperando ser poblada con excelencia.
                </div>
            )}
          </div>

          {list.items.length > 0 && (
            <div className={styles.listFooter}>
              <button className={styles.addToCartList} onClick={() => handleAddListToCart(list)}>
                <ShoppingCart size={18} /> Añadir Lista al Carrito
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
