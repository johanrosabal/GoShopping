'use client';

import { useEffect, useState } from 'react';
import { updateOrderStatus, subscribeToAllOrders } from '@/lib/services/orders';
import { Eye, Check, X, Clock, ExternalLink, Loader2, Search, Filter } from 'lucide-react';
import StatusModal, { ModalType } from '@/components/common/StatusModal';
import styles from './SinpeValidation.module.css';

interface SinpeValidationListProps {
  merchantId?: string;
  title?: string;
}

export default function SinpeValidationList({ merchantId, title = "Validación de Pagos SINPE" }: SinpeValidationListProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: ModalType;
    title: string;
    message: string;
  }>({ 
    isOpen: false, 
    type: 'error', 
    title: '', 
    message: '' 
  });

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToAllOrders((data) => {
      // Filter for SINPE and Pending
      const filtered = data.filter(order => 
        order.paymentMethod === 'sinpe' && 
        order.status === 'pending' &&
        (!merchantId || order.merchantId === merchantId)
      );
      setOrders(filtered);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [merchantId]);

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
        message: 'No logramos actualizar el estado del pedido.'
      });
    }
    setIsUpdating(false);
  };

  const filteredOrders = orders.filter(order => 
    order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>{title} <span className={styles.badge}>{orders.length}</span></h1>
        <p className={styles.subtitle}>Listado de pedidos esperando confirmación de transferencia bancaria.</p>
      </header>

      <div className={styles.filters}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Buscar por # pedido o cliente..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingState}>
          <Loader2 className="spin" size={40} />
          <p>Cargando comprobantes...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className={styles.emptyState}>
          <Clock size={48} />
          <h3>Todo al día</h3>
          <p>No hay pagos SINPE pendientes de validación en este momento.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredOrders.map(order => (
            <div key={order.id} className={styles.card} onClick={() => setSelectedOrder(order)}>
              <div className={styles.cardBadge}>PENDIENTE</div>
              <div className={styles.cardImage}>
                {order.sinpeVoucherUrl ? (
                  <img src={order.sinpeVoucherUrl} alt="Voucher" />
                ) : (
                  <div className={styles.noImage}>Sin Comprobante</div>
                )}
                <div className={styles.cardOverlay}>
                  <Eye size={24} />
                  <span>Ver Detalles</span>
                </div>
              </div>
              <div className={styles.cardContent}>
                <div className={styles.orderRef}>#{order.orderNumber}</div>
                <div className={styles.customerName}>{order.customerName}</div>
                <div className={styles.totalAmount}>₡{order.total.toLocaleString()}</div>
                <div className={styles.date}>{order.createdAt?.toDate().toLocaleString()}</div>
              </div>
              <div className={styles.cardActions}>
                <button 
                  className={styles.approveBtn}
                  onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, 'completed'); }}
                  disabled={isUpdating}
                >
                  <Check size={18} /> Aprobar
                </button>
                <button 
                  className={styles.rejectBtn}
                  onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, 'failed'); }}
                  disabled={isUpdating}
                >
                  <X size={18} /> Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Detalle */}
      {selectedOrder && (
        <div className={styles.modalOverlay} onClick={() => setSelectedOrder(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Validación Pedido #{selectedOrder.orderNumber}</h2>
              <button onClick={() => setSelectedOrder(null)} className={styles.closeBtn}><X size={24} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.voucherPreview}>
                <h3 className={styles.sectionTitle}>Comprobante de Pago</h3>
                {selectedOrder.sinpeVoucherUrl ? (
                  <a href={selectedOrder.sinpeVoucherUrl} target="_blank" rel="noopener noreferrer" className={styles.voucherLink}>
                    <img src={selectedOrder.sinpeVoucherUrl} alt="SINPE Voucher" />
                    <div className={styles.zoomTip}><ExternalLink size={14} /> Ver en pantalla completa</div>
                  </a>
                ) : (
                  <div className={styles.noVoucherError}>
                    El cliente no adjuntó una imagen de comprobante.
                  </div>
                )}
              </div>
              <div className={styles.orderSummary}>
                <h3 className={styles.sectionTitle}>Datos del Pedido</h3>
                <div className={styles.dataGrid}>
                  <div className={styles.dataItem}>
                    <label>Cliente</label>
                    <span>{selectedOrder.customerName}</span>
                  </div>
                  <div className={styles.dataItem}>
                    <label>Email</label>
                    <span>{selectedOrder.email}</span>
                  </div>
                  <div className={styles.dataItem}>
                    <label>Monto Total</label>
                    <span className={styles.accentAmount}>₡{selectedOrder.total.toLocaleString()}</span>
                  </div>
                  <div className={styles.dataItem}>
                    <label>Comercio</label>
                    <span>{selectedOrder.merchantName || 'GoShopping'}</span>
                  </div>
                </div>

                <div className={styles.itemsList}>
                   <label>Artículos:</label>
                   {selectedOrder.items?.map((item: any, i: number) => (
                     <div key={i} className={styles.itemRow}>
                       <span>{item.name} x{item.quantity}</span>
                       <span>₡{(item.price * item.quantity).toLocaleString()}</span>
                     </div>
                   ))}
                </div>

                <div className={styles.modalActions}>
                  <button 
                    className={styles.approveLargeBtn}
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'completed')}
                    disabled={isUpdating}
                  >
                    {isUpdating ? <Loader2 className="spin" size={20} /> : <><Check size={20} /> Confirmar Pago Recibido</>}
                  </button>
                  <button 
                    className={styles.rejectLargeBtn}
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'failed')}
                    disabled={isUpdating}
                  >
                    Rechazar Comprobante
                  </button>
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
