# Data Hooks Conventions

## Objetivo

Estandarizar cómo el frontend consume backend como única fuente de verdad, evitando estados stale entre pantallas y mutaciones concurrentes.

## 1) Convención de query keys

Formato obligatorio:

```ts
['modulo', 'recurso', params]
```

- `modulo`: bounded context (ej. `seoChecklist`, `iaVisibility`, `gsc`).
- `recurso`: colección o detalle (`list`, `history`, `schedule`, `report`, etc.).
- `params`: objeto serializable con el alcance mínimo (`{ clientId }`, `{ selectedSite, startDate, endDate }`).

### Helper central

Usar exclusivamente:

- `buildQueryKey(module, resource, params?)`
- `buildModuleScopeKey(module, params?)`

Archivo: `src/shared/data-hooks/queryKeys.ts`.

## 2) Estándar de hooks

### Lectura

Nombre: `useXQuery(...)`.

- Ejemplos módulo piloto:
  - `useSeoChecklistQuery(clientId, brandTerms)`
  - `useIAVisibilityListQuery(clientId)`
  - `useIAVisibilityHistoryQuery(clientId)`
  - `useIAVisibilityScheduleQuery(clientId)`

- Ejemplo módulo adicional:
  - `useGSCSitesQuery(accessToken)`
  - `useGSCReportQuery(accessToken, selectedSite, startDate, endDate, comparisonMode)`

### Mutaciones

Nombre: `useCreateX/useUpdateX/useDeleteX` o `useXMutation` cuando el verbo ya está implícito por dominio.

- Ejemplos:
  - `useImportSeoChecklistPagesMutation`
  - `useUpdateSeoChecklistPageMutation`
  - `useBulkUpdateSeoChecklistPagesMutation`
  - `useSaveIAVisibilityScheduleMutation`
  - `useToggleIAVisibilityScheduleMutation`

## 3) Política de invalidación

Regla general post-mutation:

1. Actualizar cache local del recurso directamente impactado (`setQueryData`) cuando exista respuesta canónica.
2. Invalidar sólo queries afectadas por alcance mínimo.
3. No invalidar por prefijos globales del módulo salvo casos excepcionales.

Ejemplo `iaVisibility`:

- mutate schedule/config/run ⇒ invalidar `list`, `history`, `config`, `schedule` del mismo `clientId`.

Ejemplo `seoChecklist`:

- mutate import/update/bulk ⇒ invalidar `list` del mismo `clientId`.

> Optimistic update: sólo aplicarlo donde ya exista patrón probado y testeado.

## 4) Errores y retry

Archivo: `src/shared/data-hooks/queryPolicies.ts`.

- `withNormalizedError` envuelve `queryFn/mutationFn` y lanza error normalizado (`normalizeApiError`).
- `buildRetryPolicy(policy)` aplica retry por tipo de endpoint:
  - `realtime_read`: 1 intento
  - `standard_read`: 2 intentos
  - `background_sync`: 3 intentos
  - `mutation`: 0 intentos
- No reintentar en `401/403/404` ni errores de negocio no transitorios.

## 5) Anti-patrones a evitar

- `useQuery` con strings sueltos (`['public-clients']`) en vez de helper central.
- fetch directo en componentes con estado paralelo a React Query.
- invalidación global excesiva (`invalidateQueries` sin alcance por params).
- no normalizar errores entre hooks y pantallas.

## 6) Módulos piloto aplicados

- Piloto: `seoChecklist` y `iaVisibility`.
- Módulo adicional: `gsc`.

Todos los anteriores ya usan:

- keys centralizadas;
- retry policy explícita por endpoint;
- normalización unificada de errores;
- invalidación consistente tras mutación.
