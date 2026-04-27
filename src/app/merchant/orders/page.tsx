'use client';

import { useEffect, useState } from 'react';
import { getOrdersByMerchant, OrderData, updateOrderStatus } from '@/lib/services/orders';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ArrowLeft, 
  Loader2, 
  Eye, 
  DollarSign,
  User,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from '../../admin/admin.module.css';

export default function MerchantOrdersPage() {
  const { userData } = useAuth();
  const [orders, setOrders] = useState<(OrderData & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    let mId = userData?.merchantId;
    
    // Auto-discovery if missing in profile
    if (!mId && userData?.uid) {
      const { getMerchantByOwnerUid } = await import('@/lib/services/merchants');
      const merchant = await getMerchantByOwnerUid(userData.uid);
      if (merchant) {
        mId = merchant.id;
      }
    }

    if (!mId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const data = await getOrdersByMerchant(mId);
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [userData]);

  const handleStatusChange = async (orderId: string, newStatus: 'completed' | 'failed') => {
    const success = await updateOrderStatus(orderId, newStatus);
    if (success) {
      fetchOrders();
    }
  };

  return (
    <div className={`${styles.adminPage} container animate`}>
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/merchant/dashboard" className={styles.viewBtn}>
            <ArrowLeft size={18} />
          </Link>
          <h1>Gestión de <span style={{ color: '#8b5cf6' }}>Ventas</span></h1>
        </div>
        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
          {orders.length} Pedidos registrados
        </div>
      </header>

      <div className={styles.tableContainer}>
        {loading ? (
          <div style={{ padding: '100px', textAlign: 'center' }}>
            <Loader2 className="spin" size={40} color="#8b5cf6" />
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Pedido #</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Estado</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? (
                orders.map(order => (
                  <tr key={order.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#8b5cf6' }}>#{order.orderNumber}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600 }}>{order.customerName}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{order.email}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {(order as any).createdAt?.toDate().toLocaleDateString('es-CR')}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 800, color: 'var(--brand-accent)' }}>
                        ₡{order.total.toLocaleString()}
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles['status_' + order.status]}`}>
                        {order.status === 'pending' ? 'Por Procesar' : order.status === 'completed' ? 'Despachado' : 'Cancelado'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        {order.status === 'pending' && (
                          <>
                            <button 
                              className={styles.viewBtn} 
                              style={{ padding: '8px', color: '#2ecc71', borderColor: 'rgba(46, 204, 113, 0.2)' }}
                              onClick={() => handleStatusChange(order.id, 'completed')}
                              title="Marcar como Despachado"
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button 
                              className={styles.clearBtn} 
                              style={{ padding: '8px' }}
                              onClick={() => handleStatusChange(order.id, 'failed')}
                              title="Anular Pedido"
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                        <Link href={`/merchant/orders/${order.id}`} className={styles.viewBtn} style={{ padding: '8px' }} title="Ver Detalles">
                          <Eye size={16} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ padding: '80px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    <ShoppingBag size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
                    <p>Aún no has recibido pedidos en tu tienda comercial.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
