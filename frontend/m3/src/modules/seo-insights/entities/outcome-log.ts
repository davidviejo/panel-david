import type { BaseEntity, Uuid } from './base';
import type { OutcomeStatus } from '../enums/outcome-status';

export interface OutcomeLog extends BaseEntity {
  projectId: Uuid;
  insightId?: Uuid;
  measuredAt: string;
  metric: string;
  beforeValue?: number;
  afterValue?: number;
  delta?: number;
  notes?: string;
  outcomeStatus?: OutcomeStatus;
  recommendationId?: Uuid;
  toolKey?: string;
  insightType?: string;
  sectorId?: Uuid;
  wasUsed?: boolean;
  wasEffective?: boolean;
  clientIgnoredPattern?: boolean;
  similarCasesResolved?: number;
  usageCount?: number;
}
