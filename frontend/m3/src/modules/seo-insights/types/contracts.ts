import type { AnalysisSource } from '../enums/analysis-source';
import type { IsoTimestamp, Uuid } from '../entities/base';

export interface NormalizedInsight {
  id: Uuid;
  source: AnalysisSource;
  keyword: string;
  pageUrl: string;
  metric: string;
  value: number;
  detectedAt: IsoTimestamp;
}

export interface NormalizedInsightInput {
  source: AnalysisSource;
  projectId: Uuid;
  keyword: string;
  pageUrl: string;
  metric: string;
  value: number;
  detectedAt: IsoTimestamp;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface InsightFilters {
  projectId: Uuid;
  source?: AnalysisSource;
  status?: 'open' | 'in_progress' | 'resolved' | 'ignored';
  keyword?: string;
  assignedTo?: Uuid;
  dateFrom?: IsoTimestamp;
  dateTo?: IsoTimestamp;
}

export interface ProjectInsightKpis {
  projectId: Uuid;
  totalInsights: number;
  openInsights: number;
  resolvedInsights: number;
  averageResolutionHours?: number;
  lastAnalysisAt?: IsoTimestamp;
}

export interface AssignmentPayload {
  projectId: Uuid;
  insightId: Uuid;
  assigneeId: Uuid;
  assignedById?: Uuid;
  assignedAt: IsoTimestamp;
}

export interface ProjectInsightAssignment {
  insightId: Uuid;
  assigneeId: Uuid;
  projectId: Uuid;
  assignedAt: IsoTimestamp;
}

export interface RecommendedAction {
  insightId: Uuid;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}
