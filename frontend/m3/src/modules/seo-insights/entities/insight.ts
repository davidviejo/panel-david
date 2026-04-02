import type { BaseEntity, Uuid } from './base';
import type { AnalysisSource } from '../enums/analysis-source';
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
  severity: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved' | 'ignored';
}

export interface ProjectInsight {
  insight: NormalizedInsight;
  actions: RecommendedAction[];
  score: number;
}
