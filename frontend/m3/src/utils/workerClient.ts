import { GSCRow } from '../types';
import { InsightResult } from './gscInsights';

export interface GSCInsights {
  quickWins: InsightResult;
  strikingDistance: InsightResult;
  lowCtr: InsightResult;
  topQueries: InsightResult;
  cannibalization: InsightResult;
  zeroClicks: InsightResult;
  featuredSnippets: InsightResult;
  stagnantTraffic: InsightResult;
  seasonality: InsightResult;
  stableUrls: InsightResult;
  internalRedirects: InsightResult;
}

export const runAnalysisInWorker = (data: GSCRow[]): Promise<GSCInsights> => {
  return new Promise((resolve, reject) => {
    // Create a new worker instance for each run to avoid state issues and ensure clean slate
    // Vite handles this import syntax natively
    const worker = new Worker(new URL('../workers/gscInsights.worker.ts', import.meta.url), {
      type: 'module',
    });

    worker.onmessage = (e) => {
      const { type, payload } = e.data;
      if (type === 'SUCCESS') {
        resolve(payload as GSCInsights);
      } else {
        reject(new Error(payload || 'Unknown worker error'));
      }
      worker.terminate();
    };

    worker.onerror = (error) => {
      reject(error);
      worker.terminate();
    };

    // Send data to worker
    worker.postMessage(data);
  });
};
