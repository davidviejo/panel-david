import React from 'react';
import { Spinner } from '../../../components/ui/Spinner';
import { Skeleton } from '../../../components/ui/Skeleton';

interface LoadingStateProps {
  mode?: 'spinner' | 'skeleton';
  title?: string;
  description?: string;
  skeletonRows?: number;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  mode = 'spinner',
  title = 'Cargando información...',
  description,
  skeletonRows = 3,
  className = '',
}) => {
  return (
    <section
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`rounded-brand-lg border border-border bg-surface p-6 text-center ${className}`}
    >
      {mode === 'spinner' ? (
        <div className="flex flex-col items-center gap-3">
          <Spinner size={24} className="text-primary" />
          <p className="text-sm font-medium text-foreground">{title}</p>
          {description && <p className="text-xs text-muted">{description}</p>}
        </div>
      ) : (
        <div className="space-y-3" aria-label={title}>
          <Skeleton className="h-6 w-1/3" />
          {Array.from({ length: skeletonRows }).map((_, index) => (
            <Skeleton key={index} className="h-4 w-full" />
          ))}
        </div>
      )}
    </section>
  );
};
