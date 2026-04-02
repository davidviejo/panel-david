import { describe, expect, it } from 'vitest';
import { adaptDataforseoOnPage } from '../../adapters/dataforseoOnPageAdapter';
import { dataforseoOnPageRawPayload } from '../../mocks/adapters/dataforseoOnPage.mock';

describe('adaptDataforseoOnPage', () => {
  it('normalizes onpage issues and computes support data', () => {
    const result = adaptDataforseoOnPage(dataforseoOnPageRawPayload);

    expect(result.insights).toHaveLength(2);
    expect(result.insights[0]).toMatchObject({
      source: 'dataforseo',
      metric: 'onpage_issue_score',
      keyword: 'missing_title',
      value: 90,
    });

    expect(result.supporting_data).toEqual({
      total_items: 2,
      avg_issue_score: 80,
      issue_types: ['missing_title', 'missing_h1'],
      urls: ['https://example.com/no-title', 'https://example.com/no-h1'],
    });
  });
});
