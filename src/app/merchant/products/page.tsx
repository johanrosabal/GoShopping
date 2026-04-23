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
import { useAuth } from '@/context/AuthContext';
import styles from '../../admin/admin.module.css';
import StatusModal, { ModalType } from '@/components/common/StatusModal';

export default function MerchantProductsPage() {
  const { userData } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: ModalType;
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({ isOpen: false, type: 'info', title: '', message: '' });

  const fetchProducts = async () => {
    if (!userData?.merchantId) return;
    setLoading(true);
    const data = await getProductsByMerchant(userData.merchantId);
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [userData]);

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const success = await updateProductStatus(id, !currentStatus);
    if (success) {
      fetchProducts();
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
          fetchProducts();
        }
      }
    });
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`${styles.adminPage} container animate`}>
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/merchant/dashboard" className={styles.viewBtn}>
            <ArrowLeft size={18} />
          </Link>
          <h1>Tu <span style={{ color: '#8b5cf6' }}>Inventario</span></h1>
        </div>
        <Link href="/merchant/products/new" className={styles.approveBtn} style={{ background: '#8b5cf6' }}>
          <Plus size={18} /> Nuevo Producto
        </Link>
      </header>

      {/* Filter Bar */}
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <label>Buscar en mi catálogo</label>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
            <input 
              type="text" 
              className={styles.filterInput}
              style={{ paddingLeft: '40px', width: '100%' }}
              placeholder="Nombre de producto o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        {loading ? (
          <div style={{ padding: '100px', textAlign: 'center' }}>
            <Loader2 className="spin" size={40} color="#8b5cf6" />
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
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
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
