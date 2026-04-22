'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ListSelectionModal from './ListSelectionModal';
import StatusModal from '@/components/common/StatusModal';

interface AddToListButtonProps {
  productId: string;
  variant?: 'icon' | 'full';
  className?: string;
}

export default function AddToListButton({ productId, variant = 'icon', className }: AddToListButtonProps) {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    setShowModal(true);
  };

  return (
    <>
      <button 
        onClick={handleClick}
        className={className}
        title="Añadir a Mis Listas"
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        <Heart 
          size={variant === 'full' ? 20 : 18} 
          style={{ transition: 'transform 0.2s' }}
          className="heart-icon"
        />
        {variant === 'full' && <span style={{ marginLeft: '8px', fontWeight: 600 }}>Deseados Elite</span>}
      </button>

      {showModal && user && (
        <ListSelectionModal 
          productId={productId}
          userId={user.uid}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowSuccessModal(true);
            setTimeout(() => setShowSuccessModal(false), 2000);
          }}
        />
      )}

      {/* Auth Modal if user is not logged in */}
      <StatusModal 
        isOpen={showAuthModal}
        type="warning"
        title="Acceso Exclusivo"
        message="Para crear y gestionar tus listas personales de excelencia, por favor inicia sesión o crea una cuenta."
        onClose={() => setShowAuthModal(false)}
      />

      {/* Success Toast-like Modal */}
      <StatusModal 
        isOpen={showSuccessModal}
        type="success"
        title="¡Producto Guardado!"
        message="El artículo ha sido añadido a tu lista con éxito."
        onClose={() => setShowSuccessModal(false)}
      />

      <style jsx>{`
        button:hover .heart-icon {
          transform: scale(1.1);
          color: var(--status-error);
          fill: var(--status-error);
        }
      `}</style>
    </>
  );
}
