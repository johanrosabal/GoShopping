'use client';

import { useState, useEffect } from 'react';
import { 
  getMarketplacePlans, 
  updateAllMarketplacePlans, 
  deleteMarketplacePlan,
  MarketplacePlan 
} from '@/lib/services/plans';
import { 
  Save, 
  ArrowLeft, 
  Loader2, 
  Zap, 
  Award, 
  Crown, 
  Plus, 
  Trash2,
  Settings,
  DollarSign,
  Percent,
  CreditCard,
  Smartphone,
  CheckCircle2,
  X
} from 'lucide-react';
import Link from 'next/link';
import StatusModal, { ModalType } from '@/components/common/StatusModal';
import styles from '../../admin.module.css';

const IconOptions = [
  { name: 'Zap', icon: <Zap size={24} /> },
  { name: 'Award', icon: <Award size={24} /> },
  { name: 'Crown', icon: <Crown size={24} /> },
  { name: 'Settings', icon: <Settings size={24} /> },
  { name: 'DollarSign', icon: <DollarSign size={24} /> }
];

const IconMap: Record<string, any> = {
  Zap: <Zap size={24} />,
  Award: <Award size={24} />,
  Crown: <Crown size={24} />,
  Settings: <Settings size={24} />,
  DollarSign: <DollarSign size={24} />
};

