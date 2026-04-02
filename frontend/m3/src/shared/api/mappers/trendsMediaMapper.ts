import { NewsArticle } from '../../../features/trends-media/types';
import { TrendsMediaNewsArticleContract } from '../contracts/trendsMedia';

export const mapTrendsMediaArticleToUiModel = (
  article: TrendsMediaNewsArticleContract,
  fallbackKeyword: string,
): NewsArticle => ({
  article_id: article.article_id ?? '',
  title: article.title,
  url: article.url,
  source_name: article.source_name || 'Desconocido',
  published_at: article.published_at || new Date().toISOString(),
  thumbnail_url: article.thumbnail_url ?? undefined,
  position: article.position ?? 0,
  keyword: article.keyword || fallbackKeyword,
  snippet: article.snippet || '',
});

export const mapTrendsMediaResponseToUiModel = (
  items: TrendsMediaNewsArticleContract[],
): NewsArticle[] => {
  return items
    .filter((item) => Boolean(item?.title && item?.url))
    .map((item) => mapTrendsMediaArticleToUiModel(item, item.keyword || 'general'));
};
