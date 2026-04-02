import { beforeEach, describe, expect, it, vi } from 'vitest';

const httpGetMock = vi.fn();
const legacyListMock = vi.fn();

vi.mock('./httpClient', () => ({
  createHttpClient: () => ({
    get: httpGetMock,
    post: vi.fn(),
  }),
}));

vi.mock('./iaVisibilityLegacySource', () => ({
  getLegacyIAVisibilityList: legacyListMock,
}));

describe('iaVisibilityService.list', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete import.meta.env.VITE_IA_VISIBILITY_DATA_SOURCE;
    delete import.meta.env.VITE_FF_IA_VISIBILITY_BACKEND_SOURCE;
  });

  it('uses backend source by default', async () => {
    httpGetMock.mockResolvedValue({ clientId: 'client-1', items: [] });

    const { iaVisibilityService } = await import('./iaVisibilityService');
    await iaVisibilityService.list('client-1');

    expect(httpGetMock).toHaveBeenCalledOnce();
    expect(legacyListMock).not.toHaveBeenCalled();
  });

  it('uses legacy source when pilot flag sets legacy mode', async () => {
    import.meta.env.VITE_IA_VISIBILITY_DATA_SOURCE = 'legacy';
    legacyListMock.mockResolvedValue({ clientId: 'client-legacy', items: [] });

    const { iaVisibilityService } = await import('./iaVisibilityService');
    await iaVisibilityService.list('client-legacy');

    expect(legacyListMock).toHaveBeenCalledWith('client-legacy');
    expect(httpGetMock).not.toHaveBeenCalled();
  });
});
