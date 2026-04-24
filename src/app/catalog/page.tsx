'use client';

import { useEffect, useState } from 'react';
import { Star, ShoppingCart, Loader2, Database, Eye, Heart } from 'lucide-react';
import Link from 'next/link';
import { Product, getProducts, getEffectivePrice, subscribeToAllProducts } from '@/lib/services/products';
import { Category, getCategories } from '@/lib/services/categories';
import { seedProducts } from '@/lib/seed';
import { useCart } from '@/context/CartContext';
import AddToListButton from '@/components/catalog/AddToListButton';
import StatusModal, { ModalType } from '@/components/common/StatusModal';
import ProductCard from '@/components/catalog/ProductCard';
import styles from './Catalog.module.css';

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['Todos']);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [isSeeding, setIsSeeding] = useState(false);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: ModalType;
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({ 
    isOpen: false, 
    type: 'info', 
    title: '', 
    message: '' 
  });
  
  const { addToCart } = useCart();

  useEffect(() => {
    let allProducts: Product[] = [];
    
    setLoading(true);
    
    // Load categories once
    const loadCategories = async () => {
      const categoriesData = await getCategories();
      setCategories(['Todos', ...categoriesData.map(c => c.name)]);
    };
    loadCategories();

    // Subscribe to products in real-time
    const unsubscribe = subscribeToAllProducts((data) => {
      allProducts = data;
      setProducts(data);
      
      // Update filtered list based on active category
      const activeOnly = data.filter(p => p.isActive !== false);
      if (activeCategory === 'Todos') {
        setFilteredProducts(activeOnly);
      } else {
        setFilteredProducts(activeOnly.filter(p => p.category === activeCategory));
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeCategory]);

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
            <ProductCard key={product.id} product={product} />
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
