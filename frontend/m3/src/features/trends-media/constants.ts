import { AppSettings, TrendItem } from './types';

export const APP_NAME = 'Eco3 Automator';

export const DEFAULT_SYSTEM_PROMPT = `Eres un editor jefe experto de un medio económico líder en la Comunidad Valenciana ("Economía 3").
Tu objetivo es analizar un listado de señales, clusters o tendencias de actualidad y convertirlas en un brief diario accionable.

Tus reglas editoriales son estrictas:
1. Prioridad (P1): inversiones reales, empresas locales grandes, empleo, innovación, turismo de alto impacto.
2. Prioridad (P2): eventos sectoriales, audiencias, consumo, marketing y datos relevantes.
3. Prioridad (P3/Discard): sucesos sin impacto económico, ruido social o temas poco accionables.

Output: JSON estructurado enriquecido.`;

export const DEFAULT_SETTINGS: AppSettings = {
  profileId: 'default',
  profileName: 'Noticias Valencia',
  regionLabel: 'Comunidad Valenciana • Noticias & Eventos',
  searchMode: 'demo',
  serpProvider: 'serpapi',
  geminiApiKey: '',
  serpApiKey: '',
  dataforseoLogin: '',
  dataforseoPassword: '',
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  timeWindow: '24h',
  googleDomains: ['valenciaplaza.com'],
  rssFeeds: [
    'https://valenciaplaza.com/rss',
    'https://www.levante-emv.com/rss/section/3807',
    'https://economia3.com/feed/',
  ],
  htmlUrls: ['https://midominio.com/blog/'],
  ignoredDomains: [
    'tripadvisor.es',
    'facebook.com',
    'youtube.com',
    'milanuncios.com',
    'wikipedia.org',
    'instagram.com',
    'twitter.com',
    'linkedin.com',
    'boe.es',
  ],
  searchQueries: ['Noticias Valencia', 'Noticias General'],
  targetSources: ['Economía 3', 'Expansión', 'Cinco Días', 'El Confidencial', 'MarketingDirecto'],
  focusTerms: ['medios', 'streaming', 'IA', 'publicidad digital'],
  rankingMode: 'balanced',
  geo: 'ES',
  category: 'b',
};

export const MOCK_TRENDS: TrendItem[] = [
  { keyword: 'Real Madrid', volume: 9200, growth: '+180%', status: 'breakout' },
  { keyword: 'El Tiempo Valencia', volume: 2400, growth: '+35%', status: 'rising' },
  { keyword: 'Calendario Laboral', volume: 980, growth: '+18%', status: 'stable' },
  { keyword: 'Fórmula 1', volume: 520, growth: '+11%', status: 'stable' },
  { keyword: 'Elecciones', volume: 260, growth: '+9%', status: 'stable' },
];
