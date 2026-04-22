import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, AlertTriangle, XCircle, Info, Loader2 } from 'lucide-react';
import styles from './StatusModal.module.css';

export type ModalType = 'success' | 'error' | 'warning' | 'confirm' | 'loading';

interface StatusModalProps {
  isOpen: boolean;
  type: ModalType;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export default function StatusModal({
  isOpen,
  type,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = 'Continuar',
  cancelText = 'Cancelar'
}: StatusModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle size={48} color="var(--status-success)" />;
      case 'error': return <XCircle size={48} color="var(--status-error)" />;
      case 'warning': return <AlertTriangle size={48} color="var(--status-warning)" />;
      case 'loading': return <Loader2 size={48} color="var(--brand-accent)" className="spin" />;
      default: return <Info size={48} color="var(--brand-accent)" />;
    }
  };

  return createPortal(
    <div className={styles.overlay}>
      <div className={`${styles.modal} ${styles[type]}`}>
        <div className={styles.iconWrapper}>
          {getIcon()}
        </div>
        <div className={styles.content}>
          <h3>{title}</h3>
          <p>{message}</p>
        </div>
        <div className={styles.actions}>
          {type === 'confirm' ? (
            <>
              <button 
                className={styles.secondaryBtn} 
                onClick={onClose}
              >
                {cancelText}
              </button>
              <button 
                className={styles.primaryBtn} 
                onClick={() => {
                  onConfirm?.();
                  onClose();
                }}
              >
                {confirmText}
              </button>
            </>
          ) : (
            type !== 'loading' && (
              <button 
                className={styles.primaryBtn} 
                onClick={onClose}
              >
                Aceptar
              </button>
            )
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
