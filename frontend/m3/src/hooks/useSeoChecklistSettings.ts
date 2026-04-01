import { useState, useCallback } from 'react';
import { useProject } from '../context/ProjectContext';
import { SeoChecklistSettings } from '../types/seoChecklist';
import { SettingsRepository } from '../services/settingsRepository';

const getDefaultSettings = (): SeoChecklistSettings => {
  const appSettings = SettingsRepository.getSettings();
  return {
    brandTerms: [],
    allowKwPrincipalUpdate: true,
    serp: {
      enabled: false,
      provider: 'dataforseo',
      maxKeywordsPerUrl: 10,
      maxCompetitorsPerKeyword: 3,
      dataforseoLogin: appSettings.dataforseoLogin || '',
      dataforseoPassword: appSettings.dataforseoPassword || '',
    },
    budgets: {
      maxUrlsPerBatch: 50,
      dailyBudget: 10,
      maxEstimatedCostPerBatch: 5,
    },
    competitorsMode: 'autoFromSerp',
  };
};

export const useSeoChecklistSettings = () => {
  const { currentClientId } = useProject();
  const storageKey = currentClientId ? `mediaflow_seo_settings_${currentClientId}` : null;
  const [settings, setSettings] = useState<SeoChecklistSettings>(() => {
    const defaultSettings = getDefaultSettings();
    if (!storageKey) return defaultSettings;
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return defaultSettings;
      const parsed = JSON.parse(saved);
      return {
        ...defaultSettings,
        ...parsed,
        serp: { ...defaultSettings.serp, ...parsed.serp },
        budgets: { ...defaultSettings.budgets, ...parsed.budgets },
      };
    } catch (e) {
      console.error('Failed to parse SEO settings', e);
      return defaultSettings;
    }
  });

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
