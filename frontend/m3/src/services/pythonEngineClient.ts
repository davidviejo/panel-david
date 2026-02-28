import { ChecklistKey, AnalysisConfigPayload, Capabilities } from '../types/seoChecklist';

const ENGINE_URL = import.meta.env.VITE_PYTHON_ENGINE_URL;

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

export const getCapabilities = async (): Promise<Capabilities | null> => {
  if (!ENGINE_URL) {
    return null;
  }

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
  if (!ENGINE_URL) {
    throw new Error('MOTOR_NOT_CONFIGURED');
  }

  try {
    const response = await fetch(`${ENGINE_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Engine Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data as AnalysisResponse;
  } catch (error: any) {
    if (error.message === 'MOTOR_NOT_CONFIGURED') {
      throw error;
    }
    console.error('Python Engine Error:', error);
    throw new Error(error.message || 'Error connecting to Python Engine');
  }
};

// Batch API Methods

export const createBatchJob = async (payload: BatchJobPayload): Promise<BatchJobResponse> => {
  if (!ENGINE_URL) {
    throw new Error('MOTOR_NOT_CONFIGURED');
  }

  const response = await fetch(`${ENGINE_URL}/api/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('BATCH_API_NOT_FOUND');
    }
    const errText = await response.text();
    throw new Error(`Failed to create batch job: ${response.statusText} - ${errText}`);
  }

  return response.json();
};

export const getBatchJob = async (jobId: string): Promise<BatchJobStatus> => {
  if (!ENGINE_URL) {
    throw new Error('MOTOR_NOT_CONFIGURED');
  }

  const response = await fetch(`${ENGINE_URL}/api/jobs/${jobId}`);
  if (!response.ok) {
    throw new Error(`Failed to get job status: ${response.statusText}`);
  }
  return response.json();
};

export const updateBatchJob = async (
  jobId: string,
  action: 'pause' | 'resume' | 'cancel',
): Promise<void> => {
  if (!ENGINE_URL) {
    throw new Error('MOTOR_NOT_CONFIGURED');
  }

  const response = await fetch(`${ENGINE_URL}/api/jobs/${jobId}`, {
    method: 'PATCH', // Assuming PATCH for updates, or POST to /actions
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update job: ${response.statusText}`);
  }
};

export const getBatchJobItems = async (
  jobId: string,
  status?: string,
  page: number = 1,
  limit: number = 50,
): Promise<{ items: BatchJobItem[]; total: number }> => {
  if (!ENGINE_URL) {
    throw new Error('MOTOR_NOT_CONFIGURED');
  }

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (status) {
    params.append('status', status);
  }

  const response = await fetch(`${ENGINE_URL}/api/jobs/${jobId}/items?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to get job items: ${response.statusText}`);
  }
  return response.json();
};

export const getBatchJobItemResult = async (
  jobId: string,
  itemId: string,
): Promise<AnalysisResponse> => {
  if (!ENGINE_URL) {
    throw new Error('MOTOR_NOT_CONFIGURED');
  }

  const response = await fetch(`${ENGINE_URL}/api/jobs/${jobId}/items/${itemId}/result`);
  if (!response.ok) {
    throw new Error(`Failed to get item result: ${response.statusText}`);
  }
  return response.json();
};
