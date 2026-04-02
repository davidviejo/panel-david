import { createHttpClient } from './httpClient';
import { endpoints } from './endpoints';
import { featureFlags } from '../config/featureFlags';
import { getLegacyIAVisibilityList } from './iaVisibilityLegacySource';
import {
  IAVisibilityConfigResponseContract,
  IAVisibilityHistoryResponseContract,
  IAVisibilityRunRequestContract,
  IAVisibilityRunResponseContract,
  IAVisibilityScheduleContract,
  IAVisibilityScheduleResponseContract,
} from '../shared/api/contracts/iaVisibility';

const httpClient = createHttpClient({ service: 'api' });

export type IAVisibilityRequest = IAVisibilityRunRequestContract;
export type IAVisibilityResponse = IAVisibilityRunResponseContract;
export type IAVisibilityConfigResponse = IAVisibilityConfigResponseContract;
export type IAVisibilityHistoryResponse = IAVisibilityHistoryResponseContract;
export type IAVisibilitySchedule = IAVisibilityScheduleContract;
export type IAVisibilityScheduleResponse = IAVisibilityScheduleResponseContract;

export type IAVisibilityStatus = 'up' | 'stable' | 'down';

export interface IAVisibilityListItem {
  id: string;
  keyword: string;
  url: string;
  position: number;
  change: number;
  status: IAVisibilityStatus;
  updatedAt: string;
}

export interface IAVisibilityListResponse {
  clientId: string;
  items: IAVisibilityListItem[];
}


export const iaVisibilityService = {
  list: (clientId: string): Promise<IAVisibilityListResponse> => {
    if (featureFlags.iaVisibilityBackendSource) {
      return httpClient.get<IAVisibilityListResponse>(endpoints.ai.visibilityList(clientId));
    }

    return getLegacyIAVisibilityList(clientId);
  },

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
};
