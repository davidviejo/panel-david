import { describe, expect, it } from 'vitest';
import { mapTrendsMediaResponseToUiModel } from './trendsMediaMapper';

describe('mapTrendsMediaResponseToUiModel', () => {
  it('maps backend article contracts to ui model', () => {
    const result = mapTrendsMediaResponseToUiModel([
      {
        article_id: 'a1',
        title: 'Titular',
        url: 'https://example.com',
        source_name: 'Fuente',
        published_at: '2026-04-01T00:00:00Z',
        thumbnail_url: 'https://img.example.com/1.png',
        position: 1,
        keyword: 'economia',
        snippet: 'detalle',
      },
    ]);

    expect(result[0]).toEqual({
      article_id: 'a1',
      title: 'Titular',
      url: 'https://example.com',
      source_name: 'Fuente',
      published_at: '2026-04-01T00:00:00Z',
      thumbnail_url: 'https://img.example.com/1.png',
      position: 1,
      keyword: 'economia',
      snippet: 'detalle',
    });
  });

  it('filters invalid records and applies defaults', () => {
    const result = mapTrendsMediaResponseToUiModel([
      { title: '', url: '' },
      { title: 'ok', url: 'https://example.com' },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].source_name).toBe('Desconocido');
    expect(result[0].keyword).toBe('general');
  });
});
