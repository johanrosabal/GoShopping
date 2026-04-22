'use client';

import { useState, useEffect } from 'react';
import { getCategories, addCategory, updateCategory, deleteCategory, Category } from '@/lib/services/categories';
import { Plus, Trash2, Edit2, Save, X, Image as ImageIcon, CheckCircle, Loader2, ArrowLeft, Star } from 'lucide-react';
import Link from 'next/link';
import StatusModal from '@/components/common/StatusModal';
import styles from '../admin.module.css';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    displayTitle: '',
    isPremium: false
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState({ 
    isOpen: false, 
    type: 'success' as any, 
    title: '', 
    message: '',
    onConfirm: undefined as (() => void) | undefined
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

  const handleDelete = (cat: Category) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Eliminar Categoría',
      message: `¿Estás seguro de eliminar "${cat.name}"? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        try {
          await deleteCategory(cat.id, cat.name);
          fetchCats();
          setModal({ isOpen: true, type: 'success', title: 'Eliminado', message: 'Categoría eliminada de la base Elite.' });
        } catch (error: any) {
          setModal({ isOpen: true, type: 'error', title: 'Error', message: error.message });
        }
      }
    });
  };

  return (
    <div className={`${styles.adminPage} container animate`}>
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/admin" className={styles.viewBtn}>
            <ArrowLeft size={18} />
          </Link>
          <h1>Gestión de <span className={styles.accent}>Categorías</span></h1>
        </div>
        <button className={styles.approveBtn} onClick={resetForm}>
          <Plus size={18} /> Nueva Colección
        </button>
      </header>

      <div className={styles.tableContainer} style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '32px', padding: '32px', background: 'transparent', border: 'none' }}>
        {/* List */}
        <div className={styles.tableContainer} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
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
        <div className={styles.tableContainer} style={{ padding: '32px', position: 'sticky', top: '20px', height: 'fit-content' }}>
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
              {isEditing && (
                <button 
                  type="button" 
                  className={styles.clearBtn} 
                  onClick={resetForm}
                  style={{ 
                    flex: '0.4', 
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
                  Cancelar
                </button>
              )}
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
    </div>
  );
}
