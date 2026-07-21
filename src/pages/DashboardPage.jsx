import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import StatCard from '../components/UI/StatCard';
import Badge from '../components/UI/Badge';
import Button from '../components/UI/Button';
import EmptyState from '../components/UI/EmptyState';
import { Users, KeyRound, ShoppingCart, TrendingUp, DollarSign, Plus } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    availableAccounts: 0,
    soldAccounts: 0,
    totalProfit: 0,
    monthlyProfit: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Customers Count
      const { count: customerCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

      // 2. Fetch Accounts Counts
      const { data: accounts } = await supabase
        .from('accounts')
        .select('status');

      const availableCount = accounts?.filter(a => a.status === 'available').length || 0;
      const soldCount = accounts?.filter(a => a.status === 'sold').length || 0;

      // 3. Fetch Orders for Profit & Recent List
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          id,
          plan_type,
          sale_price,
          cost_price,
          profit,
          order_status,
          created_at,
          customer:customers(full_name, phone)
        `)
        .order('created_at', { ascending: false });

      const validOrders = orders || [];
      const nonCancelledOrders = validOrders.filter(o => o.order_status !== 'cancelled');

      // Calculate Total Profit
      const totalProfit = nonCancelledOrders.reduce((sum, o) => sum + (Number(o.profit) || 0), 0);

      // Calculate Profit This Month
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyProfit = nonCancelledOrders
        .filter(o => {
          const d = new Date(o.created_at);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .reduce((sum, o) => sum + (Number(o.profit) || 0), 0);

      setStats({
        totalCustomers: customerCount || 0,
        availableAccounts: availableCount,
        soldAccounts: soldCount,
        totalProfit,
        monthlyProfit,
      });

      setRecentOrders(validOrders.slice(0, 5));
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    return `${Number(val || 0).toLocaleString('fr-DZ')} DZD`;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            Overview of customers, subscription inventory, and profits.
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => navigate('/orders')}>
          New Order
        </Button>
      </div>

      {loading ? (
        <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          Loading dashboard metrics...
        </div>
      ) : (
        <>
          {/* Key Metrics Grid */}
          <div className="stats-grid">
            <StatCard
              label="Total Customers"
              value={stats.totalCustomers}
              subtext="Registered clients"
              icon={Users}
            />
            <StatCard
              label="Available Accounts"
              value={stats.availableAccounts}
              subtext="Ready to sell"
              icon={KeyRound}
            />
            <StatCard
              label="Sold Accounts"
              value={stats.soldAccounts}
              subtext="Active subscriptions"
              icon={ShoppingCart}
            />
            <StatCard
              label="Total Profit"
              value={formatCurrency(stats.totalProfit)}
              subtext="Lifetime earnings"
              icon={DollarSign}
            />
            <StatCard
              label="Profit This Month"
              value={formatCurrency(stats.monthlyProfit)}
              subtext="Current month earnings"
              icon={TrendingUp}
            />
          </div>

          {/* Recent Orders Section */}
          <div style={{ marginTop: 'var(--space-6)' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: 'var(--space-3)'
            }}>
              <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>Recent Orders</h2>
              <Button variant="secondary" size="compact" onClick={() => navigate('/orders')}>
                View all orders
              </Button>
            </div>

            <div className="table-container">
              {recentOrders.length === 0 ? (
                <EmptyState
                  title="No orders yet"
                  description="Create your first order to start tracking revenue."
                  actionLabel="+ Create Order"
                  onAction={() => navigate('/orders')}
                />
              ) : (
                <table className="notion-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Plan Type</th>
                      <th>Sale Price</th>
                      <th>Profit</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td style={{ fontWeight: 500 }}>
                          {order.customer?.full_name || 'Unknown Customer'}
                        </td>
                        <td>
                          <span style={{ textTransform: 'capitalize' }}>
                            {order.plan_type?.replace('_', ' ')}
                          </span>
                        </td>
                        <td>{formatCurrency(order.sale_price)}</td>
                        <td style={{ 
                          fontWeight: 600, 
                          color: order.order_status === 'cancelled' 
                            ? 'var(--color-text-disabled)' 
                            : 'var(--color-success)' 
                        }}>
                          {order.order_status === 'cancelled' ? '0 DZD' : formatCurrency(order.profit)}
                        </td>
                        <td>
                          <Badge status={order.order_status} />
                        </td>
                        <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                          {new Date(order.created_at).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
