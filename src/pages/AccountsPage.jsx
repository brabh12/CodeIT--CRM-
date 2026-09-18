import React, { useEffect, useState } from 'react';
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
import { 
  getCrmServices, 
  getCrmPlans, 
  getCrmAccounts, 
  saveCrmAccount, 
  bulkAddCrmAccounts, 
  deleteCrmAccount 
} from '../lib/crmData';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [services, setServices] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [serviceTab, setServiceTab] = useState('all'); // 'all' | service_id
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');

  // Single Account Form State
  const [isSingleOpen, setIsSingleOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    account_email: '',
    account_password: '',
    service_id: '',
    plan_id: '',
    cost_price: '2000',
    status: 'available'
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk Add Form State
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkData, setBulkData] = useState({
    service_id: '',
    plan_id: '',
    cost_price: '2000',
    lines: ''
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
      const [fetchedServices, fetchedPlans, fetchedAccounts] = await Promise.all([
        getCrmServices(),
        getCrmPlans(),
        getCrmAccounts()
      ]);

      setServices(fetchedServices);
      setPlans(fetchedPlans);
      setAccounts(fetchedAccounts);
    } catch (err) {
      console.error('Error loading inventory:', err);
      addToast('Failed to load inventory', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddSingle = () => {
    setEditingAccount(null);
    const defaultService = serviceTab !== 'all' ? serviceTab : (services[0]?.id || 'svc-coursera');
    const plansForService = plans.filter(p => p.service_id === defaultService);
    const defaultPlan = plansForService[0] || plans[0];

    setFormData({
      account_email: '',
      account_password: '',
      service_id: defaultService,
      plan_id: defaultPlan?.id || '',
      cost_price: defaultPlan ? String(defaultPlan.default_cost_price || 0) : '2000',
      status: 'available'
    });
    setErrors({});
    setIsSingleOpen(true);
  };

  const handleOpenEdit = (account) => {
    setEditingAccount(account);
    const matchedPlan = plans.find(p => p.id === account.plan_id);
    const matchedServiceId = account.service_id || matchedPlan?.service_id || services[0]?.id || 'svc-coursera';

    setFormData({
      account_email: account.account_email || '',
      account_password: account.account_password || '',
      service_id: matchedServiceId,
      plan_id: account.plan_id || matchedPlan?.id || '',
      cost_price: String(account.cost_price || 0),
      status: account.status || 'available'
    });
    setErrors({});
    setIsSingleOpen(true);
  };

  const handleOpenBulk = () => {
    const defaultService = serviceTab !== 'all' ? serviceTab : (services[0]?.id || 'svc-coursera');
    const plansForService = plans.filter(p => p.service_id === defaultService);
    const defaultPlan = plansForService[0] || plans[0];

    setBulkData({
      service_id: defaultService,
      plan_id: defaultPlan?.id || '',
      cost_price: defaultPlan ? String(defaultPlan.default_cost_price || 0) : '2000',
      lines: ''
    });
    setBulkErrors({});
    setIsBulkOpen(true);
  };

  const handleSingleServiceChange = (newServiceId) => {
    const plansForService = plans.filter(p => p.service_id === newServiceId);
    const defaultPlan = plansForService[0];
    setFormData(prev => ({
      ...prev,
      service_id: newServiceId,
      plan_id: defaultPlan?.id || '',
      cost_price: defaultPlan ? String(defaultPlan.default_cost_price || 0) : prev.cost_price
    }));
  };

  const handleSinglePlanChange = (newPlanId) => {
    const matchedPlan = plans.find(p => p.id === newPlanId);
    setFormData(prev => ({
      ...prev,
      plan_id: newPlanId,
      cost_price: matchedPlan ? String(matchedPlan.default_cost_price || 0) : prev.cost_price
    }));
  };

  const handleBulkServiceChange = (newServiceId) => {
    const plansForService = plans.filter(p => p.service_id === newServiceId);
    const defaultPlan = plansForService[0];
    setBulkData(prev => ({
      ...prev,
      service_id: newServiceId,
      plan_id: defaultPlan?.id || '',
      cost_price: defaultPlan ? String(defaultPlan.default_cost_price || 0) : prev.cost_price
    }));
  };

  const handleBulkPlanChange = (newPlanId) => {
    const matchedPlan = plans.find(p => p.id === newPlanId);
    setBulkData(prev => ({
      ...prev,
      plan_id: newPlanId,
      cost_price: matchedPlan ? String(matchedPlan.default_cost_price || 0) : prev.cost_price
    }));
  };

  const validateSingleForm = () => {
    const errs = {};
    if (!formData.account_email.trim()) errs.account_email = 'Account email is required';
    if (!formData.account_password.trim()) errs.account_password = 'Password is required';
    if (!formData.service_id) errs.service_id = 'Select a service';
    if (!formData.plan_id) errs.plan_id = 'Select a plan';
    if (formData.cost_price === '' || isNaN(formData.cost_price)) errs.cost_price = 'Enter a valid cost price';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveSingle = async () => {
    if (!validateSingleForm()) return;

    setIsSubmitting(true);
    try {
      const selectedPlan = plans.find(p => p.id === formData.plan_id);
      const payload = {
        account_email: formData.account_email.trim(),
        account_password: formData.account_password.trim(),
        service_id: formData.service_id,
        plan_id: formData.plan_id,
        plan_type: selectedPlan?.plan_type || '1_month',
        cost_price: parseFloat(formData.cost_price),
        status: formData.status
      };

      if (editingAccount) {
        payload.id = editingAccount.id;
        await saveCrmAccount(payload);
        addToast('Account updated successfully', 'success');
      } else {
        await saveCrmAccount(payload);
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
    if (!bulkData.service_id) errs.service_id = 'Select a service';
    if (!bulkData.plan_id) errs.plan_id = 'Select a plan';
    if (!bulkData.lines.trim()) errs.lines = 'Paste at least one email:password line';
    if (bulkData.cost_price === '' || isNaN(bulkData.cost_price)) errs.cost_price = 'Enter a valid cost price';
    
    if (Object.keys(errs).length > 0) {
      setBulkErrors(errs);
      return;
    }

    const lines = bulkData.lines.split('\n').map(l => l.trim()).filter(Boolean);
    const parsedAccounts = [];
    const selectedPlan = plans.find(p => p.id === bulkData.plan_id);

    for (const line of lines) {
      const parts = line.split(':');
      if (parts.length >= 2) {
        const email = parts[0].trim();
        const password = parts.slice(1).join(':').trim();
        if (email && password) {
          parsedAccounts.push({
            account_email: email,
            account_password: password,
            service_id: bulkData.service_id,
            plan_id: bulkData.plan_id,
            plan_type: selectedPlan?.plan_type || '1_month',
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
      await bulkAddCrmAccounts(parsedAccounts);
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
      await deleteCrmAccount(deleteTarget.id);
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

  // Filter accounts by Service Tab, Status, and Plan
  const filteredAccounts = accounts.filter(acc => {
    const matchService = serviceTab === 'all' || acc.service_id === serviceTab || (acc.service?.id === serviceTab);
    const matchStatus = statusFilter === 'all' || acc.status === statusFilter;
    const matchPlan = planFilter === 'all' || acc.plan_id === planFilter || acc.plan_type === planFilter;
    return matchService && matchStatus && matchPlan;
  });

  // Filter available plans for the toolbar plan dropdown
  const plansForToolbar = serviceTab === 'all' 
    ? plans 
    : plans.filter(p => p.service_id === serviceTab);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Accounts (Inventory)</h1>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            Manage available and sold accounts across Coursera, CapCut, and future services.
          </p>
        </div>
        <div className="page-header-actions">
          <Button variant="secondary" icon={Layers} onClick={handleOpenBulk}>
            Bulk Add
          </Button>
          <Button variant="primary" icon={Plus} onClick={handleOpenAddSingle}>
            Add Account
          </Button>
        </div>
      </div>

      {/* Top-Level Service Tabs (Notion Segmented Bar) */}
      <div className="service-tabs-bar">
        <button
          type="button"
          className={`service-tab ${serviceTab === 'all' ? 'active' : ''}`}
          onClick={() => {
            setServiceTab('all');
            setPlanFilter('all');
          }}
        >
          <span>All Services</span>
          <span className="service-tab-count">{accounts.length}</span>
        </button>

        {services.map(svc => {
          const count = accounts.filter(a => a.service_id === svc.id || a.service?.id === svc.id).length;
          return (
            <button
              key={svc.id}
              type="button"
              className={`service-tab ${serviceTab === svc.id ? 'active' : ''}`}
              onClick={() => {
                setServiceTab(svc.id);
                setPlanFilter('all');
              }}
            >
              <span>{svc.name}</span>
              <span className="service-tab-count">{count}</span>
            </button>
          );
        })}
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
          style={{ width: '150px', height: '32px' }}
        />

        <Select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          placeholder=""
          options={[
            { value: 'all', label: 'All Plans' },
            ...plansForToolbar.map(p => {
              const svc = services.find(s => s.id === p.service_id);
              const labelPrefix = serviceTab === 'all' && svc ? `[${svc.name}] ` : '';
              return {
                value: p.id,
                label: `${labelPrefix}${p.name} Plan`
              };
            })
          ]}
          style={{ width: '170px', height: '32px' }}
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
            title="No accounts in this inventory"
            description="Add single or bulk subscription accounts to start selling."
            actionLabel="+ Add Account"
            onAction={handleOpenAddSingle}
          />
        ) : (
          <table className="notion-table">
            <thead>
              <tr>
                <th>Account Login / Email</th>
                <th>Password</th>
                <th>Service</th>
                <th>Plan</th>
                <th>Cost Price</th>
                <th>Status</th>
                <th>Created Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((account) => {
                const matchedService = services.find(s => s.id === account.service_id) || { name: 'Coursera', slug: 'coursera' };
                const matchedPlan = plans.find(p => p.id === account.plan_id);

                return (
                  <tr key={account.id}>
                    <td style={{ fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <KeyRound size={15} style={{ color: 'var(--color-text-secondary)' }} />
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
                      <Badge service={matchedService.slug} label={matchedService.name} />
                    </td>
                    <td>
                      <span style={{ textTransform: 'capitalize' }}>
                        {matchedPlan?.name || account.plan_type?.replace('_', ' ')} Plan
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
                );
              })}
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
        {/* Pick Service First */}
        <Select
          label="Service"
          value={formData.service_id}
          onChange={(e) => handleSingleServiceChange(e.target.value)}
          placeholder="Select service..."
          options={services.map(s => ({
            value: s.id,
            label: s.name
          }))}
          error={errors.service_id}
          required
        />

        {/* Pick Plan (filtered to service) */}
        <Select
          label="Plan Type"
          value={formData.plan_id}
          onChange={(e) => handleSinglePlanChange(e.target.value)}
          placeholder="Select plan..."
          options={plans
            .filter(p => p.service_id === formData.service_id)
            .map(p => ({
              value: p.id,
              label: `${p.name} (${p.default_sale_price} DZD default sale)`
            }))}
          error={errors.plan_id}
          required
        />

        <Input
          label="Account Login / Email"
          type="email"
          placeholder="user@example.com"
          value={formData.account_email}
          onChange={(e) => setFormData({ ...formData, account_email: e.target.value })}
          error={errors.account_email}
          required
        />

        <Input
          label="Account Password"
          placeholder="Enter account password"
          value={formData.account_password}
          onChange={(e) => setFormData({ ...formData, account_password: e.target.value })}
          error={errors.account_password}
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
          label="Service for All Accounts"
          value={bulkData.service_id}
          onChange={(e) => handleBulkServiceChange(e.target.value)}
          placeholder="Select service..."
          options={services.map(s => ({
            value: s.id,
            label: s.name
          }))}
          error={bulkErrors.service_id}
          required
        />

        <Select
          label="Plan Type for All Accounts"
          value={bulkData.plan_id}
          onChange={(e) => handleBulkPlanChange(e.target.value)}
          placeholder="Select plan..."
          options={plans
            .filter(p => p.service_id === bulkData.service_id)
            .map(p => ({
              value: p.id,
              label: `${p.name} Plan`
            }))}
          error={bulkErrors.plan_id}
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
