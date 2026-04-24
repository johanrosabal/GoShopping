'use client';

import { useEffect, useState } from 'react';
import { getProductsByMerchant, Product, updateProductStatus, deleteProduct } from '@/lib/services/products';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Loader2, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  AlertCircle,
  Tag
} from 'lucide-react';
import Link from 'next/link';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { getMerchantByOwnerUid } from '@/lib/services/merchants';
import { getCategories } from '@/lib/services/categories';
import styles from '../../admin/admin.module.css';
import StatusModal, { ModalType } from '@/components/common/StatusModal';

export default function MerchantProductsPage() {
  const { userData, loading: loadingAuth } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: ModalType;
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({ isOpen: false, type: 'info', title: '', message: '' });

  useEffect(() => {
    const fetchProducts = async () => {
      let effectiveMerchantId = userData?.merchantId;

      if (!effectiveMerchantId && userData?.uid) {
        try {
          const merchant = await getMerchantByOwnerUid(userData.uid);
          if (merchant) effectiveMerchantId = merchant.id;
        } catch (e) {
          console.error("Error recovering merchantId:", e);
        }
      }

      if (!effectiveMerchantId) {
        setLoading(false);
        return;
      }
      
      try {
        const q = query(
          collection(db, 'products'),
          where('merchantId', '==', effectiveMerchantId),
          orderBy('createdAt', 'desc')
        );
        
        const snap = await getDocs(q);
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
        setProducts(list);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!loadingAuth) {
      fetchProducts();
    }
  }, [userData, loadingAuth]);

  useEffect(() => {
    let filtered = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           p.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
      
      let matchesStock = true;
      if (stockFilter === 'in_stock') matchesStock = p.stock > 0;
      if (stockFilter === 'low_stock') matchesStock = p.stock > 0 && p.stock <= 5;
      if (stockFilter === 'out_of_stock') matchesStock = p.stock === 0;

      return matchesSearch && matchesCategory && matchesStock;
    });
    setFilteredProducts(filtered);
  }, [searchTerm, categoryFilter, stockFilter, products]);

  useEffect(() => {
    const fetchCats = async () => {
      const data = await getCategories();
      setCategories(data.map(c => c.name));
    };
    fetchCats();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const success = await updateProductStatus(id, !currentStatus);
    if (success) {
      window.location.reload();
    }
  };

  const handleDelete = (id: string, name: string) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Eliminar Producto',
      message: `¿Estás seguro de que deseas eliminar permanentemente "${name}" de tu inventario?`,
      onConfirm: async () => {
        const success = await deleteProduct(id);
        if (success) {
          setModal({ isOpen: true, type: 'success', title: 'Eliminado', message: 'El producto ha sido removido de tu catálogo.' });
          window.location.reload();
        }
      }
    });
  };

  return (
    <div className={`${styles.adminPage} container animate`}>
      <header className={styles.header} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/merchant/dashboard" className={styles.viewBtn}>
            <ArrowLeft size={18} />
          </Link>
          <h1>Tu <span className={styles.accent}>Inventario</span></h1>
        </div>
        <Link href="/merchant/products/new" className={styles.approveBtn}>
          <Plus size={18} /> NUEVO PRODUCTO
        </Link>
      </header>

      {/* Filter Bar */}
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <label>BUSCAR PRODUCTO</label>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input 
              type="text" 
              placeholder="Nombre o categoría..." 
              className={styles.filterInput}
              style={{ paddingLeft: '40px', width: '100%' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.filterGroup}>
          <label>CATEGORÍA</label>
          <select 
            className={styles.filterSelect}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">Todas las Categorías</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>ESTADO DE STOCK</label>
          <select 
            className={styles.filterSelect}
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
          >
            <option value="all">Todos los Estados</option>
            <option value="in_stock">En Stock</option>
            <option value="low_stock">Stock Bajo (≤ 5)</option>
            <option value="out_of_stock">Agotado</option>
          </select>
        </div>
      </div>

      <div className={styles.tableContainer}>
        {loading ? (
          <div style={{ padding: '100px', textAlign: 'center' }}>
            <Loader2 className="spin" size={40} color="var(--brand-accent)" />
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img 
                          src={p.imageUrl} 
                          alt={p.name} 
                          style={{ width: '40px', height: '40px', objectFit: 'cover', background: 'var(--bg-tertiary)' }} 
                        />
                        <div style={{ fontWeight: 600 }}>
                          <Link href={`/merchant/products/edit/${p.id}`} className={styles.productLink}>
                            {p.name}
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{p.category}</span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--brand-accent)' }}>
                      ₡{p.price.toLocaleString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ 
                          color: p.stock <= (p.minStock || 5) ? '#e74c3c' : 'inherit',
                          fontWeight: p.stock <= (p.minStock || 5) ? 800 : 400
                        }}>
                          {p.stock} units
                        </span>
                        {p.stock <= (p.minStock || 5) && <AlertCircle size={14} color="#e74c3c" />}
                      </div>
                    </td>
                    <td>
                      <button 
                        onClick={() => handleToggleStatus(p.id, p.isActive)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                        title={p.isActive ? 'Ocultar de la tienda' : 'Mostrar en la tienda'}
                      >
                        {p.isActive ? (
                          <span style={{ color: '#2ecc71', background: 'rgba(46, 204, 113, 0.1)', padding: '4px 8px', fontSize: '0.7rem', fontWeight: 700, borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Eye size={12} /> VISIBLE
                          </span>
                        ) : (
                          <span style={{ color: '#e74c3c', background: 'rgba(231, 76, 60, 0.1)', padding: '4px 8px', fontSize: '0.7rem', fontWeight: 700, borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <EyeOff size={12} /> OCULTO
                          </span>
                        )}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <Link href={`/merchant/products/edit/${p.id}`} className={styles.viewBtn} style={{ padding: '8px' }} title="Editar">
                          <Edit size={16} />
                        </Link>
                        <button 
                          className={styles.clearBtn} 
                          style={{ padding: '8px' }}
                          onClick={() => handleDelete(p.id, p.name)}
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ padding: '80px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    <Package size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
                    <p>No tienes productos que coincidan con la búsqueda.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <StatusModal 
        isOpen={modal.isOpen}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={() => setModal({ ...modal, isOpen: false })}
        onConfirm={modal.onConfirm}
      />
    </div>
  );
}
