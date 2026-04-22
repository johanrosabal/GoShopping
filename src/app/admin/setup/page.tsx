'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, doc, updateDoc, limit } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, ShieldCheck, Loader2 } from 'lucide-react';
import StatusModal from '@/components/common/StatusModal';
import { useRouter } from 'next/navigation';

export default function AdminSetupPage() {
  const { user, userData, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [canClaim, setCanClaim] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: 'info' as any, title: '', message: '' });
  const router = useRouter();

  useEffect(() => {
    const checkAdmins = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('role', '==', 'admin'), limit(1));
        const snapshot = await getDocs(q);
        
        // If no admins exist, any logged user can claim it
        setCanClaim(snapshot.empty);
      } catch (error) {
        console.error("Error checking admins:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) checkAdmins();
    else setLoading(false);
  }, [user]);

  const handleClaim = async () => {
    if (!user) return;
    setIsProcessing(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { role: 'admin' });
      setModal({
        isOpen: true,
        type: 'success',
        title: '¡Privilegios Concedidos!',
        message: 'Felicidades. Ahora tienes acceso total como Administrador de Go-Shopping.'
      });
      setTimeout(() => router.push('/admin'), 3000);
    } catch (error) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error de Sistema',
        message: 'No se pudieron reclamar los permisos. Intente de nuevo.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container" style={{ padding: '100px 20px', textAlign: 'center', maxWidth: '600px' }}>
      {loading ? (
        <Loader2 className="spin" size={40} />
      ) : isAdmin ? (
        <div>
          <ShieldCheck size={80} color="var(--brand-accent)" style={{ margin: '0 auto 20px' }} />
          <h1>Ya eres Administrador</h1>
          <p>Ya tienes acceso total al Panel de Control.</p>
          <button 
            onClick={() => router.push('/admin')} 
            className="confirmBtn" 
            style={{ marginTop: '24px', background: 'var(--brand-primary)', color: 'var(--bg-primary)', padding: '12px 24px', borderRadius: 'var(--radius-md)' }}
          >
            Ir al Panel
          </button>
        </div>
      ) : canClaim ? (
        <div>
          <ShieldAlert size={80} color="#f59e0b" style={{ margin: '0 auto 20px' }} />
          <h1>Configuración Inicial</h1>
          <p>No se ha detectado ningún administrador en el sistema. Puedes reclamar este rol para gestionar la tienda.</p>
          <button 
            onClick={handleClaim} 
            disabled={isProcessing}
            className="confirmBtn" 
            style={{ marginTop: '24px', background: 'var(--brand-primary)', color: 'var(--bg-primary)', padding: '12px 24px', borderRadius: 'var(--radius-md)' }}
          >
            {isProcessing ? 'Procesando...' : 'Convertirme en Administrador'}
          </button>
        </div>
      ) : (
        <div>
          <ShieldAlert size={80} color="#ef4444" style={{ margin: '0 auto 20px' }} />
          <h1>Acceso Denegado</h1>
          <p>Ya existe un administrador en el sistema. Debes solicitar permisos manualmente via Firestore.</p>
        </div>
      )}

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
