import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import IAVisibility from '../IAVisibility';

const getResultRowsMock = vi.fn();
const getScheduleMock = vi.fn();
const getHistoryMock = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../../context/ProjectContext', () => ({
  useProject: () => ({
    clients: [{ id: 'client-1', name: 'Cliente 1' }],
    currentClientId: 'client-1',
    switchClient: vi.fn(),
    currentClient: { id: 'client-1', name: 'Cliente 1' },
  }),
}));

vi.mock('../../services/iaVisibilityService', () => ({
  iaVisibilityService: {
    getResultRows: (...args: unknown[]) => getResultRowsMock(...args),
    getSchedule: (...args: unknown[]) => getScheduleMock(...args),
    getHistory: (...args: unknown[]) => getHistoryMock(...args),
    saveSchedule: vi.fn(),
    toggleSchedule: vi.fn(),
  },
}));

describe('IAVisibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getScheduleMock.mockResolvedValue({
      schedule: {
        frequency: 'daily',
        timezone: 'UTC',
        runHour: 9,
        runMinute: 0,
        status: 'paused',
      },
    });
    getHistoryMock.mockResolvedValue({ runs: [] });
  });

  it('renders visibility rows returned by the service', async () => {
    getResultRowsMock.mockResolvedValue([
      {
        id: 'row-1',
        keyword: 'seo para medios digitales',
        url: '/guias/seo-medios',
        position: 5,
        change: 3,
        status: 'up',
        updatedAt: '2026-03-30',
      },
    ]);

    render(<IAVisibility />);

    await waitFor(() => {
      expect(screen.getByText('seo para medios digitales')).toBeTruthy();
    });
    expect(screen.getByText('/guias/seo-medios')).toBeTruthy();
    expect(screen.getByText('+3')).toBeTruthy();
  });

  it('renders empty state when the service returns no rows', async () => {
    getResultRowsMock.mockResolvedValue([]);

    render(<IAVisibility />);

    await waitFor(() => {
      expect(screen.getByText('ia_visibility.no_results')).toBeTruthy();
    });
  });

  it('renders error state when rows loading fails', async () => {
    getResultRowsMock.mockRejectedValue(new Error('No fue posible cargar resultados.'));

    render(<IAVisibility />);

    await waitFor(() => {
      expect(screen.getByText('No fue posible cargar resultados.')).toBeTruthy();
    });
  });
});
