import { createHttpClient } from './httpClient';
import { endpoints } from './endpoints';
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

const fallbackRows: IAVisibilityListItem[] = [
  {
    id: '1',
    keyword: 'seo para medios digitales',
    url: '/guias/seo-medios',
    position: 5,
    change: 3,
    status: 'up',
    updatedAt: '2026-03-30',
  },
  {
    id: '2',
    keyword: 'indexacion google news',
    url: '/noticias/google-news-indexacion',
    position: 12,
    change: 0,
    status: 'stable',
    updatedAt: '2026-03-30',
  },
  {
    id: '3',
    keyword: 'clusterizacion semantica',
    url: '/seo/clusterizacion-semantica',
    position: 18,
    change: -4,
    status: 'down',
    updatedAt: '2026-03-29',
  },
];

const isNonProdMockFallbackEnabled =
  import.meta.env.DEV && import.meta.env.VITE_IA_VISIBILITY_ENABLE_MOCK_FALLBACK === 'true';

export const iaVisibilityService = {
  list: async (clientId: string): Promise<IAVisibilityListResponse> => {
    try {
      return await httpClient.get<IAVisibilityListResponse>(endpoints.ai.visibilityList(clientId));
    } catch (error) {
      if (isNonProdMockFallbackEnabled) {
        return {
          clientId,
          items: fallbackRows,
        };
      }

      throw error;
    }
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
