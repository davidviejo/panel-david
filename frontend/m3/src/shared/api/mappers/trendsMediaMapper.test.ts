import { describe, expect, it } from 'vitest';
import { mapTrendsMediaArticleToUiModel } from './trendsMediaMapper';

describe('mapTrendsMediaArticleToUiModel', () => {
  it('maps backend article contract to trends media UI model', () => {
    const mapped = mapTrendsMediaArticleToUiModel({
      id: 'article-1',
      title: 'Nueva inversión industrial en Valencia',
      url: 'https://example.com/news/1',
      source: 'Example News',
      publishedAt: '2026-04-01T09:00:00Z',
      thumbnailUrl: 'https://example.com/img.jpg',
      position: 2,
      keyword: 'valencia economia',
      snippet: 'Resumen de la noticia',
    });

    expect(mapped).toEqual({
      article_id: 'article-1',
      title: 'Nueva inversión industrial en Valencia',
      url: 'https://example.com/news/1',
      source_name: 'Example News',
      published_at: '2026-04-01T09:00:00Z',
      thumbnail_url: 'https://example.com/img.jpg',
      position: 2,
      keyword: 'valencia economia',
      snippet: 'Resumen de la noticia',
    });
  });

  it('uses safe fallback defaults for optional fields', () => {
    const mapped = mapTrendsMediaArticleToUiModel({
      title: 'Sin fecha',
      url: 'https://example.com/news/2',
      source: 'Example News',
      position: 1,
      keyword: 'query',
    });

    expect(mapped.article_id).toBe('');
    expect(mapped.snippet).toBe('');
    expect(mapped.published_at).toBeTruthy();
  });
});
