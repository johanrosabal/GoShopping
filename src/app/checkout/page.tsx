'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PaymentMethodSelector from '@/components/checkout/PaymentMethodSelector';
import SinpePayment from '@/components/checkout/SinpePayment';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { createOrder, OrderData } from '@/lib/services/orders';
import { getEffectivePrice } from '@/lib/services/products';
import { Loader2, CheckCircle } from 'lucide-react';
import StatusModal from '@/components/common/StatusModal';
import styles from './Checkout.module.css';

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  
  const [method, setMethod] = useState<'paypal' | 'sinpe' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [modal, setModal] = useState({ 
    isOpen: false, 
    type: 'error' as any, 
    title: '', 
    message: '' 
  });

  const handleConfirm = async () => {
    if (!method) return;
    setIsProcessing(true);

    try {
      const subtotal = cartTotal / 1.13;
      const tax = cartTotal - subtotal;

      const orderData: OrderData = {
        userId: user?.uid,
        customerName: user?.displayName || 'Cliente Anonimo',
        email: user?.email || '',
        items: cart,
        subtotal: subtotal,
        tax: tax,
        total: cartTotal,
        paymentMethod: method,
        status: method === 'paypal' ? 'completed' : 'pending',
      };

      await createOrder(orderData, voucherFile || undefined);
      setIsSuccess(true);
      clearCart();
      setTimeout(() => router.push('/'), 5000);
    } catch (error) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error de Pedido',
        message: 'No logramos procesar tu pedido exclusivo en este momento. Por favor, verifica tu conexión o intenta de nuevo.'
      });
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={styles.successContainer}>
        <CheckCircle size={80} color="var(--brand-accent)" />
        <h1>¡Pedido Recibido!</h1>
        <p>Gracias por tu compra exclusiva. Si pagaste por SINPE, revisaremos tu comprobante pronto.</p>
        <button onClick={() => router.push('/')} className={styles.confirmBtn}>
          Volver a la tienda
        </button>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className={styles.emptyCheckout}>
        <h2>Tu carrito está vacío</h2>
        <p>Añade algunos productos de excelencia antes de finalizar.</p>
        <button onClick={() => router.push('/catalog')} className={styles.confirmBtn}>
          Ver Catálogo
        </button>
      </div>
    );
  }

  return (
    <div className={`${styles.checkout} container`}>
      <header className={styles.header}>
        <h1>Finalizar <span className={styles.accent}>Pedido</span></h1>
      </header>
      
      <div className={styles.layout}>
        <div className={styles.main}>
          <section className={styles.section}>
            <h2>1. Método de Pago</h2>
            <PaymentMethodSelector onSelect={setMethod} />
          </section>

          {method === 'sinpe' && (
            <section className={styles.section}>
              <h2>2. Detalles de SINPE Móvil</h2>
              <SinpePayment onFileSelect={setVoucherFile} />
            </section>
          )}

          {method === 'paypal' && (
            <section className={styles.section}>
              <h2>2. PayPal Checkout</h2>
              <div className={styles.paypalPlaceholder}>
                <p>Integración de PayPal activa</p>
                <div style={{ marginTop: '20px', fontSize: '0.8rem' }}>
                  ( El pago se procesará de forma segura )
                </div>
              </div>
            </section>
          )}

          <div className={styles.actions} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button 
              className={styles.confirmBtn} 
              disabled={!method || isProcessing}
              onClick={handleConfirm}
            >
              {isProcessing ? <Loader2 className="spin" /> : (
                method === 'sinpe' ? 'Subir Comprobante y Finalizar' : 'Confirmar Pedido'
              )}
            </button>
            {!isProcessing && (
              <button 
                type="button"
                className={styles.cancelBtn}
                onClick={() => router.push('/catalog')}
              >
                Cancelar y seguir comprando
              </button>
            )}
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.summary}>
            <h3>Resumen del Pedido</h3>
            <div className={styles.itemList}>
              {cart.map(item => (
                <div key={item.id} className={styles.itemRow}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>{item.name} x{item.quantity}</span>
                    {getEffectivePrice(item) < item.price && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textDecoration: 'line-through' }}>
                        Base: ₡{item.price.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <span>₡{(getEffectivePrice(item) * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <hr className={styles.divider} />
            <div className={styles.row}>
              <span>Subtotal</span>
              <span>₡{cartTotal.toLocaleString()}</span>
            </div>
            <div className={styles.row}>
              <span>Envío</span>
              <span>Gratis</span>
            </div>
            <div className={`${styles.row} ${styles.total}`}>
              <span>Total</span>
              <span>₡{cartTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

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
