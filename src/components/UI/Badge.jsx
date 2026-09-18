import React from 'react';

export default function Badge({ status, label, service }) {
  if (service) {
    const serviceLower = (service || '').toLowerCase();
    return (
      <span className={`service-badge badge-service-${serviceLower}`}>
        {label || service}
      </span>
    );
  }

  const statusLower = (status || '').toLowerCase();
  const displayLabel = label || status;

  return (
    <span className={`status-badge badge-${statusLower}`}>
      {displayLabel}
    </span>
  );
}
