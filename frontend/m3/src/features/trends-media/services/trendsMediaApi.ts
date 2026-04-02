import { featureFlags } from '../../../config/featureFlags';
import { endpoints } from '../../../services/endpoints';
import { createHttpClient, HttpClientError } from '../../../services/httpClient';
import { getUiApiErrorDisplay } from '../../../shared/api/errorHandling';
import {
  TrendsMediaNewsRequestContract,
  TrendsMediaNewsResponseContract,
} from '../../../shared/api/contracts/trendsMedia';
import { mapTrendsMediaResponseToUiModel } from '../../../shared/api/mappers/trendsMediaMapper';
import { NewsArticle } from '../types';

const httpClient = createHttpClient({ service: 'api' });

const MOCK_GOOGLE_NEWS_RESPONSE: NewsArticle[] = [];

const isMockFallbackEnabled = (): boolean => featureFlags.trendsMediaMockFallback;

export const fetchTrendsMediaNews = async (
  request: TrendsMediaNewsRequestContract,
): Promise<NewsArticle[]> => {
  try {
    const response = await httpClient.post<TrendsMediaNewsResponseContract>(
      endpoints.trendsMedia.news(),
      request,
    );

    return mapTrendsMediaResponseToUiModel(response.items || []);
  } catch (error) {
    const display = getUiApiErrorDisplay(
      error,
      'No fue posible recuperar noticias de tendencias desde backend.',
    );

    const normalizedError = error as Partial<HttpClientError>;
    console.error('[trends-media-api-error]', {
      code: normalizedError.code || 'UNKNOWN_ERROR',
      status: normalizedError.status,
      traceId: normalizedError.traceId || normalizedError.requestId,
      requestId: normalizedError.requestId,
      message: display.message,
      module: 'trends-media',
    });

    if (isMockFallbackEnabled()) {
      console.warn('[trends-media] mock fallback enabled by feature flag.');
      return MOCK_GOOGLE_NEWS_RESPONSE;
    }

    throw new Error(display.fullMessage);
  }
};
