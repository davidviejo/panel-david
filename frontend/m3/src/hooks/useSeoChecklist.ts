import { useState, useEffect, useCallback } from 'react';
import { useProject } from '../context/ProjectContext';
import { SeoPage, ChecklistKey, ChecklistItem } from '../types/seoChecklist';

export const useSeoChecklist = () => {
  const { currentClientId } = useProject();
  const [pages, setPages] = useState<SeoPage[]>([]);

  const storageKey = `mediaflow_seo_checklist_${currentClientId}`;

  // Load from storage when client changes
  useEffect(() => {
    if (!currentClientId) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setPages(JSON.parse(saved));
      } else {
        setPages([]);
      }
    } catch (e) {
      console.error('Failed to parse SEO Checklist data', e);
      setPages([]);
    }
  }, [currentClientId, storageKey]);

  const addPages = useCallback(
    (newPages: SeoPage[]) => {
      setPages((prev) => {
        const updated = [...prev, ...newPages];
        localStorage.setItem(storageKey, JSON.stringify(updated));
        return updated;
      });
    },
    [storageKey],
  );

  const updatePage = useCallback(
    (id: string, updates: Partial<SeoPage>) => {
      setPages((prev) => {
        const updated = prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
        localStorage.setItem(storageKey, JSON.stringify(updated));
        return updated;
      });
    },
    [storageKey],
  );

  const bulkUpdatePages = useCallback(
    (updates: { id: string; changes: Partial<SeoPage> }[]) => {
      setPages((prev) => {
        const updated = prev.map((p) => {
          const update = updates.find((u) => u.id === p.id);
          return update ? { ...p, ...update.changes } : p;
        });
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
