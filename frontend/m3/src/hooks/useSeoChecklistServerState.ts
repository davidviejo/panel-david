import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SeoPage } from '../types/seoChecklist';
import { seoChecklistApi } from '../services/seoChecklistApi';
import {
  normalizeSeoPages,
  enforceUniquePrimaryKeywords,
  mergeChecklistWithBusinessRules,
} from '../shared/api/mappers/seoChecklistMapper';
import { buildModuleScopeKey, buildQueryKey } from '../shared/data-hooks/queryKeys';
import { buildRetryPolicy, withNormalizedError } from '../shared/data-hooks/queryPolicies';

const MODULE_KEY = 'seoChecklist';

export const seoChecklistKeys = {
  all: buildModuleScopeKey(MODULE_KEY),
  byClient: (clientId: string) => buildModuleScopeKey(MODULE_KEY, { clientId }),
  list: (clientId: string) => buildQueryKey(MODULE_KEY, 'list', { clientId }),
};

const applyBusinessRules = (pages: SeoPage[], brandTerms: string[]) =>
  enforceUniquePrimaryKeywords(normalizeSeoPages(pages), brandTerms);

const useInvalidateSeoChecklist = (clientId: string | null | undefined) => {
  const queryClient = useQueryClient();

  return async () => {
    if (!clientId) return;
    await queryClient.invalidateQueries({ queryKey: seoChecklistKeys.list(clientId) });
  };
};

export const useSeoChecklistQuery = (
  clientId: string | null | undefined,
  brandTerms: string[],
  enabled = true,
) =>
  useQuery({
    queryKey: clientId ? seoChecklistKeys.list(clientId) : seoChecklistKeys.all,
    queryFn: async () =>
      withNormalizedError(async () => {
        const response = await seoChecklistApi.list(clientId!);
        return applyBusinessRules(response.pages || [], brandTerms);
      }),
    enabled: Boolean(clientId) && enabled,
    retry: buildRetryPolicy('standard_read'),
  });

export const useImportSeoChecklistPagesMutation = (
  clientId: string | null | undefined,
  brandTerms: string[],
) => {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateSeoChecklist(clientId);

  return useMutation({
    mutationFn: async (newPages: SeoPage[]) =>
      withNormalizedError(async () => {
        const current = queryClient.getQueryData<SeoPage[]>(seoChecklistKeys.list(clientId!)) || [];
        const nextPages = applyBusinessRules([...current, ...newPages], brandTerms);
        const response = await seoChecklistApi.importPages({ clientId: clientId!, pages: nextPages });
        return applyBusinessRules(response.pages || nextPages, brandTerms);
      }),
    retry: buildRetryPolicy('mutation'),
    onSuccess: async (pages) => {
      if (clientId) {
        queryClient.setQueryData(seoChecklistKeys.list(clientId), pages);
      }
      await invalidate();
    },
  });
};

export const useUpdateSeoChecklistPageMutation = (
  clientId: string | null | undefined,
  brandTerms: string[],
) => {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateSeoChecklist(clientId);

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SeoPage> }) =>
      withNormalizedError(async () => {
        const current = queryClient.getQueryData<SeoPage[]>(seoChecklistKeys.list(clientId!)) || [];
        const existing = current.find((page) => page.id === id);
        const mergedChecklist =
          existing && updates.checklist
            ? mergeChecklistWithBusinessRules(existing.checklist, updates.checklist)
            : updates.checklist;

        const response = await seoChecklistApi.update({
          clientId: clientId!,
          pageId: id,
          changes: { ...updates, checklist: mergedChecklist },
        });
        return applyBusinessRules(response.pages || current, brandTerms);
      }),
    retry: buildRetryPolicy('mutation'),
    onSuccess: async (pages) => {
      if (clientId) {
        queryClient.setQueryData(seoChecklistKeys.list(clientId), pages);
      }
      await invalidate();
    },
  });
};

export const useBulkUpdateSeoChecklistPagesMutation = (
  clientId: string | null | undefined,
  brandTerms: string[],
) => {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateSeoChecklist(clientId);

  return useMutation({
    mutationFn: async (updates: { id: string; changes: Partial<SeoPage> }[]) =>
      withNormalizedError(async () => {
        const current = queryClient.getQueryData<SeoPage[]>(seoChecklistKeys.list(clientId!)) || [];
        const normalizedUpdates = updates.map((update) => {
          const currentPage = current.find((page) => page.id === update.id);
          const mergedChecklist =
            currentPage && update.changes.checklist
              ? mergeChecklistWithBusinessRules(currentPage.checklist, update.changes.checklist)
              : update.changes.checklist;

          return {
            id: update.id,
            changes: {
              ...update.changes,
              checklist: mergedChecklist,
            },
          };
        });

        const response = await seoChecklistApi.bulkUpdate({
          clientId: clientId!,
          updates: normalizedUpdates,
        });

        return applyBusinessRules(response.pages || current, brandTerms);
      }),
    retry: buildRetryPolicy('mutation'),
    onSuccess: async (pages) => {
      if (clientId) {
        queryClient.setQueryData(seoChecklistKeys.list(clientId), pages);
      }
      await invalidate();
    },
  });
};
