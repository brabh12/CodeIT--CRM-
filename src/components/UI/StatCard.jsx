import React from 'react';

export default function StatCard({ label, value, subtext, icon: Icon }) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="stat-label">{label}</span>
        {Icon && <Icon size={18} style={{ color: 'var(--color-text-secondary)' }} />}
      </div>
      <div className="stat-value">{value}</div>
      {subtext && <div className="stat-subtext">{subtext}</div>}
    </div>
  );
}
