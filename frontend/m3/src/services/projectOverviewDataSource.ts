import { api } from './api';
import { ProjectOverviewViewModel } from '../shared/api/contracts/projectOverview';
import { mapProjectOverviewToViewModel } from '../shared/api/mappers/projectOverviewMapper';
import { resolveModuleDataSource } from '../shared/data-hooks/backendSourceResolver';

const LEGACY_FALLBACK_OVERVIEW: ProjectOverviewViewModel = {
  projectSlug: 'legacy-overview',
  generatedAt: '',
  urlsTracked: 0,
  urlsOk: 0,
  healthScore: 0,
  issuesOpen: 0,
  recentIssues: [],
};

export const projectOverviewDataSource = {
  getOverview: async (slug: string): Promise<ProjectOverviewViewModel> => {
    const useBackendSource = resolveModuleDataSource({ module: 'portal_overview', tenantId: slug });

    if (!useBackendSource) {
      return { ...LEGACY_FALLBACK_OVERVIEW, projectSlug: slug };
    }

    const response = await api.getProjectOverview(slug);
    return mapProjectOverviewToViewModel(response);
  },
};
