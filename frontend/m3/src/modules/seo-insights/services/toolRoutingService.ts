import type { AnalysisType } from '../enums/analysis-type';
import type { NormalizedInsight } from '../types/contracts';
import {
  getBaseRecommendationsByAnalysisType,
  type HistoricalToolFeedback,
  type ToolRecommendation,
} from '../registry/toolRegistry';
import {
  CLIENT_OVERRIDES,
  type ClientOverrideRule,
} from '../registry/overrides/clientOverrides';
import {
  SECTOR_OVERRIDES,
  type SectorOverrideRule,
} from '../registry/overrides/sectorOverrides';

export interface ToolRoutingInput {
  insight: Pick<NormalizedInsight, 'analysisType'>;
  sectorId?: string;
  clientId?: string;
  feedbackHistory?: HistoricalToolFeedback[];
}

function applyOverrideRule(
  current: ToolRecommendation[],
  rule?: Pick<SectorOverrideRule | ClientOverrideRule, 'tools' | 'mode'>,
): ToolRecommendation[] {
  if (!rule) {
    return current;
  }

  const mode = rule.mode ?? 'append';

  if (mode === 'replace') {
    return rule.tools.map((toolKey, index) => ({
      toolKey,
      isPrimary: index === 0,
      weight: Number((1 - index * 0.15).toFixed(3)),
    }));
  }

  const existingKeys = new Set(current.map((recommendation) => recommendation.toolKey));
  const appended = rule.tools
    .filter((toolKey) => !existingKeys.has(toolKey))
    .map((toolKey, index) => ({
      toolKey,
      isPrimary: false,
      weight: Number(Math.max(0.2, 0.7 - index * 0.1).toFixed(3)),
    }));

  return [...current, ...appended];
}

function applyHistoricalFeedback(
  recommendations: ToolRecommendation[],
  feedbackHistory: HistoricalToolFeedback[] = [],
): ToolRecommendation[] {
  if (feedbackHistory.length === 0) {
    return recommendations;
  }

  const feedbackByTool = new Map(
    feedbackHistory.map((entry) => [entry.toolKey, Math.min(Math.max(entry.score, 0), 1)]),
  );

  return recommendations
    .map((recommendation) => {
      const historicalScore = feedbackByTool.get(recommendation.toolKey) ?? 0.5;
      const adjustedWeight = recommendation.weight * (0.4 + historicalScore * 1.2);

      return {
        ...recommendation,
        weight: Number(adjustedWeight.toFixed(3)),
      };
    })
    .sort((a, b) => b.weight - a.weight)
    .map((recommendation, index) => ({
      ...recommendation,
      isPrimary: index === 0,
    }));
}

function findSectorRule(sectorId: string | undefined, analysisType?: AnalysisType) {
  if (!sectorId || !analysisType) {
    return undefined;
  }

  return SECTOR_OVERRIDES.find(
    (rule) => rule.sectorId === sectorId && rule.analysisType === analysisType,
  );
}

function findClientRule(clientId: string | undefined, analysisType?: AnalysisType) {
  if (!clientId || !analysisType) {
    return undefined;
  }

  return CLIENT_OVERRIDES.find(
    (rule) => rule.clientId === clientId && rule.analysisType === analysisType,
  );
}

export function mapInsightToTool({
  insight,
  sectorId,
  clientId,
  feedbackHistory,
}: ToolRoutingInput): ToolRecommendation[] {
  const analysisType = insight.analysisType;
  let recommendations = getBaseRecommendationsByAnalysisType(analysisType);

  const sectorRule = findSectorRule(sectorId, analysisType);
  recommendations = applyOverrideRule(recommendations, sectorRule);

  const clientRule = findClientRule(clientId, analysisType);
  recommendations = applyOverrideRule(recommendations, clientRule);

  return applyHistoricalFeedback(recommendations, feedbackHistory);
}
