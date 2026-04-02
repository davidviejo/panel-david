import { beforeEach, describe, expect, it, vi } from 'vitest';

const httpPostMock = vi.fn();

vi.mock('../../../services/httpClient', () => ({
  createHttpClient: () => ({
    post: httpPostMock,
  }),
}));

describe('fetchSerpResults', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete import.meta.env.VITE_TRENDS_MEDIA_DATA_SOURCE;
    delete import.meta.env.VITE_FF_TRENDS_MEDIA_BACKEND_SOURCE;
    delete import.meta.env.VITE_TRENDS_MEDIA_ALLOW_MOCKS;
    import.meta.env.MODE = 'test';
  });

  it('returns normalized backend articles on success', async () => {
    httpPostMock.mockResolvedValue({
      items: [
        {
          title: 'Backend item',
          url: 'https://example.com/news',
          source: 'Source',
          publishedAt: '2026-04-02T10:00:00.000Z',
          query: 'economia',
        },
      ],
      meta: { providerUsed: 'serpapi', total: 1 },
    });

    const { fetchSerpResults } = await import('./serp');
    const results = await fetchSerpResults({ searchQueries: ['economia'], targetSources: [] });

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Backend item');
    expect(httpPostMock).toHaveBeenCalledOnce();
  });

  it('keeps empty state when backend returns no items', async () => {
    httpPostMock.mockResolvedValue({
      items: [],
      meta: { providerUsed: 'internal', total: 0 },
    });

    const { fetchSerpResults } = await import('./serp');
    const results = await fetchSerpResults({ searchQueries: ['economia'], targetSources: [] });

    expect(results).toEqual([]);
  });

  it('throws in production-like mode when backend fails (no silent mock)', async () => {
    import.meta.env.MODE = 'production';
    httpPostMock.mockRejectedValue(new Error('network down'));

    const { fetchSerpResults } = await import('./serp');

    await expect(fetchSerpResults({ searchQueries: ['economia'], targetSources: [] })).rejects.toThrow('network down');
  });
});
