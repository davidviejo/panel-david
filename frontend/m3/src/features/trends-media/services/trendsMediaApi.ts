import { featureFlags } from '../../../config/featureFlags';
import { createHttpClient } from '../../../services/httpClient';
import { endpoints } from '../../../services/endpoints';
import { getUiApiErrorDisplay, normalizeApiError } from '../../../shared/api/errorHandling';
import { logApiError } from '../../../shared/api/apiErrorLogger';
import {
  TrendsMediaNewsRequestContract,
  TrendsMediaNewsResponseContract,
} from '../../../shared/api/contracts/trendsMedia';
import { AppSettings, NewsArticle } from '../types';
import { mapTrendsMediaNewsToUi } from './trendsMediaMapper';

const httpClient = createHttpClient({ service: 'api' });

const LEGACY_DEV_MOCKS: NewsArticle[] = [
  {
    article_id: 'legacy-dev-1',
    title: 'Mock dev: endpoint Trends Media backend no habilitado',
    url: 'https://example.com/dev-mock',
    source_name: 'Mock',
    published_at: new Date().toISOString(),
    position: 1,
    keyword: 'dev',
    snippet: 'Solo para desarrollo local controlado.',
  },
];

const toRequest = (settings: AppSettings): TrendsMediaNewsRequestContract => ({
  queries: settings.searchQueries,
  maxResults: 100,
  language: 'es',
  country: 'es',
  timePeriod: 'd',
});

const useBackendSource = featureFlags.trendsMediaBackendSource;

export const fetchTrendsMediaNews = async (settings: AppSettings): Promise<NewsArticle[]> => {
  if (!useBackendSource) {
    if (import.meta.env.PROD) {
      throw new Error('Trends Media legacy source está deshabilitado en producción. Activa backend source.');
    }
    return LEGACY_DEV_MOCKS;
  }

  try {
    const response = await httpClient.post<TrendsMediaNewsResponseContract>(
      endpoints.trendsMedia.news(),
      toRequest(settings),
      { includeAuth: false },
    );
    return mapTrendsMediaNewsToUi(response);
  } catch (error) {
    const normalized = normalizeApiError(error, 'No pudimos cargar noticias para Trends Media.');
    logApiError({
      endpoint: endpoints.trendsMedia.news(),
      code: normalized.code,
      message: normalized.message,
      status: normalized.status,
      traceId: normalized.traceId,
      requestId: normalized.requestId,
    });

    const display = getUiApiErrorDisplay(error, 'No pudimos cargar noticias para Trends Media.');
    throw new Error(display.fullMessage);
  }
};
