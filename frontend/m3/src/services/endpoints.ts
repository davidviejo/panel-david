const encodePathParam = (value: string | number): string => encodeURIComponent(String(value));

export const endpoints = {
  auth: {
    clientsArea: () => 'api/auth/clients-area',
    project: (slug: string) => `api/auth/project/${encodePathParam(slug)}`,
    operator: () => 'api/auth/operator',
  },
  clients: {
    list: () => 'api/clients',
    listPublic: () => 'api/public/clients',
    projectOverview: (slug: string) => `api/${encodePathParam(slug)}/overview`,
  },
  tools: {
    run: (tool: string) => `api/tools/run/${encodePathParam(tool)}`,
  },
  ai: {
    seoAnalysis: () => 'api/ai/seo-analysis',
    headlineChallenge: () => 'api/ai/headline-challenge',
    checklistEvaluate: () => 'api/ai/checklist-evaluate',
  },
  engine: {
    capabilities: () => 'api/capabilities',
    analyze: () => 'api/analyze',
    visibilityRun: () => 'visibility/run',
    visibilitySchedule: (clientId: string) =>
      `api/visibility/schedules/${encodePathParam(clientId)}`,
    visibilityScheduleAction: (clientId: string, action: 'pause' | 'resume') =>
      `api/visibility/schedules/${encodePathParam(clientId)}/${encodePathParam(action)}`,
    visibilityRuns: (clientId: string, query?: URLSearchParams | string) => {
      const queryString = typeof query === 'string' ? query : query?.toString();
      const basePath = `api/visibility/runs/${encodePathParam(clientId)}`;
      return queryString ? `${basePath}?${queryString}` : basePath;
    },
    jobs: () => 'api/jobs',
    runnerHealth: () => 'api/jobs/runner/health',
    byId: (jobId: string) => `api/jobs/${encodePathParam(jobId)}`,
    jobAction: (jobId: string, action: 'pause' | 'resume' | 'cancel') =>
      `api/jobs/${encodePathParam(jobId)}/${encodePathParam(action)}`,
    jobItems: (jobId: string, query?: URLSearchParams | string) => {
      const queryString = typeof query === 'string' ? query : query?.toString();
      const basePath = `api/jobs/${encodePathParam(jobId)}/items`;
      return queryString ? `${basePath}?${queryString}` : basePath;
    },
    jobItemResult: (jobId: string, itemId: string) =>
      `api/jobs/${encodePathParam(jobId)}/items/${encodePathParam(itemId)}/result`,
  },
};

export type Endpoints = typeof endpoints;
