import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useProject } from '../context/ProjectContext';
import { ChecklistKey, ChecklistItem, SeoPage } from '../types/seoChecklist';
import { useSeoChecklistSettings } from './useSeoChecklistSettings';
import {
  buildFallbackChecklistItem,
  enforceUniquePrimaryKeywords,
  mergeChecklistItemWithBusinessRules,
  mergeChecklistWithBusinessRules,
  normalizeSeoPages,
} from '../shared/api/mappers/seoChecklistMapper';
import {
  useBulkUpdateSeoChecklistPagesMutation,
  useImportSeoChecklistPagesMutation,
  useSeoChecklistQuery,
  useUpdateSeoChecklistPageMutation,
  seoChecklistKeys,
} from './useSeoChecklistServerState';
import { resolveModuleDataSource } from '../shared/data-hooks/backendSourceResolver';

const loadLocalPages = (storageKey: string): SeoPage[] => {
  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return [];

    const parsed = JSON.parse(saved) as SeoPage[];
    const normalized = normalizeSeoPages(parsed);
    if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
      localStorage.setItem(storageKey, JSON.stringify(normalized));
    }

    return normalized;
  } catch (e) {
    console.error('Failed to parse SEO Checklist data', e);
    return [];
  }
};

export { enforceUniquePrimaryKeywords, mergeChecklistItemWithBusinessRules };

export const useSeoChecklist = () => {
  const { currentClientId } = useProject();
  const { settings } = useSeoChecklistSettings();
  const activeBrandTerms = useMemo(() => settings.brandTerms || [], [settings.brandTerms]);
  const storageKey = `mediaflow_seo_checklist_${currentClientId}`;
  const useBackendSource = resolveModuleDataSource({
    module: 'seo_checklist',
    tenantId: currentClientId || undefined,
  });

  const [localPages, setLocalPages] = useState<SeoPage[]>(() =>
    currentClientId ? loadLocalPages(storageKey) : [],
  );

  useEffect(() => {
    if (useBackendSource || !currentClientId) return;
    setLocalPages(loadLocalPages(storageKey));
  }, [currentClientId, storageKey, useBackendSource]);

  const queryClient = useQueryClient();
  const listQuery = useSeoChecklistQuery(currentClientId, activeBrandTerms, useBackendSource);
  const importMutation = useImportSeoChecklistPagesMutation(currentClientId, activeBrandTerms);
  const updateMutation = useUpdateSeoChecklistPageMutation(currentClientId, activeBrandTerms);
  const bulkUpdateMutation = useBulkUpdateSeoChecklistPagesMutation(
    currentClientId,
    activeBrandTerms,
  );

  const pages = useBackendSource ? listQuery.data || [] : localPages;

  const addPages = useCallback(
    (newPages: SeoPage[]) => {
      if (useBackendSource) {
        void importMutation.mutateAsync(newPages);
        return;
      }

      setLocalPages((prev) => {
        const updated = enforceUniquePrimaryKeywords(
          normalizeSeoPages([...prev, ...newPages]),
          activeBrandTerms,
        );
        localStorage.setItem(storageKey, JSON.stringify(updated));
        return updated;
      });
    },
    [activeBrandTerms, importMutation, storageKey, useBackendSource],
  );

  const updatePage = useCallback(
    (id: string, updates: Partial<SeoPage>) => {
      if (useBackendSource) {
        void updateMutation.mutateAsync({ id, updates });
        return;
      }

      setLocalPages((prev) => {
        const updated = enforceUniquePrimaryKeywords(
          normalizeSeoPages(prev.map((p) => (p.id === id ? { ...p, ...updates } : p))),
          activeBrandTerms,
        );
        localStorage.setItem(storageKey, JSON.stringify(updated));
        return updated;
      });
    },
    [activeBrandTerms, storageKey, updateMutation, useBackendSource],
  );

  const bulkUpdatePages = useCallback(
    (updates: { id: string; changes: Partial<SeoPage> }[]) => {
      if (useBackendSource) {
        void bulkUpdateMutation.mutateAsync(updates);
        return;
      }

      setLocalPages((prev) => {
        const updated = enforceUniquePrimaryKeywords(
          normalizeSeoPages(
            prev.map((p) => {
              const update = updates.find((u) => u.id === p.id);
              if (!update) return p;
              const mergedChecklist = update.changes.checklist
                ? mergeChecklistWithBusinessRules(p.checklist, update.changes.checklist)
                : p.checklist;
              return { ...p, ...update.changes, checklist: mergedChecklist };
            }),
          ),
          activeBrandTerms,
        );
        localStorage.setItem(storageKey, JSON.stringify(updated));
        return updated;
      });
    },
    [activeBrandTerms, bulkUpdateMutation, storageKey, useBackendSource],
  );

  const updateChecklistItem = useCallback(
    (pageId: string, key: ChecklistKey, updates: Partial<ChecklistItem>) => {
      const wrappedUpdate = {
        checklist: {
          [key]: updates,
        },
      } as Partial<SeoPage>;

      if (useBackendSource) {
        void updateMutation.mutateAsync({ id: pageId, updates: wrappedUpdate });
        return;
      }

      setLocalPages((prev) => {
        const updated = prev.map((p) => {
          if (p.id !== pageId) return p;
          const currentItem = p.checklist[key];
          return {
            ...p,
            checklist: {
              ...p.checklist,
              [key]: mergeChecklistItemWithBusinessRules(
                currentItem || buildFallbackChecklistItem(key),
                updates,
              ),
            },
          };
        });
        localStorage.setItem(storageKey, JSON.stringify(updated));
        return updated;
      });
    },
    [storageKey, updateMutation, useBackendSource],
  );

  const deletePage = useCallback(
    (id: string) => {
      if (useBackendSource && currentClientId) {
        const current =
          queryClient.getQueryData<SeoPage[]>(seoChecklistKeys.list(currentClientId)) || [];
        const nextPages = current.filter((page) => page.id !== id);
        queryClient.setQueryData(seoChecklistKeys.list(currentClientId), nextPages);
        void importMutation.mutateAsync(nextPages);
        return;
      }

      setLocalPages((prev) => {
        const updated = prev.filter((p) => p.id !== id);
        localStorage.setItem(storageKey, JSON.stringify(updated));
        return updated;
      });
    },
    [currentClientId, importMutation, queryClient, storageKey, useBackendSource],
  );

  const bulkDeletePages = useCallback(
    (ids: string[]) => {
      if (useBackendSource && currentClientId) {
        const current =
          queryClient.getQueryData<SeoPage[]>(seoChecklistKeys.list(currentClientId)) || [];
        const nextPages = current.filter((page) => !ids.includes(page.id));
        queryClient.setQueryData(seoChecklistKeys.list(currentClientId), nextPages);
        void importMutation.mutateAsync(nextPages);
        return;
      }

      setLocalPages((prev) => {
        const updated = prev.filter((p) => !ids.includes(p.id));
        localStorage.setItem(storageKey, JSON.stringify(updated));
        return updated;
      });
    },
    [currentClientId, importMutation, queryClient, storageKey, useBackendSource],
  );

  return {
    pages,
    addPages,
    updatePage,
    bulkUpdatePages,
    updateChecklistItem,
    deletePage,
    bulkDeletePages,
    isLoading: useBackendSource ? listQuery.isLoading : false,
    isError: useBackendSource ? listQuery.isError : false,
    error: useBackendSource ? listQuery.error : null,
  };
};
