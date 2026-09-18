import React, { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import Badge from '../components/UI/Badge';
import SlideOver from '../components/UI/SlideOver';
import ConfirmModal from '../components/UI/ConfirmModal';
import EmptyState from '../components/UI/EmptyState';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  ShoppingCart, 
  Filter, 
  User, 
  KeyRound, 
  DollarSign, 
  UserPlus, 
  Inbox, 
  CheckCircle2, 
  Clock, 
  Phone, 
  Mail, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { 
  getCrmServices, 
  getCrmPlans, 
  getCrmAccounts, 
  getCrmOrders, 
  saveCrmOrder, 
  deleteCrmOrder, 
  getCrmCustomers, 
  saveCrmCustomer,
  getCrmLeads,
  updateLeadStatus
} from '../lib/crmData';

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'leads'
  const [orders, setOrders] = useState([]);
  const [leads, setLeads] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [services, setServices] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');

  // Order Slide-Over Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [processingLead, setProcessingLead] = useState(null);
  const [isInlineCustomer, setIsInlineCustomer] = useState(false);

  const [formData, setFormData] = useState({
    customer_id: '',
    new_customer_name: '',
    new_customer_phone: '',
    service_id: '',
    plan_id: '',
    account_id: '',
    sale_price: '3500',
    cost_price: '2000',
    order_status: 'delivered'
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [fetchedServices, fetchedPlans, fetchedCustomers, fetchedAccounts, fetchedOrders, fetchedLeads] = await Promise.all([
        getCrmServices(),
        getCrmPlans(),
        getCrmCustomers(),
        getCrmAccounts(),
        getCrmOrders(),
        getCrmLeads()
      ]);

      setServices(fetchedServices);
      setPlans(fetchedPlans);
      setCustomers(fetchedCustomers);
      setAccounts(fetchedAccounts);
      setOrders(fetchedOrders);
      setLeads(fetchedLeads);
    } catch (err) {
      console.error('Error loading orders data:', err);
      addToast('Failed to load orders data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Helper to auto-select account and price based on Service & Plan
  const autoSelectAccountAndPrice = (serviceId, planId, allAccounts, allPlans) => {
    const matchedPlan = allPlans.find(p => p.id === planId);
    const salePrice = matchedPlan ? String(matchedPlan.default_sale_price) : '3500';

    // Find first available account matching this service and plan
    const availAcc = allAccounts.find(a => 
      a.status === 'available' && 
      (a.plan_id === planId || (a.service_id === serviceId && a.plan_type === matchedPlan?.plan_type))
    );

    const accountId = availAcc ? availAcc.id : '';
    const costPrice = availAcc 
      ? String(availAcc.cost_price) 
      : (matchedPlan && matchedPlan.default_cost_price ? String(matchedPlan.default_cost_price) : '0');

    return { salePrice, costPrice, accountId };
  };

  const handleOpenAdd = () => {
    setEditingOrder(null);
    setProcessingLead(null);
    setIsInlineCustomer(false);

    const defaultService = services[0]?.id || 'svc-coursera';
    const plansForService = plans.filter(p => p.service_id === defaultService);
    const defaultPlan = plansForService[0]?.id || plans[0]?.id || '';
    const auto = autoSelectAccountAndPrice(defaultService, defaultPlan, accounts, plans);

    setFormData({
      customer_id: customers[0]?.id || '',
      new_customer_name: '',
      new_customer_phone: '',
      service_id: defaultService,
      plan_id: defaultPlan,
      account_id: auto.accountId,
      sale_price: auto.salePrice,
      cost_price: auto.costPrice,
      order_status: 'delivered'
    });
    setErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (order) => {
    setEditingOrder(order);
    setProcessingLead(null);
    setIsInlineCustomer(false);

    setFormData({
      customer_id: order.customer_id || '',
      new_customer_name: '',
      new_customer_phone: '',
      service_id: order.service_id || 'svc-coursera',
      plan_id: order.plan_id || '',
      account_id: order.account_id || '',
      sale_price: String(order.sale_price || 0),
      cost_price: String(order.cost_price || 0),
      order_status: order.order_status || 'delivered'
    });
    setErrors({});
    setIsFormOpen(true);
  };

  // Convert an incoming web lead into an active order
  const handleProcessLead = (lead) => {
    setProcessingLead(lead);
    setEditingOrder(null);
    setIsInlineCustomer(false);

    // Identify target service (CapCut for /capcut leads)
    const targetService = services.find(s => s.slug === lead.service) || services.find(s => s.slug === 'capcut') || services[0];
    const servicePlans = plans.filter(p => p.service_id === targetService?.id);
    const targetPlan = servicePlans[0] || plans[0];

    // Check if customer already exists by phone
    const existingCust = customers.find(c => c.phone === lead.phone);
    const auto = autoSelectAccountAndPrice(targetService?.id, targetPlan?.id, accounts, plans);

    if (existingCust) {
      setFormData({
        customer_id: existingCust.id,
        new_customer_name: '',
        new_customer_phone: '',
        service_id: targetService?.id || '',
        plan_id: targetPlan?.id || '',
        account_id: auto.accountId,
        sale_price: auto.salePrice,
        cost_price: auto.costPrice,
        order_status: 'delivered'
      });
    } else {
      setIsInlineCustomer(true);
      setFormData({
        customer_id: '',
        new_customer_name: lead.full_name,
        new_customer_phone: lead.phone,
        service_id: targetService?.id || '',
        plan_id: targetPlan?.id || '',
        account_id: auto.accountId,
        sale_price: auto.salePrice,
        cost_price: auto.costPrice,
        order_status: 'delivered'
      });
    }

    setErrors({});
    setIsFormOpen(true);
  };

  const handleServiceChange = (newServiceId) => {
    const plansForNewService = plans.filter(p => p.service_id === newServiceId);
    const defaultPlan = plansForNewService[0]?.id || '';
    const auto = autoSelectAccountAndPrice(newServiceId, defaultPlan, accounts, plans);

    setFormData(prev => ({
      ...prev,
      service_id: newServiceId,
      plan_id: defaultPlan,
      account_id: auto.accountId,
      sale_price: auto.salePrice,
      cost_price: auto.costPrice
    }));
  };

  const handlePlanChange = (newPlanId) => {
    const auto = autoSelectAccountAndPrice(formData.service_id, newPlanId, accounts, plans);
    setFormData(prev => ({
      ...prev,
      plan_id: newPlanId,
      account_id: auto.accountId,
      sale_price: auto.salePrice,
      cost_price: auto.costPrice
    }));
  };

  const handleAccountChange = (newAccountId) => {
    const selectedAcc = accounts.find(a => a.id === newAccountId);
    setFormData(prev => ({
      ...prev,
      account_id: newAccountId,
      cost_price: selectedAcc ? String(selectedAcc.cost_price) : prev.cost_price
    }));
  };

  const validateForm = () => {
    const errs = {};
    if (isInlineCustomer) {
      if (!formData.new_customer_name.trim()) errs.new_customer_name = 'Customer name is required';
      if (!formData.new_customer_phone.trim()) errs.new_customer_phone = 'Phone number is required';
    } else {
      if (!formData.customer_id) errs.customer_id = 'Please select a customer';
    }

    if (!formData.service_id) errs.service_id = 'Select a service';
    if (!formData.plan_id) errs.plan_id = 'Select a plan';
    if (!formData.sale_price || isNaN(formData.sale_price)) errs.sale_price = 'Enter a valid sale price';
    if (!formData.cost_price || isNaN(formData.cost_price)) errs.cost_price = 'Enter a valid cost price';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveOrder = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      let activeCustomerId = formData.customer_id;

      // 1. Handle Inline Customer Creation
      if (isInlineCustomer) {
        const newCust = await saveCrmCustomer({
          full_name: formData.new_customer_name.trim(),
          phone: formData.new_customer_phone.trim(),
          email: processingLead?.email || null,
          notes: processingLead ? `Created from CapCut landing page lead (${processingLead.payment_method})` : null
        });
        activeCustomerId = newCust[newCust.length - 1].id;
      }

      // 2. Prepare Order Payload (writes service_id and plan_id)
      const selectedPlan = plans.find(p => p.id === formData.plan_id);
      const payload = {
        customer_id: activeCustomerId,
        account_id: formData.account_id || null,
        service_id: formData.service_id,
        plan_id: formData.plan_id,
        plan_type: selectedPlan?.plan_type || '1_month',
        sale_price: parseFloat(formData.sale_price),
        cost_price: parseFloat(formData.cost_price),
        order_status: formData.order_status
      };

      if (editingOrder) {
        payload.id = editingOrder.id;
        await saveCrmOrder(payload);
        addToast('Order updated successfully', 'success');
      } else {
        await saveCrmOrder(payload);
        addToast('Order created successfully', 'success');
      }

      // 3. If processing a lead, mark lead as completed
      if (processingLead) {
        await updateLeadStatus(processingLead.id, 'completed');
        addToast('Web lead marked as completed!', 'info');
      }

      setIsFormOpen(false);
      fetchInitialData();
    } catch (err) {
      console.error('Error saving order:', err);
      addToast(err.message || 'Failed to save order', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteCrmOrder(deleteTarget.id);
      addToast('Order deleted successfully', 'success');
      setDeleteTarget(null);
      fetchInitialData();
    } catch (err) {
      console.error('Error deleting order:', err);
      addToast(err.message || 'Failed to delete order', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(o => {
    const matchStatus = statusFilter === 'all' || o.order_status === statusFilter;
    const matchService = serviceFilter === 'all' || o.service_id === serviceFilter || (o.service?.slug === serviceFilter);
    return matchStatus && matchService;
  });

  // Filter available accounts matching the active form's service & plan
  const availableAccountsForPlan = accounts.filter(a => {
    const matchPlan = a.plan_id === formData.plan_id || a.plan_type === plans.find(p => p.id === formData.plan_id)?.plan_type;
    const matchService = !a.service_id || a.service_id === formData.service_id;
    const isAvailOrCurrent = a.status === 'available' || a.id === formData.account_id;
    return matchPlan && matchService && isAvailOrCurrent;
  });

  const pendingLeadsCount = leads.filter(l => l.status === 'pending').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders & Sales</h1>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            Manage subscription sales across Coursera, CapCut, and review incoming web orders.
          </p>
        </div>
        <div className="page-header-actions">
          <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
            New Order
          </Button>
        </div>
      </div>

      {/* Main Mode Tabs: Sales vs Incoming Web Leads */}
      <div className="service-tabs-bar" style={{ marginBottom: 'var(--space-4)' }}>
        <button
          type="button"
          className={`service-tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <ShoppingCart size={14} />
          <span>All Sales Orders</span>
          <span className="service-tab-count">{orders.length}</span>
        </button>

        <button
          type="button"
          className={`service-tab ${activeTab === 'leads' ? 'active' : ''}`}
          onClick={() => setActiveTab('leads')}
        >
          <Inbox size={14} />
          <span>Incoming Web Orders (Leads)</span>
          {pendingLeadsCount > 0 && (
            <span className="service-tab-count" style={{ backgroundColor: '#fef08a', color: '#854d0e', fontWeight: 700 }}>
              {pendingLeadsCount} New
            </span>
          )}
        </button>
      </div>

      {activeTab === 'leads' ? (
        /* ========================================================
           INCOMING WEB LEADS TABLE (CapCut / External Landing Pages)
           ======================================================== */
        <div>
          <div style={{
            backgroundColor: 'var(--color-accent-bg-subtle)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3) var(--space-4)',
            marginBottom: 'var(--space-4)',
            fontSize: 'var(--text-xs)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <strong>Public Landing Submissions:</strong> Orders placed directly by customers on the public landing page (e.g. <code>/capcut</code>). Confirm payment and click <strong>Process Sale</strong> to assign an available account.
            </div>
            <a 
              href="/capcut" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-accent)', fontWeight: 600 }}
            >
              <span>View /capcut page</span>
              <ExternalLink size={12} />
            </a>
          </div>

          <div className="table-container">
            {loading ? (
              <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                Loading incoming leads...
              </div>
            ) : leads.length === 0 ? (
              <EmptyState
                title="No incoming web orders yet"
                description="Orders submitted through public pages like /capcut will appear here for payment confirmation and account delivery."
              />
            ) : (
              <table className="notion-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Service</th>
                    <th>Contact Phone</th>
                    <th>Email Address</th>
                    <th>Payment Method</th>
                    <th>Notes / Ref</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id}>
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <User size={15} style={{ color: 'var(--color-text-secondary)' }} />
                          <span>{lead.full_name}</span>
                        </div>
                      </td>
                      <td>
                        <Badge service={lead.service || 'capcut'} label={lead.service === 'capcut' ? 'CapCut Pro' : lead.service} />
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 'var(--text-xs)' }}>
                        {lead.phone}
                      </td>
                      <td style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
                        {lead.email}
                      </td>
                      <td>
                        <span style={{ textTransform: 'capitalize', fontSize: 'var(--text-xs)' }}>
                          {lead.payment_method === 'baridimob' ? 'Baridimob (RIP)' : lead.payment_method === 'ccp' ? 'CCP' : lead.payment_method || 'Manual'}
                        </span>
                      </td>
                      <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {lead.notes || '—'}
                      </td>
                      <td>
                        <Badge status={lead.status} />
                      </td>
                      <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                        {new Date(lead.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {lead.status === 'pending' ? (
                          <Button
                            variant="primary"
                            size="compact"
                            icon={CheckCircle2}
                            onClick={() => handleProcessLead(lead)}
                          >
                            Process Sale
                          </Button>
                        ) : (
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', fontWeight: 500 }}>
                            Fulfilled ✓
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        /* ========================================================
           ALL SALES ORDERS TABLE (Coursera, CapCut & Future)
           ======================================================== */
        <div>
          {/* Filters Toolbar */}
          <div className="filters-row" style={{ 
            display: 'flex', 
            gap: 'var(--space-3)', 
            marginBottom: 'var(--space-4)', 
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Filter size={16} style={{ color: 'var(--color-text-secondary)' }} />
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Filters:</span>
            </div>

            {/* Service Filter */}
            <Select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              placeholder=""
              options={[
                { value: 'all', label: 'All Services' },
                ...services.map(s => ({ value: s.id, label: s.name }))
              ]}
              style={{ width: '150px', height: '32px' }}
            />

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              placeholder=""
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'delivered', label: 'Delivered' },
                { value: 'pending', label: 'Pending' },
                { value: 'cancelled', label: 'Cancelled' }
              ]}
              style={{ width: '150px', height: '32px' }}
            />
          </div>

          {/* Table Container */}
          <div className="table-container">
            {loading ? (
              <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                Loading order records...
              </div>
            ) : filteredOrders.length === 0 ? (
              <EmptyState
                title="No orders found"
                description="Create your first sale order to link customers with inventory accounts."
                actionLabel="+ Create Order"
                onAction={handleOpenAdd}
              />
            ) : (
              <table className="notion-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Service</th>
                    <th>Plan</th>
                    <th>Assigned Account</th>
                    <th>Sale Price</th>
                    <th>Cost</th>
                    <th>Profit</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => {
                    const matchedService = services.find(s => s.id === order.service_id) || { name: 'Coursera', slug: 'coursera' };
                    const matchedPlan = plans.find(p => p.id === order.plan_id);

                    return (
                      <tr key={order.id}>
                        <td style={{ fontWeight: 500 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <User size={15} style={{ color: 'var(--color-text-secondary)' }} />
                            <span>{order.customer?.full_name || 'Customer'}</span>
                          </div>
                        </td>
                        <td>
                          <Badge service={matchedService.slug} label={matchedService.name} />
                        </td>
                        <td>
                          <span style={{ textTransform: 'capitalize' }}>
                            {matchedPlan?.name || order.plan_type?.replace('_', ' ')} Plan
                          </span>
                        </td>
                        <td style={{ fontSize: 'var(--text-xs)' }}>
                          {order.account ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                              <KeyRound size={13} style={{ color: 'var(--color-accent)' }} />
                              <span>{order.account.account_email}</span>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--color-text-disabled)' }}>Unassigned</span>
                          )}
                        </td>
                        <td>{Number(order.sale_price).toLocaleString('fr-DZ')} DZD</td>
                        <td style={{ color: 'var(--color-text-secondary)' }}>
                          {Number(order.cost_price).toLocaleString('fr-DZ')} DZD
                        </td>
                        <td style={{ 
                          fontWeight: 600, 
                          color: order.order_status === 'cancelled' ? 'var(--color-text-disabled)' : 'var(--color-success)' 
                        }}>
                          {order.order_status === 'cancelled' ? '0 DZD' : `${Number(order.profit).toLocaleString('fr-DZ')} DZD`}
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
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-1)' }}>
                            <Button
                              variant="secondary"
                              size="compact"
                              icon={Edit2}
                              onClick={() => handleOpenEdit(order)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="danger"
                              size="compact"
                              icon={Trash2}
                              onClick={() => setDeleteTarget(order)}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Create / Edit Order Slide-Over Panel */}
      <SlideOver
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={
          processingLead 
            ? 'Process Incoming Web Order' 
            : editingOrder 
              ? 'Edit Order' 
              : 'Create New Order'
        }
        onSave={handleSaveOrder}
        isSubmitting={isSubmitting}
      >
        {/* Customer Selection or Inline Add */}
        {!editingOrder && (
          <div style={{ marginBottom: 'var(--space-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
              <span className="form-label" style={{ marginBottom: 0 }}>Customer</span>
              {!processingLead && (
                <button
                  type="button"
                  onClick={() => setIsInlineCustomer(!isInlineCustomer)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--color-accent)',
                    fontSize: 'var(--text-xs)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <UserPlus size={14} />
                  <span>{isInlineCustomer ? 'Select existing customer' : '+ Create new customer'}</span>
                </button>
              )}
            </div>

            {!isInlineCustomer ? (
              <Select
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                placeholder="Choose a customer..."
                options={customers.map(c => ({
                  value: c.id,
                  label: `${c.full_name} (${c.phone})`
                }))}
                error={errors.customer_id}
                required
              />
            ) : (
              <div style={{
                border: '1px solid var(--color-border-default)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3)',
                backgroundColor: 'var(--color-bg-secondary)'
              }}>
                <Input
                  label="Customer Full Name"
                  placeholder="e.g. Salim B"
                  value={formData.new_customer_name}
                  onChange={(e) => setFormData({ ...formData, new_customer_name: e.target.value })}
                  error={errors.new_customer_name}
                  required
                />
                <Input
                  label="Phone Number"
                  placeholder="e.g. 0661998877"
                  value={formData.new_customer_phone}
                  onChange={(e) => setFormData({ ...formData, new_customer_phone: e.target.value })}
                  error={errors.new_customer_phone}
                  required
                />
              </div>
            )}
          </div>
        )}

        {/* 1. Pick Service First */}
        <Select
          label="1. Service"
          value={formData.service_id}
          onChange={(e) => handleServiceChange(e.target.value)}
          placeholder="Select service..."
          options={services.map(s => ({
            value: s.id,
            label: s.name
          }))}
          error={errors.service_id}
          required
        />

        {/* 2. Pick Plan (filtered to selected service) */}
        <Select
          label="2. Subscription Plan"
          value={formData.plan_id}
          onChange={(e) => handlePlanChange(e.target.value)}
          placeholder="Select plan..."
          options={plans
            .filter(p => p.service_id === formData.service_id)
            .map(p => ({
              value: p.id,
              label: `${p.name} Plan (${p.default_sale_price} DZD default sale)`
            }))}
          error={errors.plan_id}
          required
        />

        {/* 3. Pick Account from Inventory */}
        <Select
          label="3. Assign Inventory Account"
          value={formData.account_id}
          onChange={(e) => handleAccountChange(e.target.value)}
          placeholder="No account assigned yet"
          options={availableAccountsForPlan.map(a => ({
            value: a.id,
            label: `${a.account_email} (${a.status})`
          }))}
          hint={availableAccountsForPlan.length === 0 ? 'No available account found for this service & plan. You can add one in Inventory or assign later.' : undefined}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <Input
            label="Sale Price (DZD)"
            type="number"
            value={formData.sale_price}
            onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
            error={errors.sale_price}
            required
          />
          <Input
            label="Cost Price (DZD)"
            type="number"
            value={formData.cost_price}
            onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
            error={errors.cost_price}
            required
          />
        </div>

        {/* Live Computed Profit */}
        <div style={{
          backgroundColor: 'var(--color-accent-bg-subtle)',
          padding: 'var(--space-3)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-accent-hover)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-4)'
        }}>
          <span>Computed Profit:</span>
          <strong>
            {((parseFloat(formData.sale_price) || 0) - (parseFloat(formData.cost_price) || 0)).toLocaleString('fr-DZ')} DZD
          </strong>
        </div>

        <Select
          label="Order Status"
          value={formData.order_status}
          onChange={(e) => setFormData({ ...formData, order_status: e.target.value })}
          placeholder=""
          options={[
            { value: 'delivered', label: 'Delivered (Account marked as sold)' },
            { value: 'pending', label: 'Pending (Account reserved)' },
            { value: 'cancelled', label: 'Cancelled (Account freed)' }
          ]}
          required
        />
      </SlideOver>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Order"
        message="Are you sure you want to delete this order record? If an account was assigned, it will revert to available status."
        confirmLabel="Delete Order"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        isSubmitting={isDeleting}
      />
    </div>
  );
}
