import type { NormalizedInsight, RecommendedAction } from '../types/contracts';

export interface UseSeoInsightsState {
  insights: NormalizedInsight[];
  recommendationsByInsightId: Record<string, RecommendedAction[]>;
  isLoading: boolean;
  error: string | null;
}

export type UseSeoInsights = (projectId: string) => UseSeoInsightsState;
