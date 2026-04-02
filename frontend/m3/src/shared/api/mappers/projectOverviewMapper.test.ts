import { describe, expect, it } from 'vitest';
import { mapProjectOverviewToViewModel, parseProjectOverviewContract } from './projectOverviewMapper';

describe('projectOverviewMapper', () => {
  it('parses valid contract payload', () => {
    const payload = {
      contract: { id: 'portal.project-overview.v1', version: '1.0' },
      generated_at: '2026-04-02T00:00:00Z',
      project: { slug: 'demo', project_id: '100' },
      metrics: { urls_tracked: 3, urls_ok: 2, health_score: 88, issues_open: 1 },
      recent_issues: [{ message: 'Missing H1', count: 1 }],
    };

    const parsed = parseProjectOverviewContract(payload);
    expect(parsed).toBeTruthy();
    expect(parsed?.project.slug).toBe('demo');

    const vm = mapProjectOverviewToViewModel(parsed!);
    expect(vm.urlsTracked).toBe(3);
    expect(vm.recentIssues[0].message).toBe('Missing H1');
  });

  it('returns null for invalid payload', () => {
    const parsed = parseProjectOverviewContract({ project: { slug: 'demo' } });
    expect(parsed).toBeNull();
  });
});
