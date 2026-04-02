import { fetchTrendsMediaNews } from './trendsMediaApi';
import { AppSettings, NewsArticle } from '../types';

export const fetchSerpResults = async (settings: AppSettings): Promise<NewsArticle[]> => {
  return fetchTrendsMediaNews({
    queries: settings.searchQueries,
    geo: 'ES',
    language: 'es',
    limitPerQuery: 50,
    provider: 'auto',
  });
};
