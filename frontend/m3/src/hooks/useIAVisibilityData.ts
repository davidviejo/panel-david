import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  IAVisibilityRequest,
  IAVisibilitySchedule,
  iaVisibilityService,
} from '../services/iaVisibilityService';
import { buildModuleScopeKey, buildQueryKey } from '../shared/data-hooks/queryKeys';
import { buildRetryPolicy, withNormalizedError } from '../shared/data-hooks/queryPolicies';

const MODULE_KEY = 'iaVisibility';

export const iaVisibilityKeys = {
  all: buildModuleScopeKey(MODULE_KEY),
  byClient: (clientId: string) => buildModuleScopeKey(MODULE_KEY, { clientId }),
  list: (clientId: string) => buildQueryKey(MODULE_KEY, 'list', { clientId }),
  history: (clientId: string) => buildQueryKey(MODULE_KEY, 'history', { clientId }),
  config: (clientId: string) => buildQueryKey(MODULE_KEY, 'config', { clientId }),
  schedule: (clientId: string) => buildQueryKey(MODULE_KEY, 'schedule', { clientId }),
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
    queryFn: () => withNormalizedError(() => iaVisibilityService.list(clientId!)),
    enabled: Boolean(clientId),
    retry: buildRetryPolicy('standard_read'),
  });

export const useIAVisibilityHistoryQuery = (clientId: string | null | undefined) =>
  useQuery({
    queryKey: clientId ? iaVisibilityKeys.history(clientId) : iaVisibilityKeys.all,
    queryFn: () => withNormalizedError(() => iaVisibilityService.getHistory(clientId!)),
    enabled: Boolean(clientId),
    retry: buildRetryPolicy('background_sync'),
  });

export const useIAVisibilityScheduleQuery = (clientId: string | null | undefined) =>
  useQuery({
    queryKey: clientId ? iaVisibilityKeys.schedule(clientId) : iaVisibilityKeys.all,
    queryFn: () => withNormalizedError(() => iaVisibilityService.getSchedule(clientId!)),
    enabled: Boolean(clientId),
    retry: buildRetryPolicy('realtime_read'),
  });

export const useSaveIAVisibilityScheduleMutation = (clientId: string | null | undefined) => {
  const queryClient = useQueryClient();
  const invalidateClientQueries = useInvalidateClientQueries(clientId);

  return useMutation({
    mutationFn: (payload: Partial<IAVisibilitySchedule>) =>
      withNormalizedError(() => iaVisibilityService.saveSchedule(clientId!, payload)),
    retry: buildRetryPolicy('mutation'),
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
      withNormalizedError(() => iaVisibilityService.toggleSchedule(clientId!, action)),
    retry: buildRetryPolicy('mutation'),
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
    mutationFn: (payload: IAVisibilityRequest) => withNormalizedError(() => iaVisibilityService.run(payload)),
    retry: buildRetryPolicy('mutation'),
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
      withNormalizedError(() => iaVisibilityService.saveConfig(clientId!, payload)),
    retry: buildRetryPolicy('mutation'),
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
