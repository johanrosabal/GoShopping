'use client';

import SinpeValidationList from '@/components/admin/SinpeValidationList';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import styles from '@/app/admin/admin.module.css';

export default function AdminSinpePage() {
  return (
    <div className={`${styles.adminPage} container`}>
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link href="/admin" className={styles.backBtn}>
            <ArrowLeft size={22} />
          </Link>
          <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Validación <span className={styles.accent}>SINPE Global</span></h1>
        </div>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginTop: '12px' }}>Aprobación centralizada de transferencias para todos los comercios.</p>
      </header>

      <SinpeValidationList title="Pedidos SINPE Pendientes" />
    </div>
  );
}
