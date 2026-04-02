import type { Severity } from '../enums/severity';
import {
  SCORE_DEFAULT_COMPONENTS,
  SCORE_WEIGHT_KEYS,
  SCORE_LIMITS,
  SCORE_WEIGHTS,
  type ScoreWeightKey,
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
  const total = SCORE_WEIGHT_KEYS.reduce((sum, key) => sum + weights[key], 0);

  if (total === 0) {
    return SCORE_WEIGHTS;
  }

  return SCORE_WEIGHT_KEYS.reduce(
    (normalized, key) => ({
      ...normalized,
      [key]: weights[key] / total,
    }),
    {} as ScoreWeights,
  );
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

export interface ScoreComponents {
  severity: number;
  freshness: number;
  impact: number;
  confidence: number;
}

export function computeScoreComponents(input: ScoreInsightInput): ScoreComponents {
  return {
    severity: computeSeverityScore(input.severity),
    freshness: computeFreshnessScore(input.detectedAt, input.now),
    impact: computeImpactScore(input.value),
    confidence: computeConfidenceScore(input.confidence),
  };
}

export function computeWeightedScore(
  components: ScoreComponents,
  weights: ScoreWeights = SCORE_WEIGHTS,
): number {
  const normalizedWeights = normalizeWeight(weights);

  return SCORE_WEIGHT_KEYS.reduce(
    (total, key: ScoreWeightKey) => total + components[key] * normalizedWeights[key],
    0,
  );
}

export function scoreInsight(
  input: ScoreInsightInput,
  weights: ScoreWeights = SCORE_WEIGHTS,
): number {
  const componentScores = computeScoreComponents(input);
  const weightedTotal = computeWeightedScore(componentScores, weights);

  const scaled = weightedTotal * SCORE_LIMITS.max;

  return Number(Math.max(SCORE_LIMITS.min, Math.min(SCORE_LIMITS.max, scaled)).toFixed(2));
}
