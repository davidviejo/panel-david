import { DEFAULT_SETTINGS } from '../constants';
import { AppSettings } from '../types';

const SETTINGS_KEY = 'mediaflow_trends_media_settings_v2';

const cloneDefaults = () => JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) as AppSettings;

export const getSettings = (): AppSettings => {
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (!stored) return cloneDefaults();

  try {
    const parsed = JSON.parse(stored) as Partial<AppSettings>;
    return {
      ...cloneDefaults(),
      ...parsed,
      googleDomains: parsed.googleDomains || cloneDefaults().googleDomains,
      rssFeeds: parsed.rssFeeds || cloneDefaults().rssFeeds,
      htmlUrls: parsed.htmlUrls || cloneDefaults().htmlUrls,
      ignoredDomains: parsed.ignoredDomains || cloneDefaults().ignoredDomains,
      searchQueries: parsed.searchQueries || cloneDefaults().searchQueries,
      targetSources: parsed.targetSources || cloneDefaults().targetSources,
      focusTerms: parsed.focusTerms || cloneDefaults().focusTerms,
    };
  } catch {
    return cloneDefaults();
  }
};

export const saveSettings = (settings: AppSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const resetSettings = (): AppSettings => {
  const defaults = cloneDefaults();
  saveSettings(defaults);
  return defaults;
};
