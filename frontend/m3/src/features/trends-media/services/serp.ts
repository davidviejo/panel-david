import { featureFlags } from '../../../config/featureFlags';
import { endpoints } from '../../../services/endpoints';
import { createHttpClient, HttpClientError } from '../../../services/httpClient';
import {
  TrendsMediaNewsRequestContract,
  TrendsMediaNewsResponseContract,
} from '../../../shared/api/contracts/trendsMedia';
import { mapTrendsMediaArticleToUiModel } from '../../../shared/api/mappers/trendsMediaMapper';
import { AppSettings, NewsArticle } from '../types';
import { SettingsRepository } from '../../../services/settingsRepository';

const httpClient = createHttpClient({ service: 'api' });
const isProductionRuntime = (): boolean =>
  import.meta.env.PROD || import.meta.env.MODE === 'production' || import.meta.env.NODE_ENV === 'production';

const buildRequest = (settings: AppSettings): TrendsMediaNewsRequestContract => {
  const appSettings = SettingsRepository.getSettings();

  return {
    queries: settings.searchQueries,
    provider: (appSettings.defaultSerpProvider || 'serpapi') as 'serpapi' | 'dataforseo' | 'auto',
    language: 'es',
    country: 'es',
    maxResults: 100,
  };
};

const logStructuredError = (error: HttpClientError | Error, settings: AppSettings): void => {
  const normalized = error as HttpClientError;

  console.error('[trends-media-serp-error]', {
    module: 'trends-media',
    event: 'news-fetch-failed',
    queryCount: settings.searchQueries.length,
    code: normalized.code || 'UNHANDLED_ERROR',
    status: normalized.status,
    traceId: normalized.traceId,
    requestId: normalized.requestId,
    message: normalized.message,
  });
};

export const fetchSerpResults = async (settings: AppSettings): Promise<NewsArticle[]> => {
  const useBackendSource = featureFlags.trendsMediaBackendSource;

  if (!useBackendSource) {
    if (isProductionRuntime()) {
      throw new Error(
        'Trends Media legacy source is disabled in production. Habilita backend source o ajusta el feature flag.',
      );
    }

    console.warn('[trends-media] legacy mode active for non-production environment');
    return [];
  }

  try {
    const response = await httpClient.post<TrendsMediaNewsResponseContract>(
      endpoints.trendsMedia.news(),
      buildRequest(settings),
    );

    return response.articles.map(mapTrendsMediaArticleToUiModel);
  } catch (error) {
    logStructuredError(error as Error, settings);

    if (error instanceof HttpClientError && (error.traceId || error.requestId)) {
      const traceability = error.traceId || error.requestId;
      throw new Error(
        `No se pudo cargar Trends Media desde backend. TraceId/RequestId: ${traceability}`,
      );
    }

    throw new Error('No se pudo cargar Trends Media desde backend.');
  }
};
