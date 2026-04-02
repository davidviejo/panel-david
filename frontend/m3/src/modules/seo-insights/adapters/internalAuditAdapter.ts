import type { NormalizedInsight } from '../types/contracts';

export interface AdapterOutput {
  insights: NormalizedInsight[];
  supporting_data: {
    total_items: number;
    avg_health_score: number;
    pages_flagged: string[];
    categories: string[];
  };
}

type RawAuditItem = {
  category?: string;
  url?: string;
  score?: number;
  timestamp?: string;
};

export function adaptInternalAudit(payload: unknown): AdapterOutput {
  const rows: RawAuditItem[] = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { findings?: unknown[] })?.findings)
      ? ((payload as { findings: RawAuditItem[] }).findings ?? [])
      : [];

  const insights = rows
    .filter((row) => row.category && row.url && typeof row.score === 'number')
    .map<NormalizedInsight>((row, index) => ({
      id: `internal-audit-${index + 1}`,
      source: 'internal',
      analysisType: 'manual',
      entityType: 'page',
      keyword: row.category ?? '',
      pageUrl: row.url ?? '',
      metric: 'audit_score',
      value: row.score ?? 0,
      detectedAt: row.timestamp ?? new Date(0).toISOString(),
    }));

  const avgHealthScore = insights.length === 0 ? 0 : insights.reduce((sum, item) => sum + item.value, 0) / insights.length;

  return {
    insights,
    supporting_data: {
      total_items: insights.length,
      avg_health_score: Number(avgHealthScore.toFixed(2)),
      pages_flagged: [...new Set(insights.map((item) => item.pageUrl))],
      categories: [...new Set(insights.map((item) => item.keyword))],
    },
  };
}
