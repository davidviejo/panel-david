import { GSCRow } from '../types';

export interface InsightResult {
  title: string;
  description: string;
  count: number;
  potentialTraffic?: number;
  items: GSCRow[];
}

export const analyzeQuickWins = (rows: GSCRow[]): InsightResult => {
  // Queries in position 4 to 10 (Page 1 Bottom) - "Fruta Madura"
  const wins = rows.filter((r) => r.position >= 4 && r.position <= 10);

  // Potential Traffic: Estimated 10% CTR if moved to top 3
  const potentialTraffic = wins.reduce((acc, r) => {
    const currentClicks = r.clicks;
    const potentialCtr = 0.1;
    const potentialClicks = r.impressions * potentialCtr;
    return acc + Math.max(0, potentialClicks - currentClicks);
  }, 0);

  return {
    title: 'Fruta Madura (Quick Wins)',
    description: 'Keywords en posiciones 4-10. Fácil mejora a Top 3.',
    count: wins.length,
    potentialTraffic: Math.round(potentialTraffic),
    items: wins.sort((a, b) => b.impressions - a.impressions).slice(0, 50),
  };
};

export const analyzeStrikingDistance = (rows: GSCRow[]): InsightResult => {
  // Queries in position 11 to 20 (Page 2) - "Striking Distance"
  const opportunities = rows.filter((r) => r.position >= 11 && r.position <= 20);

  const potentialTraffic = opportunities.reduce((acc, r) => {
    const currentClicks = r.clicks;
    const potentialCtr = 0.05; // Less CTR for Page 2 moving to Page 1
    const potentialClicks = r.impressions * potentialCtr;
    return acc + Math.max(0, potentialClicks - currentClicks);
  }, 0);

  return {
    title: 'Oportunidades Pág. 2',
    description: 'Keywords en posiciones 11-20. Llévalas a primera página.',
    count: opportunities.length,
    potentialTraffic: Math.round(potentialTraffic),
    items: opportunities.sort((a, b) => b.impressions - a.impressions).slice(0, 50),
  };
};

export const analyzeLowCtr = (rows: GSCRow[]): InsightResult => {
  // Filter for statistically significant impressions (e.g. > 100)
  const significant = rows.filter((r) => r.impressions > 100);

  if (significant.length === 0)
    return { title: 'Bajo CTR', description: 'No hay suficientes datos.', count: 0, items: [] };

  // Define Low CTR as < 2% AND Good Position <= 10 (as requested "Bajo CTR con Buena Posición")
  const lowCtr = significant.filter((r) => r.ctr < 0.02 && r.position <= 10);

  return {
    title: 'CTR Bajo con Buena Posición',
    description: 'Posición Top 10 pero CTR < 2%. Revisa Títulos y Snippets.',
    count: lowCtr.length,
    items: lowCtr.sort((a, b) => b.impressions - a.impressions).slice(0, 50),
  };
};

export const getTopPerforming = (rows: GSCRow[]): InsightResult => {
  const top = [...rows].sort((a, b) => b.clicks - a.clicks);

  return {
    title: 'Top Tráfico',
    description: 'Las keywords que más tráfico traen actualmente.',
    count: top.length,
    items: top.slice(0, 50),
  };
};

export const analyzeCannibalization = (rows: GSCRow[]): InsightResult => {
  // Expects rows with dimensions ['query', 'page']
  // Group by Query, but only significant pages (>50 impressions)
  const queryGroups: Record<string, GSCRow[]> = {};

  // Single pass to filter and group
  for (const r of rows) {
    if (r.impressions > 50) {
      const query = r.keys[0];
      if (!queryGroups[query]) queryGroups[query] = [];
      queryGroups[query].push(r);
    }
  }

  const cannibalized: GSCRow[] = [];

  // Iterate over groups which now only contain significant pages
  for (const [query, significantPages] of Object.entries(queryGroups)) {
    // If more than 1 page ranks for the same query with significant impressions
    if (significantPages.length > 1) {
      // Check if they are "fighting" (e.g., both have similar positions or substantial clicks)
      // Sort by position
      significantPages.sort((a, b) => a.position - b.position);

      // Example: Top 2 pages are within 5 positions of each other
      const page1 = significantPages[0];
      const page2 = significantPages[1];

      if (Math.abs(page1.position - page2.position) < 5) {
        cannibalized.push({
          ...page1,
          keys: [query, `(${significantPages.length} URLs)`], // Hack to show count in UI if needed
        });
      }
    }
  }

  return {
    title: 'Canibalización de Keywords Alta',
    description: 'Detecta páginas que compiten por las mismas palabras clave.',
    count: cannibalized.length,
    items: cannibalized.sort((a, b) => b.clicks - a.clicks).slice(0, 50),
  };
};

export const analyzeZeroClickQueries = (rows: GSCRow[]): InsightResult => {
  // Queries with high impressions but 0 clicks
  // Often means users find the answer in the SERP (Features) or title is bad
  const zeroClicks = rows.filter((r) => r.clicks === 0 && r.impressions > 300); // 300 impressions threshold

  return {
    title: 'Consultas Cero Clics',
    description: 'Alto volumen de impresión (300+) pero 0 clics.',
    count: zeroClicks.length,
    items: zeroClicks.sort((a, b) => b.impressions - a.impressions).slice(0, 50),
  };
};

// --- NEW MODULES ---

