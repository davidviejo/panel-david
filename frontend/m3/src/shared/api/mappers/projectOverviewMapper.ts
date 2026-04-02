import { ProjectOverviewContract } from '../contracts/projectOverview';

export interface ProjectOverviewViewModel {
  projectName: string;
  projectSlug: string;
  trafficLabel: string;
  keywordsTop3: number;
  healthScore: number;
  healthScaleMax: number;
  issues: string[];
  isEmpty: boolean;
}

export const mapProjectOverviewToViewModel = (contract: ProjectOverviewContract): ProjectOverviewViewModel => {
  return {
    projectName: contract.project.name,
    projectSlug: contract.project.slug,
    trafficLabel: contract.metrics.organic_traffic_estimate.formatted ?? 'N/D',
    keywordsTop3: contract.metrics.keywords_top3.value,
    healthScore: contract.metrics.health_score.value,
    healthScaleMax: contract.metrics.health_score.scale_max,
    issues: contract.metrics.recent_issues.map((item) => item.issue),
    isEmpty: contract.metrics.is_empty,
  };
};
