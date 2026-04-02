import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';

describe('api auth/session service', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it('authenticates clients-area without requiring readable token', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ role: 'clients_area' }),
    });

    const response = await api.authClientsArea('secret');
    expect(response.role).toBe('clients_area');

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.credentials).toBe('include');
  });

  it('logout hits backend endpoint and redirects to requested route', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok' }),
    });

    await api.logout('/clientes');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/auth\/logout$/),
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      }),
    );
    expect(window.location.hash).toBe('#/clientes');
  });
});
