import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import Badge from '../components/UI/Badge';
import SlideOver from '../components/UI/SlideOver';
import ConfirmModal from '../components/UI/ConfirmModal';
import EmptyState from '../components/UI/EmptyState';
import { Plus, Edit2, Trash2, ShoppingCart, Filter, User, KeyRound, DollarSign, UserPlus } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter
  const [statusFilter, setStatusFilter] = useState('all');

  // Order Slide-Over Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [isInlineCustomer, setIsInlineCustomer] = useState(false);

  const [formData, setFormData] = useState({
    customer_id: '',
    new_customer_name: '',
    new_customer_phone: '',
    plan_type: '1_month',
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
      // 1. Fetch settings for default prices
      const { data: settingsData } = await supabase
        .from('settings')
        .select('*')
        .order('plan_type');
      setPlans(settingsData || []);

      // 2. Fetch customers
      const { data: customersData } = await supabase
        .from('customers')
        .select('id, full_name, phone')
        .order('full_name');
      setCustomers(customersData || []);

      // 3. Fetch accounts (available + sold for assignment dropdown)
      const { data: accountsData } = await supabase
        .from('accounts')
        .select('id, account_email, account_password, plan_type, status, cost_price')
        .order('created_at', { ascending: false });
      setAccounts(accountsData || []);

      // 4. Fetch orders
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(full_name, phone),
          account:accounts(account_email, account_password, status)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(ordersData || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      addToast(err.message || 'Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const autoSelectAccountAndPrice = (planType, currentAccounts, currentPlans) => {
    const matchedPlan = currentPlans.find(p => p.plan_type === planType);
    const salePrice = matchedPlan ? String(matchedPlan.default_sale_price) : '3500';
    
    // Find first available account of this plan type
    const availAcc = currentAccounts.find(a => a.plan_type === planType && a.status === 'available');
    const accountId = availAcc ? availAcc.id : '';
    const costPrice = availAcc 
      ? String(availAcc.cost_price) 
      : (matchedPlan ? String(matchedPlan.default_cost_price) : '2000');

    return { salePrice, costPrice, accountId };
  };

  const handleOpenAdd = () => {
    setEditingOrder(null);
    setIsInlineCustomer(false);
    const defaultPlan = plans[0]?.plan_type || '1_month';
    const auto = autoSelectAccountAndPrice(defaultPlan, accounts, plans);

    setFormData({
      customer_id: customers[0]?.id || '',
      new_customer_name: '',
      new_customer_phone: '',
      plan_type: defaultPlan,
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
    setIsInlineCustomer(false);

    setFormData({
      customer_id: order.customer_id || '',
      new_customer_name: '',
      new_customer_phone: '',
      plan_type: order.plan_type || '1_month',
      account_id: order.account_id || '',
      sale_price: String(order.sale_price || 0),
      cost_price: String(order.cost_price || 0),
      order_status: order.order_status || 'delivered'
    });
    setErrors({});
    setIsFormOpen(true);
  };

  const handlePlanChange = (newPlanType) => {
    const auto = autoSelectAccountAndPrice(newPlanType, accounts, plans);
    setFormData(prev => ({
      ...prev,
      plan_type: newPlanType,
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
        const { data: newCust, error: custError } = await supabase
          .from('customers')
          .insert([{
            full_name: formData.new_customer_name.trim(),
            phone: formData.new_customer_phone.trim()
          }])
          .select()
          .single();

        if (custError) throw custError;
        activeCustomerId = newCust.id;
      }

      // 2. Prepare Order Payload
      const payload = {
        customer_id: activeCustomerId,
        account_id: formData.account_id || null,
        plan_type: formData.plan_type,
        sale_price: parseFloat(formData.sale_price),
        cost_price: parseFloat(formData.cost_price),
        order_status: formData.order_status
      };

      if (editingOrder) {
        const { error } = await supabase
          .from('orders')
          .update(payload)
          .eq('id', editingOrder.id);
        if (error) throw error;
        addToast('Order updated successfully', 'success');
      } else {
        const { error } = await supabase
          .from('orders')
          .insert([payload]);
        if (error) throw error;
        addToast('Order created successfully', 'success');
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
      // If deleting an order with an assigned account, release account back to available
      if (deleteTarget.account_id && deleteTarget.order_status !== 'cancelled') {
        await supabase
          .from('accounts')
          .update({ status: 'available', sold_at: null })
          .eq('id', deleteTarget.account_id);
      }

      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', deleteTarget.id);

      if (error) throw error;
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
    if (statusFilter === 'all') return true;
    return o.order_status === statusFilter;
  });

  // Filter available accounts for current form plan type
  const availableAccountsForPlan = accounts.filter(a => 
    a.plan_type === formData.plan_type && 
    (a.status === 'available' || a.id === formData.account_id)
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders / Sales</h1>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            Track sales, assign inventory accounts, and calculate profit margins.
          </p>
        </div>
        <div className="page-header-actions">
          <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
            New Order
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="filters-row" style={{ 
        display: 'flex', 
        gap: 'var(--space-3)', 
        marginBottom: 'var(--space-4)', 
        alignItems: 'center' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Filter size={16} style={{ color: 'var(--color-text-secondary)' }} />
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Status:</span>
        </div>

        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          placeholder=""
          options={[
            { value: 'all', label: 'All Orders' },
            { value: 'delivered', label: 'Delivered' },
            { value: 'pending', label: 'Pending' },
            { value: 'cancelled', label: 'Cancelled' }
          ]}
          style={{ width: '160px', height: '32px' }}
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
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <User size={16} style={{ color: 'var(--color-text-secondary)' }} />
                      <span>{order.customer?.full_name || 'Unknown Customer'}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ textTransform: 'capitalize' }}>
                      {order.plan_type?.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ fontSize: 'var(--text-xs)' }}>
                    {order.account ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                        <KeyRound size={14} style={{ color: 'var(--color-accent)' }} />
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
                    color: order.order_status === 'cancelled' 
                      ? 'var(--color-text-disabled)' 
                      : 'var(--color-success)' 
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
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Order Slide-Over */}
      <SlideOver
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingOrder ? 'Edit Order' : 'Create New Order'}
        onSave={handleSaveOrder}
        isSubmitting={isSubmitting}
      >
        {/* Customer Selection or Inline Add */}
        {!editingOrder && (
          <div style={{ marginBottom: 'var(--space-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
              <span className="form-label" style={{ marginBottom: 0 }}>Customer</span>
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

        <Select
          label="Plan Type"
          value={formData.plan_type}
          onChange={(e) => handlePlanChange(e.target.value)}
          placeholder=""
          options={plans.map(p => ({
            value: p.plan_type,
            label: `${p.plan_type.replace('_', ' ')} Plan`
          }))}
          required
        />

        <Select
          label="Assign Account from Inventory"
          value={formData.account_id}
          onChange={(e) => handleAccountChange(e.target.value)}
          placeholder="No account assigned yet"
          options={availableAccountsForPlan.map(a => ({
            value: a.id,
            label: `${a.account_email} (${a.status})`
          }))}
          hint={availableAccountsForPlan.length === 0 ? 'No available account found for this plan. You can assign one later.' : undefined}
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
          justify: 'space-between',
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
            { value: 'pending', label: 'Pending (Account held)' },
            { value: 'cancelled', label: 'Cancelled (Account freed to available)' }
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
