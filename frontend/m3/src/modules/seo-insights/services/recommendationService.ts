import type { ActionLog } from '../entities/action-log';
import type { OutcomeLog } from '../entities/outcome-log';
import type { RecommendationFeedback } from '../entities/recommendation-feedback';
import {
  computeRecommendationDelta,
  type RecommendationRuleResult,
} from '../recommendations/feedbackRules';
import type { NormalizedInsight, RecommendedAction } from '../types/contracts';

export interface RecommendationFeedbackInput {
  recommendation: RecommendedAction;
  insight?: Pick<NormalizedInsight, 'analysisType'>;
  sectorId?: string;
  feedbackLogs?: RecommendationFeedback[];
  actionLogs?: ActionLog[];
  outcomeLogs?: OutcomeLog[];
}

export interface RecommendationWeightInput {
  recommendations: RecommendedAction[];
  insight?: Pick<NormalizedInsight, 'analysisType'>;
  sectorId?: string;
  feedbackLogs?: RecommendationFeedback[];
  actionLogs?: ActionLog[];
  outcomeLogs?: OutcomeLog[];
}

const PRIORITY_BASE_WEIGHT: Record<RecommendedAction['priority'], number> = {
  high: 1,
  medium: 0.7,
  low: 0.45,
};

function clampWeight(weight: number): number {
  return Number(Math.min(2, Math.max(0.05, weight)).toFixed(3));
}

function resolveRecommendationId(recommendation: RecommendedAction): string {
  const raw = [recommendation.insightId, recommendation.toolKey, recommendation.title]
    .filter(Boolean)
    .join('::');

  return raw.toLowerCase().replace(/\s+/g, '-');
}

export function applyRecommendationFeedback({
  recommendation,
  insight,
  sectorId,
  feedbackLogs,
  actionLogs,
  outcomeLogs,
}: RecommendationFeedbackInput): RecommendedAction & RecommendationRuleResult {
  const initialWeight = recommendation.weight ?? PRIORITY_BASE_WEIGHT[recommendation.priority];
  const ruleResult = computeRecommendationDelta({
    recommendationId: resolveRecommendationId(recommendation),
    toolKey: recommendation.toolKey,
    insightType: insight?.analysisType,
    sectorId,
    feedbackLogs,
    actionLogs,
    outcomeLogs,
  });

  return {
    ...recommendation,
    weight: clampWeight(initialWeight + ruleResult.delta),
    delta: ruleResult.delta,
    tested: ruleResult.tested,
  };
}

export function computeRecommendationWeights({
  recommendations,
  insight,
  sectorId,
  feedbackLogs,
  actionLogs,
  outcomeLogs,
}: RecommendationWeightInput): (RecommendedAction & RecommendationRuleResult)[] {
  return recommendations
    .map((recommendation) =>
      applyRecommendationFeedback({
        recommendation,
        insight,
        sectorId,
        feedbackLogs,
        actionLogs,
        outcomeLogs,
      }),
    )
    .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))
    .map((recommendation, index) => ({
      ...recommendation,
      isPrimary: index === 0,
    }));
}
