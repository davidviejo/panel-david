import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
    portalOverviewBackendSource: true,
  },
}));

describe('ProjectOverview', () => {
  beforeEach(() => {
    getProjectOverviewMock.mockReset();
  });

  it('renders overview metrics on success', async () => {
    getProjectOverviewMock.mockResolvedValue({
      contract: { id: 'portal.project-overview.v1', version: '1.0' },
      generated_at: '2026-04-02T00:00:00Z',
      project: { slug: 'demo', project_id: '100' },
      metrics: { urls_tracked: 12, urls_ok: 10, health_score: 85, issues_open: 3 },
      recent_issues: [{ message: 'Missing H1', count: 2 }],
    });

    render(
      <MemoryRouter initialEntries={['/c/demo/overview']}>
        <Routes>
          <Route path="/c/:slug/overview" element={<ProjectOverview />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('URLs Monitorizadas')).toBeTruthy();
    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText('Missing H1 (2)')).toBeTruthy();
  });

  it('renders error state on API error', async () => {
    getProjectOverviewMock.mockRejectedValue(new HttpClientError({
      status: 403,
      code: 'HTTP_403',
      message: 'Forbidden',
      traceId: 'trace-123',
    }));

    render(
      <MemoryRouter initialEntries={['/c/demo/overview']}>
        <Routes>
          <Route path="/c/:slug/overview" element={<ProjectOverview />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('No tienes permisos para realizar esta acción.')).toBeTruthy();
    expect(screen.getByText('ID de trazabilidad: trace-123')).toBeTruthy();
  });

  it('renders empty state when response has no tracked urls', async () => {
    getProjectOverviewMock.mockResolvedValue({
      contract: { id: 'portal.project-overview.v1', version: '1.0' },
      generated_at: '2026-04-02T00:00:00Z',
      project: { slug: 'demo', project_id: '100' },
      metrics: { urls_tracked: 0, urls_ok: 0, health_score: 0, issues_open: 0 },
      recent_issues: [],
    });

    render(
      <MemoryRouter initialEntries={['/c/demo/overview']}>
        <Routes>
          <Route path="/c/:slug/overview" element={<ProjectOverview />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Aún no hay datos de overview para este proyecto.')).toBeTruthy();
    });
  });
});
