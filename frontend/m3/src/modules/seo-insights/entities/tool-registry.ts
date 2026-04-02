import type { BaseEntity } from './base';
import type { AnalysisSource } from '../enums/analysis-source';

export interface ToolRegistry extends BaseEntity {
  toolKey: string;
  source: AnalysisSource;
  displayName: string;
  version: string;
  isEnabled: boolean;
  configSchemaVersion?: string;
}
