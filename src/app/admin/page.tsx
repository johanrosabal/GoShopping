'use client';

import { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Tag, 
  Package, 
  ArrowRight, 
  ShieldCheck, 
  TrendingUp, 
  Clock, 
  CreditCard,
  Eye,
  Activity,
  Plus,
  Users,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getAllOrders } from '@/lib/services/orders';
import { getProducts } from '@/lib/services/products';
import styles from './admin.module.css';

export default function AdminPage() {
  const { isAdmin, loading: authLoading, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSales: 0,
    pendingOrders: 0,
    totalProducts: 0,
    inventoryValue: 0,
    recentOrders: [] as any[]
  });
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, authLoading, router]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [orders, products] = await Promise.all([
          getAllOrders(),
          getProducts()
        ]);

        const totalSales = orders
          .filter(o => o.status === 'completed')
          .reduce((acc, current) => acc + (current.total || 0), 0);
          
        const pending = orders.filter(o => o.status === 'pending').length;

        const inventoryValue = products.reduce((acc, p) => acc + (p.price * p.stock), 0);

        setStats({
          totalSales,
          pendingOrders: pending,
          totalProducts: products.length,
          inventoryValue,
          recentOrders: orders.slice(0, 5)
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) fetchDashboardData();
  }, [isAdmin]);

  if (authLoading || (loading && isAdmin)) {
    return (
      <div className="container" style={{ padding: '100px', textAlign: 'center' }}>
        <Activity className="spin" size={40} color="var(--brand-accent)" />
        <p style={{ marginTop: '20px', color: 'var(--text-secondary)' }}>Sincronizando con el centro de mando...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  const kpis = [
    {
      label: 'Ingresos Totales',
      value: `₡${stats.totalSales.toLocaleString()}`,
      icon: <TrendingUp size={24} />,
      color: '#10b981',
      desc: 'Ventas completadas'
    },
    {
      label: 'Pedidos Pendientes',
      value: stats.pendingOrders.toString(),
      icon: <Clock size={24} />,
      color: '#f59e0b',
      desc: 'Requieren atención'
    },
    {
      color: 'var(--brand-accent)',
      desc: 'Productos activos'
    },
    {
      label: 'Valor del Inventario',
      value: `₡${stats.inventoryValue.toLocaleString()}`,
      icon: <CreditCard size={24} />,
      color: '#3b82f6',
      desc: 'Capital en stock'
    }
  ];

  return (
    <div className={`${styles.adminPage} container`}>
      <header className={`${styles.header} animate`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--brand-accent)', marginBottom: '16px' }}>
          <ShieldCheck size={20} />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Portal Administrativo V.I.P.</span>
        </div>
        <h1 style={{ fontSize: '2.5rem' }}>
          Bienvenido de nuevo, <span className={styles.accent}>{userData?.displayName?.split(' ')[0] || 'Administrador'}</span>
        </h1>
        <p style={{ color: 'var(--text-tertiary)', marginTop: '8px', fontSize: '1.1rem' }}>
          Hoy es un gran día para expandir el imperio de Go-Shopping.
        </p>
      </header>

      {/* KPI Section */}
      <div className={styles.statsGrid}>
        {kpis.map((kpi, idx) => (
          <div key={idx} className={`${styles.statCard} animate`} style={{ animationDelay: `${idx * 0.1}s` }}>
            <div className={styles.statIcon} style={{ background: `${kpi.color}15`, color: kpi.color }}>
              {kpi.icon}
            </div>
            <div className={styles.statInfo}>
              <h4>{kpi.label}</h4>
              <div className={styles.statValue}>{kpi.value}</div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>{kpi.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.modulesGrid}>
        <Link href="/admin/orders" className={`${styles.moduleCard} animate`} style={{ animationDelay: '0.3s' }}>
          <div className={styles.moduleIcon} style={{ background: '#f59e0b15', color: '#f59e0b' }}>
            <ShoppingBag size={32} />
          </div>
          <div className={styles.moduleInfo}>
            <h3>Gestión de Pedidos</h3>
            <p>Control de tickets, aprobación de pagos SINPE y logística.</p>
          </div>
          <ArrowRight size={20} className={styles.arrow} />
        </Link>

        <Link href="/admin/products" className={`${styles.moduleCard} animate`} style={{ animationDelay: '0.4s' }}>
          <div className={styles.moduleIcon} style={{ background: 'var(--brand-accent)15', color: 'var(--brand-accent)' }}>
            <Package size={32} />
          </div>
          <div className={styles.moduleInfo}>
            <h3>Inventario Elite</h3>
            <p>Control total de existencias, precios y stock mínimo de productos.</p>
          </div>
          <ArrowRight size={20} className={styles.arrow} />
        </Link>

        <Link href="/admin/users" className={`${styles.moduleCard} animate`} style={{ animationDelay: '0.5s' }}>
          <div className={styles.moduleIcon} style={{ background: '#3b82f615', color: '#3b82f6' }}>
            <Users size={32} />
          </div>
          <div className={styles.moduleInfo}>
            <h3>Usuarios</h3>
            <p>Directorio de clientes registrados y gestión de roles administrativos.</p>
          </div>
          <ArrowRight size={20} className={styles.arrow} />
        </Link>

        <Link href="/admin/categories" className={`${styles.moduleCard} animate`} style={{ animationDelay: '0.6s' }}>
          <div className={styles.moduleIcon} style={{ background: '#10b98115', color: '#10b981' }}>
            <Tag size={32} />
          </div>
          <div className={styles.moduleInfo}>
            <h3>Categorías</h3>
            <p>Estructura la navegación y organiza las colecciones de la tienda.</p>
          </div>
          <ArrowRight size={20} className={styles.arrow} />
        </Link>

        <Link href="/admin/settings" className={`${styles.moduleCard} animate`} style={{ animationDelay: '0.7s' }}>
          <div className={styles.moduleIcon} style={{ background: '#3498db15', color: '#3498db' }}>
            <Settings size={32} />
          </div>
          <div className={styles.moduleInfo}>
            <h3>Configuración Global</h3>
            <p>Cambia el eslogan, datos de contacto y redes sociales.</p>
          </div>
          <ArrowRight size={20} className={styles.arrow} />
        </Link>
      </div>

      {/* Recent Activity */}
      <section className={`${styles.dashboardSection} animate`} style={{ animationDelay: '0.6s' }}>
        <div className={styles.sectionHeader}>
          <h2><Activity size={20} color="var(--brand-accent)" /> Actividad Reciente</h2>
          <Link href="/admin/orders" className={styles.viewBtn}>Ver todos los pedidos</Link>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                    No hay actividad reciente para mostrar.
                  </td>
                </tr>
              ) : (
                stats.recentOrders.map(order => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 600 }}>{order.customerName}</td>
                    <td style={{ color: 'var(--text-tertiary)' }}>{order.createdAt?.toDate().toLocaleDateString()}</td>
                    <td style={{ fontWeight: 700, color: 'var(--brand-accent)' }}>₡{order.total?.toLocaleString()}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles['status_' + order.status]}`}>
                        {order.status === 'pending' ? 'Pendiente' : order.status === 'completed' ? 'Pagado' : 'Fallido'}
                      </span>
                    </td>
                    <td>
                      <Link href="/admin/orders" className={styles.viewBtn}>
                        <Eye size={14} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
