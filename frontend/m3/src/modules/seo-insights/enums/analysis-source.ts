export const analysis_source = ['dataforseo', 'gsc', 'internal'] as const;

export type AnalysisSource = (typeof analysis_source)[number];
