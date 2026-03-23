import { useState, useCallback } from 'react';
import { useProject } from '../context/ProjectContext';
import { SeoPage, ChecklistKey, ChecklistItem } from '../types/seoChecklist';

const normalizeKeyword = (keyword?: string) => (keyword || '').trim().toLowerCase();

const getPagePerformanceScore = (page: SeoPage) => {
  const clicks = page.gscMetrics?.clicks || 0;
  const impressions = page.gscMetrics?.impressions || 0;
  const position = page.gscMetrics?.position ?? Number.POSITIVE_INFINITY;

  return { clicks, impressions, position };
};

const shouldKeepKeywordOver = (candidate: SeoPage, currentWinner: SeoPage) => {
  const candidateScore = getPagePerformanceScore(candidate);
  const winnerScore = getPagePerformanceScore(currentWinner);

  if (candidateScore.clicks !== winnerScore.clicks) {
    return candidateScore.clicks > winnerScore.clicks;
  }

  if (candidateScore.impressions !== winnerScore.impressions) {
    return candidateScore.impressions > winnerScore.impressions;
  }

  if (candidateScore.position !== winnerScore.position) {
    return candidateScore.position < winnerScore.position;
  }

  return candidate.id < currentWinner.id;
};

export const enforceUniquePrimaryKeywords = (pages: SeoPage[]) => {
  const winners = new Map<string, string>();

  pages.forEach((page) => {
    if (page.isBrandKeyword) return;

    const normalizedKeyword = normalizeKeyword(page.kwPrincipal);
    if (!normalizedKeyword || normalizedKeyword === '-') return;

    const currentWinnerId = winners.get(normalizedKeyword);
    if (!currentWinnerId) {
      winners.set(normalizedKeyword, page.id);
      return;
    }

    const currentWinner = pages.find((candidate) => candidate.id === currentWinnerId);
    if (!currentWinner || shouldKeepKeywordOver(page, currentWinner)) {
      winners.set(normalizedKeyword, page.id);
    }
  });

  return pages.map((page) => {
    if (page.isBrandKeyword) return page;

    const normalizedKeyword = normalizeKeyword(page.kwPrincipal);
    if (!normalizedKeyword || normalizedKeyword === '-') return page;

    if (winners.get(normalizedKeyword) === page.id) {
      return page;
    }

    return {
      ...page,
      kwPrincipal: '',
    };
  });
};

export const useSeoChecklist = () => {
  const { currentClientId } = useProject();
  const storageKey = `mediaflow_seo_checklist_${currentClientId}`;
  const [pages, setPages] = useState<SeoPage[]>(() => {
    if (!currentClientId) return [];
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse SEO Checklist data', e);
      return [];
    }
  });

  const addPages = useCallback(
    (newPages: SeoPage[]) => {
      setPages((prev) => {
        const updated = enforceUniquePrimaryKeywords([...prev, ...newPages]);
        localStorage.setItem(storageKey, JSON.stringify(updated));
        return updated;
      });
    },
    [storageKey],
  );

  const updatePage = useCallback(
    (id: string, updates: Partial<SeoPage>) => {
      setPages((prev) => {
        const updated = enforceUniquePrimaryKeywords(
          prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        );
        localStorage.setItem(storageKey, JSON.stringify(updated));
        return updated;
      });
    },
    [storageKey],
  );

  const bulkUpdatePages = useCallback(
    (updates: { id: string; changes: Partial<SeoPage> }[]) => {
      setPages((prev) => {
        const updated = enforceUniquePrimaryKeywords(
          prev.map((p) => {
            const update = updates.find((u) => u.id === p.id);
            return update ? { ...p, ...update.changes } : p;
          }),
        );
        localStorage.setItem(storageKey, JSON.stringify(updated));
        return updated;
      });
    },
    [storageKey],
  );

  const updateChecklistItem = useCallback(
    (pageId: string, key: ChecklistKey, updates: Partial<ChecklistItem>) => {
      setPages((prev) => {
        const updated = prev.map((p) => {
          if (p.id !== pageId) return p;
          const currentItem = p.checklist[key];
          return {
            ...p,
            checklist: {
              ...p.checklist,
              [key]: { ...currentItem, ...updates },
            },
          };
        });
        localStorage.setItem(storageKey, JSON.stringify(updated));
        return updated;
      });
    },
    [storageKey],
  );

  const deletePage = useCallback(
    (id: string) => {
      setPages((prev) => {
        const updated = prev.filter((p) => p.id !== id);
        localStorage.setItem(storageKey, JSON.stringify(updated));
        return updated;
      });
    },
    [storageKey],
  );

  const bulkDeletePages = useCallback(
    (ids: string[]) => {
      setPages((prev) => {
        const updated = prev.filter((p) => !ids.includes(p.id));
        localStorage.setItem(storageKey, JSON.stringify(updated));
        return updated;
      });
    },
    [storageKey],
  );

  return {
    pages,
    addPages,
    updatePage,
    bulkUpdatePages,
    updateChecklistItem,
    deletePage,
    bulkDeletePages,
  };
};
