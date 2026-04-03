import { beforeEach, describe, expect, it, vi } from 'vitest';

const getProjectOverviewMock = vi.fn();
const resolveModuleDataSourceMock = vi.fn();

vi.mock('./api', () => ({
  api: {
    getProjectOverview: (...args: unknown[]) => getProjectOverviewMock(...args),
  },
}));

vi.mock('../shared/data-hooks/backendSourceResolver', () => ({
  resolveModuleDataSource: (...args: unknown[]) => resolveModuleDataSourceMock(...args),
}));

describe('projectOverviewDataSource', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses backend when flag is ON', async () => {
    resolveModuleDataSourceMock.mockReturnValue(true);
    getProjectOverviewMock.mockResolvedValue({
      contract: { id: 'portal.project-overview.v1', version: '1.0' },
      generated_at: '2026-04-02T00:00:00Z',
      project: { slug: 'demo', project_id: '100' },
      metrics: { urls_tracked: 10, urls_ok: 8, health_score: 80, issues_open: 2 },
      recent_issues: [],
    });

    const { projectOverviewDataSource } = await import('./projectOverviewDataSource');
    const result = await projectOverviewDataSource.getOverview('demo');

    expect(resolveModuleDataSourceMock).toHaveBeenCalledWith({
      module: 'portal_overview',
      tenantId: 'demo',
    });
    expect(getProjectOverviewMock).toHaveBeenCalledWith('demo');
    expect(result.projectSlug).toBe('demo');
  });

  it('uses legacy fallback when flag is OFF', async () => {
    resolveModuleDataSourceMock.mockReturnValue(false);

    const { projectOverviewDataSource } = await import('./projectOverviewDataSource');
    const result = await projectOverviewDataSource.getOverview('demo-off');

    expect(getProjectOverviewMock).not.toHaveBeenCalled();
    expect(result).toMatchObject({ projectSlug: 'demo-off', urlsTracked: 0, healthScore: 0 });
  });

  it('supports fast switch without state break between OFF and ON', async () => {
    resolveModuleDataSourceMock.mockReturnValueOnce(false).mockReturnValueOnce(true);
    getProjectOverviewMock.mockResolvedValue({
      contract: { id: 'portal.project-overview.v1', version: '1.0' },
      generated_at: '2026-04-02T00:00:00Z',
      project: { slug: 'demo', project_id: '100' },
      metrics: { urls_tracked: 15, urls_ok: 12, health_score: 87, issues_open: 1 },
      recent_issues: [{ message: 'Issue', count: 1 }],
    });

    const { projectOverviewDataSource } = await import('./projectOverviewDataSource');

    const legacyResult = await projectOverviewDataSource.getOverview('demo');
    const backendResult = await projectOverviewDataSource.getOverview('demo');

    expect(legacyResult.urlsTracked).toBe(0);
    expect(backendResult.urlsTracked).toBe(15);
  });
});
