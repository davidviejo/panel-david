import { describe, expect, it } from 'vitest';
import { adaptInternalAudit } from '../../adapters/internalAuditAdapter';
import { internalAuditRawPayload } from '../../mocks/adapters/internalAudit.mock';

describe('adaptInternalAudit', () => {
  it('normalizes internal audit findings and computes supporting summary', () => {
    const result = adaptInternalAudit(internalAuditRawPayload);

    expect(result.insights).toHaveLength(2);
    expect(result.insights[1]).toMatchObject({
      source: 'internal',
      metric: 'audit_score',
      keyword: 'internal_linking',
      value: 40,
    });

    expect(result.supporting_data).toEqual({
      total_items: 2,
      avg_health_score: 51,
      pages_flagged: ['https://example.com/deep-page', 'https://example.com/orphan-page'],
      categories: ['crawl_depth', 'internal_linking'],
    });
  });
});
