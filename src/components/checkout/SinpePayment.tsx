'use client';
import { Upload, Info, CheckCircle, Copy, Check } from 'lucide-react';
import { getSiteSettings, SiteSettings, DEFAULT_SETTINGS } from '@/lib/services/settings';
import { useEffect, useState } from 'react';
import styles from './SinpePayment.module.css';

import { getMerchantById, MerchantProfile } from '@/lib/services/merchants';

export default function SinpePayment({ onFileSelect, merchant, orderNumber }: { onFileSelect?: (file: File) => void, merchant?: MerchantProfile | null, orderNumber: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedDetail, setCopiedDetail] = useState(false);

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
  const detailText = `Go Shopping #${orderNumber}`;

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(sinpePhone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleCopyDetail = () => {
    navigator.clipboard.writeText(detailText);
    setCopiedDetail(true);
    setTimeout(() => setCopiedDetail(false), 2000);
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
      <div className={styles.container}>
        <div className={styles.sinpeInfo}>
          <div className={styles.field}>
            <span className={styles.label}>Número SINPE Móvil</span>
            <div className={styles.valueRow}>
              <h2 className={styles.phoneValue}>{sinpePhone}</h2>
              <button onClick={handleCopyPhone} className={styles.actionBtn}>
                {copiedPhone ? <Check size={18} color="var(--status-success)" /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Titular de la cuenta</span>
            <p className={styles.ownerValue}>{sinpeOwner}</p>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Detalle para la transferencia</span>
            <div className={styles.valueRow}>
              <div className={styles.detailBox}>{detailText}</div>
              <button onClick={handleCopyDetail} className={styles.copyDetailBtn}>
                {copiedDetail ? <><Check size={16} /> Copiado</> : <><Copy size={16} /> Copiar Detalle</>}
              </button>
            </div>
          </div>
        </div>

        <div className={styles.steps}>
          <h3>Pasos para tu pago:</h3>
          <ol>
            <li>Ingresa a tu app bancaria y elige <strong>SINPE Móvil</strong>.</li>
            <li>Envía el monto total al número arriba indicado.</li>
            <li>Usa el botón <strong>"Copiar Detalle"</strong> y pégalo en la descripción de la transferencia.</li>
            <li>Toma una captura de pantalla del comprobante y súbelo aquí abajo.</li>
          </ol>
        </div>
      </div>

      <div className={styles.uploadSection}>
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
                <p>Haz clic para cambiar el archivo si es necesario</p>
              </div>
            ) : (
              <div className={styles.placeholder}>
                <Upload size={40} />
                <span>Sube el comprobante (voucher) aquí</span>
                <p>Formatos permitidos: JPG, PNG, PDF</p>
              </div>
            )}
          </label>
        </div>
      </div>

      <p className={styles.disclaimer}>
        * Tu pedido será procesado una vez que validemos el pago (15-30 min).
      </p>
    </div>
  );
}
