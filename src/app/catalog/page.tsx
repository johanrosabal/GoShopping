'use client';

import { useEffect, useState } from 'react';
import { Star, ShoppingCart, Loader2, Database, Eye, Heart } from 'lucide-react';
import Link from 'next/link';
import { Product, getProducts, getEffectivePrice } from '@/lib/services/products';
import { Category, getCategories } from '@/lib/services/categories';
import { seedProducts } from '@/lib/seed';
import { useCart } from '@/context/CartContext';
import AddToListButton from '@/components/catalog/AddToListButton';
import StatusModal from '@/components/common/StatusModal';
import styles from './Catalog.module.css';

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['Todos']);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [isSeeding, setIsSeeding] = useState(false);
  const [modal, setModal] = useState({ 
    isOpen: false, 
    type: 'info' as any, 
    title: '', 
    message: '',
    onConfirm: undefined as (() => void) | undefined
  });
  
  const { addToCart } = useCart();

  const fetchProducts = async () => {
    setLoading(true);
    const [productsData, categoriesData] = await Promise.all([
      getProducts(),
      getCategories()
    ]);
    
    const activeProducts = productsData.filter(p => p.isActive !== false);
    setProducts(productsData); // Store all data in case we need it, but usually not needed for client
    setFilteredProducts(activeProducts);
    setCategories(['Todos', ...categoriesData.map(c => c.name)]);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleFilter = (category: string) => {
    setActiveCategory(category);
    const activeOnly = products.filter(p => p.isActive !== false);
    if (category === 'Todos') {
      setFilteredProducts(activeOnly);
    } else {
      setFilteredProducts(activeOnly.filter(p => p.category === category));
    }
  };

  const handleSeed = () => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Inicializar Tienda',
      message: '¿Quieres poblar la base de datos con productos de prueba premium?',
      onConfirm: async () => {
        setIsSeeding(true);
        try {
          const success = await seedProducts();
          if (success) {
            setModal({
              isOpen: true,
              type: 'success',
              title: 'Éxito',
              message: '¡Base de datos poblada con éxito! Ahora verás los productos.'
            });
            await fetchProducts();
          } else {
            setModal({
              isOpen: true,
              type: 'error',
              title: 'Error de Semilla',
              message: 'Hubo un error al subir los productos. Intenta de nuevo en unos momentos.'
            });
          }
        } catch (error) {
          setModal({
            isOpen: true,
            type: 'error',
            title: 'Error Crítico',
            message: 'No se pudo completar la inicialización de productos.'
          });
        } finally {
          setIsSeeding(false);
        }
      }
    });
  };

  return (
    <div className={`${styles.catalog} container`}>
      <header className={styles.header}>
        <h1>Catálogo de <span className={styles.accent}>Excelencia</span></h1>
        <p>Selección curada de los mejores productos del mercado.</p>
      </header>

      <div className={styles.filters}>
        {categories.map(category => (
          <button
            key={category}
            className={`${styles.filterBtn} ${activeCategory === category ? styles.activeFilter : ''}`}
            onClick={() => handleFilter(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={styles.grid}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`${styles.card} ${styles.skeleton}`} style={{ height: '400px' }}></div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            No hay productos disponibles en esta categoría.
          </p>
          <button className={styles.filterBtn} onClick={handleSeed} disabled={isSeeding}>
            {isSeeding ? <Loader2 className="spin" size={18} /> : <><Database size={18} style={{ marginRight: '8px' }} /> Inicializar con Datos de Prueba</>}
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredProducts.map(product => (
            <div key={product.id} className={styles.card}>
              <Link href={`/product/${product.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <div className={styles.imageContainer}>
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className={styles.productImage} />
                  ) : (
                    <div className={styles.imagePlaceholder}></div>
                  )}
                  <span className={styles.categoryBadge}>{product.category}</span>
                  {getEffectivePrice(product) < product.price && (
                    <span style={{ 
                      position: 'absolute', 
                      top: '12px', 
                      left: '12px', 
                      background: 'var(--status-error)', 
                      color: 'white', 
                      padding: '4px 10px', 
                      fontSize: '0.7rem', 
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em'
                    }}>
                      Sale
                    </span>
                  )}
                  <div className={styles.imageOverlay}>
                    <Eye size={24} />
                    <span>Ver Detalles Elite</span>
                  </div>
                </div>
              </Link>
              <div className={styles.content}>
                 <Link href={`/product/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h3 style={{ cursor: 'pointer' }}>{product.name}</h3>
                 </Link>
                 <div className={styles.rating}>
                   {[...Array(5)].map((_, i) => (
                     <Star 
                       key={i} 
                       size={14} 
                       fill={i < Math.floor(product.rating) ? "var(--brand-accent)" : "transparent"} 
                       color="var(--brand-accent)" 
                     />
                   ))}
                   <span>({product.rating})</span>
                 </div>
                 <div className={styles.footer}>
                   <span className={styles.price}>₡{product.price.toLocaleString()}</span>
                   <div style={{ display: 'flex', gap: '8px' }}>
                     <AddToListButton productId={product.id} className={styles.addBtn} />
                     <button className={styles.addBtn} onClick={() => addToCart(product)}>
                       <ShoppingCart size={18} />
                     </button>
                   </div>
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <StatusModal 
        isOpen={modal.isOpen}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={() => setModal({ ...modal, isOpen: false })}
        onConfirm={modal.onConfirm}
        confirmText="Sí, Inicializar"
        cancelText="Volver"
      />
    </div>
  );
}
