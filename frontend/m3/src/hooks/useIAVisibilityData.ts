import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  IAVisibilityRequest,
  IAVisibilitySchedule,
  iaVisibilityService,
} from '../services/iaVisibilityService';

export const iaVisibilityKeys = {
  all: ['iaVisibility'] as const,
  byClient: (clientId: string) => [...iaVisibilityKeys.all, clientId] as const,
  list: (clientId: string) => [...iaVisibilityKeys.byClient(clientId), 'list'] as const,
  history: (clientId: string) => [...iaVisibilityKeys.byClient(clientId), 'history'] as const,
  config: (clientId: string) => [...iaVisibilityKeys.byClient(clientId), 'config'] as const,
  schedule: (clientId: string) => [...iaVisibilityKeys.byClient(clientId), 'schedule'] as const,
};

const useInvalidateClientQueries = (clientId: string | null | undefined) => {
  const queryClient = useQueryClient();

  return async () => {
    if (!clientId) return;

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: iaVisibilityKeys.list(clientId) }),
      queryClient.invalidateQueries({ queryKey: iaVisibilityKeys.history(clientId) }),
      queryClient.invalidateQueries({ queryKey: iaVisibilityKeys.config(clientId) }),
      queryClient.invalidateQueries({ queryKey: iaVisibilityKeys.schedule(clientId) }),
    ]);
  };
};

export const useIAVisibilityListQuery = (clientId: string | null | undefined) =>
  useQuery({
    queryKey: clientId ? iaVisibilityKeys.list(clientId) : iaVisibilityKeys.all,
    queryFn: () => iaVisibilityService.list(clientId!),
    enabled: Boolean(clientId),
  });

export const useIAVisibilityHistoryQuery = (clientId: string | null | undefined) =>
  useQuery({
    queryKey: clientId ? iaVisibilityKeys.history(clientId) : iaVisibilityKeys.all,
    queryFn: () => iaVisibilityService.getHistory(clientId!),
    enabled: Boolean(clientId),
  });

export const useIAVisibilityScheduleQuery = (clientId: string | null | undefined) =>
  useQuery({
    queryKey: clientId ? iaVisibilityKeys.schedule(clientId) : iaVisibilityKeys.all,
    queryFn: () => iaVisibilityService.getSchedule(clientId!),
    enabled: Boolean(clientId),
  });

export const useSaveIAVisibilityScheduleMutation = (clientId: string | null | undefined) => {
  const queryClient = useQueryClient();
  const invalidateClientQueries = useInvalidateClientQueries(clientId);

  return useMutation({
    mutationFn: (payload: Partial<IAVisibilitySchedule>) =>
      iaVisibilityService.saveSchedule(clientId!, payload),
    onSuccess: async (response) => {
      if (clientId) {
        queryClient.setQueryData(iaVisibilityKeys.schedule(clientId), response);
      }
      await invalidateClientQueries();
    },
  });
};

export const useToggleIAVisibilityScheduleMutation = (clientId: string | null | undefined) => {
  const queryClient = useQueryClient();
  const invalidateClientQueries = useInvalidateClientQueries(clientId);

  return useMutation({
    mutationFn: (action: 'pause' | 'resume') =>
      iaVisibilityService.toggleSchedule(clientId!, action),
    onSuccess: async (response) => {
      if (clientId) {
        queryClient.setQueryData(iaVisibilityKeys.schedule(clientId), response);
      }
      await invalidateClientQueries();
    },
  });
};

export const useRunIAVisibilityMutation = (clientId: string | null | undefined) => {
  const invalidateClientQueries = useInvalidateClientQueries(clientId);

  return useMutation({
    mutationFn: (payload: IAVisibilityRequest) => iaVisibilityService.run(payload),
    onSuccess: async () => {
      await invalidateClientQueries();
    },
  });
};

export const useSaveIAVisibilityConfigMutation = (clientId: string | null | undefined) => {
  const queryClient = useQueryClient();
  const invalidateClientQueries = useInvalidateClientQueries(clientId);

  return useMutation({
    mutationFn: (payload: IAVisibilityRequest) =>
      iaVisibilityService.saveConfig(clientId!, payload),
    onSuccess: async (response) => {
      if (clientId) {
        queryClient.setQueryData(iaVisibilityKeys.config(clientId), response);
      }
      await invalidateClientQueries();
    },
  });
};

export const useSyncScheduleFormState = (
  schedule: IAVisibilitySchedule | null | undefined,
  setSchedule: (value: IAVisibilitySchedule) => void,
) => {
  useEffect(() => {
    if (schedule) {
      setSchedule(schedule);
    }
  }, [schedule, setSchedule]);
};
