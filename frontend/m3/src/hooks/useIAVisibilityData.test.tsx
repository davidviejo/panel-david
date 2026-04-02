import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  iaVisibilityKeys,
  useSaveIAVisibilityScheduleMutation,
  useToggleIAVisibilityScheduleMutation,
} from './useIAVisibilityData';
import { iaVisibilityService } from '../services/iaVisibilityService';

vi.mock('../services/iaVisibilityService', () => ({
  iaVisibilityService: {
    list: vi.fn(),
    run: vi.fn(),
    getHistory: vi.fn(),
    getConfig: vi.fn(),
    saveConfig: vi.fn(),
    getSchedule: vi.fn(),
    saveSchedule: vi.fn(),
    toggleSchedule: vi.fn(),
  },
}));

const createWrapper = (client: QueryClient) => {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  return Wrapper;
};

describe('useIAVisibilityData mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });


  it('updates schedule cache and invalidates affected keys after save mutation', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    const saveResponse = {
      clientId: 'client-1',
      schedule: {
        frequency: 'daily',
        timezone: 'UTC',
        runHour: 6,
        runMinute: 30,
        status: 'active',
      },
    };

    vi.mocked(iaVisibilityService.saveSchedule).mockResolvedValue(saveResponse);

    const { result } = renderHook(() => useSaveIAVisibilityScheduleMutation('client-1'), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ runHour: 6, runMinute: 30 });
    });

    await waitFor(() => {
      expect(queryClient.getQueryData(iaVisibilityKeys.schedule('client-1'))).toEqual(saveResponse);
    });
  });

  it('invalidates module keys after save schedule mutation', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
    vi.mocked(iaVisibilityService.saveSchedule).mockResolvedValue({
      clientId: 'client-1',
      schedule: {
        frequency: 'daily',
        timezone: 'UTC',
        runHour: 10,
        runMinute: 15,
        status: 'active',
      },
    });

    const { result } = renderHook(() => useSaveIAVisibilityScheduleMutation('client-1'), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ runHour: 10, runMinute: 15 });
    });

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: iaVisibilityKeys.list('client-1'),
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: iaVisibilityKeys.history('client-1'),
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: iaVisibilityKeys.config('client-1'),
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: iaVisibilityKeys.schedule('client-1'),
      });
    });
  });

  it('invalidates module keys after toggle schedule action', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
    vi.mocked(iaVisibilityService.toggleSchedule).mockResolvedValue({
      clientId: 'client-1',
      schedule: {
        frequency: 'weekly',
        timezone: 'UTC',
        runHour: 8,
        runMinute: 0,
        status: 'paused',
      },
    });

    const { result } = renderHook(() => useToggleIAVisibilityScheduleMutation('client-1'), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync('pause');
    });

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: iaVisibilityKeys.list('client-1'),
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: iaVisibilityKeys.history('client-1'),
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: iaVisibilityKeys.config('client-1'),
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: iaVisibilityKeys.schedule('client-1'),
      });
    });
  });
});
