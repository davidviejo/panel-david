import { HttpClientError } from '../../services/httpClient';

export interface UiApiError {
  code: string;
  message: string;
  status?: number;
  traceId?: string;
  requestId?: string;
  isNetworkError: boolean;
  isBusinessError: boolean;
  originalError: unknown;
}

export interface UiApiErrorDisplay {
  message: string;
  traceabilityId?: string;
  fullMessage: string;
}

const STATUS_UI_MESSAGES: Record<number, string> = {
  401: 'Tu sesión expiró. Inicia sesión nuevamente.',
  403: 'No tienes permisos para realizar esta acción.',
  404: 'No encontramos la información solicitada.',
  500: 'Ocurrió un error interno. Intenta nuevamente en unos minutos.',
};

const DEFAULT_UI_ERROR_MESSAGE = 'No fue posible completar la operación.';

type ErrorLikePayload = {
  code?: unknown;
  message?: unknown;
  error?: unknown;
  status?: unknown;
  traceId?: unknown;
  requestId?: unknown;
};

const resolveStatusMessage = (status?: number): string | undefined => {
  if (!status) return undefined;
  return STATUS_UI_MESSAGES[status];
};

const resolveTraceability = (error: ErrorLikePayload): { traceId?: string; requestId?: string } => {
  const traceId = typeof error.traceId === 'string' && error.traceId.trim() ? error.traceId : undefined;
  const requestId = typeof error.requestId === 'string' && error.requestId.trim() ? error.requestId : undefined;

  return {
    traceId: traceId || requestId,
    requestId,
  };
};

const asBusinessError = (error: ErrorLikePayload, fallback: string): UiApiError => {
  const status = typeof error.status === 'number' ? error.status : undefined;
  const message =
    (typeof error.message === 'string' && error.message.trim()) ||
    (typeof error.error === 'string' && error.error.trim()) ||
    resolveStatusMessage(status) ||
    fallback;

  const traceability = resolveTraceability(error);

  return {
    code: typeof error.code === 'string' && error.code.trim() ? error.code : 'BUSINESS_ERROR',
    message,
    status,
    traceId: traceability.traceId,
    requestId: traceability.requestId,
    isNetworkError: false,
    isBusinessError: true,
    originalError: error,
  };
};

export const normalizeApiError = (
  error: unknown,
  fallbackMessage: string = DEFAULT_UI_ERROR_MESSAGE,
): UiApiError => {
  if (error instanceof HttpClientError) {
    return {
      code: error.code,
      message: resolveStatusMessage(error.status) || error.message || fallbackMessage,
      status: error.status,
      traceId: error.traceId || error.requestId,
      requestId: error.requestId,
      isNetworkError: error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT_ERROR',
      isBusinessError: false,
      originalError: error,
    };
  }

  if (error instanceof Error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || fallbackMessage,
      isNetworkError: false,
      isBusinessError: false,
      originalError: error,
    };
  }

  if (error && typeof error === 'object') {
    return asBusinessError(error as ErrorLikePayload, fallbackMessage);
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: fallbackMessage,
    isNetworkError: false,
    isBusinessError: false,
    originalError: error,
  };
};

export const getApiErrorMessage = (
  error: unknown,
  fallbackMessage: string = DEFAULT_UI_ERROR_MESSAGE,
): string => normalizeApiError(error, fallbackMessage).message;

export const getApiErrorTraceabilityId = (
  error: unknown,
  fallbackMessage: string = DEFAULT_UI_ERROR_MESSAGE,
): string | undefined => normalizeApiError(error, fallbackMessage).traceId;

export const getUiApiErrorDisplay = (
  error: unknown,
  fallbackMessage: string = DEFAULT_UI_ERROR_MESSAGE,
): UiApiErrorDisplay => {
  const normalizedError = normalizeApiError(error, fallbackMessage);
  const traceabilityId = normalizedError.traceId;

  return {
    message: normalizedError.message,
    traceabilityId,
    fullMessage: traceabilityId
      ? `${normalizedError.message} (ID de trazabilidad: ${traceabilityId})`
      : normalizedError.message,
  };
};

export const isApiErrorStatus = (error: unknown, status: number): boolean => {
  return normalizeApiError(error).status === status;
};

export const isUnauthorizedApiError = (error: unknown): boolean => isApiErrorStatus(error, 401);
