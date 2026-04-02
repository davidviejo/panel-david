export interface TrendsMediaNewsRequestContract {
  queries: string[];
  geo?: string;
  language?: string;
  country?: string;
  maxResults?: number;
  provider?: 'serpapi' | 'dataforseo' | 'auto';
}

export interface TrendsMediaNewsArticleContract {
  id?: string;
  title: string;
  url: string;
  source: string;
  publishedAt?: string;
  thumbnailUrl?: string;
  position: number;
  keyword: string;
  snippet?: string;
}

export interface TrendsMediaNewsResponseContract {
  articles: TrendsMediaNewsArticleContract[];
  providerUsed: string;
}
