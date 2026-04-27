'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllOrders, updateOrderStatus, subscribeToAllOrders } from '@/lib/services/orders';
import { Eye, Check, X, Clock, ExternalLink, Loader2, Plus, ArrowLeft } from 'lucide-react';
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link href="/admin" className={styles.backBtn}>
            <ArrowLeft size={22} />
          </Link>
          <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Panel de <span className={styles.accent}>Pedidos</span></h1>
        </div>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginTop: '12px' }}>Gestión centralizada de transacciones y estados logísticos.</p>
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
                <th>Pedido</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Pago</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td data-label="Pedido">
                    <button 
                      className={styles.orderIdLink} 
                      onClick={() => setSelectedOrder(order)}
                      title="Ver detalles del pedido"
                    >
                      #{order.orderNumber || order.id.slice(-6).toUpperCase()}
                      <Eye size={14} style={{ marginLeft: '8px', opacity: 0.8 }} />
                    </button>
                  </td>
                  <td data-label="Fecha">
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                      {order.createdAt?.toDate().toLocaleString('es-CR', { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  </td>
                  <td data-label="Cliente">
                    <div className={styles.customerInfo}>
                      <div className={styles.customerName}>{order.customerName}</div>
                      <div className={styles.customerEmail}>{order.email}</div>
                    </div>
                  </td>
                  <td data-label="Total" style={{ fontWeight: 700 }}>₡{order.total.toLocaleString()}</td>
                  <td data-label="Pago">
                    <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>
                      {order.paymentMethod}
                    </span>
                  </td>
                  <td data-label="Estado">
                    <span className={`${styles.statusBadge} ${styles['status_' + order.status]}`}>
                      {order.status === 'pending' ? 'Pendiente' : order.status === 'completed' ? 'Pagado' : 'Fallido'}
                    </span>
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
            <div className={styles.modalHeader}>
              <h2>
                Pedido <span className={styles.accent}>#{selectedOrder.orderNumber || selectedOrder.id.slice(-6)}</span>
              </h2>
              <span className={`${styles.statusBadge} ${styles['status_' + selectedOrder.status]}`} style={{ width: 'fit-content' }}>
                {selectedOrder.status === 'pending' ? 'Esperando Verificación' : selectedOrder.status === 'completed' ? 'Transacción Exitosa' : 'Pedido Rechazado'}
              </span>
              <button 
                onClick={() => setSelectedOrder(null)} 
                className={styles.modalCloseBtn}
                title="Cerrar"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.modalContent}>
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
                        <span style={{ fontSize: '1rem', color: 'var(--text-primary)', wordBreak: 'break-all' }}>{selectedOrder.email}</span>
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
                    <div style={{ display: 'grid', gap: '16px' }}>
                      {selectedOrder.items?.map((item: any, idx: number) => (
                        <div key={idx} className={styles.itemRow} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                            <div className={styles.itemThumbnail}>
                              <img src={item.images?.[0] || item.image || 'https://via.placeholder.com/60'} alt={item.name} />
                            </div>
                            <span style={{ color: 'var(--text-secondary)' }}>
                              <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: '0.95rem' }}>{item.name}</strong>
                              Cantidad: {item.quantity}
                            </span>
                          </div>
                          <span className={styles.itemPrice} style={{ fontWeight: 800, color: 'var(--brand-accent)', fontSize: '1rem' }}>
                            ₡{(item.price * item.quantity).toLocaleString()}
                          </span>
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
                  <div className={styles.paymentVerification} style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', border: '1px solid var(--border)', marginBottom: '24px' }}>
                    <div className={styles.paymentRow} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Método Seleccionado:</span>
                      <span className={styles.paymentValue} style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-primary)' }}>{selectedOrder.paymentMethod}</span>
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
                        <div className={styles.paymentRow} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>ID Transacción:</span>
                          <span className={styles.paymentValue} style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                            {selectedOrder.transactionId || 
                             (selectedOrder.notes?.includes('PayPal ID:') ? selectedOrder.notes.split('PayPal ID: ')[1] : 'Confirmado')}
                          </span>
                        </div>
                        <div className={styles.paymentRow} style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>Email Pagador:</span>
                          <span className={styles.paymentValue} style={{ fontSize: '0.75rem', fontWeight: 600 }}>{selectedOrder.payerEmail || 'PayPal Verified Account'}</span>
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
