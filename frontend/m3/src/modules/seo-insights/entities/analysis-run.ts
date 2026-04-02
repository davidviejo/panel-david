import type { BaseEntity, Uuid } from './base';
import type { AnalysisSource } from '../enums/analysis-source';

export interface AnalysisRun extends BaseEntity {
  projectId: Uuid;
  source: AnalysisSource;
  startedAt: string;
  finishedAt?: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  triggeredById?: Uuid;
}
