import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/UI/StatCard';
import Badge from '../components/UI/Badge';
import Button from '../components/UI/Button';
import EmptyState from '../components/UI/EmptyState';
import { 
  Users, 
  KeyRound, 
  ShoppingCart, 
  TrendingUp, 
  DollarSign, 
  Plus, 
  Inbox, 
  Layers, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { 
  getCrmServices, 
  getCrmAccounts, 
  getCrmOrders, 
  getCrmCustomers, 
  getCrmLeads 
} from '../lib/crmData';

export default function DashboardPage() {
  const [services, setServices] = useState([]);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    availableAccounts: 0,
    soldAccounts: 0,
    totalProfit: 0,
    monthlyProfit: 0,
    totalRevenue: 0
  });
  const [serviceBreakdowns, setServiceBreakdowns] = useState([]);
  const [pendingLeads, setPendingLeads] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [fetchedServices, fetchedCustomers, fetchedAccounts, fetchedOrders, fetchedLeads] = await Promise.all([
        getCrmServices(),
        getCrmCustomers(),
        getCrmAccounts(),
        getCrmOrders(),
        getCrmLeads()
      ]);

      setServices(fetchedServices);

      const customerCount = fetchedCustomers.length;
      const availableCount = fetchedAccounts.filter(a => a.status === 'available').length;
      const soldCount = fetchedAccounts.filter(a => a.status === 'sold').length;

      const validOrders = fetchedOrders || [];
      const nonCancelledOrders = validOrders.filter(o => o.order_status !== 'cancelled');

      const totalProfit = nonCancelledOrders.reduce((sum, o) => sum + (Number(o.profit) || 0), 0);
      const totalRevenue = nonCancelledOrders.reduce((sum, o) => sum + (Number(o.sale_price) || 0), 0);

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyProfit = nonCancelledOrders
        .filter(o => {
          const d = new Date(o.created_at);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .reduce((sum, o) => sum + (Number(o.profit) || 0), 0);

      setStats({
        totalCustomers: customerCount,
        availableAccounts: availableCount,
        soldAccounts: soldCount,
        totalProfit,
        monthlyProfit,
        totalRevenue
      });

      // Calculate Per-Service Breakdown
      const breakdowns = fetchedServices.map(svc => {
        const svcAccounts = fetchedAccounts.filter(a => a.service_id === svc.id || a.service?.id === svc.id);
        const svcOrders = nonCancelledOrders.filter(o => o.service_id === svc.id || o.service?.id === svc.id || (svc.slug === 'coursera' && !o.service_id));
        
        const svcAvailable = svcAccounts.filter(a => a.status === 'available').length;
        const svcSold = svcAccounts.filter(a => a.status === 'sold').length;
        const svcRevenue = svcOrders.reduce((sum, o) => sum + (Number(o.sale_price) || 0), 0);
        const svcProfit = svcOrders.reduce((sum, o) => sum + (Number(o.profit) || 0), 0);

        return {
          service: svc,
          availableAccounts: svcAvailable,
          soldAccounts: svcSold,
          revenue: svcRevenue,
          profit: svcProfit,
          orderCount: svcOrders.length
        };
      });

      setServiceBreakdowns(breakdowns);
      setPendingLeads(fetchedLeads.filter(l => l.status === 'pending'));
      setRecentOrders(validOrders.slice(0, 6));
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
            Overview of customers, inventory, profits, and multi-service breakdowns.
          </p>
        </div>
        <div className="page-header-actions">
          <Button variant="primary" icon={Plus} onClick={() => navigate('/orders')}>
            New Order
          </Button>
        </div>
      </div>

      {/* Incoming Web Leads Alert Banner */}
      {pendingLeads.length > 0 && (
        <div style={{
          backgroundColor: '#fefce8',
          border: '1px solid #fef08a',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-3) var(--space-4)',
          marginBottom: 'var(--space-5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 'var(--text-xs)',
          color: '#854d0e'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Inbox size={16} />
            <span>
              <strong>{pendingLeads.length} Incoming Web Orders:</strong> You have new pending orders from public landing pages (CapCut) waiting to be reviewed and fulfilled.
            </span>
          </div>
          <Button 
            variant="secondary" 
            size="compact" 
            icon={ArrowRight} 
            onClick={() => navigate('/orders')}
          >
            Review Orders
          </Button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          Loading dashboard metrics...
        </div>
      ) : (
        <>
          {/* Combined Top Metrics */}
          <div className="stats-grid">
            <StatCard
              label="Total Customers"
              value={stats.totalCustomers}
              subtext="Registered clients"
              icon={Users}
            />
            <StatCard
              label="Available Inventory"
              value={stats.availableAccounts}
              subtext="Ready across all services"
              icon={KeyRound}
            />
            <StatCard
              label="Sold Subscriptions"
              value={stats.soldAccounts}
              subtext="Total active accounts"
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
              subtext="Current month margin"
              icon={TrendingUp}
            />
          </div>

          {/* Service Breakdown Cards */}
          <div style={{ marginTop: 'var(--space-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
              <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>Performance by Service</h2>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Coursera vs. CapCut</span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'var(--space-4)'
            }}>
              {serviceBreakdowns.map(({ service, availableAccounts, soldAccounts, revenue, profit, orderCount }) => (
                <div key={service.id} style={{
                  border: '1px solid var(--color-border-default)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-bg-default)',
                  padding: 'var(--space-4)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <Badge service={service.slug} label={service.name} />
                      <strong style={{ fontSize: 'var(--text-sm)' }}>{service.name}</strong>
                    </div>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                      {orderCount} Sales
                    </span>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 'var(--space-2)',
                    paddingTop: 'var(--space-2)',
                    borderTop: '1px solid var(--color-border-default)'
                  }}>
                    <div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Available Stock</div>
                      <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>{availableAccounts}</div>
                    </div>

                    <div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Sold Accounts</div>
                      <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>{soldAccounts}</div>
                    </div>

                    <div style={{ marginTop: 'var(--space-2)' }}>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Total Revenue</div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{formatCurrency(revenue)}</div>
                    </div>

                    <div style={{ marginTop: 'var(--space-2)' }}>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Service Profit</div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-success)' }}>
                        {formatCurrency(profit)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders Section */}
          <div style={{ marginTop: 'var(--space-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
              <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>Recent Sales Activity</h2>
              <Button variant="secondary" size="compact" onClick={() => navigate('/orders')}>
                View All Orders
              </Button>
            </div>

            <div className="table-container">
              {recentOrders.length === 0 ? (
                <EmptyState
                  title="No sales yet"
                  description="Create your first subscription sale to see performance logs."
                  actionLabel="+ Create Order"
                  onAction={() => navigate('/orders')}
                />
              ) : (
                <table className="notion-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Service</th>
                      <th>Plan</th>
                      <th>Sale Price</th>
                      <th>Profit</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((ord) => {
                      const matchedSvc = services.find(s => s.id === ord.service_id) || { name: 'Coursera', slug: 'coursera' };
                      return (
                        <tr key={ord.id}>
                          <td style={{ fontWeight: 500 }}>
                            {ord.customer?.full_name || 'Customer'}
                          </td>
                          <td>
                            <Badge service={matchedSvc.slug} label={matchedSvc.name} />
                          </td>
                          <td>
                            <span style={{ textTransform: 'capitalize' }}>
                              {ord.plan?.name || ord.plan_type?.replace('_', ' ')} Plan
                            </span>
                          </td>
                          <td>{formatCurrency(ord.sale_price)}</td>
                          <td style={{ fontWeight: 600, color: ord.order_status === 'cancelled' ? 'var(--color-text-disabled)' : 'var(--color-success)' }}>
                            {ord.order_status === 'cancelled' ? '0 DZD' : formatCurrency(ord.profit)}
                          </td>
                          <td>
                            <Badge status={ord.order_status} />
                          </td>
                          <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                            {new Date(ord.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                          </td>
                        </tr>
                      );
                    })}
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
