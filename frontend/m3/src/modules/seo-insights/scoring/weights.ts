export const SCORE_WEIGHTS = {
  severity: 0.4,
  freshness: 0.25,
  impact: 0.25,
  confidence: 0.1,
} as const;

export const SCORE_LIMITS = {
  min: 0,
  max: 100,
  freshnessWindowDays: 30,
  impactCap: 100,
} as const;

export const SEVERITY_BASE_SCORES = {
  low: 0.25,
  medium: 0.5,
  high: 0.75,
  critical: 1,
} as const;

export type ScoreWeights = typeof SCORE_WEIGHTS;
