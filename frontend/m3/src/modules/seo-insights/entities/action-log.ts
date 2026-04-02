import type { BaseEntity, Uuid } from './base';

export interface ActionLog extends BaseEntity {
  insightId: Uuid;
  projectId: Uuid;
  actorId: Uuid;
  actionType: string;
  notes?: string;
  happenedAt: string;
}
