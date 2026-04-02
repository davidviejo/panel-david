import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface ErrorStateProps {
  title?: string;
  message: string;
  traceId?: string;
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'No pudimos completar esta acción',
  message,
  traceId,
  retryLabel = 'Reintentar',
  onRetry,
  className = '',
}) => {
  return (
    <section
      role="alert"
      aria-live="assertive"
      className={`rounded-brand-lg border border-danger/30 bg-red-50 p-6 text-left dark:bg-red-900/20 ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 text-danger" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-sm text-foreground/90">{message}</p>
          {traceId && (
            <p className="mt-2 text-xs text-muted">
              ID de trazabilidad: <span className="font-mono">{traceId}</span>
            </p>
          )}
          {onRetry && (
            <div className="mt-4">
              <Button size="sm" variant="secondary" onClick={onRetry}>
                {retryLabel}
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
