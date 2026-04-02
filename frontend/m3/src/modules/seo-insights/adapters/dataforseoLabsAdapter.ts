import type { NormalizedInsight } from '../types/contracts';

export interface AdapterOutput {
  insights: NormalizedInsight[];
  supporting_data: {
    total_items: number;
    avg_search_volume: number;
    keywords: string[];
    competition_breakdown: Record<string, number>;
  };
}

type RawLabsItem = {
  keyword?: string;
  landing_page?: string;
  search_volume?: number;
  competition?: 'low' | 'medium' | 'high' | string;
  timestamp?: string;
};

export function adaptDataforseoLabs(payload: unknown): AdapterOutput {
  const rows: RawLabsItem[] = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { tasks?: unknown[] })?.tasks)
      ? ((payload as { tasks: RawLabsItem[] }).tasks ?? [])
      : [];

  const insights = rows
    .filter((row) => row.keyword && row.landing_page && typeof row.search_volume === 'number')
    .map<NormalizedInsight>((row, index) => ({
      id: `dataforseo-labs-${index + 1}`,
      source: 'dataforseo',
      analysisType: 'full',
      entityType: 'keyword',
      keyword: row.keyword ?? '',
      pageUrl: row.landing_page ?? '',
      metric: 'search_volume',
      value: row.search_volume ?? 0,
      detectedAt: row.timestamp ?? new Date(0).toISOString(),
    }));

  const avgVolume =
    insights.length === 0 ? 0 : insights.reduce((sum, item) => sum + item.value, 0) / insights.length;

  const competition_breakdown = rows.reduce<Record<string, number>>((acc, row) => {
    const bucket = row.competition ?? 'unknown';
    acc[bucket] = (acc[bucket] ?? 0) + 1;
    return acc;
  }, {});

  return {
    insights,
    supporting_data: {
      total_items: insights.length,
      avg_search_volume: Number(avgVolume.toFixed(2)),
      keywords: [...new Set(insights.map((item) => item.keyword))],
      competition_breakdown,
    },
  };
}
