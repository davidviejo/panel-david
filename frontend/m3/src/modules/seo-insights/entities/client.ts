import type { BaseEntity, Uuid } from './base';

export interface Client extends BaseEntity {
  name: string;
  sectorId: Uuid;
  primaryContactEmail?: string;
  isActive: boolean;
}
