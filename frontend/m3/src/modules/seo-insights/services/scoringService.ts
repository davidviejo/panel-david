import type { NormalizedInsight } from '../types/contracts';
import {
  scoreInsight as scoreInsightWithFormula,
  computeConfidenceScore,
  computeFreshnessScore,
  computeImpactScore,
  computeSeverityScore,
  type ScoreInsightInput,
} from '../scoring/scoreInsight';

export type { ScoreInsightInput } from '../scoring/scoreInsight';

export interface ScoreInsightServiceInput {
  insight: Pick<NormalizedInsight, 'detectedAt' | 'value'>;
  severity?: ScoreInsightInput['severity'];
  confidence?: number;
  now?: Date;
}

export function scoreInsight({ insight, severity, confidence, now }: ScoreInsightServiceInput): number {
  return scoreInsightWithFormula({
    severity,
    detectedAt: insight.detectedAt,
    value: insight.value,
    confidence,
    now,
  });
}

export {
  computeConfidenceScore,
  computeFreshnessScore,
  computeImpactScore,
  computeSeverityScore,
};
