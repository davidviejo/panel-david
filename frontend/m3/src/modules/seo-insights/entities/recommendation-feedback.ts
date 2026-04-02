import type { BaseEntity, Uuid } from './base';

export interface RecommendationFeedback extends BaseEntity {
  insightId: Uuid;
  recommendationId: Uuid;
  projectId: Uuid;
  reviewerId: Uuid;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  feedbackAt: string;
  toolKey?: string;
  insightType?: string;
  sectorId?: Uuid;
  wasUsed?: boolean;
  wasEffective?: boolean;
  clientIgnoredPattern?: boolean;
  similarCasesResolved?: number;
  usageCount?: number;
}
