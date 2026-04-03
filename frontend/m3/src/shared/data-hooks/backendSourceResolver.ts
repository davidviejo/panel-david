import { resolveBackendSource } from '../../config/featureFlags';

export type BackendSourceModule = Parameters<typeof resolveBackendSource>[0];

interface ResolveModuleDataSourceOptions {
  module: BackendSourceModule;
  tenantId?: string;
}

export const resolveModuleDataSource = ({
  module,
  tenantId,
}: ResolveModuleDataSourceOptions): boolean => {
  const resolution = resolveBackendSource(module, { tenantId });

  console.info('[data-source-resolution]', {
    module,
    tenantId: tenantId || 'global',
    backendSourceEnabled: resolution.enabled,
    rolloutPercentage: resolution.rolloutPercentage,
    source: resolution.source,
    flagKey: resolution.flagKey,
    environment: resolution.environment,
  });

  return resolution.enabled;
};
