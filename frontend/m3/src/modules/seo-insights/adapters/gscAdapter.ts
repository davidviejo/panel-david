import type { NormalizedInsight } from '../types/contracts';

export interface AdapterOutput {
  insights: NormalizedInsight[];
  supporting_data: {
    total_items: number;
    total_clicks: number;
    avg_ctr: number;
    keywords: string[];
  };
}

type RawGscRow = {
  query?: string;
  page?: string;
  clicks?: number;
  ctr?: number;
  date?: string;
};

export function adaptGsc(payload: unknown): AdapterOutput {
  const rows: RawGscRow[] = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { rows?: unknown[] })?.rows)
      ? ((payload as { rows: RawGscRow[] }).rows ?? [])
      : [];

  const insights = rows
    .filter((row) => row.query && row.page && typeof row.clicks === 'number')
    .map<NormalizedInsight>((row, index) => ({
      id: `gsc-${index + 1}`,
      source: 'gsc',
      analysisType: 'incremental',
      entityType: 'keyword',
      keyword: row.query ?? '',
      pageUrl: row.page ?? '',
      metric: 'gsc_clicks',
      value: row.clicks ?? 0,
      detectedAt: row.date ?? new Date(0).toISOString(),
    }));

  const totalClicks = insights.reduce((sum, item) => sum + item.value, 0);
  const avgCtr = rows.length === 0 ? 0 : rows.reduce((sum, row) => sum + (row.ctr ?? 0), 0) / rows.length;

  return {
    insights,
    supporting_data: {
      total_items: insights.length,
      total_clicks: totalClicks,
      avg_ctr: Number(avgCtr.toFixed(4)),
      keywords: [...new Set(insights.map((item) => item.keyword))],
    },
  };
}
