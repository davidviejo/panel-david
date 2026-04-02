import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import IAVisibility from './IAVisibility';
import { HttpClientError } from '../services/httpClient';

const mockList = vi.fn();
const mockGetSchedule = vi.fn();
const mockGetHistory = vi.fn();

vi.mock('../services/iaVisibilityService', () => ({
  iaVisibilityService: {
    list: (...args: unknown[]) => mockList(...args),
    getSchedule: (...args: unknown[]) => mockGetSchedule(...args),
    getHistory: (...args: unknown[]) => mockGetHistory(...args),
    saveSchedule: vi.fn(),
    toggleSchedule: vi.fn(),
  },
}));

vi.mock('../context/ProjectContext', () => ({
  useProject: () => ({
    clients: [{ id: 'client-1', name: 'Cliente 1' }],
    currentClientId: 'client-1',
    switchClient: vi.fn(),
    currentClient: { id: 'client-1', name: 'Cliente 1' },
  }),
}));

const scheduleResponse = {
  clientId: 'client-1',
  schedule: {
    frequency: 'daily' as const,
    timezone: 'UTC',
    runHour: 9,
    runMinute: 0,
    status: 'paused' as const,
  },
};

const renderWithProviders = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <IAVisibility />
    </QueryClientProvider>,
  );
};

describe('IAVisibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSchedule.mockResolvedValue(scheduleResponse);
    mockGetHistory.mockResolvedValue({ clientId: 'client-1', runs: [] });
  });

  it('renders IA visibility rows when service returns data', async () => {
    mockList.mockResolvedValue({
      clientId: 'client-1',
      items: [
        {
          id: 'row-1',
          keyword: 'keyword principal',
          url: '/url-1',
          position: 4,
          change: 2,
          status: 'up',
          updatedAt: '2026-04-01',
        },
      ],
    });

    renderWithProviders();

    expect(await screen.findByText('keyword principal')).toBeTruthy();
    expect(screen.getByText('/url-1')).toBeTruthy();
  });

  it('renders empty state when list endpoint returns no items', async () => {
    mockList.mockResolvedValue({
      clientId: 'client-1',
      items: [],
    });

    renderWithProviders();

    expect(await screen.findByText('ia_visibility.no_results')).toBeTruthy();
  });

  it('renders error state when list endpoint fails', async () => {
    mockList.mockRejectedValue(new Error('Fallo backend listado'));

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Fallo backend listado')).toBeTruthy();
    });
  });


  it('shows traceability identifier in error state', async () => {
    mockList.mockRejectedValue(
      new HttpClientError({
        code: 'HTTP_500',
        status: 500,
        message: 'Error interno backend',
        traceId: 'trace-ia-500',
      }),
    );

    renderWithProviders();

    await waitFor(() => {
      expect(
        screen.getByText('Ocurrió un error interno. Intenta nuevamente en unos minutos.'),
      ).toBeTruthy();
      expect(screen.getByText('trace-ia-500')).toBeTruthy();
    });
  });

  it('renders translated message for known HTTP status errors', async () => {
    mockList.mockRejectedValue(
      new HttpClientError({
        code: 'HTTP_404',
        status: 404,
        message: 'Not found backend',
      }),
    );

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('No encontramos la información solicitada.')).toBeTruthy();
    });
  });
});
