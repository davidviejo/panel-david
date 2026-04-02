import { describe, expect, it } from 'vitest';
import { adaptDataforseoSerp } from '../../adapters/dataforseoSerpAdapter';
import { dataforseoSerpRawPayload } from '../../mocks/adapters/dataforseoSerp.mock';

describe('adaptDataforseoSerp', () => {
  it('normalizes SERP rows and computes summarized supporting data', () => {
    const result = adaptDataforseoSerp(dataforseoSerpRawPayload);

    expect(result.insights).toHaveLength(2);
    expect(result.insights[0]).toMatchObject({
      source: 'dataforseo',
      metric: 'serp_position',
      keyword: 'seo audit',
      pageUrl: 'https://example.com/audit',
      value: 3,
    });

    expect(result.supporting_data).toEqual({
      total_items: 2,
      avg_position: 4.5,
      keywords: ['seo audit', 'seo tools'],
      urls: ['https://example.com/audit', 'https://example.com/tools'],
    });
  });
});
