import { describe, expect, it } from 'vitest';
import { mapProjectOverviewToViewModel } from './projectOverviewMapper';
import { ProjectOverviewContract } from '../contracts/projectOverview';

describe('mapProjectOverviewToViewModel', () => {
  it('maps backend overview contract to UI model', () => {
    const contract: ProjectOverviewContract = {
      contract_version: '2026-04-portal-overview-v1',
      generated_at: '2026-04-02T00:00:00+00:00',
      project: { slug: 'demo-project', name: 'Demo Project', status: 'active' },
      metrics: {
        organic_traffic_estimate: { value: 12400, formatted: '12.4K', unit: 'monthly_visits' },
        keywords_top3: { value: 7 },
        health_score: { value: 88, scale_max: 100 },
        recent_issues: [{ issue: 'Missing H1', count: 2 }],
        source: 'crawler_report',
        is_empty: false,
      },
    };

    const model = mapProjectOverviewToViewModel(contract);

    expect(model.projectName).toBe('Demo Project');
    expect(model.trafficLabel).toBe('12.4K');
    expect(model.issues).toEqual(['Missing H1']);
  });

  it('uses N/D when traffic is unavailable', () => {
    const contract: ProjectOverviewContract = {
      contract_version: '2026-04-portal-overview-v1',
      generated_at: '2026-04-02T00:00:00+00:00',
      project: { slug: 'demo-project', name: 'Demo Project', status: 'active' },
      metrics: {
        organic_traffic_estimate: { value: null, formatted: null, unit: 'monthly_visits' },
        keywords_top3: { value: 0 },
        health_score: { value: 0, scale_max: 100 },
        recent_issues: [],
        source: 'crawler_report',
        is_empty: true,
      },
    };

    const model = mapProjectOverviewToViewModel(contract);
    expect(model.trafficLabel).toBe('N/D');
    expect(model.isEmpty).toBe(true);
  });
});
