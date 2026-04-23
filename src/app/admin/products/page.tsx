'use client';

import { useEffect, useState } from 'react';
import { getProducts, deleteProduct, updateProductStatus, Product, subscribeToAllProducts } from '@/lib/services/products';
import { Plus, Trash2, Loader2, ArrowLeft, Package, AlertCircle, Eye, EyeOff, Pencil, Search, X } from 'lucide-react';
import { getCategories } from '@/lib/services/categories';
import StatusModal, { ModalType } from '@/components/common/StatusModal';
import Link from 'next/link';
import styles from '../admin.module.css';

const getStockStatus = (stock: number, minStock: number) => {
  if (stock <= 0) return { label: 'Agotado', color: 'var(--status-error)' };
  if (stock <= minStock) return { label: 'Bajo Stock', color: 'var(--status-warning)' };
  return { label: 'Disponible', color: 'var(--status-success)' };
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: ''
  });
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

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToAllProducts((data) => {
      setProducts(data);
      setLoading(false);
    });

    const loadCategories = async () => {
      const data = await getCategories();
      setCategories(data.map(c => c.name));
    };
    loadCategories();

    return () => unsubscribe();
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                         product.category.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesCategory = !filters.category || product.category === filters.category;
    
    const isVisible = product.isActive !== false;
    const stockStatus = getStockStatus(product.stock, product.minStock || 0);
    
    let matchesStatus = true;
    if (filters.status === 'out') matchesStatus = product.stock <= 0 && isVisible;
    else if (filters.status === 'low') matchesStatus = product.stock > 0 && product.stock <= (product.minStock || 0) && isVisible;
    else if (filters.status === 'available') matchesStatus = product.stock > (product.minStock || 0) && isVisible;
    else if (filters.status === 'inactive') matchesStatus = !isVisible;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleDelete = (id: string, name: string) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Eliminar Producto',
      message: `¿Estás seguro de que quieres eliminar "${name}" del inventario de excelencia? Esta acción es irreversible.`,
      onConfirm: async () => {
        const success = await deleteProduct(id);
        if (success) {
          setModal({
            isOpen: true,
            type: 'success',
            title: 'Eliminado',
            message: 'El producto ha sido removido exitosamente.'
          });
        } else {
          setModal({
            isOpen: true,
            type: 'error',
            title: 'Error',
            message: 'No se pudo eliminar el producto. Intenta de nuevo.'
          });
        }
      }
    });
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean | undefined) => {
    const newStatus = currentStatus === false ? true : false;
    const success = await updateProductStatus(id, newStatus);
    if (!success) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error de Estado',
        message: 'No se pudo cambiar la visibilidad del producto.'
      });
    }
  };


  return (
    <div className={`${styles.adminPage} container`}>
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/admin" className={styles.viewBtn}>
            <ArrowLeft size={18} />
          </Link>
          <h1>Inventario <span className={styles.accent}>Elite</span></h1>
        </div>
        <Link href="/admin/products/new" className={styles.approveBtn}>
          <Plus size={16} /> Nuevo Producto
        </Link>
      </header>

      {/* Filter Panel */}
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <label>Buscar Producto</label>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input 
              type="text" 
              className={styles.filterInput}
              style={{ paddingLeft: '40px', width: '100%' }}
              placeholder="Nombre o categoría..."
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
        </div>

        <div className={styles.filterGroup}>
          <label>Categoría</label>
          <select 
            className={styles.filterSelect}
            value={filters.category}
            onChange={e => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="">Todas las Categorías</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Estado de Stock</label>
          <select 
            className={styles.filterSelect}
            value={filters.status}
            onChange={e => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">Todos los Estados</option>
            <option value="available">Disponible</option>
            <option value="low">Bajo Stock</option>
            <option value="out">Agotado</option>
            <option value="inactive">Inactivos (Ocultos)</option>
          </select>
        </div>

        {(filters.search || filters.category || filters.status) && (
          <button 
            className={styles.clearBtn}
            onClick={() => setFilters({ search: '', category: '', status: '' })}
          >
            <X size={14} style={{ marginRight: '8px' }} /> Limpiar
          </button>
        )}
      </div>

      <div className={styles.tableContainer}>
        {loading ? (
          <div style={{ padding: '100px', textAlign: 'center' }}>
            <Loader2 className="spin" size={40} />
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Costo</th>
                <th>Venta</th>
                <th>Stock</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '100px', color: 'var(--text-tertiary)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                      <Search size={40} opacity={0.2} />
                      <p>No se encontraron productos con los filtros actuales.</p>
                      {(filters.search || filters.category || filters.status) && (
                        <button 
                          onClick={() => setFilters({ search: '', category: '', status: '' })}
                          style={{ color: 'var(--brand-accent)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          Limpiar todos los filtros
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => {
                  const status = getStockStatus(product.stock, product.minStock || 0);
                  const isVisible = product.isActive !== false;
                  
                  return (
                    <tr key={product.id} style={{ opacity: isVisible ? 1 : 0.5, transition: 'opacity 0.3s' }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ 
                            width: '40px', 
                            height: '40px', 
                            background: 'var(--bg-tertiary)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            filter: isVisible ? 'none' : 'grayscale(1)' 
                          }}>
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <Package size={16} color="var(--text-tertiary)" />
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <Link href={`/admin/products/edit/${product.id}`} className={styles.productLink} style={{ fontWeight: 600 }}>
                              {product.name}
                            </Link>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                              Registro: {product.createdAt?.toDate().toLocaleDateString()}
                              {product.updatedAt && ` | Editado: ${product.updatedAt.toDate().toLocaleDateString()}`}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-tertiary)' }}>{product.category}</td>
                      <td style={{ fontSize: '0.85rem' }}>₡{(product.cost || 0).toLocaleString()}</td>
                      <td style={{ fontWeight: 700 }}>₡{product.price.toLocaleString()}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {product.stock}
                          {product.stock <= (product.minStock || 0) && <AlertCircle size={14} color={status.color} />}
                        </div>
                      </td>
                      <td>
                        <span style={{ 
                          fontSize: '0.7rem', 
                          textTransform: 'uppercase', 
                          fontWeight: 700, 
                          color: isVisible ? status.color : 'var(--text-tertiary)',
                          border: `1px solid ${isVisible ? status.color : 'var(--border)'}`,
                          padding: '2px 6px'
                        }}>
                          {isVisible ? status.label : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button 
                            className={styles.viewBtn} 
                            style={{ border: 'none', color: isVisible ? 'var(--brand-accent)' : 'var(--text-tertiary)' }}
                            onClick={() => handleToggleStatus(product.id, product.isActive)}
                            title={isVisible ? "Desactivar" : "Activar"}
                          >
                            {isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                          </button>
                          <Link 
                            href={`/admin/products/edit/${product.id}`}
                            className={styles.viewBtn} 
                            style={{ border: 'none', color: 'var(--text-secondary)' }}
                            title="Editar"
                          >
                            <Pencil size={18} />
                          </Link>
                          <button 
                            className={styles.viewBtn} 
                            style={{ border: 'none', color: 'var(--status-error)' }}
                            onClick={() => handleDelete(product.id, product.name)}
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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
        confirmText="Confirmar Eliminación"
        cancelText="Volver"
      />
    </div>
  );
}
