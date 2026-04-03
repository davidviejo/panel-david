import { createHttpClient } from './httpClient';
import { endpoints } from './endpoints';
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
import { resolveModuleDataSource } from '../shared/data-hooks/backendSourceResolver';
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

const shouldUseBackendSource = (tenantId?: string): boolean =>
  resolveModuleDataSource({ module: 'ia_visibility', tenantId });

export const iaVisibilityService = {
  list: (clientId: string): Promise<IAVisibilityListResponse> => {
    if (shouldUseBackendSource(clientId)) {
      return httpClient.get<IAVisibilityListResponse>(endpoints.ai.visibilityList(clientId));
    }

    return getLegacyIAVisibilityList(clientId);
  },

  run: (payload: IAVisibilityRequest) => {
    if (shouldUseBackendSource(payload.clientId)) {
      return httpClient.post<IAVisibilityResponse>(endpoints.ai.visibilityRun(), payload);
    }
    return runLegacyIAVisibility(payload);
  },

  getHistory: (clientId: string) => {
    if (shouldUseBackendSource(clientId)) {
      return httpClient.get<IAVisibilityHistoryResponse>(endpoints.ai.visibilityHistory(clientId));
    }
    return getLegacyIAVisibilityHistory(clientId);
  },

  getConfig: (clientId: string) => {
    if (shouldUseBackendSource(clientId)) {
      return httpClient.get<IAVisibilityConfigResponse>(endpoints.ai.visibilityConfig(clientId));
    }
    return getLegacyIAVisibilityConfig(clientId);
  },

  saveConfig: (clientId: string, payload: IAVisibilityRequest) => {
    if (shouldUseBackendSource(clientId)) {
      return httpClient.post<IAVisibilityConfigResponse>(
        endpoints.ai.visibilityConfig(clientId),
        payload,
      );
    }
    return saveLegacyIAVisibilityConfig(clientId, payload);
  },

  getSchedule: (clientId: string) => {
    if (shouldUseBackendSource(clientId)) {
      return httpClient.get<IAVisibilityScheduleResponse>(
        endpoints.ai.visibilitySchedule(clientId),
      );
    }
    return getLegacyIAVisibilitySchedule(clientId);
  },

  saveSchedule: (clientId: string, payload: Partial<IAVisibilitySchedule>) => {
    if (shouldUseBackendSource(clientId)) {
      return httpClient.post<IAVisibilityScheduleResponse>(
        endpoints.ai.visibilitySchedule(clientId),
        payload,
      );
    }
    return saveLegacyIAVisibilitySchedule(clientId, payload);
  },

  toggleSchedule: (clientId: string, action: 'pause' | 'resume') => {
    if (shouldUseBackendSource(clientId)) {
      return httpClient.post<IAVisibilityScheduleResponse>(
        endpoints.ai.visibilityScheduleAction(clientId, action),
        {},
      );
    }
    return toggleLegacyIAVisibilitySchedule(clientId, action);
  },
};
