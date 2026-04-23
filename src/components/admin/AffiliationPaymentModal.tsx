'use client';

import { useState } from 'react';
import { 
  CreditCard, 
  Smartphone, 
  CheckCircle2, 
  X, 
  Loader2, 
  ExternalLink,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { PayPalButtons } from "@paypal/react-paypal-js";

interface AffiliationPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (details: any) => void;
  plan: {
    name: string;
    price: number;
    color: string;
  };
}

export default function AffiliationPaymentModal({ isOpen, onClose, onPaymentSuccess, plan }: AffiliationPaymentModalProps) {
  const [method, setMethod] = useState<'paypal' | 'sinpe' | null>(null);
  const [sinpeConfirmed, setSinpeConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSinpeConfirm = () => {
    setLoading(true);
    // Simulate verification
    setTimeout(() => {
      onPaymentSuccess({ method: 'sinpe', status: 'pending_verification' });
      setLoading(false);
    }, 2000);
  };

  return (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100,
      backdropFilter: 'blur(15px)'
    }}>
      <div style={{ 
        background: '#111', width: '90%', maxWidth: '450px', borderRadius: '24px', 
        border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden',
        boxShadow: `0 0 50px ${plan.color}15`
      }}>
        
        <div style={{ padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', marginBottom: '4px' }}>Pago de Afiliación</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Selecciona tu método de preferencia</p>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          {/* Plan Summary Card */}
          <div style={{ 
            background: `${plan.color}10`, padding: '20px', borderRadius: '16px', 
            border: `1px solid ${plan.color}30`, marginBottom: '32px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800, color: plan.color, letterSpacing: '0.1em' }}>Plan Seleccionado</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white' }}>{plan.name}</div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: plan.color }}>${plan.price}</div>
          </div>

          {!method ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <button 
                onClick={() => setMethod('paypal')}
                style={{ 
                  width: '100%', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.02)', color: 'white', display: 'flex', alignItems: 'center', gap: '16px',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <div style={{ width: '40px', height: '40px', background: '#0070ba', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={20} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 800 }}>PayPal o Tarjeta</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>Procesamiento instantáneo</div>
                </div>
              </button>

              <button 
                onClick={() => setMethod('sinpe')}
                style={{ 
                  width: '100%', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.02)', color: 'white', display: 'flex', alignItems: 'center', gap: '16px',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <div style={{ width: '40px', height: '40px', background: '#22c55e', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Smartphone size={20} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 800 }}>SINPE Móvil</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>Transferencia directa (Costa Rica)</div>
                </div>
              </button>
            </div>
          ) : method === 'paypal' ? (
             <div>
                <div style={{ marginBottom: '24px' }}>
                  <PayPalButtons 
                    style={{ layout: "vertical", shape: "rect", label: "pay" }}
                    createOrder={(data, actions) => {
                      return actions.order.create({
                        intent: 'CAPTURE',
                        purchase_units: [{
                          amount: {
                            currency_code: 'USD',
                            value: plan.price.toString()
                          },
                          description: `Afiliación Go-Shopping: Plan ${plan.name}`
                        }]
                      });
                    }}
                    onApprove={async (data, actions) => {
                       const details = await actions.order?.capture();
                       onPaymentSuccess({ method: 'paypal', details });
                    }}
                  />
                </div>
                <button 
                  onClick={() => setMethod(null)}
                  style={{ width: '100%', padding: '12px', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  Volver a métodos de pago
                </button>
             </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
               <div style={{ padding: '24px', background: 'rgba(34, 197, 94, 0.05)', border: '1px dashed #22c55e', borderRadius: '16px', marginBottom: '24px' }}>
                  <div style={{ fontSize: '0.8rem', color: '#22c55e', fontWeight: 800, marginBottom: '12px' }}>PASOS PARA SINPE MÓVIL</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white', marginBottom: '8px' }}>8888-8888</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Nombre: Go-Shopping CR</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', lineHeight: '1.4' }}>
                    Por favor envía la transferencia y adjunta el comprobante o confirma aquí. Nuestro equipo validará el ingreso.
                  </div>
               </div>

               <button 
                onClick={handleSinpeConfirm}
                disabled={loading}
                style={{ 
                  width: '100%', padding: '18px', borderRadius: '12px', background: '#22c55e', color: 'black', 
                  fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' 
                }}
               >
                 {loading ? <Loader2 className="spin" size={20} /> : <CheckCircle2 size={20} />}
                 {loading ? 'Verificando...' : 'YA REALICÉ EL PAGO'}
               </button>

               <button 
                  onClick={() => setMethod(null)}
                  style={{ width: '100%', padding: '12px', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '0.8rem', marginTop: '12px' }}
                >
                  Cambiar método
                </button>
            </div>
          )}

          <div style={{ marginTop: '32px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
             <ShieldCheck size={18} color="var(--brand-accent)" style={{ flexShrink: 0 }} />
             <p style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', lineHeight: '1.4' }}>
               Tu pago está protegido por estándares de seguridad PCI-DSS. Al finalizar recibirás tu factura electrónica y contrato.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
