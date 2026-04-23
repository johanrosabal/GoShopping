'use client';

import { useState, useEffect } from 'react';
import { getCategories, addCategory, updateCategory, deleteCategory, Category, checkCategoryProducts } from '@/lib/services/categories';
import { Plus, Trash2, Edit2, Save, X, Image as ImageIcon, CheckCircle, Loader2, ArrowLeft, Star } from 'lucide-react';
import Link from 'next/link';
import StatusModal, { ModalType } from '@/components/common/StatusModal';
import styles from '../admin.module.css';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [reassigning, setReassigning] = useState<{ id: string, name: string } | null>(null);
  const [reassignTo, setReassignTo] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    displayTitle: '',
    isPremium: false
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: ModalType;
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({ 
    isOpen: false, 
    type: 'success', 
    title: '', 
    message: '' 
  });

  const fetchCats = async () => {
    setLoading(true);
    const data = await getCategories();
    setCategories(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCats();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const resetForm = () => {
    setIsEditing(null);
    setFormData({ name: '', tagline: '', displayTitle: '', isPremium: false });
    setSelectedFile(null);
    setPreview(null);
  };

  const handleEdit = (cat: Category) => {
    setIsEditing(cat.id);
    setFormData({
      name: cat.name,
      tagline: cat.tagline || '',
      displayTitle: cat.displayTitle || cat.name,
      isPremium: cat.isPremium || false
    });
    setPreview(cat.imageUrl || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEditing) {
        await updateCategory(isEditing, formData, selectedFile || undefined);
      } else {
        await addCategory(formData.name, formData, selectedFile || undefined);
      }
      resetForm();
      fetchCats();
      setModal({
        isOpen: true,
        type: 'success',
        title: 'Éxito',
        message: 'Categoría actualizada correctamente.'
      });
    } catch (error) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudo guardar la categoría.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSeedElite = async () => {
    setSaving(true);
    try {
      const eliteCats = [
        { name: 'Edición Limitada', tagline: 'Piezas Únicas', displayTitle: 'Exclusive Edition', isPremium: true },
        { name: 'Calzado de Autor', tagline: 'Diseño Superior', displayTitle: 'Designer Footwear', isPremium: true },
        { name: 'Marroquinería', tagline: 'Piel Fina', displayTitle: 'Luxury Leather', isPremium: false },
        { name: 'Cuidado Personal', tagline: 'Imperial Grooming', displayTitle: 'Elite Personal Care', isPremium: false },
        { name: 'Audio Hi-Fi', tagline: 'Sonic Excellence', displayTitle: 'High-Fidelity Audio', isPremium: true },
        { name: 'Joyería Fina', tagline: 'Signature Gems', displayTitle: 'Gems & Watches', isPremium: false },
        { name: 'Gourmet Reserva', tagline: 'Sabores del Mundo', displayTitle: 'Reserve Experience', isPremium: false },
        { name: 'Mobiliario Art', tagline: 'Curated Decor', displayTitle: 'Signature Living', isPremium: true }
      ];

      for (const cat of eliteCats) {
        // Simple check to avoid duplicates by name
        if (!categories.find(c => c.name.toLowerCase() === cat.name.toLowerCase())) {
          await addCategory(cat.name, cat);
        }
      }

      fetchCats();
      setModal({
        isOpen: true,
        type: 'success',
        title: 'Expansión Completada',
        message: 'Se han integrado las nuevas colecciones Elite a tu catálogo.'
      });
    } catch (error) {
      console.error(error);
      setModal({ isOpen: true, type: 'error', title: 'Error', message: 'Hubo un problema al expandir las colecciones.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (cat: Category) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Eliminar Categoría',
      message: `¿Estás seguro de eliminar "${cat.name}"? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        try {
          const result = await deleteCategory(cat.id, cat.name);
          if (!result.success && result.requiresReassignment) {
            setReassigning({ id: cat.id, name: cat.name });
            setReassignTo(categories.find(c => c.id !== cat.id)?.name || '');
          } else {
            fetchCats();
            setModal({ isOpen: true, type: 'success', title: 'Eliminado', message: 'Categoría eliminada de la base Elite.' });
          }
        } catch (error: any) {
          setModal({ isOpen: true, type: 'error', title: 'Error', message: error.message });
        }
      }
    });
  };

  const handleApplyReassignment = async () => {
    if (!reassigning || !reassignTo) return;
    setSaving(true);
    try {
      await deleteCategory(reassigning.id, reassigning.name, reassignTo);
      setReassigning(null);
      setReassignTo('');
      fetchCats();
      setModal({ isOpen: true, type: 'success', title: 'Migración Exitosa', message: `Los productos han sido movidos a "${reassignTo}" y la categoría ha sido eliminada.` });
    } catch (error: any) {
      setModal({ isOpen: true, type: 'error', title: 'Error en Migración', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`${styles.adminPage} container animate`}>
      <header className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/admin" className={styles.viewBtn}>
            <ArrowLeft size={18} />
          </Link>
          <h1 style={{ margin: 0 }}>Gestión de <span className={styles.accent}>Categorías</span></h1>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            className={styles.viewBtn} 
            onClick={handleSeedElite}
            disabled={saving}
            style={{ height: '44px', display: 'flex', alignItems: 'center', gap: '8px' }}
            title="Añadir automáticamente categorías de lujo sugeridas"
          >
            <Star size={16} color="var(--brand-accent)" /> Poblar Elite
          </button>
        </div>
      </header>

      <div className={styles.tableContainer} style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', padding: '0', background: 'transparent', border: 'none', marginTop: '32px', alignItems: 'start' }}>
        {/* List */}
        <div className={styles.tableContainer} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', margin: 0 }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Vista Previa</th>
                <th>Nombre / Tagline</th>
                <th>Home</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id}>
                  <td style={{ width: '80px' }}>
                    <div style={{ width: '60px', height: '60px', background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                      {cat.imageUrl ? (
                        <img src={cat.imageUrl} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.2 }}>
                          <ImageIcon size={20} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{cat.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--brand-accent)', textTransform: 'uppercase' }}>{cat.tagline || '---'}</div>
                  </td>
                  <td>
                    {cat.isPremium && <Star size={16} color="var(--brand-accent)" fill="var(--brand-accent)" />}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className={styles.viewBtn} style={{ padding: '8px' }} onClick={() => handleEdit(cat)}>
                        <Edit2 size={14} />
                      </button>
                      <button className={styles.clearBtn} style={{ padding: '8px' }} onClick={() => handleDelete(cat)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {loading && <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="spin" /></td></tr>}
            </tbody>
          </table>
        </div>

        {/* Form */}
        <div className={styles.tableContainer} style={{ padding: '32px', position: 'sticky', top: '20px', height: 'fit-content', margin: 0 }}>
          <h3 style={{ marginBottom: '24px', fontSize: '1.1rem' }}>
            {isEditing ? 'Editar Colección' : 'Crear Nueva Colección'}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
            <div className={styles.filterGroup}>
              <label>Nombre Interno</label>
              <input 
                type="text" 
                className={styles.filterInput}
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className={styles.filterGroup}>
              <label>Tagline (Home)</label>
              <input 
                type="text" 
                className={styles.filterInput}
                value={formData.tagline}
                onChange={e => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="Ej: Executive Tech"
              />
            </div>
            <div className={styles.filterGroup}>
              <label>Título Visual (Home)</label>
              <input 
                type="text" 
                className={styles.filterInput}
                value={formData.displayTitle}
                onChange={e => setFormData({ ...formData, displayTitle: e.target.value })}
                placeholder="Ej: Vanguardia Digital"
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input 
                type="checkbox" 
                id="isPremium"
                checked={formData.isPremium}
                onChange={e => setFormData({ ...formData, isPremium: e.target.checked })}
              />
              <label htmlFor="isPremium" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>Destacar en Home (Sección Premium)</label>
            </div>

            <div className={styles.filterGroup}>
              <label>Imagen de Referencia</label>
              <div 
                onClick={() => document.getElementById('catImg')?.click()}
                style={{ 
                  height: '150px', 
                  border: '1px dashed var(--border)', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  background: 'var(--bg-tertiary)',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {preview ? (
                  <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <>
                    <ImageIcon size={32} color="var(--text-tertiary)" />
                    <span style={{ fontSize: '0.7rem', marginTop: '10px', color: 'var(--text-tertiary)' }}>Click para subir imagen</span>
                  </>
                )}
                <input id="catImg" type="file" hidden accept="image/*" onChange={handleFileChange} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button 
                type="submit" 
                className={styles.approveBtn} 
                style={{ flex: 1 }}
                disabled={saving}
              >
                {saving ? <Loader2 className="spin" size={18} /> : isEditing ? 'Actualizar' : 'Crear'}
              </button>
              <button 
                type="button" 
                className={styles.clearBtn} 
                onClick={resetForm}
                style={{ 
                  flex: '0.6', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--text-tertiary)',
                  borderRadius: '0',
                  fontSize: '0.9rem'
                }}
              >
                {isEditing ? 'Cancelar' : 'Limpiar'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <StatusModal 
        isOpen={modal.isOpen}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={() => setModal({ ...modal, isOpen: false })}
        onConfirm={modal.onConfirm}
      />

      {/* Reassign Modal Overlay */}
      {reassigning && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className={styles.tableContainer} style={{ width: '100%', maxWidth: '450px', padding: '40px', textAlign: 'center' }}>
            <div style={{ background: 'rgba(197, 160, 89, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Star size={32} color="var(--brand-accent)" />
            </div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '16px' }}>Reasignar Productos</h2>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '24px' }}>
              La categoría <b style={{ color: 'var(--text-primary)' }}>"{reassigning.name}"</b> tiene productos activos. 
              Selecciona una colección de destino para moverlos antes de eliminarla:
            </p>
            
            <div className={styles.filterGroup} style={{ textAlign: 'left', marginBottom: '32px' }}>
              <label>Colección de Destino</label>
              <select 
                className={styles.filterInput}
                value={reassignTo}
                onChange={e => setReassignTo(e.target.value)}
                style={{ width: '100%', cursor: 'pointer' }}
              >
                {categories.filter(c => c.id !== reassigning.id).map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={handleApplyReassignment}
                className={styles.approveBtn}
                style={{ flex: 2 }}
                disabled={saving || !reassignTo}
              >
                {saving ? <Loader2 className="spin" size={18} /> : 'Confirmar Migración'}
              </button>
              <button 
                onClick={() => setReassigning(null)}
                className={styles.clearBtn}
                style={{ flex: 1, background: 'transparent', border: '1px solid var(--border)', borderRadius: 0 }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
