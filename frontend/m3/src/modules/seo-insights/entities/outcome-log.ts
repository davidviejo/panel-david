import type { BaseEntity, Uuid } from './base';

export interface OutcomeLog extends BaseEntity {
  projectId: Uuid;
  insightId?: Uuid;
  measuredAt: string;
  metric: string;
  beforeValue?: number;
  afterValue?: number;
  delta?: number;
  notes?: string;
}
