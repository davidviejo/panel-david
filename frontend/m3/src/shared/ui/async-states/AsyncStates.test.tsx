import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { EmptyState, ErrorState, LoadingState } from './index';

describe('Async shared states', () => {
  it('renders LoadingState in spinner mode with aria attributes', () => {
    render(<LoadingState title="Cargando dashboard..." />);

    const status = screen.getByRole('status');
    expect(status.getAttribute('aria-busy')).toBe('true');
    expect(screen.getByText('Cargando dashboard...')).toBeTruthy();
  });

  it('renders ErrorState with traceId and retry action', () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Error backend" traceId="trace-123" onRetry={onRetry} />);

    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('Error backend')).toBeTruthy();
    expect(screen.getByText('trace-123')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders EmptyState with CTA and triggers callback', () => {
    const onCta = vi.fn();
    render(
      <EmptyState
        title="No encontramos resultados"
        description="Ajusta filtros y vuelve a intentar."
        ctaLabel="Actualizar"
        onCta={onCta}
      />,
    );

    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.getByText('No encontramos resultados')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Actualizar' }));
    expect(onCta).toHaveBeenCalledTimes(1);
  });
});
