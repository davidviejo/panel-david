export interface ProjectOverviewMetricNumberContract {
  value: number;
}

export interface ProjectOverviewTrafficContract {
  value: number | null;
  formatted: string | null;
  unit: 'monthly_visits';
}

export interface ProjectOverviewIssueContract {
  issue: string;
  count: number;
}

export interface ProjectOverviewContract {
  contract_version: string;
  generated_at: string;
  project: {
    slug: string;
    name: string;
    status: string;
  };
  metrics: {
    organic_traffic_estimate: ProjectOverviewTrafficContract;
    keywords_top3: ProjectOverviewMetricNumberContract;
    health_score: {
      value: number;
      scale_max: number;
    };
    recent_issues: ProjectOverviewIssueContract[];
    source: 'crawler_report';
    is_empty: boolean;
  };
}
