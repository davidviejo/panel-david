import type { Status } from '../enums/status';
import type { Severity } from '../enums/severity';

export interface InsightHistoryEvent {
  id: string;
  happenedAt: string;
  actor: string;
  action: string;
  notes?: string;
}

export interface ToolRecommendation {
  id: string;
  toolName: string;
  title: string;
  description: string;
  confidence: number;
}

export interface InsightFeedbackSummary {
  avgRating: number;
  usedCount: number;
  ignoredCount: number;
  effectivenessRate: number;
}

export interface MockInsight {
  id: string;
  projectId: string;
  projectName: string;
  keyword: string;
  pageUrl: string;
  metric: string;
  value: number;
  severity: Severity;
  status: Status;
  detectedAt: string;
  assigneeId?: string;
  assigneeName?: string;
  source: 'gsc' | 'dataforseo';
  recommendation: ToolRecommendation;
  feedback: InsightFeedbackSummary;
  history: InsightHistoryEvent[];
}

export interface MockKeywordAssignment {
  id: string;
  keyword: string;
  projectId: string;
  projectName: string;
  priority: 'high' | 'medium' | 'low';
  assigneeId?: string;
  assigneeName?: string;
  updatedAt: string;
}

export interface MockKpiSummary {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
}

export const mockAssignees = [
  { id: 'u-01', name: 'Ana SEO' },
  { id: 'u-02', name: 'David Content' },
  { id: 'u-03', name: 'Lucía Tech' },
];

export const mockInsights: MockInsight[] = [
  {
    id: 'ins-001',
    projectId: 'proj-01',
    projectName: 'Panel David',
    keyword: 'seo automation dashboard',
    pageUrl: 'https://paneldavid.com/blog/seo-dashboard',
    metric: 'ctr',
    value: 1.4,
    severity: 'high',
    status: 'open',
    detectedAt: '2026-03-30T10:00:00Z',
    source: 'gsc',
    recommendation: {
      id: 'rec-001',
      toolName: 'title-optimizer',
      title: 'Reescribir title con intención comercial',
      description: 'Actualizar title + meta description para elevar CTR en posiciones 3-8.',
      confidence: 0.91,
    },
    feedback: {
      avgRating: 4.6,
      usedCount: 12,
      ignoredCount: 2,
      effectivenessRate: 0.82,
    },
    history: [
      {
        id: 'h-001',
        happenedAt: '2026-03-30T10:00:00Z',
        actor: 'System',
        action: 'Insight detectado',
      },
    ],
  },
  {
    id: 'ins-002',
    projectId: 'proj-01',
    projectName: 'Panel David',
    keyword: 'gsc anomalies report',
    pageUrl: 'https://paneldavid.com/features/gsc-alerts',
    metric: 'position',
    value: 13.2,
    severity: 'medium',
    status: 'in_progress',
    detectedAt: '2026-03-29T09:00:00Z',
    source: 'dataforseo',
    assigneeId: 'u-03',
    assigneeName: 'Lucía Tech',
    recommendation: {
      id: 'rec-002',
      toolName: 'internal-linking-bot',
      title: 'Añadir enlaces internos desde cluster GSC',
      description: 'Mejorar relevancia semántica para recuperar posiciones en términos long-tail.',
      confidence: 0.86,
    },
    feedback: {
      avgRating: 4.2,
      usedCount: 9,
      ignoredCount: 1,
      effectivenessRate: 0.77,
    },
    history: [
      {
        id: 'h-002',
        happenedAt: '2026-03-29T09:00:00Z',
        actor: 'System',
        action: 'Insight detectado',
      },
      {
        id: 'h-003',
        happenedAt: '2026-03-29T11:30:00Z',
        actor: 'Ana SEO',
        action: 'Asignado a Lucía Tech',
      },
    ],
  },
  {
    id: 'ins-003',
    projectId: 'proj-02',
    projectName: 'Media Trends',
    keyword: 'news seo content gap',
    pageUrl: 'https://mediatrends.io/insights/content-gap',
    metric: 'clicks',
    value: 48,
    severity: 'critical',
    status: 'open',
    detectedAt: '2026-03-31T08:00:00Z',
    source: 'gsc',
    recommendation: {
      id: 'rec-003',
      toolName: 'brief-generator',
      title: 'Crear brief para cubrir subtema en tendencia',
      description: 'Generar pieza nueva para capturar demanda emergente en 48h.',
      confidence: 0.95,
    },
    feedback: {
      avgRating: 4.9,
      usedCount: 20,
      ignoredCount: 0,
      effectivenessRate: 0.9,
    },
    history: [
      {
        id: 'h-004',
        happenedAt: '2026-03-31T08:00:00Z',
        actor: 'System',
        action: 'Insight detectado',
      },
    ],
  },
];

export const mockKeywordAssignments: MockKeywordAssignment[] = [
  {
    id: 'ka-001',
    keyword: 'seo insights dashboard',
    projectId: 'proj-01',
    projectName: 'Panel David',
    priority: 'high',
    updatedAt: '2026-04-01T14:00:00Z',
  },
  {
    id: 'ka-002',
    keyword: 'content decay alerts',
    projectId: 'proj-02',
    projectName: 'Media Trends',
    priority: 'medium',
    assigneeId: 'u-02',
    assigneeName: 'David Content',
    updatedAt: '2026-04-01T13:00:00Z',
  },
  {
    id: 'ka-003',
    keyword: 'technical seo backlog',
    projectId: 'proj-03',
    projectName: 'Operator Hub',
    priority: 'low',
    updatedAt: '2026-03-30T16:00:00Z',
  },
];

export const getKpisFromInsights = (insights: MockInsight[]): MockKpiSummary => {
  return {
    total: insights.length,
    open: insights.filter((insight) => insight.status === 'open').length,
    inProgress: insights.filter((insight) => insight.status === 'in_progress').length,
    resolved: insights.filter((insight) => insight.status === 'resolved').length,
  };
};
