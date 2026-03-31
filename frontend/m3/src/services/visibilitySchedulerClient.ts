import { endpoints } from './endpoints';
import { createHttpClient } from './httpClient';

const engineHttpClient = createHttpClient({ service: 'engine' });

export type VisibilityFrequency = 'daily' | 'weekly';
export type VisibilityStatus = 'active' | 'paused';

export interface VisibilitySchedulePayload {
  frequency: VisibilityFrequency;
  timezone: string;
  runHour: string;
  status: VisibilityStatus;
  runPayload: Record<string, unknown>;
}

export interface VisibilityScheduleRecord {
  client_id: string;
  frequency: VisibilityFrequency;
  timezone: string;
  run_hour: string;
  status: VisibilityStatus;
  next_run_at?: string | null;
  last_run_at?: string | null;
}

export const upsertVisibilitySchedule = async (clientId: string, payload: VisibilitySchedulePayload) =>
  engineHttpClient.request<{ schedule: VisibilityScheduleRecord }>(
    endpoints.engine.visibilitySchedule(clientId),
    { method: 'PUT', body: payload },
  );

export const getVisibilitySchedule = async (clientId: string) =>
  engineHttpClient.get<{ schedule: VisibilityScheduleRecord }>(endpoints.engine.visibilitySchedule(clientId));

export const pauseVisibilitySchedule = async (clientId: string) =>
  engineHttpClient.post<{ status: 'paused' }>(endpoints.engine.visibilityScheduleAction(clientId, 'pause'));

export const resumeVisibilitySchedule = async (clientId: string) =>
  engineHttpClient.post<{ status: 'active'; nextRunAt: string }>(
    endpoints.engine.visibilityScheduleAction(clientId, 'resume'),
  );

export interface VisibilityRunRecord {
  run_id: string;
  status: string;
  started_at: string;
  finished_at?: string | null;
  error_message?: string | null;
  retryable_error?: number;
}

export const getVisibilityRuns = async (clientId: string, limit = 20) => {
  const query = new URLSearchParams({ limit: String(limit) });
  return engineHttpClient.get<{ runs: VisibilityRunRecord[] }>(endpoints.engine.visibilityRuns(clientId, query));
};
