'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Plus, Camera, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { addProduct } from '@/lib/services/products';
import { getCategories } from '@/lib/services/categories';
import RichTextEditor from '@/components/admin/RichTextEditor';
import StatusModal, { ModalType } from '@/components/common/StatusModal';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from '../../../admin/admin.module.css';

export default function MerchantNewProductPage() {
  const router = useRouter();
  const { userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [images, setImages] = useState<{file: File, preview: string}[]>([]);
  const [video, setVideo] = useState<{file: File, preview: string} | null>(null);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: ModalType;
    title: string;
    message: string;
  }>({ isOpen: false, type: 'success', title: '', message: '' });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '10',
    minStock: '3',
    featured: false
  });

  useEffect(() => {
    const fetchCats = async () => {
      const data = await getCategories();
      const names = data.map(c => c.name);
      setCategories(names);
      if (names.length > 0) {
        setFormData(prev => ({ ...prev, category: names[0] }));
      }
    };
    fetchCats();
  }, []);

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && images.length < 5) {
      setImages(prev => [...prev, { file, preview: URL.createObjectURL(file) }]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    setFormData({ ...formData, price: rawValue });
  };

  const formatPrice = (val: string) => {
    if (!val) return '';
    const num = val.replace(/\D/g, '');
    const amount = parseFloat(num) / 100;
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) {
      setModal({
        isOpen: true,
        type: 'warning',
        title: 'Faltan Imágenes',
        message: 'Por favor, añade al menos una imagen del producto.'
      });
      return;
    }
    
    if (!userData?.merchantId) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Sesión Inválida',
        message: 'No se pudo identificar tu comercio. Por favor, re-inicia sesión.'
      });
      return;
    }

    setLoading(true);

    try {
      await addProduct({
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price) / 100,
        category: formData.category,
        stock: parseInt(formData.stock),
        minStock: parseInt(formData.minStock),
        featured: formData.featured,
        merchantId: userData.merchantId, // AUTO-ASSIGN MERCHANT ID
        isActive: true,
        cost: 0, // Default for now
        taxPercentage: 13, // Default for now
      } as any, 
      images.map(img => img.file), 
      video?.file || undefined
      );

      setSuccess(true);
      setTimeout(() => router.push('/merchant/products'), 3000);
    } catch (error) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error de Registro',
        message: 'Hubo un problema al registrar el producto. Intenta de nuevo.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modal} style={{ maxWidth: '400px', textAlign: 'center', padding: '40px' }}>
          <CheckCircle size={60} color="#8b5cf6" style={{ margin: '0 auto 20px' }} />
          <h2 style={{ marginBottom: '12px' }}>¡Producto Publicado!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Tu artículo ya está disponible en tu vitrina digital.</p>
          <button onClick={() => router.push('/merchant/products')} className={styles.approveBtn} style={{ background: '#8b5cf6' }}>Volver al Inventario</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.adminPage} container animate`}>
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/merchant/products" className={styles.viewBtn}>
            <ArrowLeft size={18} />
          </Link>
          <h1>Publicar <span style={{ color: '#8b5cf6' }}>Nuevo Artículo</span></h1>
        </div>
      </header>

      <div className={styles.tableContainer} style={{ padding: '40px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: '40px' }}>
          
          <div className={styles.orderSection}>
            <h3 style={{ marginBottom: '24px', fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>Detalles del Producto</h3>
            
            <div className={styles.formGroup} style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Nombre Comercial</label>
              <input 
                type="text" 
                className={styles.filterInput}
                style={{ width: '100%' }}
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                required
                placeholder="Nombre impactante..."
              />
            </div>

            <div className={styles.formGroup} style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Descripción</label>
              <RichTextEditor 
                value={formData.description}
                onChange={val => setFormData({ ...formData, description: val })}
                placeholder="Cuenta la historia de tu producto..."
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className={styles.formGroup}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Precio Venta (₡)</label>
                <input 
                  type="text" 
                  className={styles.filterInput}
                  style={{ width: '100%' }}
                  value={formatPrice(formData.price)}
                  onChange={handlePriceChange}
                  required
                  placeholder="0.00"
                />
              </div>
              <div className={styles.formGroup}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Categoría</label>
                <select 
                  className={styles.filterSelect}
                  style={{ width: '100%' }}
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  {categories.map(cat => <option key={cat}>{cat}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Stock Disponible</label>
                <input 
                  type="number" 
                  className={styles.filterInput}
                  style={{ width: '100%' }}
                  value={formData.stock}
                  onChange={e => setFormData({...formData, stock: e.target.value})}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Stock de Alerta</label>
                <input 
                  type="number" 
                  className={styles.filterInput}
                  style={{ width: '100%' }}
                  value={formData.minStock}
                  onChange={e => setFormData({...formData, minStock: e.target.value})}
                  required
                />
              </div>
            </div>
          </div>

          <div className={styles.orderSection}>
            <h3 style={{ marginBottom: '24px', fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>Multimedia Elite</h3>
            
            <div className={styles.galleryGrid} style={{ marginBottom: '32px' }}>
                {/* Render up to 5 slots */}
                {[...Array(5)].map((_, idx) => {
                  const img = images[idx];
                  if (img) {
                    return (
                      <div key={idx} className={styles.mediaSlot}>
                        <img src={img.preview} alt="Preview" />
                        <button type="button" className={styles.removeMedia} onClick={() => removeImage(idx)}>
                          <Plus size={14} style={{ transform: 'rotate(45deg)' }} />
                        </button>
                      </div>
                    );
                  }
                  
                  const isNextUpload = idx === images.length;
                  return (
                    <label key={idx} className={`${styles.mediaSlot} ${!isNextUpload ? styles.emptySlot : ''}`}>
                      {isNextUpload ? (
                        <>
                          <input type="file" hidden accept="image/*" onChange={handleImageAdd} />
                          <Camera size={24} color="#8b5cf6" />
                          <span style={{ fontSize: '0.65rem', marginTop: '8px', fontWeight: 600 }}>Cargar</span>
                        </>
                      ) : (
                        <div style={{ opacity: 0.1 }}>
                           <Camera size={20} />
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '40px' }}>
                <button 
                  type="submit" 
                  className={styles.approveBtn} 
                  style={{ width: '100%', background: '#8b5cf6', padding: '20px' }}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="spin" size={20} /> : <CheckCircle size={20} />}
                  {loading ? 'Publicando...' : 'Publicar en mi Tienda'}
                </button>
              </div>
          </div>

        </form>
      </div>

      <StatusModal 
        isOpen={modal.isOpen}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={() => setModal({ ...modal, isOpen: false })}
      />
    </div>
  );
}
