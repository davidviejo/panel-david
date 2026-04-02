export type QueryKeyPrimitive = string | number | boolean | null;
export type QueryKeyParams =
  | QueryKeyPrimitive
  | QueryKeyPrimitive[]
  | Record<string, QueryKeyPrimitive | QueryKeyPrimitive[] | undefined>;

export type StandardQueryKey<TModule extends string, TResource extends string> = readonly [
  TModule,
  TResource,
  QueryKeyParams?,
];

export const buildQueryKey = <TModule extends string, TResource extends string>(
  module: TModule,
  resource: TResource,
  params?: QueryKeyParams,
): StandardQueryKey<TModule, TResource> => {
  if (typeof params === 'undefined') {
    return [module, resource] as StandardQueryKey<TModule, TResource>;
  }

  return [module, resource, params] as StandardQueryKey<TModule, TResource>;
};

export const buildModuleScopeKey = <TModule extends string>(
  module: TModule,
  params?: QueryKeyParams,
) => buildQueryKey(module, 'scope', params);
