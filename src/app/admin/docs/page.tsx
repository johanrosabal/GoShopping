'use client';

import React from 'react';
import { 
  FileText, 
  ArrowLeft, 
  BookOpen, 
  ShieldCheck, 
  Code, 
  Layers, 
  Zap,
  CheckCircle2,
  Info,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import styles from '../admin.module.css';

export default function AdminDocsPage() {
  return (
    <div className={`${styles.adminPage} container animate`}>
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link href="/admin" className={styles.backBtn}>
            <ArrowLeft size={22} />
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BookOpen size={24} color="var(--brand-accent)" />
            <h1>Documentación de <span style={{ color: 'var(--brand-accent)' }}>Arquitectura Elite</span></h1>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Intro */}
        <section className={styles.tableContainer} style={{ padding: '40px', background: 'linear-gradient(135deg, rgba(197, 160, 89, 0.05) 0%, rgba(0, 0, 0, 0.4) 100%)' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            <div style={{ padding: '15px', background: 'var(--brand-accent)', borderRadius: '12px', color: 'black' }}>
              <ShieldCheck size={32} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '12px' }}>Ecosistema Multi-Comercio</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                Este documento detalla la lógica de negocio, arquitectura y flujos implementados en la plataforma Go-Shopping para el manejo de múltiples comercios.
              </p>
            </div>
          </div>
        </section>

        {/* 1. Arquitectura */}
        <section className={styles.tableContainer} style={{ padding: '32px' }}>
          <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-accent)' }}>
            <Layers size={16} /> 1. Arquitectura de Datos (Firebase Firestore)
          </h3>
          <div style={{ display: 'grid', gap: '16px' }}>
            <DocItem title="merchants" desc="Perfiles de comercios. Incluye datos legales, de contacto, configuración de pagos (PayPal/SINPE) y horarios." />
            <DocItem title="marketplace_plans" desc="Definición de planes (Standard, Premium, Elite) con sus respectivas comisiones y beneficios." />
            <DocItem title="products" desc="Catálogo global. Cada producto tiene un merchantId. Los productos del sistema usan go-shopping-main." />
            <DocItem title="users" desc="Perfiles de usuario con roles (admin, merchant_admin, client). El rol merchant_admin incluye un merchantId." />
          </div>
        </section>

        {/* 2. Onboarding */}
        <section className={styles.tableContainer} style={{ padding: '32px' }}>
          <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-accent)' }}>
            <Zap size={16} /> 2. Flujo de Afiliación (Onboarding)
          </h3>
          <div style={{ borderLeft: '2px solid var(--brand-accent)', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <StepItem step="01" title="Identidad" desc="Captura de datos legales. Generación de Folio único mediante contador atómico." />
            <StepItem step="02" title="Acceso" desc="Creación automática de cuenta en Firebase Auth con rol merchant_admin." />
            <StepItem step="03" title="Pago" desc="PayPal activa inmediato. SINPE requiere validación administrativa (pending)." />
            <StepItem step="04" title="Contrato" desc="Generación de PDF dinámico (html2canvas + jsPDF) con términos legales." />
          </div>
        </section>

        {/* 3. Checkout */}
        <section className={styles.tableContainer} style={{ padding: '32px' }}>
          <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-accent)' }}>
            <CheckCircle2 size={16} /> 3. Carrito y Checkout Segmentado
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.6' }}>
            El sistema permite comprar a múltiples comercios en una sola sesión, separando los pagos de forma transparente.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
             <FeatureItem title="Stepper Dinámico" desc="Guía al cliente comercio por comercio." />
             <FeatureItem title="Pago Directo" desc="Fondos van directo a la cuenta del comercio." />
             <FeatureItem title="Limpieza Parcial" desc="Borra solo lo pagado, preserva el resto." />
             <FeatureItem title="Multi-Pasarela" desc="Soporta PayPal y SINPE por separado." />
          </div>
        </section>

        {/* 4. Módulos de Gestión */}
        <section className={styles.tableContainer} style={{ padding: '32px' }}>
          <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-accent)' }}>
            <Settings size={16} /> 4. Módulos de Gestión Administrativa
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
             <DocItem title="📦 Pedidos" desc="Validación de SINPE, logística y estados de envío." />
             <DocItem title="💬 Soporte Chat" desc="Atención en tiempo real y resolución de casos." />
             <DocItem title="🏷️ Inventario" desc="Control maestro de productos, stock y precios." />
             <DocItem title="👥 Usuarios" desc="Gestión de roles (Admin, Merchant, Client)." />
             <DocItem title="🏪 Marketplace" desc="Control de socios comerciales y afiliaciones." />
             <DocItem title="💎 Planes" desc="Configuración de comisiones y beneficios de suscripción." />
          </div>
        </section>

        {/* 5. API & Dev */}
        <section className={styles.tableContainer} style={{ padding: '32px' }}>
          <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-accent)' }}>
            <Code size={16} /> 5. Mantenimiento y API
          </h3>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', fontFamily: 'monospace', fontSize: '0.8rem' }}>
            <div style={{ color: 'var(--brand-accent)', marginBottom: '8px' }}>// Endpoint de Gestión de Usuarios</div>
            <div style={{ color: '#fff' }}>POST /api/admin/create-user</div>
            <div style={{ color: 'var(--text-tertiary)', marginTop: '4px' }}>Maneja la creación en Auth y sincronización en Firestore.</div>
          </div>
        </section>

        <footer style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
          <Info size={14} style={{ marginBottom: '4px' }} /><br />
          Documentación generada por Antigravity AI - Abril 2026
        </footer>
      </div>
    </div>
  );
}

function DocItem({ title, desc }: { title: string, desc: string }) {
  return (
    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
      <strong style={{ color: 'white', display: 'block', marginBottom: '4px' }}>{title}</strong>
      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{desc}</span>
    </div>
  );
}

function StepItem({ step, title, desc }: { step: string, title: string, desc: string }) {
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', left: '-36px', top: '0', width: '24px', height: '24px', background: 'var(--brand-accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 900, color: 'black' }}>{step}</div>
      <h4 style={{ fontWeight: 800, color: 'white', marginBottom: '4px' }}>{title}</h4>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>{desc}</p>
    </div>
  );
}

function FeatureItem({ title, desc }: { title: string, desc: string }) {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
      <CheckCircle2 size={16} color="var(--brand-accent)" style={{ marginTop: '3px' }} />
      <div>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'white' }}>{title}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{desc}</div>
      </div>
    </div>
  );
}
