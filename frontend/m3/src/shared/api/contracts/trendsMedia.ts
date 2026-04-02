export type TrendsMediaProvider = 'serpapi' | 'dataforseo';

export interface TrendsMediaNewsRequestContract {
  queries: string[];
  provider?: TrendsMediaProvider;
  maxResults?: number;
  language?: string;
  country?: string;
  timePeriod?: 'h' | 'd' | 'w' | 'm';
}

export interface TrendsMediaNewsItemContract {
  title: string;
  url: string;
  sourceName: string;
  publishedAt: string;
  thumbnailUrl?: string;
  position: number;
  keyword: string;
  snippet?: string;
}

export interface TrendsMediaNewsResponseContract {
  items: TrendsMediaNewsItemContract[];
  provider: TrendsMediaProvider;
  requestId?: string;
  traceId?: string;
}
