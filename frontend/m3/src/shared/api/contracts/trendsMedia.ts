export interface TrendsMediaNewsRequestContract {
  queries: string[];
  geo?: string;
  language?: string;
  limitPerQuery?: number;
  provider?: 'auto' | 'serpapi' | 'dataforseo' | 'internal';
}

export interface TrendsMediaNewsArticleContract {
  article_id?: string;
  title: string;
  url: string;
  source_name?: string;
  published_at?: string;
  thumbnail_url?: string | null;
  position?: number;
  keyword?: string;
  snippet?: string;
}

export interface TrendsMediaNewsResponseContract {
  items: TrendsMediaNewsArticleContract[];
  meta?: {
    providerUsed?: string;
    queryCount?: number;
    empty?: boolean;
  };
  traceId?: string;
  requestId?: string;
}
