import { describe, expect, it } from 'vitest';
import {
  computeConfidenceScore,
  computeFreshnessScore,
  computeImpactScore,
  computeScoreComponents,
  computeWeightedScore,
  computeSeverityScore,
  scoreInsight,
} from './scoringService';
import { SCORE_DEFAULT_COMPONENTS, SCORE_WEIGHTS } from '../scoring/weights';

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

  it('uses neutral defaults when factors are missing', () => {
    expect(computeSeverityScore(undefined)).toBe(SCORE_DEFAULT_COMPONENTS.severity);
    expect(computeFreshnessScore(undefined)).toBe(SCORE_DEFAULT_COMPONENTS.freshness);
    expect(computeImpactScore(undefined)).toBe(SCORE_DEFAULT_COMPONENTS.impact);
    expect(computeConfidenceScore(undefined)).toBe(SCORE_DEFAULT_COMPONENTS.confidence);
  });

  it('returns component score breakdown for tuning', () => {
    const components = computeScoreComponents({
      severity: 'critical',
      detectedAt: '2026-04-02T00:00:00.000Z',
      value: 80,
      confidence: 0.9,
      now: new Date('2026-04-02T00:00:00.000Z'),
    });

    expect(components).toEqual({
      severity: 1,
      freshness: 1,
      impact: 0.8,
      confidence: 0.9,
    });
  });

  it('computes weighted total from factor components', () => {
    const weighted = computeWeightedScore({
      severity: 1,
      freshness: 1,
      impact: 0.8,
      confidence: 0.9,
    });

    expect(weighted).toBeCloseTo(
      1 * SCORE_WEIGHTS.severity +
        1 * SCORE_WEIGHTS.freshness +
        0.8 * SCORE_WEIGHTS.impact +
        0.9 * SCORE_WEIGHTS.confidence,
    );
  });
});
