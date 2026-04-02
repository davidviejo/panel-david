import type { NormalizedInsight, RecommendedAction } from '../types/contracts';

export interface SeoInsightsService {
  listInsights(projectId: string): Promise<NormalizedInsight[]>;
  listRecommendations(insightId: string): Promise<RecommendedAction[]>;
}
