'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  const { isMerchant, loading, userData } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isMerchant) {
      router.push('/');
    }
  }, [isMerchant, loading, router]);

  if (loading || !isMerchant) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--bg-primary)'
      }}>
        <Loader2 className="spin" size={40} color="var(--brand-accent)" />
        <p style={{ marginTop: '20px', color: 'var(--text-tertiary)' }}>Verificando credenciales de socio...</p>
      </div>
    );
  }

  return (
    <div className="merchant-area animate">
      {children}
    </div>
  );
}
