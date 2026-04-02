import type { BaseEntity, Uuid } from './base';

export interface Project extends BaseEntity {
  clientId: Uuid;
  name: string;
  domain: string;
  locale: string;
  isArchived: boolean;
}
