import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHttpClient } from './httpClient';

const handleUnauthorizedSessionMock = vi.fn();
vi.mock('./authSession', () => ({
  handleUnauthorizedSession: () => handleUnauthorizedSessionMock(),
}));

describe('httpClient', () => {
  const fetchMock = vi.fn();
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    sessionStorage.clear();
    consoleErrorSpy.mockClear();
    handleUnauthorizedSessionMock.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    fetchMock.mockReset();
    sessionStorage.clear();
  });

  it('always sends cookies with credentials include', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });

    const client = createHttpClient({ service: 'api' });
    await client.post('api/test', { hello: 'world' });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.credentials).toBe('include');

    const headers = new Headers(init.headers);
    expect(headers.get('Authorization')).toBeNull();
  });

  it('redirects uniformly on 401 auth failures', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      headers: new Headers(),
      json: async () => ({ code: 'AUTH_SESSION_EXPIRED', message: 'Invalid or expired session' }),
    });

    const client = createHttpClient({ service: 'api' });

    await expect(client.get('api/private')).rejects.toMatchObject({
      status: 401,
      code: 'AUTH_SESSION_EXPIRED',
    });

    expect(handleUnauthorizedSessionMock).toHaveBeenCalledTimes(1);
  });

  it('normalizes HTTP errors with unique error shape and traceability ids from headers', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: new Headers({
        'x-trace-id': 'hdr-trace-1',
        'x-request-id': 'hdr-request-1',
      }),
      json: async () => ({ error: 'backend exploded', traceId: 'payload-trace', details: { reason: 'test' } }),
    });

    const client = createHttpClient({ service: 'api' });

    await expect(client.get('api/fail')).rejects.toMatchObject({
      name: 'HttpClientError',
      code: 'HTTP_500',
      message: 'backend exploded',
      status: 500,
      traceId: 'hdr-trace-1',
      requestId: 'hdr-request-1',
      details: { reason: 'test' },
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[api-error]',
      expect.objectContaining({
        level: 'error',
        endpoint: expect.stringMatching(/\/api\/fail$/),
        status: 500,
        traceId: 'hdr-trace-1',
      }),
    );
  });

  it('uses payload requestId as fallback traceId', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      headers: new Headers(),
      json: async () => ({ error: 'bad request', requestId: 'req-44' }),
    });

    const client = createHttpClient({ service: 'api' });

    await expect(client.get('api/fail-request-id')).rejects.toMatchObject({
      traceId: 'req-44',
      requestId: 'req-44',
    });
  });

  it('captures traceability ids from nested payload fields using snake_case', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 502,
      headers: new Headers(),
      json: async () => ({
        error: {
          message: 'gateway failure',
          trace_id: 'trace-snake-1',
          request_id: 'request-snake-1',
        },
      }),
    });

    const client = createHttpClient({ service: 'api' });

    await expect(client.get('api/fail-nested-trace')).rejects.toMatchObject({
      code: 'HTTP_502',
      traceId: 'trace-snake-1',
      requestId: 'request-snake-1',
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[api-error]',
      expect.objectContaining({
        endpoint: expect.stringMatching(/\/api\/fail-nested-trace$/),
        status: 502,
        traceId: 'trace-snake-1',
      }),
    );
  });

  it('aborts on timeout with a standard timeout message', async () => {
    vi.useFakeTimers();

    fetchMock.mockImplementationOnce(async (_url: string, init?: RequestInit) => {
      await new Promise((resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      });
      return { ok: true, status: 200, json: async () => ({}) };
    });

    const client = createHttpClient({ service: 'api', timeoutMs: 10 });
    const request = client.get('api/slow');
    const assertion = expect(request).rejects.toMatchObject({
      name: 'HttpClientError',
      code: 'TIMEOUT_ERROR',
      message: 'Request timeout after 10ms',
      isTimeout: true,
    });

    await vi.advanceTimersByTimeAsync(20);
    await assertion;
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[api-error]',
      expect.objectContaining({
        level: 'error',
        endpoint: expect.stringMatching(/\/api\/slow$/),
        code: 'TIMEOUT_ERROR',
      }),
    );
  });

  it('supports put/patch/delete typed methods', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ id: '1', status: 'updated' }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ id: '1', partial: true }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ ok: true }) });

    const client = createHttpClient({ service: 'api' });
    const putResponse = await client.put<{ id: string; status: string }>('api/item/1', { name: 'new' });
    const patchResponse = await client.patch<{ id: string; partial: boolean }>('api/item/1', { enabled: true });
    const deleteResponse = await client.delete<{ ok: boolean }>('api/item/1');

    expect(putResponse.status).toBe('updated');
    expect(patchResponse.partial).toBe(true);
    expect(deleteResponse.ok).toBe(true);

    const [, putInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const [, patchInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    const [, deleteInit] = fetchMock.mock.calls[2] as [string, RequestInit];

    expect(putInit.method).toBe('PUT');
    expect(patchInit.method).toBe('PATCH');
    expect(deleteInit.method).toBe('DELETE');
  });

  it('uses a longer default timeout for engine requests', async () => {
    vi.useFakeTimers();

    fetchMock.mockImplementationOnce(async (_url: string, init?: RequestInit) => {
      await new Promise((resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      });
      return { ok: true, status: 200, json: async () => ({}) };
    });

    const engineClient = createHttpClient({ service: 'engine' });
    const request = engineClient.get('engine/slow');
    let settled = false;
    request.catch(() => {
      settled = true;
    });

    await vi.advanceTimersByTimeAsync(12000);
    expect(settled).toBe(false);

    await vi.advanceTimersByTimeAsync(78001);
    await expect(request).rejects.toMatchObject({
      code: 'TIMEOUT_ERROR',
      message: 'Request timeout after 90000ms',
      isTimeout: true,
    });
  });

  it('uses resolveApiUrl/resolveEngineUrl as baseURL fallback', () => {
    const apiClient = createHttpClient({ service: 'api' });
    const engineClient = createHttpClient({ service: 'engine' });

    expect(apiClient.baseURL).toBeTruthy();
    expect(engineClient.baseURL).toBeTruthy();
    expect(engineClient.baseURL).toContain('://');
  });
});
