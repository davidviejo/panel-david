import type { AnalysisSource } from '../enums/analysis-source';

export interface NormalizedInsight {
  id: string;
  source: AnalysisSource;
  keyword: string;
  pageUrl: string;
  metric: string;
  value: number;
  detectedAt: string;
}

export interface ProjectInsightAssignment {
  insightId: string;
  assigneeId: string;
  projectId: string;
  assignedAt: string;
}

export interface RecommendedAction {
  insightId: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}
