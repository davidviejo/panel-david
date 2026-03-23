import { ChecklistKey, AnalysisConfigPayload, Capabilities } from '../types/seoChecklist';
import { resolveEngineUrl } from './apiUrlHelper';

const ENGINE_URL = resolveEngineUrl();

export interface AnalysisPayload {
  url: string;
  kwPrincipal: string;
  pageType: string;
  geoTarget?: string;
  cluster?: string;
  pageId: string;
  gscQueries?: any[];
  analysisConfig?: AnalysisConfigPayload;
}

export interface AnalysisResponse {
  pageId: string;
  items: Partial<
    Record<
      ChecklistKey,
      {
        autoData?: any;
        recommendation?: string;
        suggested_status?: string;
      }
    >
  >;
  advancedExecuted?: boolean;
  advancedBlockedReason?: string;
  engineMeta?: {
    requestedProvider: string;
    usedProvider: string;
    fallbackChain: string[];
    providerFailureReasons?: Record<string, string>;
  };
}

export interface BatchJobPayload {
  items: AnalysisPayload[];
  config?: AnalysisConfigPayload;
}

export interface BatchJobResponse {
  jobId: string;
  message?: string;
}

export type JobStatus = 'pending' | 'processing' | 'done' | 'cancelled' | 'error';

export interface BatchJobStatus {
  id: string;
  status: JobStatus;
  progress: {
    total: number;
    processed: number;
    succeeded: number;
    failed: number;
  };
  created_at: string;
  completed_at?: string;
  error?: string;
}

export interface BatchJobItem {
  itemId: string; // correlates to pageId
  status: 'pending' | 'processing' | 'done' | 'error';
  url: string;
  error?: string;
  updated_at?: string;
}

type RawBatchJobStatus = {
  id?: string;
  jobId?: string;
  status?: string;
  progress?: {
    total?: number;
    processed?: number;
    succeeded?: number;
    failed?: number;
  };
  total?: number;
  processed?: number;
  success?: number;
  succeeded?: number;
  errors?: number;
  failed?: number;
  created_at?: string;
  createdAt?: string;
  completed_at?: string;
  completedAt?: string;
  updatedAt?: string;
  lastError?: string;
  error?: string;
};

type RawBatchJobItemsResponse = {
  items?: any[];
  total?: number;
};

const mapJobStatus = (status?: string): JobStatus => {
  switch (status) {
    case 'queued':
    case 'paused':
    case 'pending':
      return 'pending';
    case 'running':
    case 'processing':
      return 'processing';
    case 'completed':
    case 'done':
      return 'done';
    case 'failed':
    case 'error':
      return 'error';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'pending';
  }
};

const mapItemStatus = (status?: string): BatchJobItem['status'] => {
  const mapped = mapJobStatus(status);
  if (mapped === 'cancelled') {
    return 'error';
  }
  return mapped;
};

const normalizeBatchJob = (raw: RawBatchJobStatus): BatchJobStatus => ({
  id: raw.id || raw.jobId || '',
  status: mapJobStatus(raw.status),
  progress: {
    total: raw.progress?.total ?? raw.total ?? 0,
    processed: raw.progress?.processed ?? raw.processed ?? 0,
    succeeded: raw.progress?.succeeded ?? raw.success ?? raw.succeeded ?? 0,
    failed: raw.progress?.failed ?? raw.errors ?? raw.failed ?? 0,
  },
  created_at: raw.created_at || raw.createdAt || new Date().toISOString(),
  completed_at: raw.completed_at || raw.completedAt || undefined,
  error: raw.error || raw.lastError || undefined,
});

const normalizeBatchJobItem = (raw: any): BatchJobItem => ({
  itemId: raw.itemId || raw.item_id || raw.pageId || raw.page_id || '',
  status: mapItemStatus(raw.status),
  url: raw.url || raw.target_url || '',
  error: raw.error || raw.last_error || undefined,
  updated_at: raw.updated_at || raw.updatedAt || undefined,
});

const buildError = async (response: Response, fallback: string): Promise<Error> => {
  try {
    const data = await response.json();
    if (data?.error) {
      return new Error(data.error);
    }
    return new Error(fallback);
  } catch {
    const text = await response.text();
    return new Error(text || fallback);
  }
};

export const getCapabilities = async (): Promise<Capabilities | null> => {
  try {
    const response = await fetch(`${ENGINE_URL}/api/capabilities`);
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data as Capabilities;
  } catch (error) {
    console.warn('Failed to fetch capabilities:', error);
    return null;
  }
};

export const analyzeUrl = async (payload: AnalysisPayload): Promise<AnalysisResponse> => {
  try {
    const response = await fetch(`${ENGINE_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw await buildError(response, `Engine Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data as AnalysisResponse;
  } catch (error: any) {
    console.error('Python Engine Error:', error);
    throw new Error(error.message || 'Error connecting to Python Engine');
  }
};

// Batch API Methods

export const createBatchJob = async (payload: BatchJobPayload): Promise<BatchJobResponse> => {
  const response = await fetch(`${ENGINE_URL}/api/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: payload.items,
      config: payload.config,
    }),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('BATCH_API_NOT_FOUND');
    }
    throw await buildError(response, `Failed to create batch job: ${response.statusText}`);
  }

  return response.json();
};

export const getBatchJob = async (jobId: string): Promise<BatchJobStatus> => {
  const response = await fetch(`${ENGINE_URL}/api/jobs/${jobId}`);
  if (!response.ok) {
    throw await buildError(response, `Failed to get job status: ${response.statusText}`);
  }
  return normalizeBatchJob((await response.json()) as RawBatchJobStatus);
};

export const updateBatchJob = async (
  jobId: string,
  action: 'pause' | 'resume' | 'cancel',
): Promise<void> => {
  const response = await fetch(`${ENGINE_URL}/api/jobs/${jobId}/${action}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw await buildError(response, `Failed to update job: ${response.statusText}`);
  }
};

export const getBatchJobItems = async (
  jobId: string,
  status?: string,
  page: number = 1,
  limit: number = 50,
): Promise<{ items: BatchJobItem[]; total: number }> => {
  if (status === 'pending,processing') {
    const [pending, processing] = await Promise.all([
      getBatchJobItems(jobId, 'pending', page, limit),
      getBatchJobItems(jobId, 'running', page, limit),
    ]);

    const merged = [...pending.items, ...processing.items].slice(0, limit);
    return {
      items: merged,
      total: pending.total + processing.total,
    };
  }

  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: limit.toString(),
  });
  if (status) {
    params.append('status', status);
  }

  const response = await fetch(`${ENGINE_URL}/api/jobs/${jobId}/items?${params.toString()}`);
  if (!response.ok) {
    throw await buildError(response, `Failed to get job items: ${response.statusText}`);
  }

  const data = (await response.json()) as RawBatchJobItemsResponse;
  return {
    items: (data.items || []).map(normalizeBatchJobItem),
    total: data.total || 0,
  };
};

export const getBatchJobItemResult = async (
  jobId: string,
  itemId: string,
): Promise<AnalysisResponse> => {
  const response = await fetch(`${ENGINE_URL}/api/jobs/${jobId}/items/${itemId}/result`);
  if (!response.ok) {
    throw await buildError(response, `Failed to get item result: ${response.statusText}`);
  }
  return response.json();
};
