import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

export default function SlideOver({
  isOpen,
  onClose,
  title,
  children,
  onSave,
  saveLabel = 'Save',
  saveDisabled = false,
  isSubmitting = false,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="slide-over-overlay" onClick={onClose}>
      <div 
        className="slide-over-panel" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="slide-over-header">
          <h3 className="slide-over-title">{title}</h3>
          <button 
            type="button" 
            className="btn btn-secondary btn-compact"
            onClick={onClose}
            aria-label="Close panel"
            style={{ border: 'none', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="slide-over-body">
          {children}
        </div>

        {onSave && (
          <div className="slide-over-footer">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={onSave}
              disabled={saveDisabled || isSubmitting}
            >
              {isSubmitting ? 'Saving...' : saveLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
