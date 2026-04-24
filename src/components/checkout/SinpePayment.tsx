'use client';
import { Upload, Info, CheckCircle, Copy, Check } from 'lucide-react';
import { getSiteSettings, SiteSettings, DEFAULT_SETTINGS } from '@/lib/services/settings';
import { useEffect, useState } from 'react';
import styles from './SinpePayment.module.css';

import { getMerchantById, MerchantProfile } from '@/lib/services/merchants';

export default function SinpePayment({ onFileSelect, merchant }: { onFileSelect?: (file: File) => void, merchant?: MerchantProfile | null }) {
  const [file, setFile] = useState<File | null>(null);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const data = await getSiteSettings();
      setSettings(data);
    };
    if (!merchant) {
      fetchSettings();
    }
  }, [merchant]);

  const sinpePhone = merchant?.paymentConfig?.sinpeNumber || settings.sinpePhone;
  const sinpeOwner = merchant?.paymentConfig?.sinpeOwner || settings.sinpeOwner;

  const handleCopy = () => {
    navigator.clipboard.writeText(sinpePhone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (onFileSelect) onFileSelect(selectedFile);
    }
  };

  return (
    <div className={styles.sinpe}>
      <div className={styles.instruction}>
        <Info size={20} />
        <div style={{ flex: 1 }}>
          <p>Realiza la transferencia al número <strong>{sinpePhone}</strong> a nombre de <strong>{sinpeOwner}</strong></p>
        </div>
        <button 
          onClick={handleCopy}
          className={styles.copyBtn}
          title="Copiar número"
        >
          {copied ? <Check size={16} color="var(--status-success)" /> : <Copy size={16} />}
        </button>
      </div>

      <div className={styles.uploadArea}>
        <input 
          type="file" 
          id="voucher" 
          hidden 
          onChange={handleFileChange}
          accept="image/*"
        />
        <label htmlFor="voucher" className={styles.uploadLabel}>
          {file ? (
            <div className={styles.fileSelected}>
              <CheckCircle size={40} color="var(--status-success)" />
              <span>{file.name} seleccionado</span>
            </div>
          ) : (
            <div className={styles.placeholder}>
              <Upload size={40} />
              <span>Sube el comprobante (voucher) aquí</span>
            </div>
          )}
        </label>
      </div>

      <p className={styles.disclaimer}>
        * El pedido será procesado una vez que validemos el pago manualmente (15-30 min).
      </p>
    </div>
  );
}
