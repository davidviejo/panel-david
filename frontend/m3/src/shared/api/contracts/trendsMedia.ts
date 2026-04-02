export interface TrendsMediaNewsSearchRequestContract {
  queries: string[];
  provider?: 'serpapi' | 'dataforseo' | 'auto';
  language?: string;
  country?: string;
  limit?: number;
}

export interface TrendsMediaNewsItemContract {
  title: string;
  url: string;
  source?: string;
  publishedAt?: string;
  thumbnailUrl?: string;
  position?: number;
  query: string;
  snippet?: string;
}

export interface TrendsMediaNewsSearchResponseContract {
  items: TrendsMediaNewsItemContract[];
  meta: {
    providerUsed: string;
    total: number;
    requestId?: string;
    traceId?: string;
  };
}
