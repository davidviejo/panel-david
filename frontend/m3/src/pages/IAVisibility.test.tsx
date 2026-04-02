import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import IAVisibility from './IAVisibility';

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

    render(<IAVisibility />);

    expect(await screen.findByText('keyword principal')).toBeTruthy();
    expect(screen.getByText('/url-1')).toBeTruthy();
  });

  it('renders empty state when list endpoint returns no items', async () => {
    mockList.mockResolvedValue({
      clientId: 'client-1',
      items: [],
    });

    render(<IAVisibility />);

    expect(await screen.findByText('ia_visibility.no_results')).toBeTruthy();
  });

  it('renders error state when list endpoint fails', async () => {
    mockList.mockRejectedValue(new Error('Fallo backend listado'));

    render(<IAVisibility />);

    await waitFor(() => {
      expect(screen.getByText('Fallo backend listado')).toBeTruthy();
    });
  });
});
