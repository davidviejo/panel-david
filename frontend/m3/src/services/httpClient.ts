import { resolveApiUrl, resolveEngineUrl } from './apiUrlHelper';

export type ServiceBase = 'api' | 'engine';

export interface HttpClientConfig {
  service?: ServiceBase;
  baseURL?: string;
  timeoutMs?: number;
  includeAuth?: boolean;
}

export interface HttpRequestConfig extends Omit<RequestInit, 'body'> {
  timeoutMs?: number;
  body?: unknown;
  includeAuth?: boolean;
}

export interface HttpClientErrorPayload {
  code?: string;
  error?: string;
  message?: string;
  traceId?: string;
  details?: unknown;
  [key: string]: unknown;
}

export interface NormalizedHttpError {
  code: string;
  message: string;
  status?: number;
  traceId?: string;
  details?: unknown;
}

export class HttpClientError extends Error implements NormalizedHttpError {
  code: string;
  status?: number;
  traceId?: string;
  details?: unknown;

  constructor(normalized: NormalizedHttpError) {
    super(normalized.message);
    this.name = 'HttpClientError';
    this.code = normalized.code;
    this.status = normalized.status;
    this.traceId = normalized.traceId;
    this.details = normalized.details;
  }

  get isTimeout(): boolean {
    return this.code === 'TIMEOUT_ERROR';
  }
}

const DEFAULT_TIMEOUT_MS = 12000;
const ENGINE_DEFAULT_TIMEOUT_MS = 90000;
const DEFAULT_ERROR_MESSAGE = 'Request failed';

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');
const trimLeadingSlash = (value: string): string => value.replace(/^\/+/, '');

const defaultApiBaseURL = resolveApiUrl();
const defaultEngineBaseURL = resolveEngineUrl();

const normalizeBaseUrl = (config: HttpClientConfig): string => {
  if (config.baseURL && config.baseURL.trim()) {
    return trimTrailingSlash(config.baseURL.trim());
  }

  if (config.service === 'engine') {
    return defaultEngineBaseURL;
  }

  return defaultApiBaseURL;
};

const toRequestBody = (body: unknown): BodyInit | undefined => {
  if (body === undefined || body === null) {
    return undefined;
  }

  if (typeof body === 'string' || body instanceof FormData || body instanceof URLSearchParams || body instanceof Blob) {
    return body;
  }

  return JSON.stringify(body);
};

const parseErrorPayload = async (response: Response): Promise<HttpClientErrorPayload | undefined> => {
  try {
    return (await response.json()) as HttpClientErrorPayload;
  } catch {
    return undefined;
  }
};

const resolveErrorMessage = (payload?: HttpClientErrorPayload): string => {
  if (!payload) {
    return DEFAULT_ERROR_MESSAGE;
  }

  if (typeof payload.error === 'string' && payload.error.trim()) {
    return payload.error;
  }

  if (typeof payload.message === 'string' && payload.message.trim()) {
    return payload.message;
  }

  return DEFAULT_ERROR_MESSAGE;
};

const normalizeHttpError = (
  payload: HttpClientErrorPayload | undefined,
  status?: number,
): NormalizedHttpError => ({
  code:
    typeof payload?.code === 'string' && payload.code.trim()
      ? payload.code
      : status
        ? `HTTP_${status}`
        : 'HTTP_ERROR',
  message: resolveErrorMessage(payload),
  status,
  traceId: typeof payload?.traceId === 'string' ? payload.traceId : undefined,
  details: payload?.details,
});

const normalizeTimeoutError = (timeoutMs: number): NormalizedHttpError => ({
  code: 'TIMEOUT_ERROR',
  message: `Request timeout after ${timeoutMs}ms`,
});

const normalizeNetworkError = (error: unknown): NormalizedHttpError => ({
  code: 'NETWORK_ERROR',
  message: (error as Error)?.message || DEFAULT_ERROR_MESSAGE,
});

export const createHttpClient = (config: HttpClientConfig = {}) => {
  const baseURL = normalizeBaseUrl(config);
  const includeAuth = config.includeAuth !== false;
  const defaultTimeout =
    config.timeoutMs ?? (config.service === 'engine' ? ENGINE_DEFAULT_TIMEOUT_MS : DEFAULT_TIMEOUT_MS);

  const request = async <T>(path: string, requestConfig: HttpRequestConfig = {}): Promise<T> => {
    const controller = new AbortController();
    const timeoutMs = requestConfig.timeoutMs ?? defaultTimeout;
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    const headers = new Headers(requestConfig.headers || undefined);
    if (!headers.has('Content-Type') && requestConfig.body !== undefined && !(requestConfig.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const shouldIncludeAuth = requestConfig.includeAuth ?? includeAuth;

    if (shouldIncludeAuth) {
      const token = sessionStorage.getItem('portal_token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    const endpoint = `${baseURL}/${trimLeadingSlash(path)}`;

    try {
      const { includeAuth: _includeAuth, timeoutMs: _timeoutMs, body, ...fetchInit } = requestConfig;

      const response = await fetch(endpoint, {
        ...fetchInit,
        headers,
        body: toRequestBody(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const payload = await parseErrorPayload(response);
        throw new HttpClientError(normalizeHttpError(payload, response.status));
      }

      if (response.status === 204) {
        return undefined as T;
      }

      const data = (await response.json()) as T;
      return data;
    } catch (error) {
      if (error instanceof HttpClientError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new HttpClientError(normalizeTimeoutError(timeoutMs));
      }

      throw new HttpClientError(normalizeNetworkError(error));
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  return {
    baseURL,
    request,
    get: <T>(path: string, requestConfig: Omit<HttpRequestConfig, 'method' | 'body'> = {}) =>
      request<T>(path, { ...requestConfig, method: 'GET' }),
    post: <T>(path: string, body?: unknown, requestConfig: Omit<HttpRequestConfig, 'method' | 'body'> = {}) =>
      request<T>(path, { ...requestConfig, method: 'POST', body }),
    put: <T>(path: string, body?: unknown, requestConfig: Omit<HttpRequestConfig, 'method' | 'body'> = {}) =>
      request<T>(path, { ...requestConfig, method: 'PUT', body }),
    patch: <T>(path: string, body?: unknown, requestConfig: Omit<HttpRequestConfig, 'method' | 'body'> = {}) =>
      request<T>(path, { ...requestConfig, method: 'PATCH', body }),
    delete: <T>(path: string, requestConfig: Omit<HttpRequestConfig, 'method' | 'body'> = {}) =>
      request<T>(path, { ...requestConfig, method: 'DELETE' }),
  };
};
