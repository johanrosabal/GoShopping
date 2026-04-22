'use client';

import { useState, useEffect } from 'react';
import { Save, Globe, Info, Mail, Phone, MapPin, Camera, Link as LinkIcon, Send, Loader2, CheckCircle } from 'lucide-react';
import { getSiteSettings, updateSiteSettings, SiteSettings, DEFAULT_SETTINGS } from '@/lib/services/settings';
import StatusModal from '@/components/common/StatusModal';
import RichTextEditor from '@/components/admin/RichTextEditor';
import { formatCostaRicaPhone } from '@/lib/utils/mask';
import styles from '../admin.module.css';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [modal, setModal] = useState({ 
    isOpen: false, 
    type: 'success' as any, 
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
  }, []);

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
        <h1>Configuración <span className={styles.accent}>Global</span></h1>
        <p style={{ color: 'var(--text-tertiary)', marginTop: '8px' }}>
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
