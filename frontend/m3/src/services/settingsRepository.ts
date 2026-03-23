export interface AppSettings {
  openaiApiKey?: string;
  openaiModel?: string;
  geminiApiKey?: string;
  geminiModel?: string;
  mistralApiKey?: string;
  mistralModel?: string;
  gscClientId?: string;
  brandTerms?: string[];
}

const SETTINGS_KEY = 'mediaflow_app_settings';

export class SettingsRepository {
  static getSettings(): AppSettings {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing settings', e);
      }
    }
    // Fallback: Check for legacy GSC Client ID in localStorage if not in new settings
    // Note: useGSCAuth used 'mediaflow_gsc_client_id'
    const legacyGscId = localStorage.getItem('mediaflow_gsc_client_id');
    return {
      gscClientId: legacyGscId || undefined,
      brandTerms: [],
      openaiModel: 'gpt-4o',
      mistralModel: 'mistral-large-latest',
      geminiModel: 'gemini-1.5-pro',
    };
  }

  static saveSettings(settings: AppSettings): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    // Sync legacy GSC key for backward compatibility
    if (settings.gscClientId) {
      localStorage.setItem('mediaflow_gsc_client_id', settings.gscClientId);
    }
  }

  static getApiKey(provider: 'openai' | 'gemini' | 'mistral'): string | undefined {
    const settings = this.getSettings();
    if (provider === 'openai') return settings.openaiApiKey || import.meta.env.VITE_OPENAI_API_KEY;
    if (provider === 'gemini') return settings.geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY;
    if (provider === 'mistral')
      return settings.mistralApiKey || import.meta.env.VITE_MISTRAL_API_KEY;
    return undefined;
  }
}
