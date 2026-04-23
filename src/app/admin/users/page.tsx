'use client';

import { useEffect, useState } from 'react';
import { getAllUsers, updateUserRole, UserProfile, toggleUserStatus, deleteUser } from '@/lib/services/users';
import { Users, Shield, User as UserIcon, Loader2, ArrowLeft, Mail, Calendar, Power, Trash2, ShieldAlert, Lock, Unlock, Copy, Check } from 'lucide-react';
import StatusModal, { ModalType } from '@/components/common/StatusModal';
import Link from 'next/link';
import styles from '../admin.module.css';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
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

  const fetchUsers = async () => {
    setLoading(true);
    const data = await getAllUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyId = (uid: string) => {
    navigator.clipboard.writeText(uid);
    setCopiedId(uid);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleStatus = async (uid: string, currentStatus: boolean, email: string) => {
    const action = currentStatus === false ? 'ACTIVAR' : 'BLOQUEAR';
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Seguridad de Acceso',
      message: `¿Estás seguro de que deseas ${action} el acceso de ${email}?`,
      onConfirm: async () => {
        const success = await toggleUserStatus(uid, currentStatus);
        if (success) {
          setModal({ isOpen: true, type: 'success', title: 'Estado Actualizado', message: 'Los permisos de acceso han sido modificados.' });
          fetchUsers();
        }
      }
    });
  };

  const handleDeleteUser = (uid: string, email: string) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Eliminar Usuario',
      message: `¿Estás seguro de eliminar permanentemente a ${email}? Esta acción fallará si el usuario tiene pedidos registrados.`,
      onConfirm: async () => {
        try {
          await deleteUser(uid);
          setModal({ isOpen: true, type: 'success', title: 'Usuario Eliminado', message: 'La cuenta ha sido removida del sistema Elite.' });
          fetchUsers();
        } catch (error: any) {
          setModal({ isOpen: true, type: 'error', title: 'Restricción de Seguridad', message: error.message });
        }
      }
    });
  };

  const handleRoleChange = (uid: string, newRole: UserProfile['role'], email: string) => {
    const roleLabels: Record<string, string> = {
      admin: 'Administrador',
      vendedor: 'Vendedor',
      client: 'Cliente',
      agent: 'Agente Promotor',
      merchant_admin: 'Admin Comercio',
      merchant_seller: 'Vendedor Comercio'
    };

    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Cambio de Rango',
      message: `¿Estás seguro de que deseas cambiar a ${email} al rango de ${roleLabels[newRole]}?`,
      onConfirm: async () => {
        const success = await updateUserRole(uid, newRole);
        if (success) {
          setModal({
            isOpen: true,
            type: 'success',
            title: 'Rango Actualizado',
            message: `El usuario ahora tiene el rango de ${roleLabels[newRole]}.`
          });
          fetchUsers();
        } else {
          setModal({
            isOpen: true,
            type: 'error',
            title: 'Error',
            message: 'No se pudo actualizar el rango.'
          });
        }
      }
    });
  };

  return (
    <div className={`${styles.adminPage} container`}>
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/admin" className={styles.viewBtn}>
            <ArrowLeft size={18} />
          </Link>
          <h1>Directorio <span className={styles.accent}>Elite</span></h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-tertiary)' }}>
          <Users size={18} />
          <span>{users.length} Miembros Registrados</span>
        </div>
      </header>

      <div className={styles.tableContainer}>
        {loading ? (
          <div style={{ padding: '100px', textAlign: 'center' }}>
            <Loader2 className="spin" size={40} />
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Rol</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.uid}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '36px', 
                        height: '36px', 
                        background: user.role === 'admin' ? 'rgba(197, 160, 89, 0.2)' : 'var(--bg-tertiary)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: user.role === 'admin' ? 'var(--brand-accent)' : 'var(--text-tertiary)'
                      }}>
                        {user.role === 'admin' ? <Shield size={18} /> : <UserIcon size={18} />}
                      </div>
                      <Link 
                        href={`/admin/users/${user.uid}`}
                        className={styles.accent}
                        style={{ fontWeight: 600, textDecoration: 'none', transition: '0.2s opacity' }}
                        onMouseOver={(e) => e.currentTarget.style.opacity = '0.7'}
                        onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                      >
                        {user.displayName || 'Sin Nombre'}
                      </Link>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                      <Mail size={14} />
                      {user.email}
                    </div>
                  </td>
                  <td style={{ minWidth: '160px' }}>
                    <select 
                      className={styles.filterInput}
                      style={{ 
                        fontSize: '0.8rem', 
                        padding: '6px 12px', 
                        width: 'auto',
                        background: user.role === 'admin' ? 'rgba(197, 160, 89, 0.1)' : user.role === 'vendedor' ? 'rgba(52, 152, 219, 0.1)' : 'var(--bg-tertiary)',
                        color: user.role === 'admin' ? 'var(--brand-accent)' : user.role === 'vendedor' ? '#3498db' : 'var(--text-tertiary)',
                        border: `1px solid ${user.role === 'admin' ? 'var(--brand-accent)' : user.role === 'vendedor' ? '#3498db' : 'var(--border)'}`,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.uid, e.target.value as any, user.email)}
                    >
                      <option value="client">Cliente</option>
                      <option value="vendedor">Vendedor</option>
                      <option value="admin">Administrador</option>
                      <option value="agent">Agente Promotor</option>
                      <option value="merchant_admin">Admin Comercio</option>
                      <option value="merchant_seller">Vendedor Comercio</option>
                    </select>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button 
                        className={styles.viewBtn} 
                        style={{ padding: '8px', color: 'var(--brand-accent)' }}
                        onClick={() => handleCopyId(user.uid)}
                        title="Copiar ID de Cliente"
                      >
                        {copiedId === user.uid ? <Check size={14} color="#2ecc71" /> : <Copy size={14} />}
                      </button>
                      <button 
                        className={styles.viewBtn} 
                        style={{ 
                          padding: '8px', 
                          color: user.isActive === false ? '#e74c3c' : '#2ecc71',
                          borderColor: user.isActive === false ? 'rgba(231, 76, 60, 0.3)' : 'rgba(46, 204, 113, 0.3)'
                        }}
                        onClick={() => handleToggleStatus(user.uid, user.isActive !== false, user.email)}
                        title={user.isActive === false ? 'Activar Usuario' : 'Bloquear Usuario'}
                      >
                        {user.isActive === false ? <Unlock size={14} /> : <Lock size={14} />}
                      </button>
                      <button 
                        className={styles.clearBtn} 
                        style={{ padding: '8px' }}
                        onClick={() => handleDeleteUser(user.uid, user.email)}
                        title="Eliminar Usuario (Solo sin pedidos)"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
        confirmText="Confirmar Cambio"
        cancelText="Volver"
      />
    </div>
  );
}
