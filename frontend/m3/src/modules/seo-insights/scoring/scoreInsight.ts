import type { Severity } from '../enums/severity';
import { SCORE_LIMITS, SCORE_WEIGHTS, SEVERITY_BASE_SCORES, type ScoreWeights } from './weights';

export interface ScoreInsightInput {
  severity?: Severity | number;
  detectedAt?: string;
  value?: number;
  confidence?: number;
  now?: Date;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function normalizeWeight(weights: ScoreWeights): ScoreWeights {
  const total = Object.values(weights).reduce((sum, value) => sum + value, 0);

  if (total === 0) {
    return SCORE_WEIGHTS;
  }

  return {
    severity: weights.severity / total,
    freshness: weights.freshness / total,
    impact: weights.impact / total,
    confidence: weights.confidence / total,
  };
}

export function computeSeverityScore(severity: ScoreInsightInput['severity']): number {
  if (typeof severity === 'number') {
    return clamp01(severity);
  }

  if (!severity) {
    return 0.5;
  }

  return SEVERITY_BASE_SCORES[severity];
}

export function computeFreshnessScore(
  detectedAt: ScoreInsightInput['detectedAt'],
  now: Date = new Date(),
): number {
  if (!detectedAt) {
    return 0.5;
  }

  const timestamp = Date.parse(detectedAt);

  if (Number.isNaN(timestamp)) {
    return 0.5;
  }

  const ageInDays = Math.max(0, (now.getTime() - timestamp) / 86_400_000);
  const freshness = 1 - ageInDays / SCORE_LIMITS.freshnessWindowDays;

  return clamp01(freshness);
}

export function computeImpactScore(value: ScoreInsightInput['value']): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0.5;
  }

  return clamp01(Math.abs(value) / SCORE_LIMITS.impactCap);
}

export function computeConfidenceScore(confidence: ScoreInsightInput['confidence']): number {
  if (typeof confidence !== 'number' || Number.isNaN(confidence)) {
    return 0.5;
  }

  return clamp01(confidence);
}

export function scoreInsight(
  input: ScoreInsightInput,
  weights: ScoreWeights = SCORE_WEIGHTS,
): number {
  const normalizedWeights = normalizeWeight(weights);

  const severityScore = computeSeverityScore(input.severity);
  const freshnessScore = computeFreshnessScore(input.detectedAt, input.now);
  const impactScore = computeImpactScore(input.value);
  const confidenceScore = computeConfidenceScore(input.confidence);

  const weightedTotal =
    severityScore * normalizedWeights.severity +
    freshnessScore * normalizedWeights.freshness +
    impactScore * normalizedWeights.impact +
    confidenceScore * normalizedWeights.confidence;

  const scaled = weightedTotal * SCORE_LIMITS.max;

  return Number(Math.max(SCORE_LIMITS.min, Math.min(SCORE_LIMITS.max, scaled)).toFixed(2));
}
