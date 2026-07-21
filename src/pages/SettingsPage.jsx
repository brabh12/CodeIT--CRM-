import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import SlideOver from '../components/UI/SlideOver';
import EmptyState from '../components/UI/EmptyState';
import { Plus, Edit2, Sliders, Info } from 'lucide-react';

export default function SettingsPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit / Add Slide-Over State
  const [isOpen, setIsOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
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
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (err) {
      console.error('Error fetching settings:', err);
      addToast(err.message || 'Failed to load pricing settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingPlan(null);
    setFormData({
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
      plan_type: plan.plan_type,
      default_sale_price: String(plan.default_sale_price),
      default_cost_price: String(plan.default_cost_price)
    });
    setErrors({});
    setIsOpen(true);
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.plan_type.trim()) errs.plan_type = 'Plan key identifier is required';
    if (!formData.default_sale_price || isNaN(formData.default_sale_price)) {
      errs.default_sale_price = 'Enter a valid default sale price';
    }
    if (!formData.default_cost_price || isNaN(formData.default_cost_price)) {
      errs.default_cost_price = 'Enter a valid default cost price';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSavePlan = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const normalizedPlanKey = formData.plan_type.trim().toLowerCase().replace(/\s+/g, '_');
      const payload = {
        plan_type: normalizedPlanKey,
        default_sale_price: parseFloat(formData.default_sale_price),
        default_cost_price: parseFloat(formData.default_cost_price),
        updated_at: new Date().toISOString()
      };

      if (editingPlan) {
        const { error } = await supabase
          .from('settings')
          .update(payload)
          .eq('id', editingPlan.id);
        if (error) throw error;
        addToast(`Pricing updated for ${normalizedPlanKey}`, 'success');
      } else {
        const { error } = await supabase
          .from('settings')
          .insert([payload]);
        if (error) throw error;
        addToast(`New plan "${normalizedPlanKey}" created`, 'success');
      }

      setIsOpen(false);
      fetchSettings();
    } catch (err) {
      console.error('Error saving plan settings:', err);
      addToast(err.message || 'Failed to save pricing plan', 'error');
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
            Configure subscription plan types, default sale prices, and default cost prices.
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
          Add Plan Type
        </Button>
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
          These default prices will automatically populate when creating new orders or importing inventory accounts, but can still be overridden per individual sale.
        </span>
      </div>

      {/* Plans Table */}
      <div className="table-container">
        {loading ? (
          <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            Loading pricing settings...
          </div>
        ) : plans.length === 0 ? (
          <EmptyState
            title="No plan settings configured"
            description="Configure your first subscription plan to set default pricing."
            actionLabel="+ Add Plan Type"
            onAction={handleOpenAdd}
          />
        ) : (
          <table className="notion-table">
            <thead>
              <tr>
                <th>Plan Key</th>
                <th>Display Name</th>
                <th>Default Sale Price</th>
                <th>Default Cost Price</th>
                <th>Default Profit</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => {
                const sale = Number(plan.default_sale_price || 0);
                const cost = Number(plan.default_cost_price || 0);
                const profit = sale - cost;

                return (
                  <tr key={plan.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{plan.plan_type}</td>
                    <td style={{ textTransform: 'capitalize' }}>
                      {plan.plan_type.replace('_', ' ')} Plan
                    </td>
                    <td style={{ fontWeight: 500 }}>{sale.toLocaleString('fr-DZ')} DZD</td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>
                      {cost.toLocaleString('fr-DZ')} DZD
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--color-success)' }}>
                      {profit.toLocaleString('fr-DZ')} DZD
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Button
                        variant="secondary"
                        size="compact"
                        icon={Edit2}
                        onClick={() => handleOpenEdit(plan)}
                      >
                        Edit Pricing
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Plan Slide-Over */}
      <SlideOver
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editingPlan ? `Edit Pricing (${editingPlan.plan_type})` : 'Add New Plan Type'}
        onSave={handleSavePlan}
        isSubmitting={isSubmitting}
      >
        <Input
          label="Plan Key Identifier"
          placeholder="e.g. 1_month, 3_month, 6_month, 1_year"
          value={formData.plan_type}
          onChange={(e) => setFormData({ ...formData, plan_type: e.target.value })}
          error={errors.plan_type}
          disabled={!!editingPlan}
          hint="Unique identifier used in database records"
          required
        />
        <Input
          label="Default Sale Price (DZD)"
          type="number"
          placeholder="e.g. 3500"
          value={formData.default_sale_price}
          onChange={(e) => setFormData({ ...formData, default_sale_price: e.target.value })}
          error={errors.default_sale_price}
          hint="Default price charged to customers for this plan"
          required
        />
        <Input
          label="Default Cost Price (DZD)"
          type="number"
          placeholder="e.g. 2000"
          value={formData.default_cost_price}
          onChange={(e) => setFormData({ ...formData, default_cost_price: e.target.value })}
          error={errors.default_cost_price}
          hint="Your cost to acquire accounts under this plan (placeholder editable anytime)"
          required
        />

        {formData.default_sale_price && formData.default_cost_price && (
          <div style={{
            backgroundColor: 'var(--color-status-available-bg)',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-status-available-text)',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            marginTop: 'var(--space-2)'
          }}>
            <span>Estimated Profit per Sale:</span>
            <strong>
              {(parseFloat(formData.default_sale_price) - parseFloat(formData.default_cost_price)).toLocaleString('fr-DZ')} DZD
            </strong>
          </div>
        )}
      </SlideOver>
    </div>
  );
}
