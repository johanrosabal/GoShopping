'use client';
import { useState } from 'react';
import { CreditCard, PhoneCall, CheckCircle } from 'lucide-react';
import styles from './PaymentMethodSelector.module.css';

export default function PaymentMethodSelector({ onSelect }: { onSelect: (method: 'paypal' | 'sinpe') => void }) {
  const [selected, setSelected] = useState<'paypal' | 'sinpe' | null>(null);

  const handleSelect = (method: 'paypal' | 'sinpe') => {
    setSelected(method);
    onSelect(method);
  };

  return (
    <div className={styles.selector}>
      <div 
        className={`${styles.option} ${selected === 'paypal' ? styles.active : ''}`}
        onClick={() => handleSelect('paypal')}
      >
        <CreditCard size={24} />
        <div className={styles.info}>
          <h4>PayPal / Tarjeta</h4>
          <p>Pago seguro internacional e instantáneo.</p>
        </div>
        {selected === 'paypal' && <CheckCircle className={styles.check} size={24} />}
      </div>

      <div 
        className={`${styles.option} ${selected === 'sinpe' ? styles.active : ''}`}
        onClick={() => handleSelect('sinpe')}
      >
        <PhoneCall size={24} />
        <div className={styles.info}>
          <h4>SINPE Móvil</h4>
          <p>Transferencia local inmediata (Costa Rica).</p>
        </div>
        {selected === 'sinpe' && <CheckCircle className={styles.check} size={24} />}
      </div>
    </div>
  );
}
