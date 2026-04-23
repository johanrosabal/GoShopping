'use client';

import React, { useRef } from 'react';
import { 
  CheckCircle2, 
  Download, 
  FileText, 
  ArrowRight, 
  Building, 
  Hash,
  X,
  UserCheck
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import styles from '@/app/admin/admin.module.css';

interface SuccessAffiliationModalProps {
  isOpen: boolean;
  merchantData: any;
  onClose: () => void;
}

export default function SuccessAffiliationModal({ isOpen, merchantData, onClose }: SuccessAffiliationModalProps) {
  const contractRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleDownloadPDF = async () => {
    if (!contractRef.current) return;
    
    // Create a temporary clone for rendering perfectly
    const element = contractRef.current;
    
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Contrato_${merchantData.merchantNumber}_${merchantData.name}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Hubo un error al generar el PDF. Por favor intenta de nuevo.");
    }
  };

  return (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      backdropFilter: 'blur(10px)'
    }}>
      <div style={{ 
        background: '#111', width: '90%', maxWidth: '600px', borderRadius: '20px', 
        border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', position: 'relative',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.5 }}>
          <X size={24} />
        </button>

        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', padding: '20px', background: 'rgba(234, 179, 8, 0.1)', borderRadius: '50%', marginBottom: '24px' }}>
            <CheckCircle2 size={64} color="var(--brand-accent)" />
          </div>
          
          <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '12px', color: 'white' }}>¡Afiliación Exitosa!</h2>
          <p style={{ color: 'var(--text-tertiary)', marginBottom: '32px' }}>El comercio ha sido registrado correctamente en la plataforma.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '40px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'left' }}>
              <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'var(--brand-accent)', fontWeight: 800, marginBottom: '4px' }}>Comercio Afiliado</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building size={16} /> {merchantData.name}
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'left' }}>
              <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'var(--brand-accent)', fontWeight: 800, marginBottom: '4px' }}>N° de Contrato</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Hash size={16} /> {merchantData.merchantNumber}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button 
              onClick={handleDownloadPDF}
              style={{ 
                width: '100%', padding: '18px', borderRadius: '12px', 
                background: 'var(--brand-accent)', color: 'black', fontWeight: 800, 
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                border: 'none', cursor: 'pointer'
              }}
            >
              <Download size={20} /> DESCARGAR CONTRATO (PDF)
            </button>
            
            <button 
              onClick={onClose}
              style={{ 
                width: '100%', padding: '16px', borderRadius: '12px', 
                background: 'rgba(255,255,255,0.05)', color: 'white', fontWeight: 600, 
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                border: 'none', cursor: 'pointer'
              }}
            >
              CERRAR Y VOLVER AL PANEL <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* HIDDEN CONTRACT TEMPLATE FOR PDF GENERATION */}
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <div ref={contractRef} style={{ width: '210mm', padding: '20mm', background: 'white', color: 'black', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid black', paddingBottom: '10mm', marginBottom: '10mm' }}>
               <div>
                  <h1 style={{ margin: 0, fontSize: '24pt', fontWeight: 900 }}>GoShopping</h1>
                  <p style={{ margin: 0, fontSize: '10pt', color: '#666' }}>Marketplace de Productos de Elite</p>
               </div>
               <div style={{ textAlign: 'right' }}>
                  <h2 style={{ margin: 0, fontSize: '14pt' }}>CONTRATO DE AFILIACIÓN</h2>
                  <p style={{ margin: 0, fontSize: '12pt', fontWeight: 700 }}>FOLIO: #{merchantData.merchantNumber}</p>
                  <p style={{ margin: 0, fontSize: '9pt' }}>Fecha: {new Date().toLocaleDateString()}</p>
               </div>
            </div>

            <div style={{ marginBottom: '8mm' }}>
              <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '2mm', fontSize: '12pt' }}>I. DATOS DEL COMERCIO</h3>
              <table style={{ width: '100%', fontSize: '10pt', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr><td style={{ width: '40%', padding: '2mm 0', fontWeight: 700 }}>Nombre Comercial:</td><td>{merchantData.name}</td></tr>
                  <tr><td style={{ padding: '2mm 0', fontWeight: 700 }}>Razón Social:</td><td>{merchantData.legalName}</td></tr>
                  <tr><td style={{ padding: '2mm 0', fontWeight: 700 }}>Cédula Física / Jurídica:</td><td>{merchantData.legalId}</td></tr>
                  <tr><td style={{ padding: '2mm 0', fontWeight: 700 }}>Dirección:</td><td>{merchantData.physicalAddress}, {merchantData.district}, {merchantData.canton}, {merchantData.province}</td></tr>
                  <tr><td style={{ padding: '2mm 0', fontWeight: 700 }}>Contacto:</td><td>{merchantData.contactName} ({merchantData.phone})</td></tr>
                  <tr><td style={{ padding: '2mm 0', fontWeight: 700 }}>Email Admin:</td><td>{merchantData.adminEmail}</td></tr>
                </tbody>
              </table>
            </div>

            <div style={{ marginBottom: '8mm' }}>
              <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '2mm', fontSize: '12pt' }}>II. MODELO DE NEGOCIO SELECCIONADO</h3>
              <div style={{ padding: '4mm', background: '#f9f9f9', borderRadius: '4px', border: '1px solid #eee' }}>
                <p style={{ margin: '0 0 2mm 0', fontSize: '11pt', fontWeight: 700 }}>PLAN: {merchantData.planName?.toUpperCase()}</p>
                <p style={{ margin: 0, fontSize: '10pt' }}>Comisión por Venta: {merchantData.planCommission}</p>
              </div>
            </div>

            <div style={{ marginBottom: '10mm' }}>
              <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '2mm', fontSize: '12pt' }}>III. TÉRMINOS Y CONDICIONES ACEPTADOS</h3>
              <div style={{ fontSize: '8pt', color: '#555', lineHeight: '1.4', columns: 2, gap: '10mm' }}>
                <p><strong>1. Comisiones:</strong> El comercio acepta abonar el porcentaje de comisión definido en su plan sobre el valor bruto de cada venta procesada en la plataforma.</p>
                <p><strong>2. Pagos:</strong> Los fondos se dispersarán según el método de pago seleccionado, restando las comisiones aplicables y costos de pasarela.</p>
                <p><strong>3. Responsabilidad:</strong> El comercio es el único responsable por la calidad, garantía y entrega de los productos ofrecidos.</p>
                <p><strong>4. Duración:</strong> Este acuerdo tiene una duración indefinida, pudiendo cualquiera de las partes rescindirlo con un preaviso de 30 días.</p>
                <p><strong>5. Propiedad Intelectual:</strong> Go-Shopping queda autorizado para utilizar el nombre y logo del comercio con fines promocionales dentro del marketplace.</p>
                <p><strong>6. Aceptación:</strong> El comercio declara haber sido informado de todas las políticas de operación y acepta el uso de la plataforma bajo los lineamientos de Go-Shopping.</p>
              </div>
            </div>

            <div style={{ marginTop: '20mm', display: 'flex', justifyContent: 'space-between', gap: '20mm' }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ borderBottom: '1px solid black', height: '15mm' }}></div>
                <p style={{ marginTop: '2mm', fontSize: '9pt', fontWeight: 700 }}>{merchantData.contactName}</p>
                <p style={{ margin: 0, fontSize: '8pt', color: '#666' }}>COMERCIO AFILIADO</p>
                <p style={{ margin: 0, fontSize: '8pt', color: '#666' }}>{merchantData.legalId}</p>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ borderBottom: '1px solid black', height: '15mm' }}></div>
                <p style={{ marginTop: '2mm', fontSize: '9pt', fontWeight: 700 }}>AGENTE PROMOTOR</p>
                <p style={{ margin: 0, fontSize: '8pt', color: '#666' }}>REPRESENTANTE GOSHOPPING</p>
                <p style={{ margin: 0, fontSize: '8pt', color: '#666' }}>ID: {merchantData.promotedBy || 'SISTEMA'}</p>
              </div>
            </div>

            <div style={{ marginTop: '15mm', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '5mm' }}>
               <p style={{ fontSize: '7pt', color: '#999' }}>Documento generado electrónicamente por Go-Shopping Marketplace. © 2026 Todos los derechos reservados.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
