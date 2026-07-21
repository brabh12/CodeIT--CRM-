import React from 'react';
import Button from './Button';

export default function ConfirmModal({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isDanger = true,
  isSubmitting = false
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">{title}</h3>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          {message}
        </p>
        <div className="modal-footer">
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button 
            variant={isDanger ? 'danger' : 'primary'} 
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
