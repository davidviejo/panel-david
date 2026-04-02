const normalizeFlagValue = (value: string | undefined): string =>
  (value || '').trim().toLowerCase();

const toBooleanFlag = (value: string | undefined, fallback: boolean): boolean => {
  const normalized = normalizeFlagValue(value);

  if (!normalized) return fallback;
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;

  return fallback;
};


const resolveSeoChecklistBackendSource = (): boolean => {
  const explicitSource = normalizeFlagValue(import.meta.env.VITE_SEO_CHECKLIST_DATA_SOURCE);

  if (explicitSource === 'backend') return true;
  if (explicitSource === 'legacy') return false;

  return toBooleanFlag(import.meta.env.VITE_FF_SEO_CHECKLIST_BACKEND_SOURCE, true);
};

const resolveIAVisibilityBackendSource = (): boolean => {
  const explicitSource = normalizeFlagValue(import.meta.env.VITE_IA_VISIBILITY_DATA_SOURCE);

  if (explicitSource === 'backend') return true;
  if (explicitSource === 'legacy') return false;

  return toBooleanFlag(import.meta.env.VITE_FF_IA_VISIBILITY_BACKEND_SOURCE, true);
};

const resolvePortalOverviewBackendSource = (): boolean => {
  const explicitSource = normalizeFlagValue(import.meta.env.VITE_PORTAL_OVERVIEW_DATA_SOURCE);

  if (explicitSource === 'backend') return true;
  if (explicitSource === 'legacy') return false;

  return toBooleanFlag(import.meta.env.VITE_FF_PORTAL_OVERVIEW_BACKEND_SOURCE, true);
};

export const featureFlags = {
  iaVisibilityBackendSource: resolveIAVisibilityBackendSource(),
  seoChecklistBackendSource: resolveSeoChecklistBackendSource(),
  portalOverviewBackendSource: resolvePortalOverviewBackendSource(),
};
