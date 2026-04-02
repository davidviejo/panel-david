import { describe, expect, it } from 'vitest';
import { adaptDataforseoBacklinks } from '../../adapters/dataforseoBacklinksAdapter';
import { dataforseoBacklinksRawPayload } from '../../mocks/adapters/dataforseoBacklinks.mock';

describe('adaptDataforseoBacklinks', () => {
  it('normalizes backlinks and builds supporting summary', () => {
    const result = adaptDataforseoBacklinks(dataforseoBacklinksRawPayload);

    expect(result.insights).toHaveLength(2);
    expect(result.insights[0]).toMatchObject({
      source: 'dataforseo',
      metric: 'backlink_rank',
      keyword: 'seo checklist',
      value: 45,
    });

    expect(result.supporting_data).toEqual({
      total_items: 2,
      avg_backlink_score: 50,
      referring_domains: ['ref-a.com', 'ref-b.com'],
      urls: ['https://example.com/checklist'],
    });
  });
});
