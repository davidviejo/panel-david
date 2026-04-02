import type { BaseEntity, Uuid } from './base';

export interface KeywordAssignment extends BaseEntity {
  keywordId: Uuid;
  projectId: Uuid;
  assigneeId: Uuid;
  assignedById?: Uuid;
  assignedAt: string;
  status: 'pending' | 'in_progress' | 'completed';
}
