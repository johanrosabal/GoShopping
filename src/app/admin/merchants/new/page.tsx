'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { 
  Store, 
  Save, 
  ArrowLeft, 
  Loader2, 
  ShieldCheck, 
  Mail, 
  Globe, 
  Smartphone,
  Check,
  CheckCircle,
  Building,
  User,
  MapPin,
  ClipboardList,
  Navigation,
  Info,
  Search,
  MapIcon,
  Clock,
  Notebook,
  Briefcase,
  Hash,
  XCircle,
  CreditCard
} from 'lucide-react';
import { auth } from '@/lib/firebase';
import { createMerchant, getPredictedNextMerchantNumber, updateMerchant } from '@/lib/services/merchants';
import { getUserByEmail, updateUser } from '@/lib/services/users';
import { getMarketplacePlans, MarketplacePlan } from '@/lib/services/plans';
import SuccessAffiliationModal from '@/components/admin/SuccessAffiliationModal';
import AffiliationPaymentModal from '@/components/admin/AffiliationPaymentModal';
import StatusModal, { ModalType } from '@/components/common/StatusModal';
import RichEditor from '@/components/common/RichEditor';
import Link from 'next/link';
import styles from '../../admin.module.css';

const AddressMap = dynamic(() => import('@/components/profile/AddressMap'), { 
  ssr: false,
  loading: () => <div style={{ height: '300px', width: '100%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="spin" size={24} /></div>
});

const IconMap: Record<string, any> = {
  Zap: dynamic(() => import('lucide-react').then(m => m.Zap), { ssr: false }),
  Award: dynamic(() => import('lucide-react').then(m => m.Award), { ssr: false }),
  Crown: dynamic(() => import('lucide-react').then(m => m.Crown), { ssr: false })
};

const CR_STRUCTURE: Record<string, string[]> = {
  "San José": ["San José", "Escazú", "Desamparados", "Puriscal", "Tarrazú", "Aserrí", "Mora", "Goicoechea", "Santa Ana", "Alajuelita", "Vázquez de Coronado", "Acosta", "Tibás", "Moravia", "Montes de Oca", "Turrubares", "Dota", "Curridabat", "Pérez Zeledón", "León Cortés Castro"],
  "Alajuela": ["Alajuela", "San Ramón", "Grecia", "San Mateo", "Atenas", "Naranjo", "Palmares", "Poás", "Orotina", "San Carlos", "Zarcero", "Sarchí", "Upala", "Los Chiles", "Guatuso", "Río Cuarto"],
  "Cartago": ["Cartago", "Paraíso", "La Unión", "Jiménez", "Turrialba", "Alvarado", "Oreamuno", "El Guarco"],
  "Heredia": ["Heredia", "Barva", "Santo Domingo", "Santa Bárbara", "San Rafael", "San Isidro", "Belén", "Flores", "San Pablo", "Sarapiquí"],
  "Guanacaste": ["Liberia", "Nicoya", "Santa Cruz", "Bagaces", "Carrillo", "Cañas", "Abangares", "Tilarán", "Nandayure", "La Cruz", "Hojancha"],
  "Puntarenas": ["Puntarenas", "Esparza", "Buenos Aires", "Montes de Oro", "Osa", "Quepos", "Golfito", "Coto Brus", "Parrita", "Corredores", "Garabito", "Monteverde", "Puerto Jiménez"],
  "Limón": ["Limón", "Pococí", "Siquirres", "Talamanca", "Matina", "Guácimo"]
};

const DAYS = [
  { id: 'mon', label: 'Lunes' },
  { id: 'tue', label: 'Martes' },
  { id: 'wed', label: 'Miércoles' },
  { id: 'thu', label: 'Jueves' },
  { id: 'fri', label: 'Viernes' },
  { id: 'sat', label: 'Sábado' },
  { id: 'sun', label: 'Domingo' }
];

export default function NewMerchantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [predictedNumber, setPredictedNumber] = useState('000000');
  const [activeMerchantId, setActiveMerchantId] = useState<string | null>(null);
  
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: ModalType;
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({ isOpen: false, type: 'info', title: '', message: '' });

  const [paymentModal, setPaymentModal] = useState({ isOpen: false });
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    merchantData: {}
  });

  const [loadingPlans, setLoadingPlans] = useState(true);
  const [plans, setPlans] = useState<MarketplacePlan[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([9.9333, -84.0833]);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    legalName: '',
    legalId: '',
    contactName: '',
    province: 'San José',
    canton: 'San José',
    district: '',
    physicalAddress: '',
    mapsUrl: '', 
    country: 'Costa Rica',
    adminEmail: '',
    phone: '',
    subscriptionType: '',
    status: 'pending', // Default to pending
    internalNotes: '',
    acceptTerms: false,
    operatingHours: DAYS.reduce((acc, day) => ({
      ...acc,
      [day.id]: { isOpen: true, open: '08:00', close: '18:00' }
    }), {})
  });

  useEffect(() => {
    Promise.all([
      getMarketplacePlans(),
      getPredictedNextMerchantNumber()
    ]).then(([plansData, nextNum]) => {
      setPlans(plansData);
      if (plansData.length > 0) {
        setFormData(prev => ({ ...prev, subscriptionType: plansData[0].id }));
      }
      setPredictedNumber(nextNum);
      setLoadingPlans(false);
    });
  }, []);

  const handleSlug = (name: string) => {
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setFormData(prev => ({ ...prev, name, slug }));
  };

  const formatPhone = (val: string) => {
    const numbers = val.replace(/\D/g, '').substring(0, 8);
    if (numbers.length <= 4) return numbers;
    return `${numbers.substring(0, 4)}-${numbers.substring(4)}`;
  };

  const formatLegalId = (val: string) => {
    const clean = val.replace(/[^0-9A-Z]/g, '').substring(0, 11);
    if (clean.length <= 1) return clean;
    if (clean.length <= 5) return `${clean.substring(0, 1)}-${clean.substring(1, 5)}-${clean.substring(5)}`;
    return `${clean.substring(0, 1)}-${clean.substring(1, 5)}-${clean.substring(5)}`;
  };

  const handleLocationChange = (lat: number, lng: number) => {
    setFormData(prev => ({ 
      ...prev, 
      mapsUrl: `https://www.google.com/maps?q=${lat},${lng}` 
    }));
    setMapCenter([lat, lng]);
  };

  const handleUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, mapsUrl: url }));
    const coordMatch = url.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      setMapCenter([lat, lng]);
    }
  };

  const handleHoursChange = (dayId: string, field: 'isOpen' | 'open' | 'close', value: any) => {
    setFormData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [dayId]: {
          ...(prev.operatingHours as any)[dayId],
          [field]: value
        }
      }
    }));
  };

  // STEP 1: PERSIST DATA AS PENDING
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const agentUid = auth.currentUser?.uid;
      const user = await getUserByEmail(formData.adminEmail);
      if (!user) {
        setModal({ isOpen: true, type: 'error', title: 'Error', message: 'Usuario no encontrado.' });
        setLoading(false);
        return;
      }

      // We ALWAYS create the merchant first in 'pending' status
      const merchantId = await createMerchant({
        ...formData,
        ownerUid: user.uid,
        status: 'pending',
        paymentConfig: { paypalEmail: '', sinpeNumber: '', sinpeOwner: '' },
        contact: {
          contactName: formData.contactName,
          email: formData.adminEmail,
          phone: formData.phone,
          whatsapp: formData.phone
        },
        legalData: {
          legalName: formData.legalName,
          legalId: formData.legalId,
          physicalAddress: formData.physicalAddress,
          mapsUrl: formData.mapsUrl,
          province: formData.province,
          canton: formData.canton,
          district: formData.district,
          country: formData.country
        }
      }, agentUid);

      if (merchantId) {
        await updateUser(user.uid, {
          role: 'merchant_admin',
          merchantId: merchantId
        });

        setActiveMerchantId(merchantId);
        setLoading(false);
        setPaymentModal({ isOpen: true }); // Move to payment step
      }
    } catch (error) {
      setModal({ isOpen: true, type: 'error', title: 'Error', message: 'No se pudo guardar la información inicial.' });
      setLoading(false);
    }
  };

  // STEP 2: FINALIZE BASED ON PAYMENT
  const finalizeAffiliation = async (paymentDetails: any) => {
    if (!activeMerchantId) return;
    setPaymentModal({ isOpen: false });
    setLoading(true);

    try {
      const selectedPlan = plans.find(p => p.id === formData.subscriptionType);
      
      // Update status if payment was instant (PayPal)
      const finalStatus = paymentDetails.method === 'paypal' ? 'active' : 'pending';
      const paymentNote = `PAGO CONFIRMADO VIA ${paymentDetails.method.toUpperCase()}.`;

      await updateMerchant(activeMerchantId, {
        status: finalStatus as any,
        internalNotes: `${paymentNote}\n${formData.internalNotes}`
      });

      setSuccessModal({
        isOpen: true,
        merchantData: {
          ...formData,
          merchantNumber: predictedNumber,
          planName: selectedPlan?.name,
          planCommission: selectedPlan?.commission,
          promotedBy: auth.currentUser?.uid
        }
      });
    } catch (error) {
      console.error("Error finalizing:", error);
      setModal({ isOpen: true, type: 'error', title: 'Error', message: 'La información se guardó como pendiente, pero hubo un error al actualizar el pago.' });
    } finally {
      setLoading(false);
    }
  };

  const selectedPlanInfo = plans.find(p => p.id === formData.subscriptionType) || { name: 'Cargando...', price: 0, color: 'var(--brand-accent)' };

  return (
    <div className={`${styles.adminPage} container animate`}>
      <header className={styles.header} style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/admin/merchants" className={styles.viewBtn}>
            <XCircle size={18} />
          </Link>
          <h1>Nueva <span className={styles.accent}>Afiliación Comercial</span></h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%)', padding: '12px 24px', borderRadius: '12px', border: '1px solid rgba(234, 179, 8, 0.3)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
          <div style={{ width: '32px', height: '32px', background: 'var(--brand-accent)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black' }}><Hash size={18} strokeWidth={3} /></div>
          <div>
            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--brand-accent)', fontWeight: 800, marginBottom: '2px', opacity: 0.8 }}>Folio de Socio</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white', letterSpacing: '0.1em', fontFamily: 'monospace' }}>{predictedNumber}</div>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <section className={styles.tableContainer} style={{ padding: '32px' }}>
              <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}><Store size={16} color="var(--brand-accent)" /> Identidad de Marca</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className={styles.filterGroup}><label>Nombre del Negocio</label><input type="text" className={styles.filterInput} placeholder="Relojería Elite" value={formData.name} onChange={(e) => handleSlug(e.target.value)} required /></div>
                <div className={styles.filterGroup}><label>URL / Slug</label><input type="text" className={styles.filterInput} value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} required /></div>
              </div>
            </section>

            <section className={styles.tableContainer} style={{ padding: '32px' }}>
              <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}><Building size={16} color="var(--brand-accent)" /> Información Comercial & Contacto</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div className={styles.filterGroup} style={{ gridColumn: 'span 3' }}><label>Nombre Legal / Razón Social</label><input type="text" className={styles.filterInput} value={formData.legalName} onChange={(e) => setFormData({ ...formData, legalName: e.target.value })} required /></div>
                <div className={styles.filterGroup} style={{ gridColumn: 'span 2' }}><label>Cédula Jurídica / Física</label><input type="text" className={styles.filterInput} value={formData.legalId} onChange={(e) => setFormData({ ...formData, legalId: formatLegalId(e.target.value) })} required /></div>
                <div className={styles.filterGroup}><label>Teléfono Celular</label><input type="text" className={styles.filterInput} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })} required /></div>
                <div className={styles.filterGroup} style={{ gridColumn: 'span 3' }}><label>Persona de Contacto</label><div style={{ position: 'relative' }}><User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} /><input type="text" className={styles.filterInput} style={{ paddingLeft: '40px' }} value={formData.contactName} onChange={(e) => setFormData({ ...formData, contactName: e.target.value })} required /></div></div>
                <div className={styles.filterGroup}><label>Provincia</label><select className={styles.filterSelect} value={formData.province} onChange={(e) => setFormData({...formData, province: e.target.value, canton: CR_STRUCTURE[e.target.value][0]})}>{Object.keys(CR_STRUCTURE).map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                <div className={styles.filterGroup}><label>Cantón</label><select className={styles.filterSelect} value={formData.canton} onChange={(e) => setFormData({...formData, canton: e.target.value})}>{CR_STRUCTURE[formData.province].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div className={styles.filterGroup}><label>Distrito</label><input type="text" className={styles.filterInput} value={formData.district} onChange={(e) => setFormData({...formData, district: e.target.value})} /></div>
                <div className={styles.filterGroup} style={{ gridColumn: 'span 3' }}><label>Señas Exactas</label><textarea className={styles.filterInput} style={{ minHeight: '60px', paddingTop: '10px' }} value={formData.physicalAddress} onChange={(e) => setFormData({...formData, physicalAddress: e.target.value})} /></div>
                <div className={styles.filterGroup} style={{ gridColumn: 'span 3', marginTop: '16px' }}><AddressMap initialCenter={mapCenter} onLocationChange={handleLocationChange} /><div style={{ position: 'relative', marginTop: '12px', width: '100%' }}><Globe size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} /><input type="url" className={styles.filterInput} style={{ paddingLeft: '40px', width: '100%', fontSize: '0.75rem' }} value={formData.mapsUrl} onChange={(e) => handleUrlChange(e.target.value)} /></div></div>
              </div>
            </section>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <section className={styles.tableContainer} style={{ padding: '32px' }}>
              <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldCheck size={16} color="var(--brand-accent)" /> Acceso Administrativo</h3>
              <div className={styles.filterGroup}><label>Email del Administrador</label><input type="email" className={styles.filterInput} style={{ fontSize: '1.2rem', fontWeight: 700 }} value={formData.adminEmail} onChange={(e) => setFormData({...formData, adminEmail: e.target.value})} required /></div>
            </section>

            <section className={styles.tableContainer} style={{ padding: '32px' }}>
              <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={16} color="var(--brand-accent)" /> Horarios de Atención</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>{DAYS.map(day => (<div key={day.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}><div style={{ width: '70px', fontWeight: 600, fontSize: '0.8rem' }}>{day.label}</div><label style={{ position: 'relative', display: 'inline-block', width: '32px', height: '16px' }}><input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={(formData.operatingHours as any)[day.id].isOpen} onChange={(e) => handleHoursChange(day.id, 'isOpen', e.target.checked)} /><span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: (formData.operatingHours as any)[day.id].isOpen ? 'var(--brand-accent)' : '#333', transition: '.4s', borderRadius: '34px' }}><span style={{ position: 'absolute', height: '10px', width: '10px', left: (formData.operatingHours as any)[day.id].isOpen ? '19px' : '3px', bottom: '3px', backgroundColor: (formData.operatingHours as any)[day.id].isOpen ? 'black' : '#666', transition: '.4s', borderRadius: '50%' }}></span></span></label>{(formData.operatingHours as any)[day.id].isOpen ? (<div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}><input type="time" className={styles.filterInput} style={{ width: '110px', padding: '4px 6px', fontSize: '0.8rem' }} value={(formData.operatingHours as any)[day.id].open} onChange={(e) => handleHoursChange(day.id, 'open', e.target.value)} /><span style={{ color: 'var(--text-tertiary)', fontSize: '0.6rem' }}>a</span><input type="time" className={styles.filterInput} style={{ width: '110px', padding: '4px 6px', fontSize: '0.8rem' }} value={(formData.operatingHours as any)[day.id].close} onChange={(e) => handleHoursChange(day.id, 'close', e.target.value)} /></div>) : <div style={{ flex: 1, fontSize: '0.65rem', opacity: 0.5 }}>CERRADO</div>}</div>))}</div>
            </section>
          </div>
        </div>

        <section className={styles.tableContainer} style={{ padding: '40px' }}>
            <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.15em', textAlign: 'center', marginBottom: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}><Briefcase size={20} color="var(--brand-accent)" /> Selección de Modelo de Negocio</h3>
            {loadingPlans ? (<div style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="spin" size={32} /></div>) : (<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>{plans.map(plan => { const Icon = (IconMap as any)[plan.iconName] || Store; const isSelected = formData.subscriptionType === plan.id; return (<div key={plan.id} onClick={() => setFormData({...formData, subscriptionType: plan.id})} style={{ padding: '32px', background: isSelected ? `${plan.color}15` : 'rgba(255,255,255,0.02)', border: '2px solid', borderColor: isSelected ? plan.color : 'rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderRadius: '8px' }}><div style={{ color: plan.color, marginBottom: '20px' }}><Icon size={48} /></div><span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '0.1em', marginBottom: '8px' }}>{plan.name.toUpperCase()}</span><div style={{ fontWeight: 900, fontSize: '2rem', color: plan.color, marginBottom: '24px' }}>${plan.price}</div><div style={{ fontSize: '0.8rem', color: plan.color, fontWeight: 800, marginBottom: '20px', padding: '8px 16px', background: `${plan.color}20`, borderRadius: '4px' }}>COMISIÓN: {plan.commission}</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', textAlign: 'left', marginTop: '10px' }}>
              {plan.features.map((feature: string, i: number) => (
                <div key={i} style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'flex-start', gap: '10px', opacity: 0.8, lineHeight: '1.4' }}>
                   <Check size={14} color={plan.color} style={{ flexShrink: 0, marginTop: '2px' }} />
                   {feature}
                </div>
              ))}
            </div>

            {isSelected && (<div style={{ position: 'absolute', top: '20px', right: '20px' }}><CheckCircle size={32} color={plan.color} /></div>)}
            </div>); })}</div>)}
        </section>

        <section className={styles.tableContainer} style={{ padding: '32px' }}>
          <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}><Notebook size={16} color="var(--brand-accent)" /> Notas Administrativas</h3>
          <RichEditor value={formData.internalNotes} onChange={(val) => setFormData({ ...formData, internalNotes: val })} placeholder="Notas internas..." minHeight="200px" />
        </section>

        <section className={styles.tableContainer} style={{ padding: '32px', border: formData.acceptTerms ? '1px solid var(--brand-accent)' : '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div onClick={() => setFormData({ ...formData, acceptTerms: !formData.acceptTerms })} style={{ width: '24px', height: '24px', borderRadius: '4px', border: '2px solid', borderColor: formData.acceptTerms ? 'var(--brand-accent)' : 'rgba(255,255,255,0.2)', background: formData.acceptTerms ? 'var(--brand-accent)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{formData.acceptTerms && <Check size={18} color="black" strokeWidth={4} />}</div>
            <div style={{ flex: 1 }}><h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '8px' }}>Términos de Afiliación</h3><p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Acepto los términos de operación del marketplace.</p></div>
          </div>
        </section>

        <button type="submit" className={styles.approveBtn} disabled={loading || !formData.acceptTerms} style={{ width: '100%', padding: '32px', fontSize: '1.4rem', background: formData.acceptTerms ? 'var(--brand-accent)' : 'rgba(255,255,255,0.1)', color: formData.acceptTerms ? 'black' : 'rgba(255,255,255,0.3)', fontWeight: 800 }}>
          {loading ? <Loader2 className="spin" size={32} /> : <CreditCard size={32} />}
          {loading ? 'Guardando Informacion...' : 'GUARDAR Y PROCEDER AL PAGO'}
        </button>
      </form>

      <StatusModal isOpen={modal.isOpen} type={modal.type} title={modal.title} message={modal.message} onClose={() => setModal({...modal, isOpen: false})} onConfirm={modal.onConfirm} />
      
      <AffiliationPaymentModal 
        isOpen={paymentModal.isOpen} 
        onClose={() => router.push('/admin/merchants')} // If closed, stay in merchants list with 'pending' status
        onPaymentSuccess={finalizeAffiliation} 
        plan={selectedPlanInfo as any} 
      />

      <SuccessAffiliationModal isOpen={successModal.isOpen} merchantData={successModal.merchantData} onClose={() => router.push('/admin/merchants')} />
    </div>
  );
}
