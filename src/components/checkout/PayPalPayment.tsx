'use client';

import { useEffect, useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { getSiteSettings, SiteSettings, DEFAULT_SETTINGS } from '@/lib/services/settings';
import { Loader2, AlertTriangle } from 'lucide-react';

interface PayPalPaymentProps {
  amount: number; // In CRC
  onSuccess: (details: any) => void;
  onError: (error: any) => void;
}

export default function PayPalPayment({ amount, onSuccess, onError }: PayPalPaymentProps) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      const data = await getSiteSettings();
      setSettings(data);
      setLoading(false);
    };
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Loader2 className="spin" size={24} color="var(--brand-accent)" />
        <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>Cargando pasarela segura...</p>
      </div>
    );
  }

  if (!settings.paypalEnabled || (!settings.paypalSandboxClientId && !settings.paypalLiveClientId)) {
    return (
      <div style={{ 
        padding: '20px', 
        background: 'rgba(255, 68, 68, 0.1)', 
        border: '1px solid #ff4444',
        borderRadius: '8px',
        color: '#ff4444',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <AlertTriangle size={20} />
        <p style={{ fontSize: '0.85rem' }}>PayPal no está configurado correctamente en los ajustes globales.</p>
      </div>
    );
  }

  const clientId = settings.paypalMode === 'sandbox' 
    ? settings.paypalSandboxClientId 
    : settings.paypalLiveClientId;

  // Convert CRC to USD
  const amountInUSD = (amount / settings.usdExchangeRate).toFixed(2);

  return (
    <div style={{ width: '100%', marginTop: '20px' }}>
      <PayPalScriptProvider options={{ 
        clientId: clientId,
        currency: 'USD',
        intent: 'capture'
      }}>
        <PayPalButtons 
          style={{ 
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'paypal'
          }}
          disabled={!clientId}
          createOrder={(data, actions) => {
            return actions.order.create({
              intent: 'CAPTURE',
              purchase_units: [
                {
                  description: "Compra en Go-Shopping Elite",
                  amount: {
                    currency_code: 'USD',
                    value: amountInUSD,
                  },
                },
              ],
            });
          }}
          onApprove={async (data, actions) => {
            if (actions.order) {
              const details = await actions.order.capture();
              onSuccess(details);
            }
          }}
          onError={(err) => {
            console.error("PayPal Error:", err);
            onError(err);
          }}
        />
      </PayPalScriptProvider>
      <div style={{ 
        textAlign: 'center', 
        marginTop: '12px', 
        fontSize: '0.75rem', 
        color: 'var(--text-tertiary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      }}>
        <span>Tasa de cambio aplicada: 1 USD = ₡{settings.usdExchangeRate}</span>
        {settings.paypalMode === 'sandbox' && (
          <span style={{ 
            background: 'var(--status-warning)', 
            color: 'black', 
            padding: '2px 6px', 
            borderRadius: '4px',
            fontWeight: 800,
            fontSize: '0.6rem'
          }}>
            MODO SANDBOX
          </span>
        )}
      </div>
    </div>
  );
}
