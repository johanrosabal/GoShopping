'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Plus, Camera, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { addProduct } from '@/lib/services/products';
import { getCategories } from '@/lib/services/categories';
import RichTextEditor from '@/components/admin/RichTextEditor';
import StatusModal from '@/components/common/StatusModal';
import Link from 'next/link';
import styles from '../../admin.module.css';

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [images, setImages] = useState<{file: File, preview: string}[]>([]);
  const [video, setVideo] = useState<{file: File, preview: string} | null>(null);
  const [modal, setModal] = useState({ 
    isOpen: false, 
    type: 'success' as any, 
    title: '', 
    message: '' 
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '10',
    minStock: '3',
    cost: '',
    taxPercentage: '13',
    featured: false,
    onSale: false,
    salePrice: '',
    saleStartsAt: '',
    saleExpiresAt: '',
    discountType: 'amount',
    discountPercent: ''
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

  const handleVideoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideo({ file, preview: URL.createObjectURL(file) });
    }
  };

  const removeVideo = () => {
    setVideo(null);
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

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    setFormData({ ...formData, price: rawValue });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) {
      setModal({
        isOpen: true,
        type: 'warning',
        title: 'Faltan Imágenes',
        message: 'Por favor, añade al menos una imagen del producto para continuar.'
      });
      return;
    }
    setLoading(true);

    try {
      await addProduct({
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price) / 100,
        cost: parseFloat(formData.cost) / 100,
        taxPercentage: parseFloat(formData.taxPercentage),
        category: formData.category,
        stock: parseInt(formData.stock),
        minStock: parseInt(formData.minStock),
        featured: formData.featured,
        onSale: formData.onSale,
        salePrice: parseFloat(formData.salePrice) / 100,
        saleStartsAt: formData.saleStartsAt,
        saleExpiresAt: formData.saleExpiresAt
      }, 
      images.map(img => img.file), 
      video?.file || undefined
      );

      setSuccess(true);
      setTimeout(() => router.push('/admin'), 3000);
    } catch (error) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error de Registro',
        message: 'Hubo un problema al registrar el producto en el sistema de excelencia. Por favor, intenta de nuevo.'
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modal} style={{ maxWidth: '400px', textAlign: 'center', padding: '40px' }}>
          <CheckCircle size={60} color="var(--brand-accent)" style={{ margin: '0 auto 20px' }} />
          <h2 style={{ marginBottom: '12px' }}>¡Producto Registrado!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>El nuevo artículo ya está disponible en el catálogo de excelencia.</p>
          <button onClick={() => router.push('/catalog')} className={styles.approveBtn}>Ver en Catálogo</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.adminPage} container`}>
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/admin" className={styles.viewBtn}>
            <ArrowLeft size={18} />
          </Link>
          <h1>Nuevo <span className={styles.accent}>Producto</span></h1>
        </div>
      </header>

      <div className={styles.tableContainer} style={{ padding: '40px' }}>
        <form className={styles.modalContent} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '40px', padding: 0 }} onSubmit={handleSubmit}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
            <div className={styles.orderSection}>
              <h3 style={{ marginBottom: '24px' }}>Información Básica</h3>
              
              <div className={styles.formGroup} style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>Nombre del Producto</label>
                <input 
                  type="text" 
                  placeholder="Ej: Elite Ultra Watch v5" 
                  style={{ width: '100%', padding: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '0', color: 'var(--text-primary)' }}
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div className={styles.formGroup} style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>Descripción Detallada</label>
                <RichTextEditor 
                  value={formData.description}
                  onChange={val => setFormData({ ...formData, description: val })}
                  placeholder="Describe la excelencia de este producto con formato rico..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className={styles.formGroup}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>Costo (₡)</label>
                  <input 
                    type="text" 
                    placeholder="0" 
                    style={{ width: '100%', padding: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '0', color: 'var(--text-primary)' }}
                    value={formatPrice(formData.cost)}
                    onChange={e => setFormData({ ...formData, cost: e.target.value.replace(/\D/g, '') })}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>Precio Venta (₡)</label>
                  <input 
                    type="text" 
                    placeholder="0" 
                    style={{ width: '100%', padding: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '0', color: 'var(--text-primary)' }}
                    value={formatPrice(formData.price)}
                    onChange={handlePriceChange}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>Categoría</label>
                  <select 
                    style={{ width: '100%', padding: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '0', color: 'var(--text-primary)' }}
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    {categories.map(cat => <option key={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                <div className={styles.formGroup}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>Stock Inicial</label>
                  <input 
                    type="number" 
                    placeholder="Ej: 10" 
                    style={{ width: '100%', padding: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '0', color: 'var(--text-primary)' }}
                    value={formData.stock}
                    onChange={e => setFormData({...formData, stock: e.target.value})}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>Stock Mínimo</label>
                  <input 
                    type="number" 
                    placeholder="Ej: 3" 
                    style={{ width: '100%', padding: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '0', color: 'var(--text-primary)' }}
                    value={formData.minStock}
                    onChange={e => setFormData({...formData, minStock: e.target.value})}
                    required
                  />
                </div>
              </div>

               <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className={styles.formGroup}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>Impuesto IVA (%)</label>
                    <select 
                      style={{ width: '100%', padding: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '0', color: 'var(--text-primary)' }}
                      value={formData.taxPercentage}
                      onChange={e => setFormData({...formData, taxPercentage: e.target.value})}
                    >
                      <option value="0">Exento o No Sujeto (0%)</option>
                      <option value="1">Canasta Básica o Agrícola (1%)</option>
                      <option value="2">Medicamentos y Seguros (2%)</option>
                      <option value="4">Servicios de Salud y Boletos (4%)</option>
                      <option value="13">Tarifa General (13%)</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '24px' }}>
                    <input 
                      type="checkbox" 
                      id="featured" 
                      checked={formData.featured}
                      onChange={e => setFormData({...formData, featured: e.target.checked})}
                    />
                    <label htmlFor="featured" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>Producto Destacado</label>
                  </div>
               </div>

               {/* Financial Preview */}
               <div style={{ marginTop: '32px', padding: '20px', background: 'rgba(197, 160, 89, 0.05)', border: '1px solid var(--border)' }}>
                 <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--brand-accent)', marginBottom: '16px' }}>Proyección Financiera</h4>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                   <div>
                     <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Ganancia Estimada</span>
                     <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--status-success)' }}>
                       {(() => {
                         const price = parseFloat(formData.price) || 0;
                         const cost = parseFloat(formData.cost) || 0;
                         return `₡${((price - cost) / 100).toLocaleString()}`;
                       })()}
                     </div>
                   </div>
                   <div>
                     <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>IVA Incluido ({formData.taxPercentage}%)</span>
                     <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                       {(() => {
                         const tax = parseFloat(formData.taxPercentage) || 0;
                         if (tax === 0) return '₡0';
                         const price = parseFloat(formData.price) || 0;
                         return `₡${((price / 100) * (tax / 100)).toLocaleString()}`;
                       })()}
                     </div>
                   </div>
                 </div>
               </div>

               {/* Promotions Elite */}
               <div style={{ marginTop: '32px', padding: '20px', background: 'rgba(239, 68, 68, 0.03)', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="checkbox" 
                        id="onSale" 
                        checked={formData.onSale}
                        onChange={e => setFormData({ ...formData, onSale: e.target.checked })}
                      />
                      <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--status-error)', margin: 0 }}>Promoción Elite Activa</h4>
                    </div>
                    {formData.onSale && (
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button 
                          type="button"
                          onClick={() => setFormData({ ...formData, discountType: 'amount' })}
                          style={{ 
                            padding: '4px 10px', 
                            fontSize: '0.7rem', 
                            background: formData.discountType === 'amount' ? 'var(--brand-accent)' : 'transparent',
                            color: formData.discountType === 'amount' ? 'var(--bg-primary)' : 'var(--text-tertiary)',
                            border: '1px solid var(--border)',
                            cursor: 'pointer'
                          }}
                        >Monto Fijo</button>
                        <button 
                          type="button"
                          onClick={() => setFormData({ ...formData, discountType: 'percent' })}
                          style={{ 
                            padding: '4px 10px', 
                            fontSize: '0.7rem', 
                            background: formData.discountType === 'percent' ? 'var(--brand-accent)' : 'transparent',
                            color: formData.discountType === 'percent' ? 'var(--bg-primary)' : 'var(--text-tertiary)',
                            border: '1px solid var(--border)',
                            cursor: 'pointer'
                          }}
                        >Porcentaje %</button>
                      </div>
                    )}
                 </div>

                 {formData.onSale && (
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', animation: 'fadeIn 0.3s ease-out' }}>
                     {formData.discountType === 'amount' ? (
                       <div className={styles.formGroup}>
                         <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>Precio de Oferta (₡)</label>
                         <input 
                           type="text" 
                           style={{ width: '100%', padding: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '0', color: 'var(--text-primary)' }}
                           value={formatPrice(formData.salePrice)}
                           onChange={e => setFormData({ ...formData, salePrice: e.target.value.replace(/\D/g, '') })}
                           placeholder="0"
                         />
                       </div>
                     ) : (
                       <div className={styles.formGroup}>
                         <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>Descuento (%)</label>
                         <input 
                           type="number" 
                           max="99"
                           min="1"
                           style={{ width: '100%', padding: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '0', color: 'var(--text-primary)' }}
                           value={formData.discountPercent}
                           onChange={e => {
                             const percent = e.target.value;
                             const basePrice = parseFloat(formData.price) || 0;
                             const newSalePrice = basePrice * (1 - (parseFloat(percent) || 0) / 100);
                             setFormData({ 
                               ...formData, 
                               discountPercent: percent, 
                               salePrice: Math.round(newSalePrice).toString() 
                             });
                           }}
                           placeholder="Ej: 20"
                         />
                       </div>
                     )}
                     <div className={styles.formGroup}>
                       <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>Inicia el día</label>
                       <input 
                         type="date" 
                         style={{ width: '100%', padding: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '0', color: 'var(--text-primary)' }}
                         value={formData.saleStartsAt}
                         onChange={e => setFormData({ ...formData, saleStartsAt: e.target.value })}
                       />
                     </div>
                     <div className={styles.formGroup}>
                       <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>Vence el día</label>
                       <input 
                         type="date" 
                         style={{ width: '100%', padding: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '0', color: 'var(--text-primary)' }}
                         value={formData.saleExpiresAt}
                         onChange={e => setFormData({ ...formData, saleExpiresAt: e.target.value })}
                         min={formData.saleStartsAt || new Date().toISOString().split('T')[0]}
                       />
                     </div>
                     {parseFloat(formData.price) > 0 && parseFloat(formData.salePrice) > 0 && (
                       <div style={{ gridColumn: 'span 2', padding: '12px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '4px' }}>
                         <div style={{ fontSize: '0.8rem', color: 'var(--status-error)', fontWeight: 600 }}>
                           Valor Promocional: ₡{(parseFloat(formData.salePrice)/100).toLocaleString()} 
                           {formData.discountType === 'amount' && ` (${Math.round((1 - (parseFloat(formData.salePrice) / parseFloat(formData.price))) * 100)}% de ahorro)`}
                           {formData.discountType === 'percent' && ` (${formData.discountPercent}% de ahorro aplicado)`}
                         </div>
                       </div>
                     )}
                   </div>
                 )}
               </div>
            </div>

            <div className={styles.orderSection}>
              <h3 style={{ marginBottom: '24px' }}>Galería de Imágenes (Máx 5)</h3>
              <div className={styles.galleryGrid}>
                {images.map((img, idx) => (
                  <div key={idx} className={styles.mediaSlot}>
                    <img src={img.preview} alt="Preview" />
                    <button type="button" className={styles.removeMedia} onClick={() => removeImage(idx)}>
                      <Plus size={14} style={{ transform: 'rotate(45deg)' }} />
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <label className={styles.mediaSlot}>
                    <input type="file" hidden accept="image/*" onChange={handleImageAdd} />
                    <Camera size={24} color="var(--text-tertiary)" />
                    <span style={{ fontSize: '0.7rem', marginTop: '4px' }}>{images.length}/5 Fotos</span>
                  </label>
                )}
              </div>

              <h3 style={{ marginTop: '32px', marginBottom: '24px' }}>Video de Muestra (1)</h3>
              <div className={`${styles.galleryGrid} ${styles.videoGrid}`}>
                {video ? (
                  <div className={`${styles.mediaSlot} ${styles.videoSlot}`}>
                    <video src={video.preview} controls />
                    <button type="button" className={styles.removeMedia} onClick={removeVideo}>
                      <Plus size={14} style={{ transform: 'rotate(45deg)' }} />
                    </button>
                  </div>
                ) : (
                  <label className={`${styles.mediaSlot} ${styles.videoSlot}`}>
                    <input type="file" hidden accept="video/*" onChange={handleVideoAdd} />
                    <Upload size={24} color="var(--text-tertiary)" />
                    <span style={{ fontSize: '0.8rem', marginTop: '8px' }}>Subir Video Showcase</span>
                  </label>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', borderTop: '1px solid var(--border)', paddingTop: '40px' }}>
            <button 
              type="button" 
              className={styles.cancelBtn} 
              style={{ minWidth: '150px' }}
              onClick={() => router.push('/admin')}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className={styles.approveBtn} 
              style={{ minWidth: '300px' }}
              disabled={loading}
            >
              {loading ? (
                <><Loader2 className="spin" size={20} /> Subiendo Multimedia...</>
              ) : (
                <><CheckCircle size={18} /> Registrar y Publicar Producto</>
              )}
            </button>
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
