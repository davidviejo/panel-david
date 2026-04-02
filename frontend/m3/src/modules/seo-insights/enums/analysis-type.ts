export const analysis_type = ['full', 'incremental', 'manual'] as const;

export type AnalysisType = (typeof analysis_type)[number];
