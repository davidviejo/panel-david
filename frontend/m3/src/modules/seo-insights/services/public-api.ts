import type { NormalizedInsight, RecommendedAction } from '../types/contracts';

export interface SeoInsightsService {
  listInsights(projectId: string): Promise<NormalizedInsight[]>;
  listRecommendations(insightId: string): Promise<RecommendedAction[]>;
}

export type { ToolRoutingInput } from './toolRoutingService';
export { mapInsightToTool } from './toolRoutingService';

export {
  scoreInsight,
  computeConfidenceScore,
  computeFreshnessScore,
  computeImpactScore,
  computeScoreComponents,
  computeSeverityScore,
} from './scoringService';
