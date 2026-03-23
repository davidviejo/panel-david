import { useState, useEffect, useCallback } from 'react';
import { useProject } from '../context/ProjectContext';
import { SeoChecklistSettings } from '../types/seoChecklist';

const DEFAULT_SETTINGS: SeoChecklistSettings = {
  serp: {
    enabled: false,
    provider: 'serpapi',
    maxKeywordsPerUrl: 10,
    maxCompetitorsPerKeyword: 3,
    dataforseoLogin: '',
    dataforseoPassword: '',
  },
  budgets: {
    maxUrlsPerBatch: 50,
    dailyBudget: 10,
    maxEstimatedCostPerBatch: 5,
  },
  competitorsMode: 'autoFromSerp',
};

export const useSeoChecklistSettings = () => {
  const { currentClientId } = useProject();
  const [settings, setSettings] = useState<SeoChecklistSettings>(DEFAULT_SETTINGS);

  const storageKey = currentClientId ? `mediaflow_seo_settings_${currentClientId}` : null;

  useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with default to ensure new fields are present
        setSettings({
          ...DEFAULT_SETTINGS,
          ...parsed,
          serp: { ...DEFAULT_SETTINGS.serp, ...parsed.serp },
          budgets: { ...DEFAULT_SETTINGS.budgets, ...parsed.budgets },
        });
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (e) {
      console.error('Failed to parse SEO settings', e);
      setSettings(DEFAULT_SETTINGS);
    }
  }, [storageKey]);

  const updateSettings = useCallback(
    (newSettings: Partial<SeoChecklistSettings>) => {
      if (!storageKey) return;
      setSettings((prev) => {
        const updated = {
          ...prev,
          ...newSettings,
          serp: { ...prev.serp, ...newSettings.serp },
          budgets: { ...prev.budgets, ...newSettings.budgets },
        };
        localStorage.setItem(storageKey, JSON.stringify(updated));
        return updated;
      });
    },
    [storageKey],
  );

  return {
    settings,
    updateSettings,
  };
};
