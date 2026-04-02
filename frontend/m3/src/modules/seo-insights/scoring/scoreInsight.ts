import type { Severity } from '../enums/severity';
import {
  SCORE_DEFAULT_COMPONENTS,
  SCORE_LIMITS,
  SCORE_WEIGHTS,
  SEVERITY_BASE_SCORES,
  type ScoreWeights,
} from './weights';

export interface ScoreInsightInput {
  severity?: Severity | number;
  detectedAt?: string;
  value?: number;
  confidence?: number;
  now?: Date;
}

const MS_PER_DAY = 86_400_000;

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
    return SCORE_DEFAULT_COMPONENTS.severity;
  }

  return SEVERITY_BASE_SCORES[severity];
}

export function computeFreshnessScore(
  detectedAt: ScoreInsightInput['detectedAt'],
  now: Date = new Date(),
): number {
  if (!detectedAt) {
    return SCORE_DEFAULT_COMPONENTS.freshness;
  }

  const timestamp = Date.parse(detectedAt);

  if (Number.isNaN(timestamp)) {
    return SCORE_DEFAULT_COMPONENTS.freshness;
  }

  const ageInDays = Math.max(0, (now.getTime() - timestamp) / MS_PER_DAY);
  const freshness = 1 - ageInDays / SCORE_LIMITS.freshnessWindowDays;

  return clamp01(freshness);
}

export function computeImpactScore(value: ScoreInsightInput['value']): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return SCORE_DEFAULT_COMPONENTS.impact;
  }

  return clamp01(Math.abs(value) / SCORE_LIMITS.impactCap);
}

export function computeConfidenceScore(confidence: ScoreInsightInput['confidence']): number {
  if (typeof confidence !== 'number' || Number.isNaN(confidence)) {
    return SCORE_DEFAULT_COMPONENTS.confidence;
  }

  return clamp01(confidence);
}

export function scoreInsight(
  input: ScoreInsightInput,
  weights: ScoreWeights = SCORE_WEIGHTS,
): number {
  const normalizedWeights = normalizeWeight(weights);

  const componentScores = {
    severity: computeSeverityScore(input.severity),
    freshness: computeFreshnessScore(input.detectedAt, input.now),
    impact: computeImpactScore(input.value),
    confidence: computeConfidenceScore(input.confidence),
  };

  const weightedTotal =
    componentScores.severity * normalizedWeights.severity +
    componentScores.freshness * normalizedWeights.freshness +
    componentScores.impact * normalizedWeights.impact +
    componentScores.confidence * normalizedWeights.confidence;

  const scaled = weightedTotal * SCORE_LIMITS.max;

  return Number(Math.max(SCORE_LIMITS.min, Math.min(SCORE_LIMITS.max, scaled)).toFixed(2));
}
