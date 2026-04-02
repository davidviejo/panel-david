import {
  TrendsMediaNewsResponseContract,
} from '../../../shared/api/contracts/trendsMedia';
import { NewsArticle } from '../types';

export const mapTrendsMediaNewsToUi = (
  response: TrendsMediaNewsResponseContract,
): NewsArticle[] => {
  return response.items
    .map((item) => ({
      article_id: '',
      title: item.title,
      url: item.url,
      source_name: item.sourceName || 'Desconocido',
      published_at: item.publishedAt,
      thumbnail_url: item.thumbnailUrl,
      position: item.position,
      keyword: item.keyword,
      snippet: item.snippet || '',
    }))
    .filter((article) => article.title && article.url);
};
