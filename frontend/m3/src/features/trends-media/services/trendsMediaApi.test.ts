import { beforeEach, describe, expect, it, vi } from 'vitest';

const httpPostMock = vi.fn();

vi.mock('../../../services/httpClient', () => ({
  createHttpClient: () => ({
    post: httpPostMock,
  }),
  HttpClientError: class HttpClientError extends Error {
    code = 'HTTP_ERROR';
    status?: number;
    traceId?: string;
    requestId?: string;
  },
}));

describe('fetchTrendsMediaNews', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete import.meta.env.VITE_TRENDS_MEDIA_NEWS_MODE;
    delete import.meta.env.VITE_FF_TRENDS_MEDIA_ALLOW_MOCKS;
  });

  it('returns mapped backend data on success', async () => {
    httpPostMock.mockResolvedValueOnce({
      items: [
        {
          title: 'News',
          url: 'https://example.com/news',
          source_name: 'Source',
          published_at: '2026-04-01T00:00:00Z',
          keyword: 'query',
        },
      ],
    });

    const { fetchTrendsMediaNews } = await import('./trendsMediaApi');
    const result = await fetchTrendsMediaNews({ queries: ['query'] });

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('News');
    expect(httpPostMock).toHaveBeenCalledOnce();
  });

  it('throws normalized error when backend fails and mock fallback is disabled', async () => {
    httpPostMock.mockRejectedValueOnce({
      code: 'HTTP_502',
      message: 'backend down',
      status: 502,
      traceId: 'trace-1',
      requestId: 'req-1',
    });

    import.meta.env.VITE_TRENDS_MEDIA_NEWS_MODE = 'backend-only';
    const { fetchTrendsMediaNews } = await import('./trendsMediaApi');

    await expect(fetchTrendsMediaNews({ queries: ['query'] })).rejects.toThrow(
      'backend down (ID de trazabilidad: trace-1)',
    );
  });

  it('returns empty list when backend fails and mock fallback is explicitly enabled', async () => {
    httpPostMock.mockRejectedValueOnce({
      code: 'HTTP_500',
      message: 'backend down',
      status: 500,
    });

    import.meta.env.VITE_TRENDS_MEDIA_NEWS_MODE = 'allow-mock';
    const { fetchTrendsMediaNews } = await import('./trendsMediaApi');
    const result = await fetchTrendsMediaNews({ queries: ['query'] });

    expect(result).toEqual([]);
  });

  it('supports empty backend response', async () => {
    httpPostMock.mockResolvedValueOnce({ items: [] });

    const { fetchTrendsMediaNews } = await import('./trendsMediaApi');
    const result = await fetchTrendsMediaNews({ queries: ['query'] });

    expect(result).toEqual([]);
  });
});
