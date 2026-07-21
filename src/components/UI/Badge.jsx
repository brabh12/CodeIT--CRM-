import React from 'react';

export default function Badge({ status, label }) {
  const statusLower = (status || '').toLowerCase();
  const displayLabel = label || status;

  return (
    <span className={`status-badge badge-${statusLower}`}>
      {displayLabel}
    </span>
  );
}
