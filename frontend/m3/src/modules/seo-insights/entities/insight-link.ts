import type { BaseEntity, Uuid } from './base';

export interface InsightLink extends BaseEntity {
  insightId: Uuid;
  relatedInsightId: Uuid;
  relationType: 'duplicate' | 'supporting' | 'blocking' | 'follow_up';
}
