import React from 'react';

export default function Button({ 
  children, 
  variant = 'secondary', // 'primary' | 'secondary' | 'danger'
  size = 'default',      // 'default' | 'compact'
  icon: Icon = null,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  ...props 
}) {
  const variantClass = `btn-${variant}`;
  const sizeClass = size === 'compact' ? 'btn-compact' : '';

  return (
    <button
      type={type}
      className={`btn ${variantClass} ${sizeClass} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {Icon && <Icon size={size === 'compact' ? 14 : 16} />}
      {children}
    </button>
  );
}
