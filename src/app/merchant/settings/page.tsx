'use client';

import { useState, useEffect } from 'react';
import { 
  Save, 
  Store, 
  CreditCard, 
  Smartphone, 
  Globe, 
  Instagram, 
  Facebook, 
  MessageCircle,
  Mail,
  Phone,
  Loader2,
  Settings as SettingsIcon,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getMerchantById, updateMerchant, MerchantProfile } from '@/lib/services/merchants';
import StatusModal, { ModalType } from '@/components/common/StatusModal';
import styles from '../../admin/admin.module.css';

export default function MerchantSettingsPage() {
  const { userData } = useAuth();
  const [merchant, setMerchant] = useState<MerchantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: ModalType;
    title: string;
    message: string;
  }>({ isOpen: false, type: 'info', title: '', message: '' });

  useEffect(() => {
    if (userData?.merchantId) {
      getMerchantById(userData.merchantId).then(data => {
        setMerchant(data);
        setLoading(false);
      });
    }
  }, [userData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant) return;

    setSaving(true);
    try {
      const success = await updateMerchant(merchant.id, merchant);
      if (success) {
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Configuración Guardada',
          message: 'Los datos de tu comercio han sido actualizados exitosamente.'
        });
      }
    } catch (error) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error al Guardar',
        message: 'Hubo un problema al intentar actualizar tu perfil.'
      });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (section: string, field: string, value: string) => {
    if (!merchant) return;
    
    if (section === 'root') {
      setMerchant({ ...merchant, [field]: value });
    } else {
      setMerchant({
        ...merchant,
        [section]: {
          ...(merchant as any)[section],
          [field]: value
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '100px', textAlign: 'center' }}>
        <Loader2 className="spin" size={40} color="#8b5cf6" />
      </div>
    );
  }

  return (
    <div className={`${styles.adminPage} container animate`}>
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <SettingsIcon size={24} color="#8b5cf6" />
          <h1>Configuración de <span style={{ color: '#8b5cf6' }}>Comercio</span></h1>
        </div>
      </header>

      <form onSubmit={handleSave} className={styles.filterBar} style={{ flexDirection: 'column', gap: '32px', padding: '40px', background: 'var(--bg-tertiary)' }}>
        
        {/* Basic Brand Identity */}
        <section style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            <Store size={20} color="#8b5cf6" />
            <h3 style={{ textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '0.1em' }}>Identidad de Marca</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className={styles.filterGroup}>
              <label>Nombre del Comercio</label>
              <input 
                type="text" 
                className={styles.filterInput}
                value={merchant?.name} 
                onChange={(e) => updateField('root', 'name', e.target.value)}
                required
              />
            </div>
            <div className={styles.filterGroup}>
              <label>Slug de Tienda (URL: /slug)</label>
              <input 
                type="text" 
                className={styles.filterInput}
                value={merchant?.slug} 
                disabled
                style={{ opacity: 0.6 }}
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>El slug solo puede ser modificado por el Super Admin.</span>
            </div>
            <div className={styles.filterGroup} style={{ gridColumn: 'span 2' }}>
              <label>Descripción / Slogan</label>
              <textarea 
                className={styles.filterInput}
                style={{ minHeight: '80px', paddingTop: '12px' }}
                value={merchant?.description}
                onChange={(e) => updateField('root', 'description', e.target.value)}
                placeholder="Escribe algo que defina tu marca..."
              />
            </div>
            <div className={styles.filterGroup}>
              <label>URL del Logo (1:1 recomendado)</label>
              <input 
                type="url" 
                className={styles.filterInput}
                value={merchant?.logoUrl}
                onChange={(e) => updateField('root', 'logoUrl', e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className={styles.filterGroup}>
              <label>URL del Banner (16:9 recomendado)</label>
              <input 
                type="url" 
                className={styles.filterInput}
                value={merchant?.bannerUrl}
                onChange={(e) => updateField('root', 'bannerUrl', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
        </section>

        {/* Payment Configuration */}
        <section style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            <CreditCard size={20} color="#8b5cf6" />
            <h3 style={{ textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '0.1em' }}>Pasarelas de Pago Propias</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className={styles.filterGroup}>
              <label><Smartphone size={14} style={{ marginRight: '6px' }} /> Número SINPE Móvil</label>
              <input 
                type="text" 
                className={styles.filterInput}
                value={merchant?.paymentConfig.sinpeNumber}
                onChange={(e) => updateField('paymentConfig', 'sinpeNumber', e.target.value)}
                placeholder="8888 7777"
              />
            </div>
            <div className={styles.filterGroup}>
              <label>Nombre del Titular (SINPE)</label>
              <input 
                type="text" 
                className={styles.filterInput}
                value={merchant?.paymentConfig.sinpeOwner}
                onChange={(e) => updateField('paymentConfig', 'sinpeOwner', e.target.value)}
                placeholder="Nombre Completo"
              />
            </div>
            <div className={styles.filterGroup} style={{ gridColumn: 'span 2' }}>
              <label><Globe size={14} style={{ marginRight: '6px' }} /> Correo PayPal Business</label>
              <input 
                type="email" 
                className={styles.filterInput}
                value={merchant?.paymentConfig.paypalEmail}
                onChange={(e) => updateField('paymentConfig', 'paypalEmail', e.target.value)}
                placeholder="tusventas@paypal.com"
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Tus clientes te pagarán directamente a estas cuentas.</span>
            </div>
          </div>
        </section>

        {/* Social Presence */}
        <section style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            <Instagram size={20} color="#8b5cf6" />
            <h3 style={{ textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '0.1em' }}>Ecosistema Social</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className={styles.filterGroup}>
              <label>WhatsApp de Contacto</label>
              <input 
                type="text" 
                className={styles.filterInput}
                value={merchant?.contact.whatsapp}
                onChange={(e) => updateField('contact', 'whatsapp', e.target.value)}
                placeholder="506 8888 0000"
              />
            </div>
            <div className={styles.filterGroup}>
              <label>Instagram URL</label>
              <input 
                type="url" 
                className={styles.filterInput}
                value={merchant?.contact.instagram}
                onChange={(e) => updateField('contact', 'instagram', e.target.value)}
                placeholder="https://instagram.com/tu-marca"
              />
            </div>
            <div className={styles.filterGroup}>
              <label>Facebook URL</label>
              <input 
                type="url" 
                className={styles.filterInput}
                value={merchant?.contact.facebook}
                onChange={(e) => updateField('contact', 'facebook', e.target.value)}
                placeholder="https://facebook.com/tu-marca"
              />
            </div>
            <div className={styles.filterGroup}>
              <label>Teléfono de Local</label>
              <input 
                type="text" 
                className={styles.filterInput}
                value={merchant?.contact.phone}
                onChange={(e) => updateField('contact', 'phone', e.target.value)}
                placeholder="2233 4455"
              />
            </div>
          </div>
        </section>

        <button 
          type="submit" 
          disabled={saving}
          className={styles.approveBtn} 
          style={{ 
            width: '100%', 
            background: '#8b5cf6', 
            padding: '20px', 
            borderRadius: '8px', 
            cursor: saving ? 'not-allowed' : 'pointer' 
          }}
        >
          {saving ? <Loader2 className="spin" size={20} /> : <Save size={20} />}
          {saving ? 'Guardando cambios...' : 'Actualizar Perfil Elite'}
        </button>
      </form>

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
