import React, { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import Badge from '../components/UI/Badge';
import SlideOver from '../components/UI/SlideOver';
import EmptyState from '../components/UI/EmptyState';
import { Plus, Edit2, Sliders, Info, ShieldCheck } from 'lucide-react';
import { getCrmServices, getCrmPlans, saveCrmPlan } from '../lib/crmData';

export default function SettingsPage() {
  const [services, setServices] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit / Add Slide-Over State
  const [isOpen, setIsOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    service_id: '',
    name: '',
    plan_type: '',
    default_sale_price: '',
    default_cost_price: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const [fetchedServices, fetchedPlans] = await Promise.all([
        getCrmServices(),
        getCrmPlans()
      ]);
      setServices(fetchedServices);
      setPlans(fetchedPlans);
    } catch (err) {
      console.error('Error fetching settings:', err);
      addToast('Failed to load pricing settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = (defaultServiceId) => {
    setEditingPlan(null);
    setFormData({
      service_id: defaultServiceId || services[0]?.id || 'svc-coursera',
      name: '',
      plan_type: '',
      default_sale_price: '',
      default_cost_price: ''
    });
    setErrors({});
    setIsOpen(true);
  };

  const handleOpenEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      service_id: plan.service_id || services[0]?.id || 'svc-coursera',
      name: plan.name || plan.plan_type,
      plan_type: plan.plan_type,
      default_sale_price: String(plan.default_sale_price || ''),
      default_cost_price: plan.default_cost_price !== null && plan.default_cost_price !== undefined ? String(plan.default_cost_price) : ''
    });
    setErrors({});
    setIsOpen(true);
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.service_id) errs.service_id = 'Please select a service';
    if (!formData.name.trim()) errs.name = 'Plan name is required (e.g. 1-Month)';
    if (!formData.default_sale_price || isNaN(formData.default_sale_price)) {
      errs.default_sale_price = 'Enter a valid default sale price';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const normalizedPlanKey = formData.plan_type.trim() 
        ? formData.plan_type.trim().toLowerCase().replace(/\s+/g, '_')
        : formData.name.trim().toLowerCase().replace(/\s+/g, '_');

      const payload = {
        service_id: formData.service_id,
        name: formData.name.trim(),
        plan_type: normalizedPlanKey,
        default_sale_price: parseFloat(formData.default_sale_price),
        default_cost_price: formData.default_cost_price !== '' ? parseFloat(formData.default_cost_price) : null
      };

      if (editingPlan) {
        payload.id = editingPlan.id;
      }

      await saveCrmPlan(payload);
      addToast(editingPlan ? 'Plan pricing updated' : 'New plan created', 'success');
      setIsOpen(false);
      fetchSettings();
    } catch (err) {
      console.error('Error saving plan:', err);
      addToast('Failed to save plan pricing', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings & Pricing</h1>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            Configure plans, sale prices, and default cost prices grouped per service.
          </p>
        </div>
        <div className="page-header-actions">
          <Button variant="primary" icon={Plus} onClick={() => handleOpenAdd()}>
            Add Plan
          </Button>
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        backgroundColor: 'var(--color-accent-bg-subtle)',
        border: '1px solid var(--color-border-default)',
        padding: 'var(--space-3) var(--space-4)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--space-5)',
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-primary)'
      }}>
        <Info size={16} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
        <span>
          <strong>Pricing Defaults:</strong> These prices auto-fill when creating a new order or calculating profits. They remain fully overridable per individual sale.
        </span>
      </div>

      {loading ? (
        <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          Loading pricing configuration...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {services.map((service) => {
            const plansForService = plans.filter(p => p.service_id === service.id);

            return (
              <div key={service.id} style={{
                border: '1px solid var(--color-border-default)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-bg-default)',
                overflow: 'hidden'
              }}>
                {/* Service Section Header */}
                <div style={{
                  padding: 'var(--space-3) var(--space-4)',
                  backgroundColor: 'var(--color-bg-secondary)',
                  borderBottom: '1px solid var(--color-border-default)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <Badge service={service.slug} label={service.name} />
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                      {service.name} Subscription Plans
                    </span>
                  </div>
                  <Button 
                    variant="secondary" 
                    size="compact" 
                    icon={Plus} 
                    onClick={() => handleOpenAdd(service.id)}
                  >
                    Add {service.name} Plan
                  </Button>
                </div>

                {/* Plans Table */}
                {plansForService.length === 0 ? (
                  <div style={{ padding: 'var(--space-4)', textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                    No pricing plans configured for {service.name} yet.
                  </div>
                ) : (
                  <table className="notion-table" style={{ border: 'none' }}>
                    <thead>
                      <tr>
                        <th>Plan Name</th>
                        <th>Identifier Code</th>
                        <th>Default Sale Price</th>
                        <th>Default Cost Price</th>
                        <th>Estimated Margin</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plansForService.map((plan) => {
                        const sale = Number(plan.default_sale_price) || 0;
                        const cost = plan.default_cost_price !== null ? Number(plan.default_cost_price) : 0;
                        const margin = sale - cost;

                        return (
                          <tr key={plan.id}>
                            <td style={{ fontWeight: 600 }}>{plan.name || plan.plan_type}</td>
                            <td style={{ fontFamily: 'monospace', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                              {plan.plan_type}
                            </td>
                            <td style={{ fontWeight: 600 }}>{sale.toLocaleString('fr-DZ')} DZD</td>
                            <td style={{ color: 'var(--color-text-secondary)' }}>
                              {plan.default_cost_price !== null ? `${cost.toLocaleString('fr-DZ')} DZD` : <span style={{ color: 'var(--color-text-disabled)' }}>Editable per sale</span>}
                            </td>
                            <td style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                              {plan.default_cost_price !== null ? `+${margin.toLocaleString('fr-DZ')} DZD` : '—'}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <Button
                                variant="secondary"
                                size="compact"
                                icon={Edit2}
                                onClick={() => handleOpenEdit(plan)}
                              >
                                Edit Price
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Slide-Over */}
      <SlideOver
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editingPlan ? `Edit Pricing: ${editingPlan.name || editingPlan.plan_type}` : 'Add New Plan'}
        onSave={handleSave}
        isSubmitting={isSubmitting}
      >
        <Select
          label="Target Service"
          value={formData.service_id}
          onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
          placeholder="Select service..."
          options={services.map(s => ({ value: s.id, label: s.name }))}
          error={errors.service_id}
          required
        />

        <Input
          label="Plan Display Name"
          placeholder="e.g. 1-Month, 3-Month, VIP"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
          required
        />

        <Input
          label="Plan Key Identifier (Slug)"
          placeholder="e.g. 1_month, 3_month"
          value={formData.plan_type}
          onChange={(e) => setFormData({ ...formData, plan_type: e.target.value })}
          hint="Internal unique key (defaults to name formatted as snake_case)"
        />

        <Input
          label="Default Sale Price (DZD)"
          type="number"
          placeholder="3500"
          value={formData.default_sale_price}
          onChange={(e) => setFormData({ ...formData, default_sale_price: e.target.value })}
          error={errors.default_sale_price}
          required
        />

        <Input
          label="Default Cost Price (DZD) — Optional"
          type="number"
          placeholder="2000 (leave blank if cost varies)"
          value={formData.default_cost_price}
          onChange={(e) => setFormData({ ...formData, default_cost_price: e.target.value })}
          hint="Default acquisition cost. Can be left empty for services like CapCut."
        />
      </SlideOver>
    </div>
  );
}
