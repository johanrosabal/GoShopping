'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PaymentMethodSelector from '@/components/checkout/PaymentMethodSelector';
import SinpePayment from '@/components/checkout/SinpePayment';
import PayPalPayment from '@/components/checkout/PayPalPayment';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { createOrder, OrderData, generateOrderNumber } from '@/lib/services/orders';
import { getEffectivePrice } from '@/lib/services/products';
import { getMerchantById, MerchantProfile } from '@/lib/services/merchants';
import { Loader2, CheckCircle, Store, Clock, Check, ArrowRight, FileText, Download } from 'lucide-react';
import StatusModal, { ModalType } from '@/components/common/StatusModal';
import styles from './Checkout.module.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface CheckoutSessionItem {
  merchantId: string;
  merchantName: string;
  status: 'idle' | 'pending' | 'success';
}

function CheckoutContent() {
  const { cart, cartTotal, clearCart, clearMerchantItems } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const merchantIdParam = searchParams.get('merchantId');
  
  const [method, setMethod] = useState<'paypal' | 'sinpe' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [lastPaymentStatus, setLastPaymentStatus] = useState<'pending' | 'success' | null>(null);
  const [lastOrderNumber, setLastOrderNumber] = useState<string>('');
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [merchant, setMerchant] = useState<MerchantProfile | null>(null);
  const [loadingMerchant, setLoadingMerchant] = useState(!!merchantIdParam);
  const [pregeneratedOrderNumber, setPregeneratedOrderNumber] = useState<string>('');
  
  // Last order capture for success screen
  const [lastOrderItems, setLastOrderItems] = useState<any[]>([]);
  const [lastOrderTotal, setLastOrderTotal] = useState<number>(0);
  const [lastOrderMerchantName, setLastOrderMerchantName] = useState<string>('');
  
  // Multi-merchant session tracking
  const [sessionSteps, setSessionSteps] = useState<CheckoutSessionItem[]>([]);
  
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: ModalType;
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({ 
    isOpen: false, 
    type: 'error', 
    title: '', 
    message: '' 
  });

  // 1. Initialize session steps and fetch merchant names if needed
  useEffect(() => {
    if (cart.length === 0) return;

    const initializeSession = async () => {
      // Get unique merchants from cart
      const uniqueMerchantIds = Array.from(new Set(cart.map(item => item.merchantId || 'go-shopping-main')));
      
      const savedSession = sessionStorage.getItem('checkout_session');
      let parsed: CheckoutSessionItem[] = [];
      if (savedSession) {
        parsed = JSON.parse(savedSession);
      }

      // Check if session is stale (cart has new merchants not in session)
      const sessionMerchantIds = parsed.map(p => p.merchantId);
      const hasNewMerchants = uniqueMerchantIds.some(id => !sessionMerchantIds.includes(id));
      const isStale = !savedSession || hasNewMerchants;
      
      if (!savedSession || isStale) {
        const merchantsWithNames = await Promise.all(uniqueMerchantIds.map(async (mId) => {
          if (mId === 'go-shopping-main') {
            return { merchantId: mId, merchantName: 'GoShopping Oficial', status: 'idle' as const };
          }
          try {
            const mData = await getMerchantById(mId);
            return { 
              merchantId: mId, 
              merchantName: mData?.name || `Socio ${mId.substring(0, 4)}`, 
              status: 'idle' as const 
            };
          } catch (e) {
            return { merchantId: mId, merchantName: 'Comercio', status: 'idle' as const };
          }
        }));
        
        setSessionSteps(merchantsWithNames);
        sessionStorage.setItem('checkout_session', JSON.stringify(merchantsWithNames));
      } else {
        setSessionSteps(parsed);
      }
    };

    initializeSession();
  }, [cart.length]); 

  // 2. Load current merchant data
  useEffect(() => {
    const mId = merchantIdParam || (sessionSteps.length > 0 ? sessionSteps.find(s => s.status === 'idle')?.merchantId : null);
    
    if (mId && mId !== 'go-shopping-main') {
      const fetchMerchant = async () => {
        try {
          const data = await getMerchantById(mId);
          setMerchant(data);
        } catch (error) {
          console.error("Error loading merchant:", error);
        } finally {
          setLoadingMerchant(false);
        }
      };
      fetchMerchant();
    } else {
      setMerchant(null);
      setLoadingMerchant(false);
    }
    
    // Generate a fresh order number for each session
    setPregeneratedOrderNumber(generateOrderNumber());
  }, [merchantIdParam, sessionSteps.length]);

  const currentMId = merchantIdParam || (sessionSteps.length > 0 ? sessionSteps.find(s => s.status === 'idle')?.merchantId : 'go-shopping-main');

  const filteredItems = cart.filter(item => (item.merchantId || 'go-shopping-main') === currentMId);

  const filteredTotal = filteredItems.reduce((total, item) => 
    total + (getEffectivePrice(item) * item.quantity), 0);

  const updateSessionStatus = (status: 'pending' | 'success') => {
    const updated = sessionSteps.map(step => 
      step.merchantId === currentMId ? { ...step, status } : step
    );
    setSessionSteps(updated);
    sessionStorage.setItem('checkout_session', JSON.stringify(updated));
    setLastPaymentStatus(status);
  };

  const handleConfirm = async () => {
    if (!method) return;
    setIsProcessing(true);

    try {
      const subtotal = filteredTotal / 1.13;
      const tax = filteredTotal - subtotal;

      const orderData: OrderData = {
        userId: user?.uid,
        customerName: user?.displayName || 'Cliente Anonimo',
        email: user?.email || '',
        items: filteredItems,
        subtotal,
        tax,
        total: filteredTotal,
        paymentMethod: method,
        status: method === 'paypal' ? 'completed' : 'pending',
        merchantId: currentMId || 'go-shopping-main',
        merchantName: merchant ? merchant.name : 'GoShopping Oficial',
        orderNumber: method === 'sinpe' ? pregeneratedOrderNumber : undefined
      };

      const { orderId, orderNumber } = await createOrder(orderData, voucherFile || undefined);
      setLastOrderNumber(orderNumber);
      setLastOrderItems([...filteredItems]);
      setLastOrderTotal(filteredTotal);
      setLastOrderMerchantName(merchant ? merchant.name : 'GoShopping Oficial');
      
      updateSessionStatus(method === 'sinpe' ? 'pending' : 'success');
      setIsSuccess(true);
      
      if (currentMId) {
        clearMerchantItems(currentMId);
      }
    } catch (error) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error de Pedido',
        message: 'No logramos procesar tu pedido exclusivo.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayPalSuccess = useMemo(() => async (details: any) => {
    setIsProcessing(true);
    try {
      const subtotal = filteredTotal / 1.13;
      const tax = filteredTotal - subtotal;

      const orderData: OrderData = {
        userId: user?.uid,
        customerName: user?.displayName || 'Cliente Anonimo',
        email: user?.email || '',
        items: filteredItems,
        subtotal,
        tax,
        total: filteredTotal,
        paymentMethod: 'paypal',
        status: 'completed',
        transactionId: details.id,
        payerEmail: details.payer.email_address,
        merchantId: currentMId || 'go-shopping-main',
        merchantName: merchant ? merchant.name : 'GoShopping Oficial'
      };

      const { orderId, orderNumber } = await createOrder(orderData);
      setLastOrderNumber(orderNumber);
      setLastOrderItems([...filteredItems]);
      setLastOrderTotal(filteredTotal);
      setLastOrderMerchantName(merchant ? merchant.name : 'GoShopping Oficial');

      updateSessionStatus('success');
      setIsSuccess(true);
      
      if (currentMId) {
        clearMerchantItems(currentMId);
      }
    } catch (error) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error Procesando Pago',
        message: 'El pago se realizó con éxito pero no pudimos registrar el pedido.'
      });
    } finally {
      setIsProcessing(false);
    }
  }, [filteredTotal, filteredItems, user, currentMId, merchant, clearMerchantItems]);

  const generatePDF = async () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const invoiceElement = document.getElementById('printable-invoice');
    if (!invoiceElement) return;

    const canvas = await html2canvas(invoiceElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#000000'
    });
    
    const imgData = canvas.toDataURL('image/png');
    const imgProps = doc.getImageProperties(imgData);
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    doc.save(`Factura_GoShopping_${lastOrderNumber}.pdf`);
  };

  const nextMerchant = sessionSteps.find(s => s.status === 'idle');

  if (isSuccess) {
    return (
      <div className={styles.successContainer}>
        <div id="printable-invoice" style={{ 
          padding: '40px', 
          background: '#000', 
          color: '#fff', 
          width: '500px', 
          border: '2px solid #d4af37',
          textAlign: 'left',
          marginBottom: '20px'
        }}>
          <div style={{ borderBottom: '2px solid #d4af37', paddingBottom: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, color: '#d4af37' }}>GO-SHOPPING ELITE</h2>
              <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Recibo Digital de Compra</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontWeight: 900 }}>Factura #{lastOrderNumber}</p>
              <p style={{ margin: 0, fontSize: '0.7rem' }}>Fecha: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p style={{ margin: '0 0 5px 0', fontSize: '0.7rem', textTransform: 'uppercase', color: '#d4af37' }}>Comercio</p>
            <p style={{ margin: 0, fontWeight: 700 }}>{lastOrderMerchantName}</p>
            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>Email: {merchant?.contact?.email || 'soporte@goshopping.com'}</p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '0.7rem', textTransform: 'uppercase', color: '#d4af37' }}>Artículos</p>
            {lastOrderItems.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                <span>{item.name} x{item.quantity}</span>
                <span>₡{(getEffectivePrice(item) * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid #333', paddingTop: '15px', textAlign: 'right' }}>
            <p style={{ margin: '0 0 5px 0', fontSize: '1.2rem', fontWeight: 900 }}>Total: ₡{lastOrderTotal.toLocaleString()}</p>
            <p style={{ margin: 0, fontSize: '0.7rem', color: lastPaymentStatus === 'success' ? '#44ff44' : '#ffcc00' }}>
              Estado: {lastPaymentStatus === 'success' ? 'PAGO CONFIRMADO' : 'PENDIENTE DE VALIDACIÓN (SINPE)'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={generatePDF} className={styles.confirmBtn} style={{ background: '#fff', color: '#000' }}>
            <Download size={20} /> Descargar Factura PDF
          </button>
          
          {nextMerchant ? (
            <button 
              onClick={() => {
                setIsSuccess(false);
                router.push(`/checkout?merchantId=${nextMerchant.merchantId}`);
              }} 
              className={styles.confirmBtn}
            >
              Pagar siguiente comercio <ArrowRight size={20} />
            </button>
          ) : (
            <button 
              onClick={() => {
                sessionStorage.removeItem('checkout_session');
                router.push('/');
              }} 
              className={styles.confirmBtn}
            >
              Completar todo el proceso
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.checkout} container`}>
      <header className={styles.header}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
          <h1>Finalizar <span className={styles.accent}>Pedido</span></h1>
          
          {sessionSteps.length > 0 && (
            <div className={styles.stepper}>
              {sessionSteps.map((step, idx) => (
                <div key={step.merchantId} className={styles.stepContainer}>
                  <div className={`${styles.step} ${step.merchantId === currentMId ? styles.active : ''} ${styles[step.status]}`}>
                    <div className={styles.stepIcon}>
                      {step.status === 'success' ? <Check size={18} /> : 
                       step.status === 'pending' ? <Clock size={18} /> : 
                       (idx + 1)}
                    </div>
                    <span className={styles.stepLabel}>{step.merchantName}</span>
                  </div>
                  <div className={`${styles.stepLine} ${step.status !== 'idle' || (idx < sessionSteps.length && sessionSteps[idx+1]?.merchantId === currentMId) ? styles.active : ''}`} />
                </div>
              ))}
              <div className={styles.step}>
                <div className={styles.stepIcon} style={{ opacity: 0.5 }}>
                  <FileText size={18} />
                </div>
                <span className={styles.stepLabel}>Confirmación</span>
              </div>
            </div>
          )}
        </div>
      </header>
      
      <div className={styles.layout}>
        <div className={styles.main}>
          <section className={styles.section}>
            <h2>1. Método de Pago - <span className={styles.accent}>{merchant?.name || 'GoShopping'}</span></h2>
            <PaymentMethodSelector onSelect={setMethod} />
          </section>

          {method === 'sinpe' && (
            <section className={styles.section}>
              <h2>2. Detalles de SINPE Móvil - <span className={styles.accent}>{merchant?.name || 'GoShopping'}</span></h2>
              <SinpePayment 
                onFileSelect={setVoucherFile} 
                merchant={merchant} 
                orderNumber={pregeneratedOrderNumber}
              />
            </section>
          )}

          {method === 'paypal' && (
            <section className={styles.section}>
              <h2>2. PayPal Checkout - <span className={styles.accent}>{merchant?.name || 'GoShopping'}</span></h2>
              <PayPalPayment 
                amount={filteredTotal} 
                onSuccess={handlePayPalSuccess}
                merchant={merchant}
                onError={(err) => setModal({
                  isOpen: true,
                  type: 'error',
                  title: 'Error de PayPal',
                  message: 'Problema de conexión. Reintenta.'
                })}
              />
            </section>
          )}

          <div className={styles.actions}>
            {method !== 'paypal' && (
              <button 
                className={styles.confirmBtn} 
                disabled={!method || isProcessing}
                onClick={handleConfirm}
              >
                {isProcessing ? <Loader2 className="spin" /> : (
                  method === 'sinpe' ? 'Confirmar Pago SINPE' : 'Procesar Pedido'
                )}
              </button>
            )}
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.summary}>
            <h3>Resumen de {merchant?.name || 'GoShopping'}</h3>
            <div className={styles.itemList}>
              {filteredItems.map(item => (
                <div key={item.id} className={styles.itemRow}>
                  <span>{item.name} x{item.quantity}</span>
                  <span>₡{(getEffectivePrice(item) * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <hr className={styles.divider} />
            <div className={`${styles.row} ${styles.total}`}>
              <span>Total Parcial</span>
              <span>₡{filteredTotal.toLocaleString()}</span>
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

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '100px', textAlign: 'center' }}><Loader2 className="spin" size={40} color="var(--brand-accent)" /></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
