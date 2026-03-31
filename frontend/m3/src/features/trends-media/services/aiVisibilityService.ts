import { createHttpClient, HttpClientError } from '../../../services/httpClient';
import { endpoints } from '../../../services/endpoints';
import { NewsCluster } from '../types';

const httpClient = createHttpClient({ service: 'api' });

interface AiVisibilityAnalyzeResponse {
  results: NewsCluster[];
}

const resolveScope = (): string => {
  const sessionScope = sessionStorage.getItem('portal_scope');
  return sessionScope?.trim() || '';
};

export const analyzeNewsWithAiVisibility = async (clusters: NewsCluster[]): Promise<NewsCluster[]> => {
  try {
    const data = await httpClient.post<AiVisibilityAnalyzeResponse>(endpoints.ai.visibilityAnalyze(), {
      clusters,
      scope: resolveScope(),
      provider: 'gemini',
    });
    return data.results || [];
  } catch (error) {
    if (error instanceof HttpClientError) {
      throw new Error(error.message || 'No se pudo completar el análisis IA.');
    }
    throw error;
  }
};
