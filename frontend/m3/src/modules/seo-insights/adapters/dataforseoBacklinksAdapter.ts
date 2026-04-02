import type { NormalizedInsight } from '../types/contracts';

export interface AdapterOutput {
  insights: NormalizedInsight[];
  supporting_data: {
    total_items: number;
    avg_backlink_score: number;
    referring_domains: string[];
    urls: string[];
  };
}

type RawBacklinkItem = {
  anchor?: string;
  target_url?: string;
  domain_from?: string;
  rank?: number;
  timestamp?: string;
};

export function adaptDataforseoBacklinks(payload: unknown): AdapterOutput {
  const rows: RawBacklinkItem[] = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { backlinks?: unknown[] })?.backlinks)
      ? ((payload as { backlinks: RawBacklinkItem[] }).backlinks ?? [])
      : [];

  const insights = rows
    .filter((row) => row.anchor && row.target_url && typeof row.rank === 'number')
    .map<NormalizedInsight>((row, index) => ({
      id: `dataforseo-backlinks-${index + 1}`,
      source: 'dataforseo',
      analysisType: 'incremental',
      entityType: 'page',
      keyword: row.anchor ?? '',
      pageUrl: row.target_url ?? '',
      metric: 'backlink_rank',
      value: row.rank ?? 0,
      detectedAt: row.timestamp ?? new Date(0).toISOString(),
    }));

  const avgBacklinkScore =
    insights.length === 0 ? 0 : insights.reduce((sum, item) => sum + item.value, 0) / insights.length;

  return {
    insights,
    supporting_data: {
      total_items: insights.length,
      avg_backlink_score: Number(avgBacklinkScore.toFixed(2)),
      referring_domains: [...new Set(rows.map((row) => row.domain_from).filter(Boolean) as string[])],
      urls: [...new Set(insights.map((item) => item.pageUrl))],
    },
  };
}
