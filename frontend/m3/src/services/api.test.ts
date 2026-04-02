import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.fn();

vi.mock('./apiUrlHelper', () => ({
  resolveApiUrl: () => 'http://localhost:5000',
  resolveEngineUrl: () => 'http://localhost:5000',
}));

describe('portal api auth/session', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('logout invoca backend y redirige al home', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ ok: true }) });

    const assignMock = vi.fn();
    vi.stubGlobal('location', { ...window.location, assign: assignMock });
    const { api } = await import('./api');

    await api.logout();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/logout'),
      expect.objectContaining({ method: 'POST', credentials: 'include' }),
    );
    expect(assignMock).toHaveBeenCalledWith('/');
  });

  it('getSession obtiene rol/scope desde backend', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ authenticated: true, role: 'project', scope: 'acme' }),
    });

    const { api } = await import('./api');
    const session = await api.getSession();

    expect(session.role).toBe('project');
    expect(session.scope).toBe('acme');
  });
});
