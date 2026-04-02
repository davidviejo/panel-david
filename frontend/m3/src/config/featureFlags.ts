const normalizeFlagValue = (value: string | undefined): string =>
  (value || '').trim().toLowerCase();

const toBooleanFlag = (value: string | undefined, fallback: boolean): boolean => {
  const normalized = normalizeFlagValue(value);

  if (!normalized) return fallback;
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;

  return fallback;
};

const resolveIAVisibilityBackendSource = (): boolean => {
  const explicitSource = normalizeFlagValue(import.meta.env.VITE_IA_VISIBILITY_DATA_SOURCE);

  if (explicitSource === 'backend') return true;
  if (explicitSource === 'legacy') return false;

  return toBooleanFlag(import.meta.env.VITE_FF_IA_VISIBILITY_BACKEND_SOURCE, true);
};

const resolveTrendsMediaMockFallback = (): boolean => {
  const explicitMode = normalizeFlagValue(import.meta.env.VITE_TRENDS_MEDIA_NEWS_MODE);

  if (explicitMode === 'backend-only') return false;
  if (explicitMode === 'allow-mock') return true;

  const isTest = normalizeFlagValue(import.meta.env.MODE) === 'test';
  return toBooleanFlag(import.meta.env.VITE_FF_TRENDS_MEDIA_ALLOW_MOCKS, isTest);
};

export const featureFlags = {
  iaVisibilityBackendSource: resolveIAVisibilityBackendSource(),
  trendsMediaMockFallback: resolveTrendsMediaMockFallback(),
};
