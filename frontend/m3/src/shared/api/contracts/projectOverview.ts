export interface ProjectOverviewIssueContract {
  message: string;
  count: number;
}

export interface ProjectOverviewResponseContract {
  contract: {
    id: string;
    version: string;
  };
  generated_at: string;
  project: {
    slug: string;
    project_id: string;
  };
  metrics: {
    urls_tracked: number;
    urls_ok: number;
    health_score: number;
    issues_open: number;
  };
  recent_issues: ProjectOverviewIssueContract[];
}

export interface ProjectOverviewViewModel {
  projectSlug: string;
  generatedAt: string;
  urlsTracked: number;
  urlsOk: number;
  healthScore: number;
  issuesOpen: number;
  recentIssues: ProjectOverviewIssueContract[];
}
