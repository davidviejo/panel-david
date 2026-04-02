import { createHttpClient } from './httpClient';
import { endpoints } from './endpoints';

const httpClient = createHttpClient({ service: 'api' });

export interface IAVisibilityRequest {
  clientId: string;
  brand: string;
  competitors: string[];
  promptTemplate: string;
  sources: string[];
  providerPriority: string[];
}

export interface IAVisibilityEvidence {
  id?: string | number;
  keyword?: string;
  query?: string;
  term?: string;
  url?: string;
  targetUrl?: string;
  pageUrl?: string;
  position?: number;
  rank?: number;
  change?: number;
  delta?: number;
  updatedAt?: string;
  capturedAt?: string;
  [key: string]: unknown;
}

export interface IAVisibilityResponse {
  id?: string | number;
  clientId: string;
  version?: number;
  runTrigger?: 'manual' | 'scheduled';
  mentions: number;
  shareOfVoice: number;
  sentiment: number;
  competitorAppearances: Record<string, number>;
  rawEvidence: IAVisibilityEvidence[];
  providerUsed?: string;
  createdAt?: string;
}

export interface IAVisibilityResultRow {
  id: string;
  keyword: string;
  url: string;
  position: number;
  change: number;
  status: 'up' | 'stable' | 'down';
  updatedAt: string;
}

export interface IAVisibilityConfigResponse {
  status: 'ok';
  config: IAVisibilityRequest & {
    updatedAt?: string;
  };
}

export interface IAVisibilityHistoryResponse {
  clientId: string;
  runs: IAVisibilityResponse[];
}

export interface IAVisibilitySchedule {
  frequency: 'daily' | 'weekly';
  timezone: string;
  runHour: number;
  runMinute: number;
  status: 'active' | 'paused';
  lastRunAt?: string;
  updatedAt?: string;
}

export interface IAVisibilityScheduleResponse {
  status?: 'ok';
  clientId: string;
  schedule: IAVisibilitySchedule;
}

const developmentFallbackRows: IAVisibilityResultRow[] = [
  {
    id: 'seed-1',
    keyword: 'seo para medios digitales',
    url: '/guias/seo-medios',
    position: 5,
    change: 3,
    status: 'up',
    updatedAt: '2026-03-30',
  },
  {
    id: 'seed-2',
    keyword: 'indexacion google news',
    url: '/noticias/google-news-indexacion',
    position: 12,
    change: 0,
    status: 'stable',
    updatedAt: '2026-03-30',
  },
  {
    id: 'seed-3',
    keyword: 'clusterizacion semantica',
    url: '/seo/clusterizacion-semantica',
    position: 18,
    change: -4,
    status: 'down',
    updatedAt: '2026-03-29',
  },
];

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object';

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const toStringValue = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return fallback;
};

const resolveStatus = (change: number): IAVisibilityResultRow['status'] => {
  if (change > 0) return 'up';
  if (change < 0) return 'down';
  return 'stable';
};

const normalizeEvidenceRow = (
  evidence: IAVisibilityEvidence,
  run: IAVisibilityResponse,
  index: number,
): IAVisibilityResultRow => {
  const position = toNumber(evidence.position ?? evidence.rank, 0);
  const change = toNumber(evidence.change ?? evidence.delta, 0);

  return {
    id: toStringValue(evidence.id, `${run.id ?? run.version ?? 'run'}-${index}`),
    keyword: toStringValue(evidence.keyword ?? evidence.query ?? evidence.term, 'Sin keyword'),
    url: toStringValue(evidence.url ?? evidence.targetUrl ?? evidence.pageUrl, '-'),
    position,
    change,
    status: resolveStatus(change),
    updatedAt: toStringValue(evidence.updatedAt ?? evidence.capturedAt ?? run.createdAt, ''),
  };
};

const mapHistoryToResultRows = (runs: IAVisibilityResponse[]): IAVisibilityResultRow[] => {
  const rows = runs.flatMap((run, runIndex) => {
    const evidences = Array.isArray(run.rawEvidence) ? run.rawEvidence.filter(isObject) : [];

    if (evidences.length > 0) {
      return evidences.map((evidence, evidenceIndex) =>
        normalizeEvidenceRow(evidence as IAVisibilityEvidence, run, evidenceIndex),
      );
    }

    const synthesizedRow: IAVisibilityResultRow = {
      id: `run-${toStringValue(run.id, String(runIndex))}`,
      keyword: `Run #${run.version ?? runIndex + 1}`,
      url: run.providerUsed ? `provider:${run.providerUsed}` : '-',
      position: 0,
      change: 0,
      status: 'stable',
      updatedAt: toStringValue(run.createdAt, ''),
    };

    return [synthesizedRow];
  });

  return rows;
};

const canUseDevelopmentFallback = () =>
  import.meta.env.DEV && import.meta.env.VITE_IA_VISIBILITY_ALLOW_MOCK_FALLBACK === 'true';

export const iaVisibilityService = {
  run: (payload: IAVisibilityRequest) =>
    httpClient.post<IAVisibilityResponse>(endpoints.ai.visibilityRun(), payload),

  getHistory: (clientId: string) =>
    httpClient.get<IAVisibilityHistoryResponse>(endpoints.ai.visibilityHistory(clientId)),

  getConfig: (clientId: string) =>
    httpClient.get<IAVisibilityConfigResponse>(endpoints.ai.visibilityConfig(clientId)),

  saveConfig: (clientId: string, payload: IAVisibilityRequest) =>
    httpClient.post<IAVisibilityConfigResponse>(endpoints.ai.visibilityConfig(clientId), payload),

  getSchedule: (clientId: string) =>
    httpClient.get<IAVisibilityScheduleResponse>(endpoints.ai.visibilitySchedule(clientId)),

  saveSchedule: (clientId: string, payload: Partial<IAVisibilitySchedule>) =>
    httpClient.post<IAVisibilityScheduleResponse>(endpoints.ai.visibilitySchedule(clientId), payload),

  toggleSchedule: (clientId: string, action: 'pause' | 'resume') =>
    httpClient.post<IAVisibilityScheduleResponse>(endpoints.ai.visibilityScheduleAction(clientId, action), {}),

  getResultRows: async (clientId: string): Promise<IAVisibilityResultRow[]> => {
    const response = await httpClient.get<IAVisibilityHistoryResponse>(endpoints.ai.visibilityHistory(clientId));
    const rows = mapHistoryToResultRows(response.runs || []);

    if (rows.length > 0) {
      return rows;
    }

    if (canUseDevelopmentFallback()) {
      return developmentFallbackRows;
    }

    return [];
  },
};
