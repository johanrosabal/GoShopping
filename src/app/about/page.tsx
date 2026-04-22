'use client';

import { useEffect, useState } from 'react';
import { getSiteSettings, SiteSettings, DEFAULT_SETTINGS } from '@/lib/services/settings';
import { Loader2, Landmark, ShieldCheck, Zap } from 'lucide-react';
import styles from './About.module.css';

export default function AboutPage() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getSiteSettings();
        setSettings(data);
      } catch (error) {
        console.error("Error loading about page content:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <div className={styles.page} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="spin" size={48} color="var(--brand-accent)" />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="container animate">
        <header className={styles.hero}>
          <h1>{settings.aboutTitle}</h1>
          <p>{settings.aboutHeader}</p>
        </header>

        <div className={styles.contentWrapper}>
          <div className={styles.accentLine} />
          
          <div 
            className={styles.aboutBody}
            dangerouslySetInnerHTML={{ __html: settings.aboutContent }}
          />

          <section className={styles.values}>
            <div className={styles.valueCard}>
              <Landmark className="accent" size={32} style={{ marginBottom: '20px' }} />
              <h3>Legado Kurada</h3>
              <p>Cada producto en nuestra tienda ha sido seleccionado bajo los más estrictos criterios de excelencia técnica y estética.</p>
            </div>
            <div className={styles.valueCard}>
              <ShieldCheck className="accent" size={32} style={{ marginBottom: '20px' }} />
              <h3>Integridad Total</h3>
              <p>Garantizamos la autenticidad y el respaldo oficial en cada transacción. Tu confianza es nuestra divisa más valiosa.</p>
            </div>
            <div className={styles.valueCard}>
              <Zap className="accent" size={32} style={{ marginBottom: '20px' }} />
              <h3>Agilidad Executive</h3>
              <p>Entendemos el valor de tu tiempo. Por ello, optimizamos cada proceso para que tu experiencia sea fluida e inmediata.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
