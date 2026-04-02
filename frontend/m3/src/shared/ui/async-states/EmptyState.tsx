import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface EmptyStateProps {
  title: string;
  description?: string;
  ctaLabel?: string;
  onCta?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  ctaLabel,
  onCta,
  className = '',
}) => {
  return (
    <section
      role="status"
      aria-live="polite"
      className={`rounded-brand-lg border border-dashed border-border bg-surface px-6 py-10 text-center ${className}`}
    >
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface-alt text-muted">
        <Inbox size={18} aria-hidden="true" />
      </div>
      <p className="text-base font-semibold text-foreground">{title}</p>
      {description && <p className="mt-2 text-sm text-muted">{description}</p>}
      {ctaLabel && onCta && (
        <div className="mt-4">
          <Button size="sm" variant="secondary" onClick={onCta}>
            {ctaLabel}
          </Button>
        </div>
      )}
    </section>
  );
};
