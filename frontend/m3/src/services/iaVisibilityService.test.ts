import { beforeEach, describe, expect, it, vi } from 'vitest';

const httpGetMock = vi.fn();
const httpPostMock = vi.fn();

vi.mock('./httpClient', () => ({
  createHttpClient: () => ({
    get: httpGetMock,
    post: httpPostMock,
  }),
}));

describe('iaVisibilityService', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('uses backend endpoints for list/history/config/schedule getters', async () => {
    httpGetMock.mockResolvedValue({});

    const { iaVisibilityService } = await import('./iaVisibilityService');

    await iaVisibilityService.list('client-1');
    await iaVisibilityService.getHistory('client-1');
    await iaVisibilityService.getConfig('client-1');
    await iaVisibilityService.getSchedule('client-1');

    expect(httpGetMock).toHaveBeenCalledTimes(4);
    expect(httpGetMock).toHaveBeenNthCalledWith(1, 'api/ai/visibility/client-1');
    expect(httpGetMock).toHaveBeenNthCalledWith(2, 'api/ai/visibility/history/client-1');
    expect(httpGetMock).toHaveBeenNthCalledWith(3, 'api/ai/visibility/config/client-1');
    expect(httpGetMock).toHaveBeenNthCalledWith(4, 'api/ai/visibility/schedule/client-1');
  });

  it('uses backend endpoints for run/config/schedule mutations', async () => {
    httpPostMock.mockResolvedValue({});

    const { iaVisibilityService } = await import('./iaVisibilityService');
    const runPayload = {
      clientId: 'client-1',
      brand: 'Brand',
      competitors: [],
      promptTemplate: '',
      sources: [],
      providerPriority: [],
    };

    await iaVisibilityService.run(runPayload);
    await iaVisibilityService.saveConfig('client-1', runPayload);
    await iaVisibilityService.saveSchedule('client-1', { frequency: 'daily' });
    await iaVisibilityService.toggleSchedule('client-1', 'resume');

    expect(httpPostMock).toHaveBeenCalledTimes(4);
    expect(httpPostMock).toHaveBeenNthCalledWith(1, 'api/ai/visibility/run', runPayload);
    expect(httpPostMock).toHaveBeenNthCalledWith(2, 'api/ai/visibility/config/client-1', runPayload);
    expect(httpPostMock).toHaveBeenNthCalledWith(
      3,
      'api/ai/visibility/schedule/client-1',
      { frequency: 'daily' },
    );
    expect(httpPostMock).toHaveBeenNthCalledWith(
      4,
      'api/ai/visibility/schedule/client-1/resume',
      {},
    );
  });
});
