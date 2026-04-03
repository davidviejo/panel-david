import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProjectOverview from './ProjectOverview';
import { HttpClientError } from '../../services/httpClient';

const getOverviewMock = vi.fn();

vi.mock('../../services/api', () => ({
  api: { logout: vi.fn() },
}));

vi.mock('../../services/projectOverviewDataSource', () => ({
  projectOverviewDataSource: {
    getOverview: (...args: unknown[]) => getOverviewMock(...args),
  },
}));

describe('ProjectOverview', () => {
  beforeEach(() => {
    getOverviewMock.mockReset();
  });

  it('renders overview metrics on success', async () => {
    getOverviewMock.mockResolvedValue({
      projectSlug: 'demo',
      generatedAt: '2026-04-02T00:00:00Z',
      urlsTracked: 12,
      urlsOk: 10,
      healthScore: 85,
      issuesOpen: 3,
      recentIssues: [{ message: 'Missing H1', count: 2 }],
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

  it('renders loading state while request is in flight', async () => {
    getOverviewMock.mockImplementation(() => new Promise(() => undefined));

    render(
      <MemoryRouter initialEntries={['/c/demo/overview']}>
        <Routes>
          <Route path="/c/:slug/overview" element={<ProjectOverview />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Cargando dashboard...')).toBeTruthy();
  });

  it('renders error state on API error', async () => {
    getOverviewMock.mockRejectedValue(
      new HttpClientError({
        status: 403,
        code: 'HTTP_403',
        message: 'Forbidden',
        traceId: 'trace-123',
      }),
    );

    render(
      <MemoryRouter initialEntries={['/c/demo/overview']}>
        <Routes>
          <Route path="/c/:slug/overview" element={<ProjectOverview />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('No tienes permisos para realizar esta acción.')).toBeTruthy();
    expect(screen.getByText(/ID de trazabilidad:/)).toBeTruthy();
    expect(screen.getByText('trace-123')).toBeTruthy();
  });

  it('renders empty state when response has no tracked urls', async () => {
    getOverviewMock.mockResolvedValue({
      projectSlug: 'demo',
      generatedAt: '2026-04-02T00:00:00Z',
      urlsTracked: 0,
      urlsOk: 0,
      healthScore: 0,
      issuesOpen: 0,
      recentIssues: [],
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

  it('retries fetch after error when clicking retry CTA', async () => {
    getOverviewMock
      .mockRejectedValueOnce(
        new HttpClientError({
          status: 500,
          code: 'HTTP_500',
          message: 'Internal error',
        }),
      )
      .mockResolvedValueOnce({
        projectSlug: 'demo',
        generatedAt: '2026-04-02T00:00:00Z',
        urlsTracked: 11,
        urlsOk: 9,
        healthScore: 78,
        issuesOpen: 2,
        recentIssues: [{ message: 'Robots bloqueando', count: 1 }],
      });

    render(
      <MemoryRouter initialEntries={['/c/demo/overview']}>
        <Routes>
          <Route path="/c/:slug/overview" element={<ProjectOverview />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByText('Ocurrió un error interno. Intenta nuevamente en unos minutos.'),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('Robots bloqueando (1)')).toBeTruthy();
    expect(getOverviewMock).toHaveBeenCalledTimes(2);
  });
});
