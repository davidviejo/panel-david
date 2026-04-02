import type { BaseEntity, Uuid } from './base';

export interface Keyword extends BaseEntity {
  projectId: Uuid;
  term: string;
  countryCode: string;
  languageCode: string;
  searchVolume?: number;
}
