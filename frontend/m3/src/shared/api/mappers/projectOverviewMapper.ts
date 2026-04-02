import {
  ProjectOverviewResponseContract,
  ProjectOverviewViewModel,
} from '../contracts/projectOverview';

const asString = (value: unknown): string | null => (typeof value === 'string' && value.trim() ? value : null);
const asNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

export const parseProjectOverviewContract = (
  payload: unknown,
): ProjectOverviewResponseContract | null => {
  if (!payload || typeof payload !== 'object') return null;
  const data = payload as Record<string, unknown>;

  const contract = data.contract as Record<string, unknown> | undefined;
  const project = data.project as Record<string, unknown> | undefined;
  const metrics = data.metrics as Record<string, unknown> | undefined;

  if (!contract || !project || !metrics) return null;

  const id = asString(contract.id);
  const version = asString(contract.version);
  const generatedAt = asString(data.generated_at);
  const slug = asString(project.slug);
  const projectId = asString(project.project_id);
  const urlsTracked = asNumber(metrics.urls_tracked);
  const urlsOk = asNumber(metrics.urls_ok);
  const healthScore = asNumber(metrics.health_score);
  const issuesOpen = asNumber(metrics.issues_open);

  if (
    !id ||
    !version ||
    !generatedAt ||
    !slug ||
    !projectId ||
    urlsTracked === null ||
    urlsOk === null ||
    healthScore === null ||
    issuesOpen === null
  ) {
    return null;
  }

  const issuesRaw = Array.isArray(data.recent_issues) ? data.recent_issues : [];
  const recentIssues = issuesRaw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const issue = item as Record<string, unknown>;
      const message = asString(issue.message);
      const count = asNumber(issue.count);
      if (!message || count === null) return null;
      return { message, count };
    })
    .filter((item): item is { message: string; count: number } => item !== null);

  return {
    contract: { id, version },
    generated_at: generatedAt,
    project: { slug, project_id: projectId },
    metrics: {
      urls_tracked: urlsTracked,
      urls_ok: urlsOk,
      health_score: healthScore,
      issues_open: issuesOpen,
    },
    recent_issues: recentIssues,
  };
};

export const mapProjectOverviewToViewModel = (
  contract: ProjectOverviewResponseContract,
): ProjectOverviewViewModel => ({
  projectSlug: contract.project.slug,
  generatedAt: contract.generated_at,
  urlsTracked: contract.metrics.urls_tracked,
  urlsOk: contract.metrics.urls_ok,
  healthScore: contract.metrics.health_score,
  issuesOpen: contract.metrics.issues_open,
  recentIssues: contract.recent_issues,
});
