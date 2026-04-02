import type { NormalizedInsight } from '../types/contracts';

export interface AdapterOutput {
  insights: NormalizedInsight[];
  supporting_data: {
    total_items: number;
    avg_issue_score: number;
    issue_types: string[];
    urls: string[];
  };
}

type RawOnPageItem = {
  issue_type?: string;
  page_url?: string;
  severity_score?: number;
  timestamp?: string;
};

export function adaptDataforseoOnPage(payload: unknown): AdapterOutput {
  const rows: RawOnPageItem[] = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { issues?: unknown[] })?.issues)
      ? ((payload as { issues: RawOnPageItem[] }).issues ?? [])
      : [];

  const insights = rows
    .filter((row) => row.issue_type && row.page_url && typeof row.severity_score === 'number')
    .map<NormalizedInsight>((row, index) => ({
      id: `dataforseo-onpage-${index + 1}`,
      source: 'dataforseo',
      analysisType: 'full',
      entityType: 'page',
      keyword: row.issue_type ?? '',
      pageUrl: row.page_url ?? '',
      metric: 'onpage_issue_score',
      value: row.severity_score ?? 0,
      detectedAt: row.timestamp ?? new Date(0).toISOString(),
    }));

  const avgIssueScore = insights.length === 0 ? 0 : insights.reduce((sum, item) => sum + item.value, 0) / insights.length;

  return {
    insights,
    supporting_data: {
      total_items: insights.length,
      avg_issue_score: Number(avgIssueScore.toFixed(2)),
      issue_types: [...new Set(insights.map((item) => item.keyword))],
      urls: [...new Set(insights.map((item) => item.pageUrl))],
    },
  };
}
