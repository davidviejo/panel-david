import { beforeEach, describe, expect, it, vi } from 'vitest';

const httpPostMock = vi.fn();

vi.mock('../../../services/httpClient', () => ({
  HttpClientError: class HttpClientError extends Error {
    code: string;
    status?: number;
    traceId?: string;
    requestId?: string;

    constructor(message: string, code = 'HTTP_ERROR', status?: number, traceId?: string) {
      super(message);
      this.code = code;
      this.status = status;
      this.traceId = traceId;
    }
  },
  createHttpClient: () => ({
    post: httpPostMock,
  }),
}));

describe('trendsMediaApi', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete import.meta.env.VITE_TRENDS_MEDIA_DATA_SOURCE;
    delete import.meta.env.VITE_FF_TRENDS_MEDIA_BACKEND_SOURCE;
    delete import.meta.env.PROD;
  });

  it('uses backend source by default and returns mapped items', async () => {
    httpPostMock.mockResolvedValue({
      provider: 'serpapi',
      items: [
        {
          title: 'Noticia',
          url: 'https://example.com',
          sourceName: 'Fuente',
          publishedAt: '2026-04-02T00:00:00.000Z',
          position: 1,
          keyword: 'economia',
        },
      ],
    });

    const { fetchTrendsMediaNews } = await import('./trendsMediaApi');
    const result = await fetchTrendsMediaNews({ searchQueries: ['economia'], targetSources: [] });

    expect(httpPostMock).toHaveBeenCalledOnce();
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Noticia');
  });

  it('throws in production when legacy source is requested', async () => {
    import.meta.env.VITE_TRENDS_MEDIA_DATA_SOURCE = 'legacy';
    import.meta.env.PROD = true;

    const { fetchTrendsMediaNews } = await import('./trendsMediaApi');

    await expect(fetchTrendsMediaNews({ searchQueries: ['economia'], targetSources: [] })).rejects.toThrow(
      /deshabilitado en producción/i,
    );
    expect(httpPostMock).not.toHaveBeenCalled();
  });

  it('propagates traceability id in backend errors', async () => {
    const { HttpClientError } = await import('../../../services/httpClient');
    httpPostMock.mockRejectedValue(new HttpClientError('Backend exploded', 'HTTP_502', 502, 'trace-123'));

    const { fetchTrendsMediaNews } = await import('./trendsMediaApi');

    await expect(fetchTrendsMediaNews({ searchQueries: ['economia'], targetSources: [] })).rejects.toThrow(
      /trace-123/i,
    );
  });
});
