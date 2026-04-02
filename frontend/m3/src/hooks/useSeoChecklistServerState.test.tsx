import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  seoChecklistKeys,
  useBulkUpdateSeoChecklistPagesMutation,
  useImportSeoChecklistPagesMutation,
  useUpdateSeoChecklistPageMutation,
} from './useSeoChecklistServerState';
import { seoChecklistApi } from '../services/seoChecklistApi';
import { CHECKLIST_POINTS, ChecklistItem, ChecklistKey, SeoPage } from '../types/seoChecklist';

vi.mock('../services/seoChecklistApi', () => ({
  seoChecklistApi: {
    list: vi.fn(),
    importPages: vi.fn(),
    update: vi.fn(),
    bulkUpdate: vi.fn(),
  },
}));

const createWrapper = (client: QueryClient) => {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  return Wrapper;
};

const buildChecklist = () => {
  const checklist: Record<string, ChecklistItem> = {};
  CHECKLIST_POINTS.forEach((point) => {
    checklist[point.key] = {
      key: point.key,
      label: point.label,
      status_manual: 'NA',
      notes_manual: '',
    };
  });

  return checklist as Record<ChecklistKey, ChecklistItem>;
};

const buildPage = (id: string): SeoPage => ({
  id,
  url: `https://example.com/${id}`,
  kwPrincipal: id,
  pageType: 'Article',
  checklist: buildChecklist(),
});

describe('useSeoChecklistServerState mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });


  it('updates cache and avoids stale data after import/create mutation', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    queryClient.setQueryData(seoChecklistKeys.list('client-1'), [buildPage('page-1')]);

    vi.mocked(seoChecklistApi.importPages).mockResolvedValue({
      clientId: 'client-1',
      pages: [buildPage('page-1'), buildPage('page-2')],
    });

    const { result } = renderHook(
      () => useImportSeoChecklistPagesMutation('client-1', []),
      { wrapper: createWrapper(queryClient) },
    );

    await act(async () => {
      await result.current.mutateAsync([buildPage('page-2')]);
    });

    await waitFor(() => {
      const cachedPages = queryClient.getQueryData<SeoPage[]>(seoChecklistKeys.list('client-1')) || [];
      expect(cachedPages).toHaveLength(2);
      expect(cachedPages.map((page) => page.id)).toEqual(['page-1', 'page-2']);
      expect(cachedPages.every((page) => page.kwPrincipal)).toBe(true);
    });
  });

  it('invalidates list key after update mutation', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    queryClient.setQueryData(seoChecklistKeys.list('client-1'), [buildPage('page-1')]);

    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
    vi.mocked(seoChecklistApi.update).mockResolvedValue({
      clientId: 'client-1',
      pages: [buildPage('page-1')],
    });

    const { result } = renderHook(
      () => useUpdateSeoChecklistPageMutation('client-1', []),
      { wrapper: createWrapper(queryClient) },
    );

    await act(async () => {
      await result.current.mutateAsync({ id: 'page-1', updates: { kwPrincipal: 'updated' } });
    });

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: seoChecklistKeys.list('client-1'),
      });
    });
  });

  it('invalidates list key after bulk update mutation', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    queryClient.setQueryData(seoChecklistKeys.list('client-1'), [buildPage('page-1'), buildPage('page-2')]);

    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
    vi.mocked(seoChecklistApi.bulkUpdate).mockResolvedValue({
      clientId: 'client-1',
      pages: [buildPage('page-1'), buildPage('page-2')],
    });

    const { result } = renderHook(
      () => useBulkUpdateSeoChecklistPagesMutation('client-1', []),
      { wrapper: createWrapper(queryClient) },
    );

    await act(async () => {
      await result.current.mutateAsync([{ id: 'page-1', changes: { kwPrincipal: 'bulk-updated' } }]);
    });

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: seoChecklistKeys.list('client-1'),
      });
    });
  });
});
