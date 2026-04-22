'use client';

import { useEffect, useState } from 'react';
import { getAllUsers, updateUserRole, UserProfile } from '@/lib/services/users';
import { Users, Shield, User as UserIcon, Loader2, ArrowLeft, Mail, Calendar } from 'lucide-react';
import StatusModal from '@/components/common/StatusModal';
import Link from 'next/link';
import styles from '../admin.module.css';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ 
    isOpen: false, 
    type: 'info' as any, 
    title: '', 
    message: '',
    onConfirm: undefined as (() => void) | undefined
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

  const handleRoleChange = (uid: string, currentRole: string, email: string) => {
    const newRole = currentRole === 'admin' ? 'client' : 'admin';
    const action = newRole === 'admin' ? 'ASCENDER a Administrador' : 'DEGRADAR a Cliente';

    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Cambio de Rango',
      message: `¿Estás seguro de que deseas ${action} al usuario ${email}?`,
      onConfirm: async () => {
        const success = await updateUserRole(uid, newRole);
        if (success) {
          setModal({
            isOpen: true,
            type: 'success',
            title: 'Rango Actualizado',
            message: `El usuario ahora tiene el rol de ${newRole === 'admin' ? 'Administrador' : 'Cliente'}.`
          });
          fetchUsers();
        } else {
          setModal({
            isOpen: true,
            type: 'error',
            title: 'Error',
            message: 'No tienes permisos suficientes o hubo un error de red.'
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
                <th>ID Cliente</th>
                <th>Acciones</th>
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
                      <span style={{ fontWeight: 600 }}>{user.displayName || 'Sin Nombre'}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                      <Mail size={14} />
                      {user.email}
                    </div>
                  </td>
                  <td>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      textTransform: 'uppercase', 
                      fontWeight: 700, 
                      color: user.role === 'admin' ? 'var(--brand-accent)' : 'var(--text-tertiary)',
                      background: user.role === 'admin' ? 'rgba(197, 160, 89, 0.1)' : 'transparent',
                      padding: '4px 8px',
                      border: `1px solid ${user.role === 'admin' ? 'var(--brand-accent)' : 'var(--border)'}`
                    }}>
                      {user.role === 'admin' ? 'Administrador' : 'Cliente'}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                    {user.uid.slice(0, 8)}...
                  </td>
                  <td>
                    <button 
                      className={styles.viewBtn} 
                      style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                      onClick={() => handleRoleChange(user.uid, user.role, user.email)}
                    >
                      {user.role === 'admin' ? 'Degradar' : 'Hacer Admin'}
                    </button>
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
