import { describe, expect, it } from 'vitest';
import {
  computeFreshnessScore,
  computeImpactScore,
  computeSeverityScore,
  scoreInsight,
} from './scoringService';

describe('scoringService', () => {
  it('scores a critical and fresh insight with high value above medium', () => {
    const result = scoreInsight({
      insight: {
        detectedAt: '2026-04-02T00:00:00.000Z',
        value: 90,
      },
      severity: 'critical',
      confidence: 1,
      now: new Date('2026-04-02T00:00:00.000Z'),
    });

    expect(result).toBeGreaterThan(85);
  });

  it('returns lower score for stale insights', () => {
    const fresh = computeFreshnessScore('2026-04-01T00:00:00.000Z', new Date('2026-04-02T00:00:00.000Z'));
    const stale = computeFreshnessScore('2026-01-01T00:00:00.000Z', new Date('2026-04-02T00:00:00.000Z'));

    expect(fresh).toBeGreaterThan(stale);
    expect(stale).toBe(0);
  });

  it('normalizes severity and impact scores', () => {
    expect(computeSeverityScore('high')).toBe(0.75);
    expect(computeImpactScore(150)).toBe(1);
  });
});
