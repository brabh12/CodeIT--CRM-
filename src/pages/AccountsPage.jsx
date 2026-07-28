import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import Textarea from '../components/UI/Textarea';
import Badge from '../components/UI/Badge';
import SlideOver from '../components/UI/SlideOver';
import ConfirmModal from '../components/UI/ConfirmModal';
import EmptyState from '../components/UI/EmptyState';
import { Plus, Edit2, Trash2, KeyRound, Copy, Check, Filter, Layers } from 'lucide-react';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');

  // Single Account Form State
  const [isSingleOpen, setIsSingleOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    account_email: '',
    account_password: '',
    plan_type: '1_month',
    cost_price: '2000',
    status: 'available'
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk Add Form State
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkData, setBulkData] = useState({
    lines: '',
    plan_type: '1_month',
    cost_price: '2000'
  });
  const [bulkErrors, setBulkErrors] = useState({});

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Copy password helper state
  const [copiedId, setCopiedId] = useState(null);

  const { addToast } = useToast();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch available plan settings
      const { data: settingsData } = await supabase
        .from('settings')
        .select('*')
        .order('plan_type');
      
      setPlans(settingsData || []);

      // Set default plan and price in forms if available
      if (settingsData && settingsData.length > 0) {
        const defaultPlan = settingsData[0];
        setFormData(prev => ({
          ...prev,
          plan_type: defaultPlan.plan_type,
          cost_price: String(defaultPlan.default_cost_price)
        }));
        setBulkData(prev => ({
          ...prev,
          plan_type: defaultPlan.plan_type,
          cost_price: String(defaultPlan.default_cost_price)
        }));
      }

      // 2. Fetch inventory accounts
      const { data: accountsData, error } = await supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccounts(accountsData || []);
    } catch (err) {
      console.error('Error fetching accounts:', err);
      addToast(err.message || 'Failed to load inventory', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddSingle = () => {
    setEditingAccount(null);
    const defaultPlan = plans[0];
    setFormData({
      account_email: '',
      account_password: '',
      plan_type: defaultPlan ? defaultPlan.plan_type : '1_month',
      cost_price: defaultPlan ? String(defaultPlan.default_cost_price) : '2000',
      status: 'available'
    });
    setErrors({});
    setIsSingleOpen(true);
  };

  const handleOpenEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      account_email: account.account_email || '',
      account_password: account.account_password || '',
      plan_type: account.plan_type || '1_month',
      cost_price: String(account.cost_price || 0),
      status: account.status || 'available'
    });
    setErrors({});
    setIsSingleOpen(true);
  };

  const handlePlanChange = (selectedPlanType) => {
    const matchedPlan = plans.find(p => p.plan_type === selectedPlanType);
    setFormData(prev => ({
      ...prev,
      plan_type: selectedPlanType,
      cost_price: matchedPlan ? String(matchedPlan.default_cost_price) : prev.cost_price
    }));
  };

  const handleBulkPlanChange = (selectedPlanType) => {
    const matchedPlan = plans.find(p => p.plan_type === selectedPlanType);
    setBulkData(prev => ({
      ...prev,
      plan_type: selectedPlanType,
      cost_price: matchedPlan ? String(matchedPlan.default_cost_price) : prev.cost_price
    }));
  };

  const validateSingleForm = () => {
    const errs = {};
    if (!formData.account_email.trim()) errs.account_email = 'Account email is required';
    if (!formData.account_password.trim()) errs.account_password = 'Password is required';
    if (!formData.cost_price || isNaN(formData.cost_price)) errs.cost_price = 'Enter a valid cost price';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveSingle = async () => {
    if (!validateSingleForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        account_email: formData.account_email.trim(),
        account_password: formData.account_password.trim(),
        plan_type: formData.plan_type,
        cost_price: parseFloat(formData.cost_price),
        status: formData.status
      };

      if (editingAccount) {
        const { error } = await supabase
          .from('accounts')
          .update(payload)
          .eq('id', editingAccount.id);
        if (error) throw error;
        addToast('Account updated successfully', 'success');
      } else {
        const { error } = await supabase
          .from('accounts')
          .insert([payload]);
        if (error) throw error;
        addToast('Account added to inventory', 'success');
      }

      setIsSingleOpen(false);
      fetchInitialData();
    } catch (err) {
      console.error('Error saving account:', err);
      addToast(err.message || 'Failed to save account', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveBulk = async () => {
    const errs = {};
    if (!bulkData.lines.trim()) errs.lines = 'Paste at least one email:password line';
    if (!bulkData.cost_price || isNaN(bulkData.cost_price)) errs.cost_price = 'Enter a valid cost price';
    
    if (Object.keys(errs).length > 0) {
      setBulkErrors(errs);
      return;
    }

    // Parse lines format email:password
    const lines = bulkData.lines.split('\n').map(l => l.trim()).filter(Boolean);
    const parsedAccounts = [];

    for (const line of lines) {
      const parts = line.split(':');
      if (parts.length >= 2) {
        const email = parts[0].trim();
        const password = parts.slice(1).join(':').trim();
        if (email && password) {
          parsedAccounts.push({
            account_email: email,
            account_password: password,
            plan_type: bulkData.plan_type,
            cost_price: parseFloat(bulkData.cost_price),
            status: 'available'
          });
        }
      }
    }

    if (parsedAccounts.length === 0) {
      setBulkErrors({ lines: 'No valid "email:password" pairs found. Use format email:password per line.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('accounts')
        .insert(parsedAccounts);

      if (error) throw error;
      addToast(`Successfully added ${parsedAccounts.length} accounts to inventory!`, 'success');
      setIsBulkOpen(false);
      setBulkData(prev => ({ ...prev, lines: '' }));
      fetchInitialData();
    } catch (err) {
      console.error('Bulk insert error:', err);
      addToast(err.message || 'Failed to bulk import accounts', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', deleteTarget.id);

      if (error) throw error;
      addToast('Account deleted from inventory', 'success');
      setDeleteTarget(null);
      fetchInitialData();
    } catch (err) {
      console.error('Error deleting account:', err);
      addToast(err.message || 'Failed to delete account', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    addToast('Password copied to clipboard', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter accounts
  const filteredAccounts = accounts.filter(acc => {
    const matchStatus = statusFilter === 'all' || acc.status === statusFilter;
    const matchPlan = planFilter === 'all' || acc.plan_type === planFilter;
    return matchStatus && matchPlan;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Accounts (Inventory)</h1>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            Manage available and sold Coursera subscription accounts.
          </p>
        </div>
        <div className="page-header-actions">
          <Button variant="secondary" icon={Layers} onClick={() => setIsBulkOpen(true)}>
            Bulk Add
          </Button>
          <Button variant="primary" icon={Plus} onClick={handleOpenAddSingle}>
            Add Account
          </Button>
        </div>
      </div>

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

        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          placeholder=""
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'available', label: 'Available' },
            { value: 'sold', label: 'Sold' },
            { value: 'expired', label: 'Expired / Disabled' }
          ]}
          style={{ width: '160px', height: '32px' }}
        />

        <Select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          placeholder=""
          options={[
            { value: 'all', label: 'All Plans' },
            ...plans.map(p => ({
              value: p.plan_type,
              label: `${p.plan_type.replace('_', ' ')} Plan`
            }))
          ]}
          style={{ width: '160px', height: '32px' }}
        />
      </div>

      {/* Table Container */}
      <div className="table-container">
        {loading ? (
          <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            Loading subscription inventory...
          </div>
        ) : filteredAccounts.length === 0 ? (
          <EmptyState
            title="No accounts in inventory"
            description="Add single or bulk subscription accounts to start selling."
            actionLabel="+ Add Account"
            onAction={handleOpenAddSingle}
          />
        ) : (
          <table className="notion-table">
            <thead>
              <tr>
                <th>Account Email</th>
                <th>Password</th>
                <th>Plan Type</th>
                <th>Cost Price</th>
                <th>Status</th>
                <th>Created Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((account) => (
                <tr key={account.id}>
                  <td style={{ fontWeight: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <KeyRound size={16} style={{ color: 'var(--color-text-secondary)' }} />
                      <span>{account.account_email}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <span style={{ fontFamily: 'monospace' }}>••••••••</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(account.account_password, account.id)}
                        title="Copy password"
                        style={{
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          color: 'var(--color-text-secondary)'
                        }}
                      >
                        {copiedId === account.id ? <Check size={14} style={{ color: 'var(--color-success)' }} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </td>
                  <td>
                    <span style={{ textTransform: 'capitalize' }}>
                      {account.plan_type?.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{Number(account.cost_price || 0).toLocaleString('fr-DZ')} DZD</td>
                  <td>
                    <Badge status={account.status} />
                  </td>
                  <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                    {new Date(account.created_at).toLocaleDateString('en-GB', {
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
                        onClick={() => handleOpenEdit(account)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="compact"
                        icon={Trash2}
                        onClick={() => setDeleteTarget(account)}
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

      {/* Add / Edit Single Account Slide-Over */}
      <SlideOver
        isOpen={isSingleOpen}
        onClose={() => setIsSingleOpen(false)}
        title={editingAccount ? 'Edit Account' : 'Add Single Account'}
        onSave={handleSaveSingle}
        isSubmitting={isSubmitting}
      >
        <Input
          label="Coursera Account Email"
          type="email"
          placeholder="coursera.user@example.com"
          value={formData.account_email}
          onChange={(e) => setFormData({ ...formData, account_email: e.target.value })}
          error={errors.account_email}
          required
        />
        <Input
          label="Account Password"
          placeholder="Enter password"
          value={formData.account_password}
          onChange={(e) => setFormData({ ...formData, account_password: e.target.value })}
          error={errors.account_password}
          required
        />
        <Select
          label="Plan Type"
          value={formData.plan_type}
          onChange={(e) => handlePlanChange(e.target.value)}
          placeholder=""
          options={plans.map(p => ({
            value: p.plan_type,
            label: `${p.plan_type.replace('_', ' ')} (${p.default_sale_price} DZD default sale)`
          }))}
          required
        />
        <Input
          label="Cost Price (DZD)"
          type="number"
          placeholder="2000"
          value={formData.cost_price}
          onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
          error={errors.cost_price}
          hint="Price you paid to acquire this account"
          required
        />
        <Select
          label="Inventory Status"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          placeholder=""
          options={[
            { value: 'available', label: 'Available' },
            { value: 'sold', label: 'Sold' },
            { value: 'expired', label: 'Expired / Disabled' }
          ]}
          required
        />
      </SlideOver>

      {/* Bulk Add Accounts Slide-Over */}
      <SlideOver
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        title="Bulk Add Accounts"
        onSave={handleSaveBulk}
        saveLabel="Import Accounts"
        isSubmitting={isSubmitting}
      >
        <Select
          label="Plan Type for All Accounts"
          value={bulkData.plan_type}
          onChange={(e) => handleBulkPlanChange(e.target.value)}
          placeholder=""
          options={plans.map(p => ({
            value: p.plan_type,
            label: `${p.plan_type.replace('_', ' ')} Plan`
          }))}
          required
        />
        <Input
          label="Cost Price per Account (DZD)"
          type="number"
          value={bulkData.cost_price}
          onChange={(e) => setBulkData({ ...bulkData, cost_price: e.target.value })}
          error={bulkErrors.cost_price}
          required
        />
        <Textarea
          label="Account Lines (email:password)"
          rows={8}
          placeholder={`user1@gmail.com:pass123\nuser2@gmail.com:pass456\nuser3@gmail.com:secret789`}
          value={bulkData.lines}
          onChange={(e) => setBulkData({ ...bulkData, lines: e.target.value })}
          error={bulkErrors.lines}
          hint="Paste one account per line formatted as email:password"
          required
        />
      </SlideOver>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Account"
        message={`Are you sure you want to delete account "${deleteTarget?.account_email}" from inventory?`}
        confirmLabel="Delete Account"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        isSubmitting={isDeleting}
      />
    </div>
  );
}
