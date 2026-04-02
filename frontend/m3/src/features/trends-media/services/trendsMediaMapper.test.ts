import { describe, expect, it } from 'vitest';
import { mapTrendsMediaNewsToUi } from './trendsMediaMapper';

describe('mapTrendsMediaNewsToUi', () => {
  it('maps backend contract items to NewsArticle UI model', () => {
    const mapped = mapTrendsMediaNewsToUi({
      provider: 'serpapi',
      items: [
        {
          title: 'Titular',
          url: 'https://example.com/news',
          sourceName: 'Example News',
          publishedAt: '2026-04-02T00:00:00.000Z',
          position: 1,
          keyword: 'economia valencia',
          snippet: 'Resumen',
          thumbnailUrl: 'https://example.com/img.jpg',
        },
      ],
    });

    expect(mapped).toHaveLength(1);
    expect(mapped[0].source_name).toBe('Example News');
    expect(mapped[0].title).toBe('Titular');
    expect(mapped[0].article_id).toBe('');
  });

  it('filters items without required title/url', () => {
    const mapped = mapTrendsMediaNewsToUi({
      provider: 'serpapi',
      items: [
        {
          title: '',
          url: '',
          sourceName: 'Bad',
          publishedAt: '2026-04-02T00:00:00.000Z',
          position: 1,
          keyword: 'bad',
        },
      ],
    });

    expect(mapped).toHaveLength(0);
  });
});
