import type { BaseEntity, Uuid } from './base';

export interface ActionLog extends BaseEntity {
  insightId: Uuid;
  projectId: Uuid;
  actorId: Uuid;
  actionType: string;
  notes?: string;
  happenedAt: string;
  recommendationId?: Uuid;
  toolKey?: string;
  insightType?: string;
  sectorId?: Uuid;
  patternIgnored?: boolean;
  applied?: boolean;
  wasUsed?: boolean;
  wasEffective?: boolean;
  clientIgnoredPattern?: boolean;
  similarCasesResolved?: number;
}
