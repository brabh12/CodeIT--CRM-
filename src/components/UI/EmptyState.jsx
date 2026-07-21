import React from 'react';
import { Inbox } from 'lucide-react';
import Button from './Button';

export default function EmptyState({
  title = 'No items found',
  description = 'There are no items matching your criteria.',
  actionLabel,
  onAction,
  icon: Icon = Inbox
}) {
  return (
    <div className="empty-state">
      <Icon size={36} className="empty-icon" />
      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>
        {title}
      </div>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', maxWidth: '300px' }}>
        {description}
      </div>
      {actionLabel && onAction && (
        <div style={{ marginTop: 'var(--space-2)' }}>
          <Button variant="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
