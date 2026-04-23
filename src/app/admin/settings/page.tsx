'use client';

import { useState, useEffect } from 'react';
import { Save, Globe, Info, Mail, Phone, MapPin, Camera, Link as LinkIcon, Send, Loader2, CheckCircle, CreditCard, ShieldCheck, Activity, Image as ImageIcon, Layout, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getSiteSettings, updateSiteSettings, SiteSettings, DEFAULT_SETTINGS, addExchangeRateEntry, subscribeToExchangeRateHistory, ExchangeRateEntry, subscribeToSettings } from '@/lib/services/settings';
import StatusModal, { ModalType } from '@/components/common/StatusModal';
import RichTextEditor from '@/components/admin/RichTextEditor';
import { formatCostaRicaPhone } from '@/lib/utils/mask';
import styles from '../admin.module.css';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [history, setHistory] = useState<ExchangeRateEntry[]>([]);
  const [newRate, setNewRate] = useState<string>('');
  const [updatingRate, setUpdatingRate] = useState(false);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: ModalType;
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({ 
    isOpen: false, 
    type: 'success', 
    title: '', 
    message: '' 
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getSiteSettings();
        setSettings(data);
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setFetching(false);
      }
    };
    fetchSettings();

    const unsubscribeSettings = subscribeToSettings((data) => {
      setSettings(data);
    });

    const unsubscribeHistory = subscribeToExchangeRateHistory((data) => {
      setHistory(data);
    });

    return () => {
      unsubscribeSettings();
      unsubscribeHistory();
    };
  }, []);

  const handleUpdateExchangeRate = async () => {
    const rate = parseFloat(newRate);
    if (isNaN(rate) || rate <= 0) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Valor Inválido',
        message: 'Por favor, introduce un número válido para el tipo de cambio.'
      });
      return;
    }

    setUpdatingRate(true);
    try {
      const success = await addExchangeRateEntry(rate);
      if (success) {
        setNewRate('');
        // No need to manually update local state as subscriptions will handle it
      }
    } catch (error) {
      console.error(error);
    } finally {
      setUpdatingRate(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await updateSiteSettings(settings);
      if (result) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        throw new Error("Update failed");
      }
    } catch (error) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error de Configuración',
        message: 'No se pudieron guardar los cambios globales.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConsultHacienda = async () => {
    setUpdatingRate(true);
    try {
      const response = await fetch('https://api.hacienda.go.cr/indicadores/tc/dolar');
      const data = await response.json();
      
      if (data && data.venta && data.venta.valor) {
        setNewRate(data.venta.valor.toString());
      } else {
        throw new Error("Invalid format");
      }
    } catch (error) {
      console.error("Error consulting Hacienda API:", error);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error de Consulta',
        message: 'No se pudo conectar con el servicio de Hacienda. Por favor, ingresa el valor manualmente.'
      });
    } finally {
      setUpdatingRate(false);
    }
  };

  if (fetching) {
    return (
      <div className="container" style={{ padding: '100px', textAlign: 'center' }}>
        <Loader2 className="spin" size={40} color="var(--brand-accent)" />
        <p style={{ marginTop: '20px', color: 'var(--text-secondary)' }}>Cargando configuración global...</p>
      </div>
    );
  }

  return (
    <div className={`${styles.adminPage} container animate`}>
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/admin" className={styles.viewBtn}>
            <ArrowLeft size={18} />
          </Link>
          <h1 style={{ margin: 0 }}>Configuración <span className={styles.accent}>Global</span></h1>
        </div>
        <p style={{ color: 'var(--text-tertiary)', marginTop: '16px' }}>
          Gestiona la identidad visual, información de contacto y enlaces sociales de Go-Shopping.
        </p>
      </header>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '32px' }}>
        
        {/* Identidad de Marca */}
        <div className={styles.tableContainer} style={{ padding: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <Globe className={styles.accent} size={24} />
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Identidad de Marca</h2>
          </div>
          
          <div style={{ display: 'grid', gap: '24px' }}>
            <div className={styles.filterGroup}>
              <label>Eslogan Principal (Debajo del Logo)</label>
              <input 
                type="text" 
                className={styles.filterInput}
                value={settings.tagline}
                onChange={e => setSettings({ ...settings, tagline: e.target.value })}
                placeholder="Ej: La Definición de Excelencia"
                required
              />
            </div>
            
            <div className={styles.filterGroup}>
              <label>Descripción del Footer (Bio de Empresa)</label>
              <textarea 
                className={styles.filterInput}
                style={{ minHeight: '100px', resize: 'vertical' }}
                value={settings.footerDescription}
                onChange={e => setSettings({ ...settings, footerDescription: e.target.value })}
                placeholder="Describe tu marca..."
                required
              />
            </div>
          </div>
        </div>

        {/* Información de Contacto */}
        <div className={styles.tableContainer} style={{ padding: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <Mail className={styles.accent} size={24} />
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Canales de Comunicación</h2>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <div className={styles.filterGroup}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={14} /> Correo Electrónico
              </label>
              <input 
                type="email" 
                className={styles.filterInput}
                value={settings.contactEmail}
                onChange={e => setSettings({ ...settings, contactEmail: e.target.value })}
                required
              />
            </div>
            <div className={styles.filterGroup}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={14} /> Teléfono de Contacto
              </label>
              <input 
                type="text" 
                className={styles.filterInput}
                value={settings.contactPhone}
                onChange={e => setSettings({ ...settings, contactPhone: formatCostaRicaPhone(e.target.value) })}
                required
              />
            </div>
            <div className={styles.filterGroup} style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={14} /> Dirección Física
              </label>
              <input 
                type="text" 
                className={styles.filterInput}
                value={settings.contactAddress}
                onChange={e => setSettings({ ...settings, contactAddress: e.target.value })}
                required
              />
            </div>
          </div>
        </div>

        {/* Configuración de SINPE Móvil */}
        <div className={styles.tableContainer} style={{ padding: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <Phone className={styles.accent} size={24} />
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Configuración de SINPE Móvil</h2>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <div className={styles.filterGroup}>
              <label>Número de Teléfono (SINPE)</label>
              <input 
                type="text" 
                className={styles.filterInput}
                value={settings.sinpePhone}
                onChange={e => setSettings({ ...settings, sinpePhone: formatCostaRicaPhone(e.target.value) })}
                placeholder="Ej: +506 8888-8888"
                required
              />
            </div>
            <div className={styles.filterGroup}>
              <label>Nombre del Titular</label>
              <input 
                type="text" 
                className={styles.filterInput}
                value={settings.sinpeOwner}
                onChange={e => setSettings({ ...settings, sinpeOwner: e.target.value })}
                placeholder="Ej: Comercio Elite S.A."
                required
              />
            </div>
          </div>
        </div>

        {/* Pasarela de Pagos (PayPal) */}
        <div className={styles.tableContainer} style={{ padding: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CreditCard className={styles.accent} size={24} />
              <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Pasarela de Pagos Elite (PayPal)</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.85rem', color: settings.paypalEnabled ? 'var(--status-success)' : 'var(--text-tertiary)', fontWeight: 700 }}>
                {settings.paypalEnabled ? 'ACTIVO' : 'DESACTIVADO'}
              </span>
              <button 
                type="button"
                onClick={() => setSettings({ ...settings, paypalEnabled: !settings.paypalEnabled })}
                className={styles.viewBtn}
                style={{ 
                  padding: '4px 12px', 
                  fontSize: '0.75rem',
                  borderColor: settings.paypalEnabled ? 'var(--status-success)' : 'var(--border)'
                }}
              >
                {settings.paypalEnabled ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', opacity: settings.paypalEnabled ? 1 : 0.5, pointerEvents: settings.paypalEnabled ? 'all' : 'none', transition: 'opacity 0.3s ease' }}>
            <div className={styles.filterGroup} style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={14} /> Ambiente de Ejecución
              </label>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button 
                  type="button"
                  onClick={() => setSettings({ ...settings, paypalMode: 'sandbox' })}
                  style={{ 
                    flex: 1, 
                    padding: '12px', 
                    borderRadius: '8px',
                    border: '1px solid',
                    cursor: 'pointer',
                    background: settings.paypalMode === 'sandbox' ? 'rgba(197, 160, 89, 0.1)' : 'var(--bg-secondary)',
                    borderColor: settings.paypalMode === 'sandbox' ? 'var(--brand-accent)' : 'var(--border)',
                    color: settings.paypalMode === 'sandbox' ? 'var(--brand-accent)' : 'var(--text-secondary)',
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
                  onClick={() => setSettings({ ...settings, paypalMode: 'live' })}
                  style={{ 
                    flex: 1, 
                    padding: '12px', 
                    borderRadius: '8px',
                    border: '1px solid',
                    cursor: 'pointer',
                    background: settings.paypalMode === 'live' ? 'rgba(255, 68, 68, 0.1)' : 'var(--bg-secondary)',
                    borderColor: settings.paypalMode === 'live' ? '#ff4444' : 'var(--border)',
                    color: settings.paypalMode === 'live' ? '#ff4444' : 'var(--text-secondary)',
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
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '8px' }}>
                {settings.paypalMode === 'sandbox' 
                  ? '⚠️ Estás en modo de pruebas. Los pagos no serán reales.' 
                  : '🔴 ATENCIÓN: Estás en modo PRODUCCIÓN. Se procesarán transacciones reales.'}
              </p>
            </div>

            <div className={styles.filterGroup}>
              <label>PayPal Client ID (Sandbox)</label>
              <input 
                type="text" 
                className={styles.filterInput}
                value={settings.paypalSandboxClientId}
                onChange={e => setSettings({ ...settings, paypalSandboxClientId: e.target.value })}
                placeholder="Introducir Client ID de Sandbox..."
              />
            </div>

            <div className={styles.filterGroup}>
              <label>PayPal Client ID (Producción)</label>
              <input 
                type="text" 
                className={styles.filterInput}
                value={settings.paypalLiveClientId}
                onChange={e => setSettings({ ...settings, paypalLiveClientId: e.target.value })}
                placeholder="Introducir Client ID de Producción..."
              />
            </div>
          </div>
        </div>

        {/* Gestión de Tipo de Cambio (Independiente) */}
        <div className={styles.tableContainer} style={{ padding: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <Activity className={styles.accent} size={24} />
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Gestión de Tipo de Cambio (Dólar)</h2>
          </div>

          <div style={{ display: 'grid', gap: '24px' }}>
            <div className={styles.filterGroup}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '12px', fontSize: '0.8rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tasa Actual en Sistema</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: '12px', fontWeight: 800, color: 'var(--brand-accent)', pointerEvents: 'none' }}>₡</span>
                    <input 
                      type="number" 
                      className={styles.filterInput}
                      style={{ paddingLeft: '30px', background: 'rgba(212, 175, 55, 0.05)', borderColor: 'rgba(212, 175, 55, 0.2)', color: 'var(--brand-accent)', fontWeight: 800, width: '100%' }}
                      value={settings.usdExchangeRate}
                      readOnly
                      title="Este es el valor actual que utiliza el sistema para PayPal."
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '12px', fontSize: '0.8rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nueva Tasa (Actualización)</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                      <span style={{ position: 'absolute', left: '12px', fontWeight: 800, color: 'var(--brand-accent)', pointerEvents: 'none' }}>₡</span>
                      <input 
                        type="number" 
                        className={styles.filterInput}
                        style={{ paddingLeft: '30px', borderColor: newRate ? 'var(--brand-accent)' : 'var(--border)', width: '100%' }}
                        value={newRate}
                        onChange={e => setNewRate(e.target.value)}
                        placeholder="Ej: 540.50"
                      />
                    </div>
                    <div style={{ position: 'relative' }}>
                      <button 
                        type="button" 
                        onClick={handleConsultHacienda}
                        className={styles.viewBtn}
                        style={{ padding: '0 16px', height: '46px', display: 'flex', alignItems: 'center', gap: '8px' }}
                        disabled={updatingRate}
                      >
                        <Globe size={16} /> BCCR
                      </button>
                      <div className={styles.tooltip} style={{ 
                        position: 'absolute', 
                        bottom: '100%', 
                        right: 0, 
                        width: '200px', 
                        padding: '10px', 
                        background: 'var(--bg-tertiary)', 
                        border: '1px solid var(--brand-accent)', 
                        fontSize: '0.65rem', 
                        color: 'var(--text-secondary)',
                        marginBottom: '10px',
                        zIndex: 10,
                        pointerEvents: 'none',
                        opacity: 0,
                        transition: 'opacity 0.2s'
                      }}>
                        Consulta en tiempo real el tipo de cambio oficial de venta del Ministerio de Hacienda (BCCR).
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={handleUpdateExchangeRate}
                      className={styles.approveBtn}
                      style={{ padding: '0 24px', height: '46px', minHeight: 'auto', whiteSpace: 'nowrap' }}
                      disabled={updatingRate || !newRate}
                    >
                      {updatingRate ? <Loader2 className="spin" size={14} /> : 'Actualizar'}
                    </button>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                 <Info size={14} color="var(--brand-accent)" />
                 <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontStyle: 'italic', margin: 0 }}>
                  El botón <b>BCCR</b> obtiene el valor oficial del Ministerio de Hacienda para automatizar el registro.
                 </p>
              </div>
            </div>

            {/* Historical Table */}
            <div className={styles.filterGroup}>
              <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--brand-accent)', marginBottom: '16px', marginTop: '12px' }}>Cronología de Variaciones</h4>
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Fecha y Hora de Aplicación</th>
                      <th>Valor de Referencia</th>
                      <th>Agente Administrativo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '32px' }}>No hay actividad cambiaria registrada.</td>
                      </tr>
                    ) : (
                      history.map((entry) => (
                        <tr key={entry.id}>
                          <td style={{ color: 'var(--text-tertiary)' }}>
                            {entry.timestamp ? entry.timestamp.toDate().toLocaleString('es-CR', { dateStyle: 'long', timeStyle: 'short' }) : 'Sincronizando...'}
                          </td>
                          <td style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1rem' }}>₡{entry.rate.toLocaleString()}</td>
                          <td style={{ fontWeight: 600, color: 'var(--brand-accent)' }}>{(entry.createdBy || 'Sistema').toUpperCase()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Configuración Visual del Hero */}
        <div className={styles.tableContainer} style={{ padding: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <Layout className={styles.accent} size={24} />
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Identidad Visual del Hero (Portada)</h2>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <div className={styles.filterGroup}>
              <label>Badge Superior (Texto pequeño)</label>
              <input 
                type="text" 
                className={styles.filterInput}
                value={settings.heroBadge}
                onChange={e => setSettings({ ...settings, heroBadge: e.target.value })}
                placeholder="Ej: Nueva Temporada 2026"
                required
              />
            </div>
            
            <div className={styles.filterGroup}>
              <label>Título Principal del Hero</label>
              <input 
                type="text" 
                className={styles.filterInput}
                value={settings.heroTitle}
                onChange={e => setSettings({ ...settings, heroTitle: e.target.value })}
                placeholder="Ej: La Definición de Excelencia"
                required
              />
            </div>

            <div className={styles.filterGroup} style={{ gridColumn: '1 / -1' }}>
              <label>Descripción Narrativa</label>
              <textarea 
                className={styles.filterInput}
                style={{ minHeight: '80px', resize: 'vertical' }}
                value={settings.heroDescription}
                onChange={e => setSettings({ ...settings, heroDescription: e.target.value })}
                placeholder="Describe la excelencia..."
                required
              />
            </div>

            <div className={styles.filterGroup}>
              <label>Imagen de Fondo (Background URL)</label>
              <input 
                type="text" 
                className={styles.filterInput}
                value={settings.heroBackgroundImageUrl}
                onChange={e => setSettings({ ...settings, heroBackgroundImageUrl: e.target.value })}
                placeholder="URL de la imagen de fondo..."
                required
              />
              {settings.heroBackgroundImageUrl && (
                <div style={{ marginTop: '12px', height: '100px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <img src={settings.heroBackgroundImageUrl} alt="Preview Background" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
            </div>

            <div className={styles.filterGroup}>
              <label>Imagen Destacada (Highlight Product URL)</label>
              <input 
                type="text" 
                className={styles.filterInput}
                value={settings.heroHighlightImageUrl}
                onChange={e => setSettings({ ...settings, heroHighlightImageUrl: e.target.value })}
                placeholder="URL de la imagen del producto..."
                required
              />
              {settings.heroHighlightImageUrl && (
                <div style={{ marginTop: '12px', height: '100px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-tertiary)' }}>
                  <img src={settings.heroHighlightImageUrl} alt="Preview Highlight" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Redes Sociales */}
        <div className={styles.tableContainer} style={{ padding: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <Camera className={styles.accent} size={24} />
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Ecosistema Social</h2>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <div className={styles.filterGroup}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={14} /> Instagram URL
              </label>
              <input 
                type="url" 
                className={styles.filterInput}
                value={settings.instagram}
                onChange={e => setSettings({ ...settings, instagram: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} className={styles.filterGroup}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Send size={14} /> Telegram URL
              </label>
              <input 
                type="url" 
                className={styles.filterInput}
                value={settings.telegram}
                onChange={e => setSettings({ ...settings, telegram: e.target.value })}
              />
            </div>
            <div className={styles.filterGroup}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LinkIcon size={14} /> Sitio Web Oficial
              </label>
              <input 
                type="url" 
                className={styles.filterInput}
                value={settings.website}
                onChange={e => setSettings({ ...settings, website: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Narrativa de Marca (Sobre Nosotros) */}
        <div className={styles.tableContainer} style={{ padding: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <Info className={styles.accent} size={24} />
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Narrativa de Marca (Sobre Nosotros)</h2>
          </div>
          
          <div style={{ display: 'grid', gap: '24px' }}>
            <div className={styles.filterGroup}>
              <label>Título de la Página</label>
              <input 
                type="text" 
                className={styles.filterInput}
                value={settings.aboutTitle}
                onChange={e => setSettings({ ...settings, aboutTitle: e.target.value })}
                placeholder="Ej: Nuestra Filosofía de Excelencia"
                required
              />
            </div>

            <div className={styles.filterGroup}>
              <label>Enunciado de Impacto (Header)</label>
              <input 
                type="text" 
                className={styles.filterInput}
                value={settings.aboutHeader}
                onChange={e => setSettings({ ...settings, aboutHeader: e.target.value })}
                placeholder="Ej: Definiendo el estándar del lujo..."
                required
              />
            </div>
            
            <div className={styles.filterGroup}>
              <label>Contenido Principal (Editor Enriquecido)</label>
              <RichTextEditor 
                value={settings.aboutContent}
                onChange={val => setSettings({ ...settings, aboutContent: val })}
                placeholder="Escribe la historia de tu marca aquí..."
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button 
            type="submit" 
            className={styles.approveBtn} 
            style={{ minWidth: '350px' }}
            disabled={loading}
          >
            {loading ? (
              <><Loader2 className="spin" size={20} /> Sincronizando...</>
            ) : success ? (
              <><CheckCircle size={20} /> ¡Configuración Guardada Elite!</>
            ) : (
              <><Save size={20} /> Guardar Cambios Globales</>
            )}
          </button>
        </div>
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
