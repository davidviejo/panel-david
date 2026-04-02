import type { NormalizedInsight } from '../types/contracts';

export interface AdapterOutput {
  insights: NormalizedInsight[];
  supporting_data: {
    total_items: number;
    avg_position: number;
    keywords: string[];
    urls: string[];
  };
}

type RawSerpItem = {
  keyword?: string;
  url?: string;
  position?: number;
  timestamp?: string;
};

export function adaptDataforseoSerp(payload: unknown): AdapterOutput {
  const rows: RawSerpItem[] = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { items?: unknown[] })?.items)
      ? ((payload as { items: RawSerpItem[] }).items ?? [])
      : [];

  const insights = rows
    .filter((row) => row.keyword && row.url && typeof row.position === 'number')
    .map<NormalizedInsight>((row, index) => ({
      id: `dataforseo-serp-${index + 1}`,
      source: 'dataforseo',
      analysisType: 'incremental',
      entityType: 'keyword',
      keyword: row.keyword ?? '',
      pageUrl: row.url ?? '',
      metric: 'serp_position',
      value: row.position ?? 0,
      detectedAt: row.timestamp ?? new Date(0).toISOString(),
    }));

  const avgPosition =
    insights.length === 0 ? 0 : insights.reduce((sum, item) => sum + item.value, 0) / insights.length;

  return {
    insights,
    supporting_data: {
      total_items: insights.length,
      avg_position: Number(avgPosition.toFixed(2)),
      keywords: [...new Set(insights.map((item) => item.keyword))],
      urls: [...new Set(insights.map((item) => item.pageUrl))],
    },
  };
}
