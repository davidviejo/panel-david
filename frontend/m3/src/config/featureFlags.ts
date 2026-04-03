const normalizeFlagValue = (value: string | undefined): string =>
  (value || '').trim().toLowerCase();

const toBooleanFlag = (value: string | undefined, fallback: boolean): boolean => {
  const normalized = normalizeFlagValue(value);

  if (!normalized) return fallback;
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;

  return fallback;
};

const toPercentageFlag = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;

  return Math.max(0, Math.min(100, Math.trunc(parsed)));
};

const isProductionRuntime = (): boolean =>
  import.meta.env.PROD ||
  import.meta.env.MODE === 'production' ||
  import.meta.env.NODE_ENV === 'production';

type BackendSourceModule = 'seo_checklist' | 'ia_visibility' | 'portal_overview' | 'trends_media';

interface RuntimeTenantOverrides {
  [moduleName: string]: Record<string, boolean>;
}

export interface BackendSourceResolution {
  enabled: boolean;
  module: BackendSourceModule;
  flagKey: `ff_${BackendSourceModule}_backend_source`;
  rolloutPercentage: number;
  environment: string;
  source: 'explicit' | 'global' | 'tenant_override' | 'canary';
}

const MODULE_CONFIG: Record<
  BackendSourceModule,
  {
    explicitSourceEnv: string;
    globalFlagEnv: string;
    rolloutEnv: string;
  }
> = {
  seo_checklist: {
    explicitSourceEnv: 'VITE_SEO_CHECKLIST_DATA_SOURCE',
    globalFlagEnv: 'VITE_FF_SEO_CHECKLIST_BACKEND_SOURCE',
    rolloutEnv: 'VITE_FF_SEO_CHECKLIST_BACKEND_SOURCE_ROLLOUT',
  },
  ia_visibility: {
    explicitSourceEnv: 'VITE_IA_VISIBILITY_DATA_SOURCE',
    globalFlagEnv: 'VITE_FF_IA_VISIBILITY_BACKEND_SOURCE',
    rolloutEnv: 'VITE_FF_IA_VISIBILITY_BACKEND_SOURCE_ROLLOUT',
  },
  portal_overview: {
    explicitSourceEnv: 'VITE_PORTAL_OVERVIEW_DATA_SOURCE',
    globalFlagEnv: 'VITE_FF_PORTAL_OVERVIEW_BACKEND_SOURCE',
    rolloutEnv: 'VITE_FF_PORTAL_OVERVIEW_BACKEND_SOURCE_ROLLOUT',
  },
  trends_media: {
    explicitSourceEnv: 'VITE_TRENDS_MEDIA_DATA_SOURCE',
    globalFlagEnv: 'VITE_FF_TRENDS_MEDIA_BACKEND_SOURCE',
    rolloutEnv: 'VITE_FF_TRENDS_MEDIA_BACKEND_SOURCE_ROLLOUT',
  },
};

const buildFlagKey = (module: BackendSourceModule): `ff_${BackendSourceModule}_backend_source` =>
  `ff_${module}_backend_source`;

const envValue = (envName: string): string | undefined =>
  (import.meta.env as Record<string, string | undefined>)[envName];

const parseTenantOverrides = (): RuntimeTenantOverrides => {
  const raw = envValue('VITE_FF_BACKEND_SOURCE_TENANT_OVERRIDES');
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as RuntimeTenantOverrides;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const tenantBucket = (tenantId: string, module: BackendSourceModule): number => {
  const input = `${module}:${tenantId}`;
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash % 100;
};

const runtimeEnvironment = (): string =>
  envValue('VITE_ENVIRONMENT') || import.meta.env.MODE || 'development';

export const resolveBackendSource = (
  module: BackendSourceModule,
  options: { tenantId?: string } = {},
): BackendSourceResolution => {
  const config = MODULE_CONFIG[module];
  const explicitSource = normalizeFlagValue(envValue(config.explicitSourceEnv));
  const environment = runtimeEnvironment();
  const flagKey = buildFlagKey(module);

  if (explicitSource === 'backend') {
    return {
      enabled: true,
      module,
      flagKey,
      rolloutPercentage: 100,
      environment,
      source: 'explicit',
    };
  }

  if (explicitSource === 'legacy') {
    return {
      enabled: false,
      module,
      flagKey,
      rolloutPercentage: 0,
      environment,
      source: 'explicit',
    };
  }

  const globalEnabled = toBooleanFlag(envValue(config.globalFlagEnv), true);
  const tenantId = options.tenantId;
  const tenantOverrides = parseTenantOverrides();

  if (tenantId) {
    const moduleOverrides = tenantOverrides[module] || {};
    const tenantOverride = moduleOverrides[tenantId];
    if (typeof tenantOverride === 'boolean') {
      return {
        enabled: tenantOverride,
        module,
        flagKey,
        rolloutPercentage: tenantOverride ? 100 : 0,
        environment,
        source: 'tenant_override',
      };
    }
  }

  if (!globalEnabled) {
    return {
      enabled: false,
      module,
      flagKey,
      rolloutPercentage: 0,
      environment,
      source: 'global',
    };
  }

  const fallbackRollout = isProductionRuntime() ? 100 : 100;
  const rolloutPercentage = toPercentageFlag(envValue(config.rolloutEnv), fallbackRollout);

  if (!tenantId || rolloutPercentage >= 100) {
    return {
      enabled: rolloutPercentage > 0,
      module,
      flagKey,
      rolloutPercentage,
      environment,
      source: 'canary',
    };
  }

  return {
    enabled: tenantBucket(tenantId, module) < rolloutPercentage,
    module,
    flagKey,
    rolloutPercentage,
    environment,
    source: 'canary',
  };
};

export const featureFlags = {
  iaVisibilityBackendSource: resolveBackendSource('ia_visibility').enabled,
  seoChecklistBackendSource: resolveBackendSource('seo_checklist').enabled,
  portalOverviewBackendSource: resolveBackendSource('portal_overview').enabled,
  trendsMediaBackendSource: resolveBackendSource('trends_media').enabled,
};
