import type { BaseEntity } from './base';

export interface Sector extends BaseEntity {
  name: string;
  slug: string;
  description?: string;
}
