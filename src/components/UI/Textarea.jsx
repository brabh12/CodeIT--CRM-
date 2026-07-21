import React from 'react';

export default function Textarea({
  label,
  error,
  hint,
  id,
  value,
  onChange,
  placeholder,
  rows = 3,
  required = false,
  className = '',
  ...props
}) {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={textareaId} className="form-label">
          {label} {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className={`form-textarea ${error ? 'error' : ''} ${className}`}
        {...props}
      />
      {error && <span className="form-error">{error}</span>}
      {hint && !error && <span className="form-hint">{hint}</span>}
    </div>
  );
}
