'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ShieldAlert, Loader2 } from 'lucide-react';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdmin) {
      // Redirect to home if not admin
      router.push('/');
    }
  }, [isAdmin, loading, router]);

  if (loading) {
    return (
      <div style={{ height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
        <Loader2 className="spin" size={48} color="var(--brand-accent)" />
        <p style={{ color: 'var(--text-tertiary)', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.8rem' }}>
          Verificando Credenciales Elite...
        </p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
        <ShieldAlert size={60} color="var(--status-error)" />
        <h2 style={{ fontSize: '1.5rem' }}>Acceso Restringido</h2>
        <p style={{ color: 'var(--text-tertiary)' }}>No tienes los privilegios necesarios para acceder a esta área.</p>
      </div>
    );
  }

  return <>{children}</>;
}
