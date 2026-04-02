import { UiApiError, normalizeApiError } from '../api/errorHandling';

export type EndpointRetryPolicy = 'realtime_read' | 'standard_read' | 'background_sync' | 'mutation';

const MAX_RETRY_ATTEMPTS: Record<EndpointRetryPolicy, number> = {
  realtime_read: 1,
  standard_read: 2,
  background_sync: 3,
  mutation: 0,
};

export const normalizeQueryError = (error: unknown): UiApiError => normalizeApiError(error);

export const withNormalizedError = async <T>(fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    throw normalizeQueryError(error);
  }
};

export const buildRetryPolicy =
  (policy: EndpointRetryPolicy) =>
  (failureCount: number, error: unknown): boolean => {
    const normalized = normalizeQueryError(error);

    if (normalized.status === 401 || normalized.status === 403 || normalized.status === 404) {
      return false;
    }

    if (policy === 'mutation') {
      return false;
    }

    if (normalized.isBusinessError && !normalized.isNetworkError) {
      return false;
    }

    return failureCount < MAX_RETRY_ATTEMPTS[policy];
  };
