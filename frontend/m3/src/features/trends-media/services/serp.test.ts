import { beforeEach, describe, expect, it, vi } from 'vitest';

const httpPostMock = vi.fn();

vi.mock('../../../services/httpClient', async () => {
  const actual = await vi.importActual<typeof import('../../../services/httpClient')>('../../../services/httpClient');

  return {
    ...actual,
    createHttpClient: () => ({
      post: httpPostMock,
    }),
  };
});

describe('fetchSerpResults', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete import.meta.env.VITE_TRENDS_MEDIA_DATA_SOURCE;
    delete import.meta.env.VITE_FF_TRENDS_MEDIA_BACKEND_SOURCE;
    delete import.meta.env.NODE_ENV;
  });

  it('returns mapped articles when backend responds successfully', async () => {
    httpPostMock.mockResolvedValue({
      providerUsed: 'serpapi',
      articles: [
        {
          id: 'a1',
          title: 'Noticia',
          url: 'https://example.com/news',
          source: 'Example',
          publishedAt: '2026-04-02T08:00:00Z',
          thumbnailUrl: 'https://example.com/image.jpg',
          position: 1,
          keyword: 'valencia',
          snippet: 'detalle',
        },
      ],
    });

    const { fetchSerpResults } = await import('./serp');

    const results = await fetchSerpResults({ searchQueries: ['valencia'], targetSources: [] });

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      article_id: 'a1',
      source_name: 'Example',
      keyword: 'valencia',
    });
    expect(httpPostMock).toHaveBeenCalledOnce();
  });

  it('throws a traceable error when backend fails', async () => {
    const { HttpClientError } = await import('../../../services/httpClient');
    httpPostMock.mockRejectedValue(
      new HttpClientError({
        code: 'HTTP_502',
        message: 'upstream failed',
        status: 502,
        traceId: 'trace-123',
        requestId: 'req-123',
      }),
    );

    const { fetchSerpResults } = await import('./serp');

    await expect(
      fetchSerpResults({ searchQueries: ['valencia'], targetSources: [] }),
    ).rejects.toThrow('TraceId/RequestId: trace-123');
  });

  it('does not silently fallback to mocks in production legacy mode', async () => {
    import.meta.env.VITE_TRENDS_MEDIA_DATA_SOURCE = 'legacy';
    import.meta.env.NODE_ENV = 'production';

    const { fetchSerpResults } = await import('./serp');

    await expect(
      fetchSerpResults({ searchQueries: ['valencia'], targetSources: [] }),
    ).rejects.toThrow('legacy source is disabled in production');
  });

  it('returns empty results in non-production legacy mode', async () => {
    import.meta.env.VITE_TRENDS_MEDIA_DATA_SOURCE = 'legacy';
    import.meta.env.NODE_ENV = 'development';

    const { fetchSerpResults } = await import('./serp');

    await expect(
      fetchSerpResults({ searchQueries: ['valencia'], targetSources: [] }),
    ).resolves.toEqual([]);
  });
});