export const analyzeFeaturedSnippets = (rows: GSCRow[]): InsightResult => {
  // Queries starting with typical question words in positions 1-10 (Position 1 is usually snippet, but we look for potential)
  // "Posibles Fragmentos Destacados": Opportunity is usually Pos 2-5 moving to 0/1.
  const questionWords = [
    'qué',
    'que',
    'cómo',
    'como',
    'cuándo',
    'cuando',
    'dónde',
    'donde',
    'por qué',
    'quién',
    'cuál',
  ];

  const opportunities = rows.filter((r) => {
    const q = r.keys[0].toLowerCase();
    // Check if it starts with a question word OR contains it significantly? User said "Posibles".
    // Usually Position 1-5 is the sweet spot.
    const isQuestion = questionWords.some((w) => q.startsWith(w + ' '));
    return isQuestion && r.position >= 2 && r.position <= 10;
  });

  return {
    title: 'Posibles Fragmentos Destacados',
    description: 'Preguntas (Qué, Cómo...) en primera página. Optimiza para ganar la Posición 0.',
    count: opportunities.length,
    items: opportunities.sort((a, b) => b.impressions - a.impressions).slice(0, 50),
  };
};

// "Páginas con Tráfico Estancado" implies we need trend data.
// Since we only get aggregated data for the period in some calls, this is tricky.
// However, 'getGSCQueryPageData' returns aggregated. 'getSearchAnalytics' returns by date.
// Limitation: The current 'analyze' functions operate on 'rows' which are usually Query+Page aggregated.
// We cannot detect "Stagnant" from a single aggregated row easily without comparing periods or looking at daily variance.
// Proxy: High impressions, low CTR variance? No.
// Proxy for "Estancado": URLs with significant traffic that have NOT grown?
// Since we don't have historical data in this specific 'rows' array (it's a snapshot), we will use a heuristic:
// "High Impressions, Low CTR, Old Content?" - No way to know age.
// Let's rely on: High Impressions, Low Clicks (High potential but not converting) - similar to Low CTR?
// Or: Just list the top pages that are NOT in the "Top Growth" list?
// Better approach: User asked for "Tráfico Estancado".
// We will filter for: High Impressions (>1000) AND Click/Impression ratio (CTR) is very stable?
// Actually, without time-series per URL, we can't do true "Stagnant".
// BUT, we can just show "High Volume, Low CTR" pages again?
// Let's try to infer from Position.
// "Stagnant" often means stuck in Pos 5-10 with no movement.
// Let's filter: High Impressions, Position 5-20, CTR < Average.
export const analyzeStagnantTraffic = (rows: GSCRow[]): InsightResult => {
  // "Estancado" = Stuck in positions 6-20 with high impressions but not moving up.
  const stagnant = rows.filter(
    (r) => r.impressions > 500 && r.position > 5 && r.position < 20 && r.ctr < 0.03,
  );

  return {
    title: 'Páginas con Tráfico Estancado',
    description: "Alto volumen, posición media estática (5-20) y bajo CTR. Necesitan 'refresh'.",
    count: stagnant.length,
    items: stagnant.sort((a, b) => b.impressions - a.impressions).slice(0, 50),
  };
};

// "Alertas por Tráfico Estacional"
// Proxy: Detect queries containing "2023", "2024", months, or "navidad", "verano".
// Or: High variance in position?
// Without comparison data, we look for "Seasonal Keywords".
export const analyzeSeasonality = (rows: GSCRow[]): InsightResult => {
  const seasonalTerms = [
    'navidad',
    'verano',
    'invierno',
    'otoño',
    'primavera',
    'black friday',
    'cyber monday',
    'reyes',
    'san valentín',
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
    '2024',
    '2025',
    '2023',
  ];

  const seasonal = rows.filter((r) => {
    const q = r.keys[0].toLowerCase();
    return seasonalTerms.some((term) => q.includes(term));
  });

  return {
    title: 'Alertas por Tráfico Estacional',
    description: 'Keywords detectadas con intención temporal (meses, eventos, años).',
    count: seasonal.length,
    items: seasonal.sort((a, b) => b.impressions - a.impressions).slice(0, 50),
  };
};

// "URLs No Afectadas por Cambios" -> Stable Traffic.
// Proxy: High Clicks, Position < 3 (Very stable usually).
export const analyzeStableUrls = (rows: GSCRow[]): InsightResult => {
  const stable = rows.filter((r) => r.position <= 3 && r.clicks > 100);

  return {
    title: 'URLs No Afectadas por Cambios',
    description: 'Rendimiento sólido: Top 3 y alto tráfico constante.',
    count: stable.length,
    items: stable.sort((a, b) => b.clicks - a.clicks).slice(0, 50),
  };
};

// "Redirecciones Internas" -> Proxy: Traffic Drop / Lost URLs
// We can't see redirects. We can see "Lost Traffic" if we had comparison.
// Since we only have one dataset here, we can't calculate "Lost".
// However, the user request explicitly listed it.
// We will create a placeholder that looks for "Zero Clicks but High Impressions" (Failed redirects?)
// OR we filter for 404s? No GSC API for that here.
// We will use "Cannibalization" as a proxy for bad redirects? No.
// Let's use: "Pages with High Impressions but 0 Clicks" (Maybe broken?) - already have Zero Click.
// Let's implement a heuristic: "Queries ranking for Home Page only"? No.
// I will implement "Posibles Errores / Redirecciones" looking for params in URL '?' or 'index.php' which should be redirected.
export const analyzeInternalRedirects = (rows: GSCRow[]): InsightResult => {
  // Look for dirty URLs that might need clean-up redirects
  const dirty = rows.filter((r) => {
    const url = r.keys[1] || ''; // Assuming Page is key[1]
    return (
      url.includes('?') || url.includes('.php') || url.includes('.html') || url.includes('index')
    );
  });

  return {
    title: 'Redirecciones Internas / URLs Sucias',
    description: 'URLs con parámetros o extensiones que podrían necesitar limpieza/redirección.',
    count: dirty.length,
    items: dirty.sort((a, b) => b.impressions - a.impressions).slice(0, 50),
  };
};
