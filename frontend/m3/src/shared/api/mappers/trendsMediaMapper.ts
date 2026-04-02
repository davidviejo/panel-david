import { NewsArticle } from '../../../features/trends-media/types';
import {
  TrendsMediaNewsSearchResponseContract,
  TrendsMediaNewsItemContract,
} from '../contracts/trendsMedia';

const toPublishedAt = (value?: string): string => {
  if (!value || !value.trim()) return new Date().toISOString();

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return new Date().toISOString();
  }

  return parsedDate.toISOString();
};

const toArticle = (item: TrendsMediaNewsItemContract, index: number): NewsArticle | null => {
  if (!item.title?.trim() || !item.url?.trim()) {
    return null;
  }

  return {
    article_id: '',
    title: item.title,
    url: item.url,
    source_name: item.source?.trim() || 'Desconocido',
    published_at: toPublishedAt(item.publishedAt),
    thumbnail_url: item.thumbnailUrl,
    position: item.position ?? index + 1,
    keyword: item.query,
    snippet: item.snippet || '',
  };
};

export const mapTrendsMediaResponseToArticles = (
  payload: TrendsMediaNewsSearchResponseContract,
): NewsArticle[] => {
  return payload.items
    .map((item, index) => toArticle(item, index))
    .filter((item): item is NewsArticle => Boolean(item));
};
