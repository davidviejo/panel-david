import { createHttpClient } from './httpClient';
import { endpoints } from './endpoints';
import { featureFlags } from '../config/featureFlags';
import {
  getLegacyIAVisibilityConfig,
  getLegacyIAVisibilityHistory,
  getLegacyIAVisibilityList,
  getLegacyIAVisibilitySchedule,
  runLegacyIAVisibility,
  saveLegacyIAVisibilityConfig,
  saveLegacyIAVisibilitySchedule,
  toggleLegacyIAVisibilitySchedule,
} from './iaVisibilityLegacySource';
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

const useBackendSource = featureFlags.iaVisibilityBackendSource;

export const iaVisibilityService = {
  list: (clientId: string): Promise<IAVisibilityListResponse> => {
    if (useBackendSource) {
      return httpClient.get<IAVisibilityListResponse>(endpoints.ai.visibilityList(clientId));
    }

    return getLegacyIAVisibilityList(clientId);
  },

  run: (payload: IAVisibilityRequest) => {
    if (useBackendSource) {
      return httpClient.post<IAVisibilityResponse>(endpoints.ai.visibilityRun(), payload);
    }
    return runLegacyIAVisibility(payload);
  },

  getHistory: (clientId: string) => {
    if (useBackendSource) {
      return httpClient.get<IAVisibilityHistoryResponse>(endpoints.ai.visibilityHistory(clientId));
    }
    return getLegacyIAVisibilityHistory(clientId);
  },

  getConfig: (clientId: string) => {
    if (useBackendSource) {
      return httpClient.get<IAVisibilityConfigResponse>(endpoints.ai.visibilityConfig(clientId));
    }
    return getLegacyIAVisibilityConfig(clientId);
  },

  saveConfig: (clientId: string, payload: IAVisibilityRequest) => {
    if (useBackendSource) {
      return httpClient.post<IAVisibilityConfigResponse>(endpoints.ai.visibilityConfig(clientId), payload);
    }
    return saveLegacyIAVisibilityConfig(clientId, payload);
  },

  getSchedule: (clientId: string) => {
    if (useBackendSource) {
      return httpClient.get<IAVisibilityScheduleResponse>(endpoints.ai.visibilitySchedule(clientId));
    }
    return getLegacyIAVisibilitySchedule(clientId);
  },

  saveSchedule: (clientId: string, payload: Partial<IAVisibilitySchedule>) => {
    if (useBackendSource) {
      return httpClient.post<IAVisibilityScheduleResponse>(endpoints.ai.visibilitySchedule(clientId), payload);
    }
    return saveLegacyIAVisibilitySchedule(clientId, payload);
  },

  toggleSchedule: (clientId: string, action: 'pause' | 'resume') => {
    if (useBackendSource) {
      return httpClient.post<IAVisibilityScheduleResponse>(endpoints.ai.visibilityScheduleAction(clientId, action), {});
    }
    return toggleLegacyIAVisibilitySchedule(clientId, action);
  },
};
