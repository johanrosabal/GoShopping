'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, List, Loader2, CheckCircle } from 'lucide-react';
import { getShoppingLists, createShoppingList, addItemToShoppingList, ShoppingList } from '@/lib/services/shoppingLists';
import styles from './ListSelectionModal.module.css';

interface ListSelectionModalProps {
  productId: string;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ListSelectionModal({ productId, userId, onClose, onSuccess }: ListSelectionModalProps) {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [newListName, setNewListName] = useState('');
  const [creating, setCreating] = useState(false);
  const [addingToListId, setAddingToListId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchLists = async () => {
      const data = await getShoppingLists(userId);
      setLists(data);
      setLoading(false);
    };
    fetchLists();
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [userId]);

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    setCreating(true);
    const listId = await createShoppingList(userId, newListName.trim());
    if (listId) {
      const newList: ShoppingList = {
        id: listId,
        userId,
        name: newListName.trim(),
        items: [],
        createdAt: new Date()
      };
      setLists([newList, ...lists]);
      setNewListName('');
    }
    setCreating(false);
  };

  const handleAddToList = async (listId: string) => {
    setAddingToListId(listId);
    const success = await addItemToShoppingList(listId, productId);
    if (success) {
      onSuccess();
      setTimeout(onClose, 1000);
    } else {
      setAddingToListId(null);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Guardar en <span style={{ color: 'var(--brand-accent)' }}>Mi Lista</span></h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Loader2 className="spin" size={32} color="var(--brand-accent)" />
              <p style={{ marginTop: '16px', fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>Recuperando tus listas privadas...</p>
            </div>
          ) : (
            <>
              <div className={styles.listGrid}>
                {lists.map(list => (
                  <div key={list.id} className={styles.listItem} onClick={() => !addingToListId && handleAddToList(list.id)}>
                    <div className={styles.listInfo}>
                      <span className={styles.listName}>{list.name}</span>
                      <span className={styles.itemCount}>{list.items.length} artículos guardados</span>
                    </div>
                    <div>
                      {addingToListId === list.id ? (
                        <Loader2 className="spin" size={18} color="var(--brand-accent)" />
                      ) : (
                        <Plus className={styles.addBtnIcon} size={18} />
                      )}
                    </div>
                  </div>
                ))}
                {lists.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-tertiary)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                    No tienes listas creadas aún. Crea la primera abajo.
                  </div>
                )}
              </div>

              <div className={styles.createSection}>
                <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Nueva Lista Elite</label>
                <div className={styles.inputGroup}>
                  <input 
                    type="text" 
                    className={styles.input} 
                    placeholder="Ej: Deseos de Aniversario" 
                    value={newListName}
                    onChange={e => setNewListName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreateList()}
                  />
                  <button className={styles.createBtn} onClick={handleCreateList} disabled={creating || !newListName.trim()}>
                    {creating ? <Loader2 className="spin" size={18} /> : 'Crear'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
