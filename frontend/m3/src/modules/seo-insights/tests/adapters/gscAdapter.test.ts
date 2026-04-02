import { describe, expect, it } from 'vitest';
import { adaptGsc } from '../../adapters/gscAdapter';
import { gscRawPayload } from '../../mocks/adapters/gsc.mock';

describe('adaptGsc', () => {
  it('normalizes GSC rows and summarizes clicks/ctr', () => {
    const result = adaptGsc(gscRawPayload);

    expect(result.insights).toHaveLength(2);
    expect(result.insights[0]).toMatchObject({
      source: 'gsc',
      metric: 'gsc_clicks',
      keyword: 'seo consultant',
      value: 140,
    });

    expect(result.supporting_data).toEqual({
      total_items: 2,
      total_clicks: 200,
      avg_ctr: 0.1,
      keywords: ['seo consultant', 'seo agency'],
    });
  });
});
