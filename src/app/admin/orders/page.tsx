'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllOrders, updateOrderStatus, subscribeToAllOrders } from '@/lib/services/orders';
import { Eye, Check, X, Clock, ExternalLink, Loader2, Plus } from 'lucide-react';
import StatusModal, { ModalType } from '@/components/common/StatusModal';
import styles from '../admin.module.css';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: ModalType;
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({ 
    isOpen: false, 
    type: 'error', 
    title: '', 
    message: '' 
  });

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToAllOrders((data) => {
      setOrders(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setIsUpdating(true);
    const success = await updateOrderStatus(id, newStatus);
    if (success) {
      setSelectedOrder(null);
    } else {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error de Actualización',
        message: 'No logramos actualizar el estado del pedido. Revisa tu conexión de red.'
      });
    }
    setIsUpdating(false);
  };

  return (
    <div className={`${styles.adminPage} container`}>
      <header className={styles.header}>
        <h1>Panel de <span className={styles.accent}>Pedidos</span></h1>
        <div className={styles.controls}>
          {/* Real-time synchronization active */}
        </div>
      </header>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <Loader2 className="spin" size={40} />
          <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Cargando pedidos elite...</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID / Fecha</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Pago</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>#{order.id.slice(-6)}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                      {order.createdAt?.toDate().toLocaleString('es-CR', { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  </td>
                  <td>
                    <div>{order.customerName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{order.email}</div>
                  </td>
                  <td style={{ fontWeight: 700 }}>₡{order.total.toLocaleString()}</td>
                  <td>
                    <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>
                      {order.paymentMethod}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles['status_' + order.status]}`}>
                      {order.status === 'pending' ? 'Pendiente' : order.status === 'completed' ? 'Pagado' : 'Fallido'}
                    </span>
                  </td>
                  <td>
                    <button className={styles.viewBtn} onClick={() => setSelectedOrder(order)}>
                      <Eye size={16} style={{ marginRight: '8px' }} /> Ver Detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selectedOrder && (
        <div className={styles.modalOverlay} onClick={() => setSelectedOrder(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader} style={{ padding: '32px 40px', borderBottom: 'none', position: 'relative' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>
                  Pedido <span className={styles.accent}>#{selectedOrder.orderNumber || selectedOrder.id.slice(-6)}</span>
                </h2>
                <span className={`${styles.statusBadge} ${styles['status_' + selectedOrder.status]}`}>
                  {selectedOrder.status === 'pending' ? 'Esperando Verificación' : selectedOrder.status === 'completed' ? 'Transacción Exitosa' : 'Pedido Rechazado'}
                </span>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)} 
                className={styles.cancelBtn}
                style={{ 
                  position: 'absolute',
                  top: '32px',
                  right: '40px',
                  padding: '8px 16px',
                  fontSize: '0.8rem'
                }}
              >
                Cerrar
              </button>
            </div>
            
            <div className={styles.modalContent} style={{ textAlign: 'left', padding: '0 40px 40px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                {/* Columna Izquierda: Cliente y Artículos */}
                <div>
                  <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--brand-accent)', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                      Información del Cliente
                    </h3>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Nombre Completo</label>
                        <span style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{selectedOrder.customerName}</span>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Correo Electrónico</label>
                        <span style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{selectedOrder.email}</span>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Fecha de Compra</label>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{selectedOrder.createdAt?.toDate().toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--brand-accent)', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                      Resumen de Artículos
                    </h3>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {selectedOrder.items?.map((item: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{item.name} <strong style={{ color: 'var(--text-primary)' }}>x{item.quantity}</strong></span>
                          <span style={{ fontWeight: 600 }}>₡{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'grid', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                          <span>Subtotal</span>
                          <span>₡{(selectedOrder.subtotal || (selectedOrder.total / 1.13)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                          <span>Impuestos (IVA 13%)</span>
                          <span>₡{(selectedOrder.tax || (selectedOrder.total - (selectedOrder.total / 1.13))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div style={{ marginTop: '8px', paddingTop: '12px', borderTop: '2px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 800 }}>Total Pagado</span>
                          <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--brand-accent)' }}>₡{selectedOrder.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Pago y Acciones */}
                <div>
                  <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--brand-accent)', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                    Verificación de Pago
                  </h3>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', border: '1px solid var(--border)', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Método Seleccionado:</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-primary)' }}>{selectedOrder.paymentMethod}</span>
                    </div>
                    
                    {selectedOrder.paymentMethod === 'sinpe' ? (
                      <div style={{ textAlign: 'center' }}>
                        {selectedOrder.sinpeVoucherUrl ? (
                          <>
                            <a href={selectedOrder.sinpeVoucherUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginBottom: '12px' }}>
                              <img src={selectedOrder.sinpeVoucherUrl} alt="Comprobante" style={{ width: '100%', height: '180px', objectFit: 'cover', border: '1px solid var(--border)' }} />
                            </a>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                              Click en la imagen para validar el folio <ExternalLink size={10} />
                            </p>
                          </>
                        ) : (
                          <div style={{ padding: '20px', border: '1px dashed var(--status-error)', color: 'var(--status-error)', fontSize: '0.8rem' }}>
                            Aún no se ha cargado el comprobante de pago.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>ID Transacción:</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                            {selectedOrder.transactionId || 
                             (selectedOrder.notes?.includes('PayPal ID:') ? selectedOrder.notes.split('PayPal ID: ')[1] : 'Confirmado')}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>Email Pagador:</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{selectedOrder.payerEmail || 'PayPal Verified Account'}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'grid', gap: '12px' }}>
                    {selectedOrder.status === 'pending' && (
                      <button 
                        className={styles.approveBtn}
                        style={{ width: '100%', padding: '16px' }}
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'completed')}
                        disabled={isUpdating}
                      >
                        {isUpdating ? <Loader2 className="spin" size={18} /> : (
                          <><Check size={18} /> Aprobar Pedido</>
                        )}
                      </button>
                    )}
                    {selectedOrder.status !== 'completed' && (
                      <button 
                        className={styles.clearBtn}
                        style={{ width: '100%', padding: '12px' }}
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'failed')}
                        disabled={isUpdating}
                      >
                        {selectedOrder.status === 'failed' ? 'Pedido Cancelado' : 'Rechazar / Cancelar'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
