'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { getSiteSettings, SiteSettings, DEFAULT_SETTINGS } from '@/lib/services/settings';
import { Loader2, AlertTriangle } from 'lucide-react';

import { MerchantProfile } from '@/lib/services/merchants';

interface PayPalPaymentProps {
  amount: number; // In CRC
  onSuccess: (details: any) => void;
  onError: (error: any) => void;
  merchant?: MerchantProfile | null;
}

const PayPalPayment = React.memo(({ amount, onSuccess, onError, merchant }: PayPalPaymentProps) => {
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

  const paypalMode = merchant ? merchant.paymentConfig?.paypalMode : settings.paypalMode;
  const sandboxId = merchant ? merchant.paymentConfig?.paypalSandboxClientId : settings.paypalSandboxClientId;
  const liveId = merchant ? merchant.paymentConfig?.paypalLiveClientId : settings.paypalLiveClientId;
  const clientId = paypalMode === 'sandbox' ? sandboxId : liveId;

  const amountInUSD = useMemo(() => {
    return (amount / settings.usdExchangeRate).toFixed(2);
  }, [amount, settings.usdExchangeRate]);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Loader2 className="spin" size={24} color="var(--brand-accent)" />
        <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>Conectando con PayPal...</p>
      </div>
    );
  }

  const paypalEnabled = merchant ? merchant.paymentConfig?.paypalEnabled : settings.paypalEnabled;

  if (!paypalEnabled || !clientId) {
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
        <p style={{ fontSize: '0.85rem' }}>Configuración de PayPal incompleta.</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', marginTop: '20px' }}>
      <PayPalScriptProvider 
        key={clientId} 
        options={{ 
          clientId: clientId as string,
          currency: 'USD',
          intent: 'capture',
          "disable-funding": "credit,card"
        }}
      >
        <PayPalButtons 
          style={{ 
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'paypal'
          }}
          createOrder={(data, actions) => {
            return actions.order.create({
              intent: 'CAPTURE',
              purchase_units: [
                {
                  description: merchant ? `Compra en ${merchant.name}` : "Compra en Go-Shopping Elite",
                  amount: {
                    currency_code: 'USD',
                    value: amountInUSD,
                  },
                },
              ],
            });
          }}
          onApprove={(data, actions) => {
            if (!actions.order) return Promise.reject("No order action available");
            return actions.order.capture().then((details) => {
              onSuccess(details);
            });
          }}
          onError={(err) => {
            console.error("PayPal Error:", err);
            onError(err);
          }}
        />
      </PayPalScriptProvider>
      <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
        <span>Tasa: 1 USD = ₡{settings.usdExchangeRate}</span>
        {paypalMode === 'sandbox' && <span style={{ marginLeft: '10px', color: 'var(--status-warning)' }}>SANDBOX</span>}
      </div>
    </div>
  );
});

PayPalPayment.displayName = 'PayPalPayment';
export default PayPalPayment;
