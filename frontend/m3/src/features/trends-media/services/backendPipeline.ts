import { resolveApiUrl } from '../../../services/apiUrlHelper';
import { AppSettings, PipelineJobStatus } from '../types';

const API_URL = resolveApiUrl();

const toMultiline = (values: string[]) => values.filter(Boolean).join('\n');

export const startTrendPipeline = async (settings: AppSettings): Promise<string> => {
  const formData = new FormData();
  formData.append('geo', settings.geo);
  formData.append('category', settings.category);
  formData.append('ranking_mode', settings.rankingMode);
  formData.append('focus_terms', settings.focusTerms.join(', '));
  formData.append('search_mode', settings.searchMode);
  formData.append('serp_provider', settings.serpProvider);
  formData.append('serp_api_key', settings.serpApiKey);
  formData.append('dataforseo_login', settings.dataforseoLogin);
  formData.append('dataforseo_password', settings.dataforseoPassword);
  formData.append('google_domains', toMultiline(settings.googleDomains));
  formData.append('rss_feeds', toMultiline(settings.rssFeeds));
  formData.append('html_urls', toMultiline(settings.htmlUrls));
  formData.append('ignored_domains', toMultiline(settings.ignoredDomains));
  formData.append('time_window', settings.timeWindow);

  const response = await fetch(`${API_URL}/trends/start`, { method: 'POST', body: formData });
  const data = await response.json();
  if (!response.ok || data.status !== 'started' || !data.job_id) {
    throw new Error(data.error || 'No se pudo iniciar el pipeline.');
  }
  return data.job_id as string;
};

export const getTrendPipelineStatus = async (jobId: string): Promise<PipelineJobStatus> => {
  const response = await fetch(`${API_URL}/trends/status?job_id=${encodeURIComponent(jobId)}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'No se pudo consultar el estado del pipeline.');
  }
  return data as PipelineJobStatus;
};
