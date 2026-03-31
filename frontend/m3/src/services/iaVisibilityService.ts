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

export interface IAVisibilityResponse {
  id?: string | number;
  clientId: string;
  mentions: number;
  shareOfVoice: number;
  sentiment: number;
  competitorAppearances: Record<string, number>;
  rawEvidence: Array<Record<string, unknown>>;
  providerUsed?: string;
  createdAt?: string;
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

export const iaVisibilityService = {
  run: (payload: IAVisibilityRequest) =>
    httpClient.post<IAVisibilityResponse>(endpoints.ai.visibilityRun(), payload),

  getHistory: (clientId: string) =>
    httpClient.get<IAVisibilityHistoryResponse>(endpoints.ai.visibilityHistory(clientId)),

  saveConfig: (clientId: string, payload: IAVisibilityRequest) =>
    httpClient.post<IAVisibilityConfigResponse>(endpoints.ai.visibilityConfig(clientId), payload),
};
