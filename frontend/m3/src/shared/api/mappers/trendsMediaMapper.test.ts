import { describe, expect, it, vi } from 'vitest';
import { mapTrendsMediaResponseToArticles } from './trendsMediaMapper';

describe('mapTrendsMediaResponseToArticles', () => {
  it('maps backend contract into UI articles', () => {
    const result = mapTrendsMediaResponseToArticles({
      items: [
        {
          title: 'Headline',
          url: 'https://example.com/article',
          source: 'Example',
          publishedAt: '2026-04-01T10:00:00.000Z',
          query: 'economia',
          position: 3,
          snippet: 'sample',
        },
      ],
      meta: {
        providerUsed: 'serpapi',
        total: 1,
      },
    });

    expect(result).toEqual([
      {
        article_id: '',
        title: 'Headline',
        url: 'https://example.com/article',
        source_name: 'Example',
        published_at: '2026-04-01T10:00:00.000Z',
        thumbnail_url: undefined,
        position: 3,
        keyword: 'economia',
        snippet: 'sample',
      },
    ]);
  });

  it('filters invalid rows and normalizes fallback values', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-02T00:00:00.000Z'));

    const result = mapTrendsMediaResponseToArticles({
      items: [
        {
          title: '  ',
          url: 'https://example.com/invalid',
          query: 'q1',
        },
        {
          title: 'Valid title',
          url: 'https://example.com/ok',
          query: 'q2',
          publishedAt: 'invalid-date',
        },
      ],
      meta: {
        providerUsed: 'internal',
        total: 2,
      },
    });

    expect(result).toEqual([
      {
        article_id: '',
        title: 'Valid title',
        url: 'https://example.com/ok',
        source_name: 'Desconocido',
        published_at: '2026-04-02T00:00:00.000Z',
        thumbnail_url: undefined,
        position: 2,
        keyword: 'q2',
        snippet: '',
      },
    ]);

    vi.useRealTimers();
  });
});
