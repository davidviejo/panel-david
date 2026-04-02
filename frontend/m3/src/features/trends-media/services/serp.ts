import { featureFlags } from '../../../config/featureFlags';
import { createHttpClient } from '../../../services/httpClient';
import { endpoints } from '../../../services/endpoints';
import { mapTrendsMediaResponseToArticles } from '../../../shared/api/mappers/trendsMediaMapper';
import { TrendsMediaNewsSearchRequestContract, TrendsMediaNewsSearchResponseContract } from '../../../shared/api/contracts/trendsMedia';
import { AppSettings, NewsArticle } from '../types';

const httpClient = createHttpClient({ service: 'api' });

const isMockFallbackAllowed = (): boolean => {
  const env = (import.meta.env.MODE || '').toLowerCase();
  const explicitMockFlag = (import.meta.env.VITE_TRENDS_MEDIA_ALLOW_MOCKS || '').toLowerCase();
  const enabledByFlag = ['1', 'true', 'yes', 'on'].includes(explicitMockFlag);

  return env !== 'production' && enabledByFlag;
};

export const fetchSerpResults = async (settings: AppSettings): Promise<NewsArticle[]> => {
  if (!featureFlags.trendsMediaBackendSource) {
    if (isMockFallbackAllowed()) {
      console.warn('[trends-media] backend source disabled by flag, using dev-only mock fallback');
      return MOCK_GOOGLE_NEWS_RESPONSE;
    }

    throw new Error('Trends Media backend source is disabled and mocks are blocked in this environment.');
  }

  const payload: TrendsMediaNewsSearchRequestContract = {
    queries: settings.searchQueries,
    country: 'es',
    language: 'es',
    limit: 100,
    provider: 'auto',
  };

  try {
    const response = await httpClient.post<TrendsMediaNewsSearchResponseContract>(
      endpoints.trendsMedia.newsSearch(),
      payload,
    );

    return mapTrendsMediaResponseToArticles(response);
  } catch (error) {
    if (isMockFallbackAllowed()) {
      console.warn('[trends-media] backend request failed, using dev-only mock fallback', error);
      return MOCK_GOOGLE_NEWS_RESPONSE;
    }

    throw error;
  }
};

const MOCK_GOOGLE_NEWS_RESPONSE: NewsArticle[] = [
  {
    article_id: 'mock-1',
    title: 'Mock: Tendencia de ejemplo para desarrollo local',
    url: 'https://example.com/mock-trend',
    source_name: 'Local Mock',
    published_at: '2026-04-01T09:00:00.000Z',
    position: 1,
    keyword: 'mock trend',
    snippet: 'Mock habilitado solo para test/dev con flag explícita.',
  },
];
