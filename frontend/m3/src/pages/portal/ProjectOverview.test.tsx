import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProjectOverview from './ProjectOverview';
import { HttpClientError } from '../../services/httpClient';

const getProjectOverviewMock = vi.fn();

vi.mock('../../services/api', () => ({
  api: {
    getProjectOverview: (...args: unknown[]) => getProjectOverviewMock(...args),
    logout: vi.fn(),
  },
}));

vi.mock('../../config/featureFlags', () => ({
  featureFlags: {
    portalOverviewFallback: false,
  },
}));

describe('ProjectOverview', () => {
  beforeEach(() => {
    getProjectOverviewMock.mockReset();
  });

  it('renders overview data on success', async () => {
    getProjectOverviewMock.mockResolvedValueOnce({
      contract_version: '2026-04-portal-overview-v1',
      generated_at: '2026-04-02T00:00:00+00:00',
      project: { slug: 'demo-project', name: 'Demo Project', status: 'active' },
      metrics: {
        organic_traffic_estimate: { value: 15000, formatted: '15.0K', unit: 'monthly_visits' },
        keywords_top3: { value: 9 },
        health_score: { value: 90, scale_max: 100 },
        recent_issues: [{ issue: 'Missing H1', count: 1 }],
        source: 'crawler_report',
        is_empty: false,
      },
    });

    render(
      <MemoryRouter initialEntries={['/c/demo-project/overview']}>
        <Routes>
          <Route path="/c/:slug/overview" element={<ProjectOverview />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Demo Project')).toBeTruthy();
    expect(screen.getByText('15.0K')).toBeTruthy();
    expect(screen.getByText('Missing H1')).toBeTruthy();
  });

  it('renders empty state when no issues are returned', async () => {
    getProjectOverviewMock.mockResolvedValueOnce({
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
    });

    render(
      <MemoryRouter initialEntries={['/c/demo-project/overview']}>
        <Routes>
          <Route path="/c/:slug/overview" element={<ProjectOverview />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('No hay incidencias para mostrar.')).toBeTruthy();
  });

  it('renders API error message for forbidden response', async () => {
    getProjectOverviewMock.mockRejectedValueOnce(
      new HttpClientError({
        code: 'HTTP_403',
        message: 'forbidden',
        status: 403,
        traceId: 'trace-403',
      }),
    );

    render(
      <MemoryRouter initialEntries={['/c/demo-project/overview']}>
        <Routes>
          <Route path="/c/:slug/overview" element={<ProjectOverview />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('No pudimos cargar el overview')).toBeTruthy();
    });

    expect(screen.getByText(/No tienes permisos para realizar esta acción/)).toBeTruthy();
  });
});
