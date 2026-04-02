import type { BaseEntity, Uuid } from './base';
import type { AnalysisSource } from '../enums/analysis-source';
import type { Severity } from '../enums/severity';
import type { Status } from '../enums/status';
import type { NormalizedInsight, RecommendedAction } from '../types/contracts';

export interface Insight extends BaseEntity {
  projectId: Uuid;
  analysisRunId: Uuid;
  source: AnalysisSource;
  keywordId?: Uuid;
  keyword: string;
  pageUrl: string;
  metric: string;
  value: number;
  detectedAt: string;
  severity: Severity;
  status: Status;
}

export interface ProjectInsight {
  insight: NormalizedInsight;
  actions: RecommendedAction[];
  score: number;
}
