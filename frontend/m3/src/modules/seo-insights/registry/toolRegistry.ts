import type { AnalysisType } from '../enums/analysis-type';

export interface ToolRecommendation {
  toolKey: string;
  isPrimary: boolean;
  weight: number;
}

export interface HistoricalToolFeedback {
  toolKey: string;
  /**
   * Score normalized in [0, 1].
   */
  score: number;
}

export const BASE_TOOL_REGISTRY: Record<AnalysisType, string[]> = {
  full: ['site_audit_tool', 'content_gap_tool', 'wpo_tool'],
  incremental: ['serp_scanner_tool', 'ctr_tool', 'link_health_tool'],
  manual: ['checklist_tool', 'snippet_tool', 'schema_tool'],
};

const BASE_WEIGHT_START = 1;
const BASE_WEIGHT_DECAY = 0.2;

export function getBaseRecommendationsByAnalysisType(
  analysisType?: AnalysisType,
): ToolRecommendation[] {
  if (!analysisType) {
    return [];
  }

  const toolKeys = BASE_TOOL_REGISTRY[analysisType] ?? [];

  return toolKeys.map((toolKey, index) => ({
    toolKey,
    isPrimary: index === 0,
    weight: Number((BASE_WEIGHT_START - BASE_WEIGHT_DECAY * index).toFixed(3)),
  }));
}
