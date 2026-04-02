import type { NormalizedInsight, RecommendedAction } from '../types/contracts';

export interface ProjectInsight {
  insight: NormalizedInsight;
  actions: RecommendedAction[];
  score: number;
}