export default function PlansManagementPage() {
  const [plans, setPlans] = useState<MarketplacePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: ModalType;
    title: string;
    message: string;
  }>({ isOpen: false, type: 'info', title: '', message: '' });

  const fetchPlans = async () => {
    setLoading(true);
    const data = await getMarketplacePlans();
    setPlans(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSaveAll = async () => {
    setSaving(true);
    const success = await updateAllMarketplacePlans(plans);
    if (success) {
      setModal({
        isOpen: true,
        type: 'success',
        title: 'Modelos Sincronizados',
        message: 'Todos lo cambios masivos han sido aplicados exitosamente al ecosistema Go-Shopping.'
      });
      fetchPlans();
    } else {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error de Sincronización',
        message: 'Hubo un error al intentar guardar los cambios masivos.'
      });
    }
    setSaving(false);
  };

  const addNewPlan = () => {
    const newId = `plan-${Math.random().toString(36).substr(2, 5)}`;
    const newPlan: MarketplacePlan = {
      id: newId,
      name: 'Nuevo Plan',
      price: '0',
      color: '#ffffff',
      iconName: 'Zap',
      features: ['Beneficio 1'],
      commission: '0%',
      productLimit: 100,
      orderIndex: plans.length,
      allowedPayments: ['sinpe']
    };
    setPlans([...plans, newPlan]);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este modelo de negocio? Esto afectará a futuros registros.')) return;
    const success = await deleteMarketplacePlan(id);
    if (success) fetchPlans();
  };

  const updateField = (id: string, field: string, value: any) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const togglePayment = (planId: string, method: 'paypal' | 'sinpe') => {
    setPlans(prev => prev.map(p => {
      if (p.id === planId) {
        const allowed = p.allowedPayments || [];
        const isSelected = allowed.includes(method);
        return {
          ...p,
          allowedPayments: isSelected 
            ? allowed.filter(m => m !== method)
            : [...allowed, method]
        };
      }
      return p;
    }));
  };

  const updateFeature = (planId: string, index: number, value: string) => {
    setPlans(prev => prev.map(p => {
      if (p.id === planId) {
        const newFeatures = [...p.features];
        newFeatures[index] = value;
        return { ...p, features: newFeatures };
      }
      return p;
    }));
  };

  const addFeature = (planId: string) => {
    setPlans(prev => prev.map(p => {
      if (p.id === planId) {
        return { ...p, features: [...p.features, 'Nueva característica'] };
      }
      return p;
    }));
  };

  const removeFeature = (planId: string, index: number) => {
    setPlans(prev => prev.map(p => {
      if (p.id === planId) {
        return { ...p, features: p.features.filter((_, i) => i !== index) };
      }
      return p;
    }));
  };

  if (loading) {
    return <div className="container" style={{ padding: '100px', textAlign: 'center' }}><Loader2 className="spin" size={40} color="var(--brand-accent)" /></div>;
  }

  return (
    <div className={`${styles.adminPage} container animate`}>
      <header className={styles.header} style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/admin/merchants" className={styles.viewBtn}>
            <ArrowLeft size={18} />
          </Link>
          <h1>Gestión de <span className={styles.accent}>Modelos de Negocio</span></h1>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={addNewPlan}
            className={styles.viewBtn}
            style={{ border: '1px solid var(--brand-accent)', color: 'var(--brand-accent)' }}
          >
            <Plus size={18} /> AÑADIR NUEVO MODELO
          </button>
          
          <button 
            onClick={handleSaveAll}
            className={styles.approveBtn}
            style={{ padding: '12px 32px' }}
            disabled={saving}
          >
            {saving ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
            {saving ? 'SINCRONIZANDO...' : 'GUARDAR TODOS LOS CAMBIOS'}
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '40px', paddingBottom: '60px' }}>
        {plans.map(plan => (
          <div key={plan.id} className={styles.tableContainer} style={{ padding: '32px', background: 'rgba(255,255,255,0.02)', borderLeft: `4px solid ${plan.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ width: '64px', height: '64px', background: `${plan.color}15`, color: plan.color, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', border: `1px solid ${plan.color}30` }}>
                    {IconMap[plan.iconName]}
                  </div>
                  <select 
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                    value={plan.iconName}
                    onChange={(e) => updateField(plan.id, 'iconName', e.target.value)}
                  >
                    {IconOptions.map(opt => <option key={opt.name} value={opt.name}>{opt.name}</option>)}
                  </select>
                </div>
                <div>
                  <input 
                    type="text" 
                    value={plan.name} 
                    onChange={(e) => updateField(plan.id, 'name', e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.8rem', fontWeight: 900, marginBottom: '4px', outline: 'none', borderBottom: '1px dashed transparent' }}
                    onFocus={(e) => e.target.style.borderBottom = '1px dashed var(--brand-accent)'}
                    onBlur={(e) => e.target.style.borderBottom = '1px dashed transparent'}
                  />
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>ID TÉCNICO: {plan.id}</div>
                </div>
              </div>
              <button 
                className={styles.clearBtn} 
                style={{ color: '#ff4444', background: 'rgba(255,68,68,0.1)' }}
                onClick={() => handleDelete(plan.id)}
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '32px', marginBottom: '32px' }}>
              <div className={styles.filterGroup}>
                <label><DollarSign size={14} style={{ marginRight: '6px', color: plan.color }} /> Precio Afiliación ($)</label>
                <input type="text" className={styles.filterInput} value={plan.price} onChange={(e) => updateField(plan.id, 'price', e.target.value)} />
              </div>
              <div className={styles.filterGroup}>
                <label><Percent size={14} style={{ marginRight: '6px', color: plan.color }} /> Comisión Marketplace</label>
                <input type="text" className={styles.filterInput} value={plan.commission} onChange={(e) => updateField(plan.id, 'commission', e.target.value)} />
              </div>
              <div className={styles.filterGroup}>
                <label>Límite de Productos</label>
                <input type="number" className={styles.filterInput} value={plan.productLimit} onChange={(e) => updateField(plan.id, 'productLimit', parseInt(e.target.value))} />
              </div>
              <div className={styles.filterGroup}>
                <label>Color Identidad (Hex)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" className={styles.filterInput} value={plan.color} onChange={(e) => updateField(plan.id, 'color', e.target.value)} />
                  <div style={{ width: '42px', height: '42px', background: plan.color, borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}></div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '40px' }}>
              {/* Features List */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: plan.color }}>Beneficios Incluidos</h3>
                  <button className={styles.viewBtn} style={{ padding: '4px 10px', fontSize: '0.65rem' }} onClick={() => addFeature(plan.id)}><Plus size={14} /> Añadir Nodo</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {plan.features.map((feature, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input type="text" className={styles.filterInput} style={{ flex: 1, fontSize: '0.8rem' }} value={feature} onChange={(e) => updateFeature(plan.id, idx, e.target.value)} />
                      <button className={styles.clearBtn} onClick={() => removeFeature(plan.id, idx)} style={{ padding: '8px' }}><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Methods Control */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                 <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: plan.color, marginBottom: '20px' }}>Pasarelas Permitidas</h3>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    
                    <div 
                      onClick={() => togglePayment(plan.id, 'paypal')}
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', 
                        background: 'rgba(255,255,255,0.03)', borderRadius: '12px', cursor: 'pointer',
                        border: plan.allowedPayments?.includes('paypal') ? `1px solid ${plan.color}` : '1px solid transparent',
                        transition: 'all 0.3s'
                      }}
                    >
                       <div style={{ width: '40px', height: '40px', background: plan.allowedPayments?.includes('paypal') ? '#0070ba' : '#333', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}>
                          <CreditCard size={20} color="white" />
                       </div>
                       <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>PayPal / Tarjetas</div>
                          <div style={{ fontSize: '0.65rem', opacity: 0.5 }}>Cobro automático en USD</div>
                       </div>
                       {plan.allowedPayments?.includes('paypal') && <CheckCircle2 size={24} color={plan.color} />}
                    </div>

                    <div 
                      onClick={() => togglePayment(plan.id, 'sinpe')}
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', 
                        background: 'rgba(255,255,255,0.03)', borderRadius: '12px', cursor: 'pointer',
                        border: plan.allowedPayments?.includes('sinpe') ? `1px solid ${plan.color}` : '1px solid transparent',
                        transition: 'all 0.3s'
                      }}
                    >
                       <div style={{ width: '40px', height: '40px', background: plan.allowedPayments?.includes('sinpe') ? '#22c55e' : '#333', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}>
                          <Smartphone size={20} color="white" />
                       </div>
                       <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>SINPE Móvil</div>
                          <div style={{ fontSize: '0.65rem', opacity: 0.5 }}>Transferencia Directa CRC</div>
                       </div>
                       {plan.allowedPayments?.includes('sinpe') && <CheckCircle2 size={24} color={plan.color} />}
                    </div>

                 </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <StatusModal 
        isOpen={modal.isOpen} type={modal.type} title={modal.title} message={modal.message}
        onClose={() => setModal({ ...modal, isOpen: false })}
      />
    </div>
  );
}
