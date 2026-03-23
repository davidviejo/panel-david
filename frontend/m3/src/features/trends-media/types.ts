export type SearchMode = 'free' | 'pro' | 'demo';
export type SerpProvider = 'serpapi' | 'dataforseo';
export type TimeWindow = '24h' | '48h' | '7d';

export interface AppSettings {
  profileId: string;
  profileName: string;
  regionLabel: string;
  searchMode: SearchMode;
  serpProvider: SerpProvider;
  geminiApiKey: string;
  serpApiKey: string;
  dataforseoLogin: string;
  dataforseoPassword: string;
  systemPrompt: string;
  timeWindow: TimeWindow;
  googleDomains: string[];
  rssFeeds: string[];
  htmlUrls: string[];
  ignoredDomains: string[];
  searchQueries: string[];
  targetSources: string[];
  focusTerms: string[];
  rankingMode: 'balanced' | 'strict' | 'discovery';
  geo: string;
  category: 'h' | 'b' | 'm' | 't' | 's' | 'e';
}

export interface DashboardStats {
  sourcesScanned: number;
  itemsFound: number;
  highPriority: number;
  duplicatesRemoved: number;
}

export interface TrendItem {
  keyword: string;
  volume: number;
  growth: string;
  status: 'breakout' | 'rising' | 'stable';
}

export interface TrendResult {
  rank: number;
  topic: string;
  traffic: string;
  context: string;
  google_link: string;
  relevance_score: number;
  matched_terms?: string[];
  fit_label?: string;
  opportunity_note?: string;
  source_type?: 'rss' | 'html' | 'serp' | 'dataforseo' | 'demo' | 'google_internal';
  source_url?: string;
}

export interface PipelineJobStatus {
  active: boolean;
  progress: number;
  log: string[];
  data: TrendResult[];
  error?: string | null;
}
