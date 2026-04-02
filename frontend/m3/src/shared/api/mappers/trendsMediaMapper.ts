import { NewsArticle } from '../../../features/trends-media/types';
import { TrendsMediaNewsArticleContract } from '../contracts/trendsMedia';

const normalizePublishedAt = (publishedAt?: string): string => {
  if (!publishedAt || !publishedAt.trim()) {
    return new Date().toISOString();
  }

  return publishedAt;
};

export const mapTrendsMediaArticleToUiModel = (
  article: TrendsMediaNewsArticleContract,
): NewsArticle => ({
  article_id: article.id || '',
  title: article.title,
  url: article.url,
  source_name: article.source,
  published_at: normalizePublishedAt(article.publishedAt),
  thumbnail_url: article.thumbnailUrl,
  position: article.position,
  keyword: article.keyword,
  snippet: article.snippet || '',
});
