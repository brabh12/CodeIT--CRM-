import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Textarea from '../components/UI/Textarea';
import Badge from '../components/UI/Badge';
import SlideOver from '../components/UI/SlideOver';
import ConfirmModal from '../components/UI/ConfirmModal';
import EmptyState from '../components/UI/EmptyState';
import { Plus, Search, Edit2, Trash2, User, Phone, Mail, FileText, ShoppingCart } from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Form slide-over state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({ full_name: '', phone: '', email: '', notes: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Customer Detail slide-over state
  const [detailCustomer, setDetailCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      // Fetch customers with their orders to compute count and last status
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          orders (
            id,
            plan_type,
            sale_price,
            order_status,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (err) {
      console.error('Error fetching customers:', err);
      addToast(err.message || 'Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({ full_name: '', phone: '', email: '', notes: '' });
    setErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (customer, e) => {
    e.stopPropagation();
    setEditingCustomer(customer);
    setFormData({
      full_name: customer.full_name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      notes: customer.notes || ''
    });
    setErrors({});
    setIsFormOpen(true);
  };

  const handleOpenDetail = async (customer) => {
    setDetailCustomer(customer);
    setLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          account:accounts(account_email, account_password)
        `)
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomerOrders(data || []);
    } catch (err) {
      console.error('Error fetching customer orders:', err);
      addToast('Failed to load customer orders', 'error');
    } finally {
      setLoadingOrders(false);
    }
  };


  const validateForm = () => {
    const errs = {};
    if (!formData.full_name.trim()) errs.full_name = 'Full name is required';
    if (!formData.phone.trim()) errs.phone = 'Phone number is required';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Enter a valid email address';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveCustomer = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || null,
        notes: formData.notes.trim() || null
      };

      if (editingCustomer) {
        const { error } = await supabase
          .from('customers')
          .update(payload)
          .eq('id', editingCustomer.id);
        if (error) throw error;
        addToast('Customer updated successfully', 'success');
      } else {
        const { error } = await supabase
          .from('customers')
          .insert([payload]);
        if (error) throw error;
        addToast('Customer added successfully', 'success');
      }

      setIsFormOpen(false);
      fetchCustomers();
    } catch (err) {
      console.error('Error saving customer:', err);
      addToast(err.message || 'Failed to save customer', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };




  

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', deleteTarget.id);

      if (error) throw error;
      addToast('Customer deleted successfully', 'success');
      setDeleteTarget(null);
      if (detailCustomer?.id === deleteTarget.id) setDetailCustomer(null);
      fetchCustomers();
    } catch (err) {
      console.error('Error deleting customer:', err);
      addToast(err.message || 'Failed to delete customer', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter customers by search query
  const filteredCustomers = customers.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      (c.full_name || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            Manage client profiles and view order histories.
          </p>
        </div>
        <div className="page-header-actions">
          <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
            Add Customer
          </Button>
        </div>
      </div>

      {/* Search & Toolbar */}
      <div className="search-input-wrapper" style={{ marginBottom: 'var(--space-4)', maxWidth: '300px', width: '100%', position: 'relative' }}>
        <Input
          placeholder="Search by name, phone, email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ paddingLeft: '32px' }}
        />
        <Search 
          size={16} 
          style={{ 
            position: 'absolute', 
            left: '10px', 
            top: '10px', 
            color: 'var(--color-text-secondary)' 
          }} 
        />
      </div>

      {/* Table Container */}
      <div className="table-container">
        {loading ? (
          <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            Loading customers...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <EmptyState
            title="No customers found"
            description={searchQuery ? 'No customers match your search.' : 'Add your first customer to get started.'}
            actionLabel={!searchQuery ? '+ Add Customer' : undefined}
            onAction={!searchQuery ? handleOpenAdd : undefined}
          />
        ) : (
          <table className="notion-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Orders</th>
                <th>Last Order Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => {
                const ordersList = customer.orders || [];
                const sortedOrders = [...ordersList].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                const lastOrderStatus = sortedOrders[0]?.order_status;

                return (
                  <tr 
                    key={customer.id} 
                    onClick={() => handleOpenDetail(customer)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <User size={16} style={{ color: 'var(--color-text-secondary)' }} />
                        <span>{customer.full_name}</span>
                      </div>
                    </td>
                    <td>{customer.phone}</td>
                    <td style={{ color: customer.email ? 'inherit' : 'var(--color-text-disabled)' }}>
                      {customer.email || '—'}
                    </td>
                    <td>{ordersList.length}</td>
                    <td>
                      {lastOrderStatus ? (
                        <Badge status={lastOrderStatus} />
                      ) : (
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-disabled)' }}>No orders</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-1)' }}>
                        <Button
                          variant="secondary"
                          size="compact"
                          icon={Edit2}
                          onClick={(e) => handleOpenEdit(customer, e)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="compact"
                          icon={Trash2}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(customer);
                          }}
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

      {/* Add / Edit Customer Slide-Over Panel */}
      <SlideOver
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
        onSave={handleSaveCustomer}
        isSubmitting={isSubmitting}
      >
        <Input
          label="Full Name"
          placeholder="e.g. Karim Ahmed"
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          error={errors.full_name}
          required
        />
        <Input
          label="Phone Number"
          placeholder="e.g. 0550123456"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          error={errors.phone}
          required
        />
        <Input
          label="Email Address (Optional)"
          type="email"
          placeholder="e.g. karim@gmail.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          error={errors.email}
        />
        <Textarea
          label="Notes (Optional)"
          placeholder="e.g. Prefers WhatsApp communication..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </SlideOver>

      {/* Customer Detail & Order History Slide-Over Panel */}
      <SlideOver
        isOpen={!!detailCustomer}
        onClose={() => setDetailCustomer(null)}
        title="Customer Details"
      >
        {detailCustomer && (
          <div>
            <div style={{ 
              backgroundColor: 'var(--color-bg-secondary)', 
              borderRadius: 'var(--radius-md)', 
              padding: 'var(--space-4)',
              marginBottom: 'var(--space-5)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)'
            }}>
              <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>{detailCustomer.full_name}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-xs)' }}>
                <Phone size={14} style={{ color: 'var(--color-text-secondary)' }} />
                <span>{detailCustomer.phone}</span>
              </div>
              {detailCustomer.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-xs)' }}>
                  <Mail size={14} style={{ color: 'var(--color-text-secondary)' }} />
                  <span>{detailCustomer.email}</span>
                </div>
              )}
              {detailCustomer.notes && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', marginTop: 'var(--space-1)' }}>
                  <FileText size={14} style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }} />
                  <span style={{ color: 'var(--color-text-secondary)' }}>{detailCustomer.notes}</span>
                </div>
              )}
            </div>

            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <ShoppingCart size={16} />
              <span>Purchase History ({customerOrders.length})</span>
            </h3>

            {loadingOrders ? (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', padding: 'var(--space-4)' }}>
                Loading order history...
              </div>
            ) : customerOrders.length === 0 ? (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', padding: 'var(--space-4)', textAlign: 'center' }}>
                No orders placed by this customer yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {customerOrders.map((ord) => (
                  <div key={ord.id} style={{
                    border: '1px solid var(--color-border-default)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-3)',
                    backgroundColor: 'var(--color-bg-default)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                      <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                        {ord.plan_type?.replace('_', ' ')} Plan
                      </span>
                      <Badge status={ord.order_status} />
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Price: {Number(ord.sale_price).toLocaleString('fr-DZ')} DZD</span>
                      <span>Profit: {Number(ord.profit).toLocaleString('fr-DZ')} DZD</span>
                    </div>
                    {ord.account && (
                      <div style={{
                        marginTop: 'var(--space-2)',
                        paddingTop: 'var(--space-2)',
                        borderTop: '1px dashed var(--color-border-default)',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-text-primary)'
                      }}>
                        <div><strong>Account Email:</strong> {ord.account.account_email}</div>
                        <div><strong>Password:</strong> {ord.account.account_password}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </SlideOver>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Customer"
        message={`Are you sure you want to delete "${deleteTarget?.full_name}"? This action cannot be undone.`}
        confirmLabel="Delete Customer"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        isSubmitting={isDeleting}
      />
    </div>
  );
}
