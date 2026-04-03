import type { ActionLog } from '../entities/action-log';
import type { OutcomeLog } from '../entities/outcome-log';
import type { RecommendationFeedback } from '../entities/recommendation-feedback';

export const RECOMMENDATION_FEEDBACK_RULES = {
  SECTOR_SUCCESS_BOOST: 0.2,
  INSIGHT_TOOL_EFFECTIVE_BOOST: 0.25,
  IGNORED_PATTERN_PENALTY: 0.3,
  SIMILAR_CASE_RESOLVED_BOOST: 0.2,
  LOW_USAGE_OR_INEFFECTIVE_PENALTY: 0.25,
} as const;

export interface RecommendationRuleInput {
  recommendationId?: string;
  toolKey?: string;
  insightType?: string;
  sectorId?: string;
  feedbackLogs?: RecommendationFeedback[];
  actionLogs?: ActionLog[];
  outcomeLogs?: OutcomeLog[];
}

export interface RecommendationRuleResult {
  delta: number;
  tested: boolean;
}

function matchesRecommendation(
  entry: Pick<RecommendationFeedback | ActionLog | OutcomeLog, 'recommendationId' | 'toolKey'>,
  recommendationId?: string,
  toolKey?: string,
): boolean {
  if (recommendationId && entry.recommendationId === recommendationId) {
    return true;
  }

  if (toolKey && entry.toolKey === toolKey) {
    return true;
  }

  return !recommendationId && !toolKey;
}

function countEffectiveSignals(entries: RecommendationFeedback[] | OutcomeLog[]): number {
  return entries.filter((entry) => {
    if ('rating' in entry) {
      return entry.wasEffective === true || entry.rating >= 4;
    }

    return entry.outcomeStatus === 'improved' || entry.wasEffective === true;
  }).length;
}

function countIneffectiveSignals(entries: RecommendationFeedback[] | OutcomeLog[]): number {
  return entries.filter((entry) => {
    if ('rating' in entry) {
      return entry.wasEffective === false || entry.rating <= 2;
    }

    return entry.outcomeStatus === 'worsened' || entry.wasEffective === false;
  }).length;
}

export function computeRecommendationDelta({
  recommendationId,
  toolKey,
  insightType,
  sectorId,
  feedbackLogs = [],
  actionLogs = [],
  outcomeLogs = [],
}: RecommendationRuleInput): RecommendationRuleResult {
  const feedbackForRecommendation = feedbackLogs.filter((entry) =>
    matchesRecommendation(entry, recommendationId, toolKey),
  );
  const actionsForRecommendation = actionLogs.filter((entry) =>
    matchesRecommendation(entry, recommendationId, toolKey),
  );
  const outcomesForRecommendation = outcomeLogs.filter((entry) =>
    matchesRecommendation(entry, recommendationId, toolKey),
  );

  let delta = 0;

  const sectorOutcomes = outcomesForRecommendation.filter(
    (entry) => !sectorId || !entry.sectorId || entry.sectorId === sectorId,
  );
  const improvedSectorOutcomes = sectorOutcomes.filter((entry) => entry.outcomeStatus === 'improved').length;

  if (sectorOutcomes.length >= 2 && improvedSectorOutcomes / sectorOutcomes.length >= 0.6) {
    delta += RECOMMENDATION_FEEDBACK_RULES.SECTOR_SUCCESS_BOOST;
  }

  const typedFeedback = feedbackForRecommendation.filter(
    (entry) => !insightType || !entry.insightType || entry.insightType === insightType,
  );
  const typedOutcomes = outcomesForRecommendation.filter(
    (entry) => !insightType || !entry.insightType || entry.insightType === insightType,
  );

  const effectiveByInsightType =
    countEffectiveSignals(typedFeedback) +
    countEffectiveSignals(typedOutcomes) +
    actionsForRecommendation.filter(
      (entry) => (!insightType || !entry.insightType || entry.insightType === insightType) && entry.wasEffective,
    ).length;

  const ineffectiveByInsightType =
    countIneffectiveSignals(typedFeedback) +
    countIneffectiveSignals(typedOutcomes) +
    actionsForRecommendation.filter(
      (entry) => (!insightType || !entry.insightType || entry.insightType === insightType) && entry.wasEffective === false,
    ).length;

  const insightTypeSignals = typedFeedback.length + typedOutcomes.length;

  if (insightTypeSignals >= 2 && effectiveByInsightType > ineffectiveByInsightType) {
    delta += RECOMMENDATION_FEEDBACK_RULES.INSIGHT_TOOL_EFFECTIVE_BOOST;
  }

  const ignoredPatternSignals =
    actionsForRecommendation.filter((entry) => entry.patternIgnored === true || entry.clientIgnoredPattern === true).length +
    feedbackForRecommendation.filter((entry) => entry.clientIgnoredPattern === true).length +
    outcomesForRecommendation.filter((entry) => entry.clientIgnoredPattern === true).length;

  if (ignoredPatternSignals >= 2) {
    delta -= RECOMMENDATION_FEEDBACK_RULES.IGNORED_PATTERN_PENALTY;
  }

  const similarCasesResolved =
    outcomesForRecommendation.reduce((sum, entry) => sum + (entry.similarCasesResolved ?? 0), 0) +
    feedbackForRecommendation.reduce((sum, entry) => sum + (entry.similarCasesResolved ?? 0), 0) +
    actionsForRecommendation.reduce((sum, entry) => sum + (entry.similarCasesResolved ?? 0), 0);

  const tested = similarCasesResolved > 0;

  if (tested) {
    delta += Math.min(
      RECOMMENDATION_FEEDBACK_RULES.SIMILAR_CASE_RESOLVED_BOOST,
      similarCasesResolved * 0.05,
    );
  }

  const usageSignals =
    actionsForRecommendation.filter((entry) => entry.applied === true || entry.wasUsed === true).length +
    feedbackForRecommendation.filter((entry) => entry.wasUsed === true).length +
    outcomesForRecommendation.filter((entry) => entry.wasUsed === true).length +
    feedbackForRecommendation.reduce((sum, entry) => sum + (entry.usageCount ?? 0), 0) +
    outcomesForRecommendation.reduce((sum, entry) => sum + (entry.usageCount ?? 0), 0);
  const totalInteractionSignals =
    actionsForRecommendation.length + feedbackForRecommendation.length + outcomesForRecommendation.length;

  if (totalInteractionSignals >= 2 && usageSignals < 2) {
    delta -= RECOMMENDATION_FEEDBACK_RULES.LOW_USAGE_OR_INEFFECTIVE_PENALTY * 0.6;
  }

  if (insightTypeSignals >= 2 && ineffectiveByInsightType >= effectiveByInsightType) {
    delta -= RECOMMENDATION_FEEDBACK_RULES.LOW_USAGE_OR_INEFFECTIVE_PENALTY;
  }

  return {
    delta: Number(delta.toFixed(3)),
    tested,
  };
}
