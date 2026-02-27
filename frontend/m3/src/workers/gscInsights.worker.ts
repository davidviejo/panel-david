import {
  analyzeQuickWins,
  analyzeStrikingDistance,
  analyzeLowCtr,
  getTopPerforming,
  analyzeCannibalization,
  analyzeZeroClickQueries,
  analyzeFeaturedSnippets,
  analyzeStagnantTraffic,
  analyzeSeasonality,
  analyzeStableUrls,
  analyzeInternalRedirects,
} from '../utils/gscInsights';
import { GSCRow } from '../types';

addEventListener('message', (e: MessageEvent<GSCRow[]>) => {
  const rows = e.data;

  if (!Array.isArray(rows)) {
    postMessage({ type: 'ERROR', payload: 'Invalid data format: expected array of GSCRow' });
    return;
  }

  try {
    const insights = {
      quickWins: analyzeQuickWins(rows),
      strikingDistance: analyzeStrikingDistance(rows),
      lowCtr: analyzeLowCtr(rows),
      topQueries: getTopPerforming(rows),
      cannibalization: analyzeCannibalization(rows),
      zeroClicks: analyzeZeroClickQueries(rows),
      featuredSnippets: analyzeFeaturedSnippets(rows),
      stagnantTraffic: analyzeStagnantTraffic(rows),
      seasonality: analyzeSeasonality(rows),
      stableUrls: analyzeStableUrls(rows),
      internalRedirects: analyzeInternalRedirects(rows),
    };

    postMessage({ type: 'SUCCESS', payload: insights });
  } catch (error) {
    postMessage({ type: 'ERROR', payload: error instanceof Error ? error.message : String(error) });
  }
});
