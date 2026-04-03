import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('resolveBackendSource', () => {
  beforeEach(() => {
    vi.resetModules();
    delete import.meta.env.VITE_PORTAL_OVERVIEW_DATA_SOURCE;
    delete import.meta.env.VITE_FF_PORTAL_OVERVIEW_BACKEND_SOURCE;
    delete import.meta.env.VITE_FF_PORTAL_OVERVIEW_BACKEND_SOURCE_ROLLOUT;
    delete import.meta.env.VITE_FF_BACKEND_SOURCE_TENANT_OVERRIDES;
  });

  it('uses backend by default', async () => {
    const { resolveBackendSource } = await import('./featureFlags');
    const resolution = resolveBackendSource('portal_overview', { tenantId: 'tenant-a' });

    expect(resolution.enabled).toBe(true);
    expect(resolution.flagKey).toBe('ff_portal_overview_backend_source');
  });

  it('uses legacy when explicit source is legacy', async () => {
    import.meta.env.VITE_PORTAL_OVERVIEW_DATA_SOURCE = 'legacy';

    const { resolveBackendSource } = await import('./featureFlags');
    const resolution = resolveBackendSource('portal_overview', { tenantId: 'tenant-a' });

    expect(resolution.enabled).toBe(false);
    expect(resolution.source).toBe('explicit');
  });

  it('respects tenant override over global flag', async () => {
    import.meta.env.VITE_FF_PORTAL_OVERVIEW_BACKEND_SOURCE = 'false';
    import.meta.env.VITE_FF_BACKEND_SOURCE_TENANT_OVERRIDES = JSON.stringify({
      portal_overview: {
        'tenant-priority': true,
      },
    });

    const { resolveBackendSource } = await import('./featureFlags');
    const resolution = resolveBackendSource('portal_overview', { tenantId: 'tenant-priority' });

    expect(resolution.enabled).toBe(true);
    expect(resolution.source).toBe('tenant_override');
  });

  it('applies canary rollout percentage deterministically by tenant', async () => {
    import.meta.env.VITE_FF_PORTAL_OVERVIEW_BACKEND_SOURCE = 'true';
    import.meta.env.VITE_FF_PORTAL_OVERVIEW_BACKEND_SOURCE_ROLLOUT = '0';

    const { resolveBackendSource } = await import('./featureFlags');
    const resolution = resolveBackendSource('portal_overview', { tenantId: 'tenant-a' });

    expect(resolution.enabled).toBe(false);
    expect(resolution.rolloutPercentage).toBe(0);
    expect(resolution.source).toBe('canary');
  });
});
