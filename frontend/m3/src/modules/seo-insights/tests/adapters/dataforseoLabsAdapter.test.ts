import { describe, expect, it } from 'vitest';
import { adaptDataforseoLabs } from '../../adapters/dataforseoLabsAdapter';
import { dataforseoLabsRawPayload } from '../../mocks/adapters/dataforseoLabs.mock';

describe('adaptDataforseoLabs', () => {
  it('normalizes Labs tasks and returns summarized metadata', () => {
    const result = adaptDataforseoLabs(dataforseoLabsRawPayload);

    expect(result.insights).toHaveLength(2);
    expect(result.insights[1]).toMatchObject({
      source: 'dataforseo',
      metric: 'search_volume',
      keyword: 'on page seo',
      value: 800,
    });

    expect(result.supporting_data).toMatchObject({
      total_items: 2,
      avg_search_volume: 1000,
      keywords: ['technical seo', 'on page seo'],
      competition_breakdown: { high: 1, medium: 1 },
    });
  });
});
