'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
  AlertCircle,
  Upload,
  Trash2,
  X,
  ArrowLeft,
  Clock,
  Activity,
  ShieldCheck
} from 'lucide-react';
import Image from 'next/image';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { getMerchantById, updateMerchant, MerchantProfile, getMerchantByOwnerUid } from '@/lib/services/merchants';
import StatusModal, { ModalType } from '@/components/common/StatusModal';
import styles from '../../admin/admin.module.css';

export default function MerchantSettingsPage() {
  const { userData, loading: loadingAuth } = useAuth();
  const [merchant, setMerchant] = useState<MerchantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: ModalType;
    title: string;
    message: string;
  }>({ isOpen: false, type: 'info', title: '', message: '' });

  useEffect(() => {
    const init = async () => {
      if (loadingAuth) return;
      
      try {
        let mData = null;
        if (userData?.merchantId) {
          mData = await getMerchantById(userData.merchantId);
        }
        
        // Auto-recovery
        if (!mData && userData?.uid) {
          mData = await getMerchantByOwnerUid(userData.uid);
        }

        if (mData) {
          // Initialize socialConfig if missing
          if (!mData.socialConfig) {
            mData.socialConfig = {
              showWhatsapp: true,
              showInstagram: true,
              showFacebook: true,
              showPhone: true
            };
          }
          setMerchant(mData);
          if (mData.logoUrl) setLogoPreview(mData.logoUrl);
          if (mData.bannerUrl) setBannerPreview(mData.bannerUrl);
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [userData, loadingAuth]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setBannerPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant) return;

    setSaving(true);
    try {
      let updatedMerchant = { ...merchant };

      // 1. Upload Logo if changed
      if (logoFile) {
        const logoRef = ref(storage, `merchants/${merchant.id}/logo-${Date.now()}`);
        const snapshot = await uploadBytes(logoRef, logoFile);
        updatedMerchant.logoUrl = await getDownloadURL(snapshot.ref);
      } else if (!logoPreview) {
        updatedMerchant.logoUrl = '';
      }

      // 2. Upload Banner if changed
      if (bannerFile) {
        const bannerRef = ref(storage, `merchants/${merchant.id}/banner-${Date.now()}`);
        const snapshot = await uploadBytes(bannerRef, bannerFile);
        updatedMerchant.bannerUrl = await getDownloadURL(snapshot.ref);
      } else if (!bannerPreview) {
        updatedMerchant.bannerUrl = '';
      }

      const success = await updateMerchant(merchant.id, updatedMerchant);
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

  const updateField = (section: string, field: string, value: any) => {
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

  const updateHours = (day: string, field: string, value: any) => {
    if (!merchant) return;
    setMerchant({
      ...merchant,
      operatingHours: {
        ...merchant.operatingHours,
        [day]: {
          ...merchant.operatingHours[day],
          [field]: value
        }
      }
    });
  };

  // Helper to convert 24h to 12h components
  const get12hComponents = (time24: string) => {
    if (!time24) return { h: "08", m: "00", p: "AM" };
    const [h24, m] = time24.split(':').map(Number);
    const p = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 % 12 || 12;
    return { 
      h: h12.toString().padStart(2, '0'), 
      m: m.toString().padStart(2, '0'), 
      p 
    };
  };

  // Helper to handle time change from 3-dropdown system
  const handleDropdownTimeChange = (day: string, field: string, part: 'h' | 'm' | 'p', value: string) => {
    const current = get12hComponents((merchant as any).operatingHours[day][field]);
    const next = { ...current, [part]: value };
    
    let h24 = parseInt(next.h);
    if (next.p === 'PM' && h24 < 12) h24 += 12;
    if (next.p === 'AM' && h24 === 12) h24 = 0;
    
    const time24 = `${h24.toString().padStart(2, '0')}:${next.m}`;
    updateHours(day, field, time24);
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '100px', textAlign: 'center' }}>
        <Loader2 className="spin" size={40} color="var(--brand-accent)" />
      </div>
    );
  }

  return (
    <div className={`${styles.adminPage} container animate`}>
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/merchant/dashboard" className={styles.viewBtn} style={{ padding: '8px' }}>
            <ArrowLeft size={18} />
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <SettingsIcon size={24} color="var(--brand-accent)" />
            <h1>Configuración de <span style={{ color: 'var(--brand-accent)' }}>Comercio</span></h1>
          </div>
        </div>
      </header>

      <form onSubmit={handleSave} className={styles.filterBar} style={{ flexDirection: 'column', gap: '32px', padding: '40px', background: 'var(--bg-tertiary)' }}>
        
        {/* Basic Brand Identity */}
        <section style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            <Store size={20} color="var(--brand-accent)" />
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
            <div className={styles.filterGroup} style={{ gridColumn: 'span 2' }}>
              <label>Logo del Comercio</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: '12px' }}>
                <div 
                  className={styles.logoUploadPreview}
                  onClick={() => document.getElementById('logo-input')?.click()}
                >
                  {logoPreview ? (
                    <Image src={logoPreview} alt="Preview" fill style={{ objectFit: 'cover' }} />
                  ) : (
                    <Upload size={30} opacity={0.3} />
                  )}
                  <input 
                    id="logo-input"
                    type="file" 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    onChange={handleLogoChange}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button 
                    type="button"
                    className={styles.viewBtn} 
                    onClick={() => document.getElementById('logo-input')?.click()}
                    style={{ padding: '10px 20px', fontSize: '0.8rem' }}
                  >
                    CAMBIAR LOGO
                  </button>
                  {logoPreview && (
                    <button 
                      type="button"
                      className={styles.deleteBtn} 
                      onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                      style={{ padding: '10px 20px', fontSize: '0.8rem', background: 'transparent', border: '1px solid var(--status-error)', color: 'var(--status-error)' }}
                    >
                      ELIMINAR
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.filterGroup} style={{ gridColumn: 'span 2' }}>
              <label>Fondo de Portada (Hero) - Imagen Cinematográfica</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
                <div 
                  style={{ 
                    position: 'relative', 
                    width: '100%', 
                    height: '180px', 
                    borderRadius: '8px', 
                    overflow: 'hidden', 
                    border: '1px dashed rgba(255,255,255,0.1)',
                    background: 'rgba(0,0,0,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  onClick={() => document.getElementById('banner-input')?.click()}
                >
                  {bannerPreview ? (
                    <Image src={bannerPreview} alt="Hero Background Preview" fill style={{ objectFit: 'cover', opacity: 0.7 }} />
                  ) : (
                    <div style={{ textAlign: 'center', opacity: 0.3 }}>
                      <Upload size={40} style={{ marginBottom: '8px' }} />
                      <div style={{ fontSize: '0.8rem' }}>Subir Imagen de Fondo</div>
                    </div>
                  )}
                  <input 
                    id="banner-input"
                    type="file" 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    onChange={handleBannerChange}
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    type="button"
                    className={styles.viewBtn} 
                    onClick={() => document.getElementById('banner-input')?.click()}
                    style={{ padding: '8px 16px', fontSize: '0.75rem' }}
                  >
                    CAMBIAR FONDO
                  </button>
                  {bannerPreview && (
                    <button 
                      type="button"
                      className={styles.deleteBtn} 
                      onClick={() => { setBannerFile(null); setBannerPreview(null); }}
                      style={{ padding: '8px 16px', fontSize: '0.75rem', background: 'transparent', border: '1px solid var(--status-error)', color: 'var(--status-error)' }}
                    >
                      ELIMINAR
                    </button>
                  )}
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                  * Esta imagen aparecerá detrás del logo y nombre en la página principal. Recomendado: 1920x1080 o similar.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Payment Configuration */}
        <section style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            <CreditCard size={20} color="var(--brand-accent)" />
            <h3 style={{ textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '0.1em' }}>Pasarelas de Pago Propias</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className={styles.filterGroup}>
              <label><Smartphone size={14} style={{ marginRight: '6px' }} /> Número SINPE Móvil</label>
              <input 
                type="text" 
                className={styles.filterInput}
                value={merchant?.paymentConfig?.sinpeNumber || ''}
                onChange={(e) => updateField('paymentConfig', 'sinpeNumber', e.target.value)}
                placeholder="8888 7777"
              />
            </div>
            <div className={styles.filterGroup}>
              <label>Nombre del Titular (SINPE)</label>
              <input 
                type="text" 
                className={styles.filterInput}
                value={merchant?.paymentConfig?.sinpeOwner || ''}
                onChange={(e) => updateField('paymentConfig', 'sinpeOwner', e.target.value)}
                placeholder="Nombre Completo"
              />
            </div>

            <div className={styles.filterGroup} style={{ gridColumn: 'span 2', marginTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Globe size={20} color="var(--brand-accent)" />
                  <h3 style={{ textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '0.1em', margin: 0 }}>Pasarela de Pagos Elite (PayPal)</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '0.75rem', color: merchant?.paymentConfig?.paypalEnabled ? 'var(--status-success)' : 'var(--text-tertiary)', fontWeight: 700 }}>
                    {merchant?.paymentConfig?.paypalEnabled ? 'ACTIVO' : 'DESACTIVADO'}
                  </span>
                  <div className={styles.switchWrapper}>
                    <input 
                      type="checkbox" 
                      id="paypal-enabled"
                      className={styles.switchInput}
                      checked={merchant?.paymentConfig?.paypalEnabled || false}
                      onChange={(e) => updateField('paymentConfig', 'paypalEnabled', e.target.checked)}
                    />
                    <label htmlFor="paypal-enabled" className={styles.switchLabel}></label>
                  </div>
                </div>
              </div>

              <div style={{ 
                display: 'grid', 
                gap: '24px', 
                opacity: merchant?.paymentConfig?.paypalEnabled ? 1 : 0.5, 
                pointerEvents: merchant?.paymentConfig?.paypalEnabled ? 'all' : 'none', 
                transition: 'opacity 0.3s ease' 
              }}>
                <div className={styles.filterGroup}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={14} /> Ambiente de Ejecución
                  </label>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <button 
                      type="button"
                      onClick={() => updateField('paymentConfig', 'paypalMode', 'sandbox')}
                      style={{ 
                        flex: 1, 
                        padding: '12px', 
                        borderRadius: '8px',
                        border: '1px solid',
                        cursor: 'pointer',
                        background: merchant?.paymentConfig?.paypalMode === 'sandbox' ? 'rgba(197, 160, 89, 0.1)' : 'var(--bg-secondary)',
                        borderColor: merchant?.paymentConfig?.paypalMode === 'sandbox' ? 'var(--brand-accent)' : 'var(--border)',
                        color: merchant?.paymentConfig?.paypalMode === 'sandbox' ? 'var(--brand-accent)' : 'var(--text-secondary)',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <ShieldCheck size={16} /> Sandbox (Pruebas)
                    </button>
                    <button 
                      type="button"
                      onClick={() => updateField('paymentConfig', 'paypalMode', 'live')}
                      style={{ 
                        flex: 1, 
                        padding: '12px', 
                        borderRadius: '8px',
                        border: '1px solid',
                        cursor: 'pointer',
                        background: merchant?.paymentConfig?.paypalMode === 'live' ? 'rgba(255, 68, 68, 0.1)' : 'var(--bg-secondary)',
                        borderColor: merchant?.paymentConfig?.paypalMode === 'live' ? '#ff4444' : 'var(--border)',
                        color: merchant?.paymentConfig?.paypalMode === 'live' ? '#ff4444' : 'var(--text-secondary)',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Globe size={16} /> Producción (Real)
                    </button>
                  </div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '8px' }}>
                    {merchant?.paymentConfig?.paypalMode === 'sandbox' 
                      ? '⚠️ Estás en modo de pruebas. Los pagos no serán reales.' 
                      : '🔴 ATENCIÓN: Estás en modo PRODUCCIÓN. Se procesarán transacciones reales.'}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className={styles.filterGroup}>
                    <label>PayPal Client ID (Sandbox)</label>
                    <input 
                      type="text" 
                      className={styles.filterInput}
                      value={merchant?.paymentConfig?.paypalSandboxClientId || ''}
                      onChange={(e) => updateField('paymentConfig', 'paypalSandboxClientId', e.target.value)}
                      placeholder="Introducir Client ID de Sandbox..."
                    />
                  </div>

                  <div className={styles.filterGroup}>
                    <label>PayPal Client ID (Producción)</label>
                    <input 
                      type="text" 
                      className={styles.filterInput}
                      value={merchant?.paymentConfig?.paypalLiveClientId || ''}
                      onChange={(e) => updateField('paymentConfig', 'paypalLiveClientId', e.target.value)}
                      placeholder="Introducir Client ID de Producción..."
                    />
                  </div>
                </div>

                <div className={styles.filterGroup}>
                  <label>Correo PayPal Business</label>
                  <input 
                    type="email" 
                    className={styles.filterInput}
                    value={merchant?.paymentConfig?.paypalEmail || ''}
                    onChange={(e) => updateField('paymentConfig', 'paypalEmail', e.target.value)}
                    placeholder="tusventas@paypal.com"
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '4px', display: 'block' }}>
                    Tus clientes te pagarán directamente a esta cuenta. Asegúrate de que los Client IDs coincidan con esta cuenta.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Presence */}
        <section style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            <Instagram size={20} color="var(--brand-accent)" />
            <h3 style={{ textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '0.1em' }}>Ecosistema Social</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            <div className={styles.filterGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label>WhatsApp de Contacto</label>
                <div className={styles.switchWrapper}>
                  <input 
                    type="checkbox" 
                    id="show-whatsapp"
                    className={styles.switchInput}
                    checked={merchant?.socialConfig?.showWhatsapp}
                    onChange={(e) => updateField('socialConfig', 'showWhatsapp', e.target.checked as any)}
                  />
                  <label htmlFor="show-whatsapp" className={styles.switchLabel}></label>
                </div>
              </div>
              <input 
                type="text" 
                className={styles.filterInput}
                value={merchant?.contact.whatsapp}
                onChange={(e) => updateField('contact', 'whatsapp', e.target.value)}
                placeholder="506 8888 0000"
              />
            </div>

            <div className={styles.filterGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label>Instagram URL</label>
                <div className={styles.switchWrapper}>
                  <input 
                    type="checkbox" 
                    id="show-instagram"
                    className={styles.switchInput}
                    checked={merchant?.socialConfig?.showInstagram}
                    onChange={(e) => updateField('socialConfig', 'showInstagram', e.target.checked as any)}
                  />
                  <label htmlFor="show-instagram" className={styles.switchLabel}></label>
                </div>
              </div>
              <input 
                type="url" 
                className={styles.filterInput}
                value={merchant?.contact.instagram}
                onChange={(e) => updateField('contact', 'instagram', e.target.value)}
                placeholder="https://instagram.com/tu-marca"
              />
            </div>

            <div className={styles.filterGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label>Facebook URL</label>
                <div className={styles.switchWrapper}>
                  <input 
                    type="checkbox" 
                    id="show-facebook"
                    className={styles.switchInput}
                    checked={merchant?.socialConfig?.showFacebook}
                    onChange={(e) => updateField('socialConfig', 'showFacebook', e.target.checked as any)}
                  />
                  <label htmlFor="show-facebook" className={styles.switchLabel}></label>
                </div>
              </div>
              <input 
                type="url" 
                className={styles.filterInput}
                value={merchant?.contact.facebook}
                onChange={(e) => updateField('contact', 'facebook', e.target.value)}
                placeholder="https://facebook.com/tu-marca"
              />
            </div>

            <div className={styles.filterGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label>Teléfono de Local</label>
                <div className={styles.switchWrapper}>
                  <input 
                    type="checkbox" 
                    id="show-phone"
                    className={styles.switchInput}
                    checked={merchant?.socialConfig?.showPhone}
                    onChange={(e) => updateField('socialConfig', 'showPhone', e.target.checked as any)}
                  />
                  <label htmlFor="show-phone" className={styles.switchLabel}></label>
                </div>
              </div>
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
        
        {/* Operating Hours */}
        <section style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            <Clock size={20} color="var(--brand-accent)" />
            <h3 style={{ textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '0.1em' }}>Horarios de Operación</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {Object.keys(merchant?.operatingHours || {}).map((day) => {
              const dayLabels: any = {
                monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
                thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo'
              };
              const hours = merchant?.operatingHours[day];
              
              return (
                <div key={day} style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '150px 1fr 2fr', 
                  alignItems: 'center', 
                  gap: '20px',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '8px'
                }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{dayLabels[day]}</span>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className={styles.switchWrapper}>
                      <input 
                        type="checkbox" 
                        id={`open-${day}`}
                        className={styles.switchInput}
                        checked={hours?.isOpen}
                        onChange={(e) => updateHours(day, 'isOpen', e.target.checked)}
                      />
                      <label htmlFor={`open-${day}`} className={styles.switchLabel}></label>
                    </div>
                    <span style={{ fontSize: '0.75rem', opacity: hours?.isOpen ? 1 : 0.5 }}>
                      {hours?.isOpen ? 'ABIERTO' : 'CERRADO'}
                    </span>
                  </div>

                  {hours?.isOpen && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                      {/* Open Time Pickers */}
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <select 
                          className={styles.filterInput}
                          style={{ width: '65px', padding: '10px 5px', textAlign: 'center' }}
                          value={get12hComponents(hours.open).h}
                          onChange={(e) => handleDropdownTimeChange(day, 'open', 'h', e.target.value)}
                        >
                          {Array.from({length: 12}, (_, i) => (i + 1).toString().padStart(2, '0')).map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                        <select 
                          className={styles.filterInput}
                          style={{ width: '65px', padding: '10px 5px', textAlign: 'center' }}
                          value={get12hComponents(hours.open).m}
                          onChange={(e) => handleDropdownTimeChange(day, 'open', 'm', e.target.value)}
                        >
                          {Array.from({length: 60}, (_, i) => i.toString().padStart(2, '0')).map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <select 
                          className={styles.filterInput}
                          style={{ width: '65px', padding: '10px 5px', textAlign: 'center', color: 'var(--brand-accent)', fontWeight: 'bold' }}
                          value={get12hComponents(hours.open).p}
                          onChange={(e) => handleDropdownTimeChange(day, 'open', 'p', e.target.value)}
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>

                      <span style={{ opacity: 0.5 }}>—</span>

                      {/* Close Time Pickers */}
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <select 
                          className={styles.filterInput}
                          style={{ width: '65px', padding: '10px 5px', textAlign: 'center' }}
                          value={get12hComponents(hours.close).h}
                          onChange={(e) => handleDropdownTimeChange(day, 'close', 'h', e.target.value)}
                        >
                          {Array.from({length: 12}, (_, i) => (i + 1).toString().padStart(2, '0')).map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                        <select 
                          className={styles.filterInput}
                          style={{ width: '65px', padding: '10px 5px', textAlign: 'center' }}
                          value={get12hComponents(hours.close).m}
                          onChange={(e) => handleDropdownTimeChange(day, 'close', 'm', e.target.value)}
                        >
                          {Array.from({length: 60}, (_, i) => i.toString().padStart(2, '0')).map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <select 
                          className={styles.filterInput}
                          style={{ width: '65px', padding: '10px 5px', textAlign: 'center', color: 'var(--brand-accent)', fontWeight: 'bold' }}
                          value={get12hComponents(hours.close).p}
                          onChange={(e) => handleDropdownTimeChange(day, 'close', 'p', e.target.value)}
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <button 
          type="submit" 
          disabled={saving}
          className={styles.approveBtn} 
          style={{ 
            width: '100%', 
            background: 'var(--brand-accent)', 
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
