import { AppSettings, NewsArticle } from '../types';
import { fetchTrendsMediaNews } from './trendsMediaApi';

export const fetchSerpResults = async (settings: AppSettings): Promise<NewsArticle[]> => {
  return fetchTrendsMediaNews(settings);
};
