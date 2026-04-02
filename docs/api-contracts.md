# API Contracts Strategy (Pilot: IA Visibility)

## Objetivo

Unificar frontend y backend para que el frontend consuma el backend como **fuente de verdad** en producción, reduciendo dependencias de mocks y tipos dispersos.

## Fuente de verdad de tipos

- Los contratos del piloto viven en `frontend/m3/src/shared/api/contracts/iaVisibility.ts`.
- `src/services/iaVisibilityService.ts` consume estos contratos y expone aliases tipados para mantener compatibilidad incremental con módulos existentes.
- `src/pages/IAVisibility.tsx` consume un view model mapeado desde contrato backend en lugar de depender del shape raw del endpoint.

## Campos obligatorios y opcionales

### IAVisibilityRunRequestContract

- **Obligatorios**: `clientId`, `brand`, `competitors`, `promptTemplate`, `sources`, `providerPriority`.
- **Racional**: son necesarios para ejecutar el análisis sin valores implícitos.

### IAVisibilityRunResponseContract

- **Obligatorios**: `clientId`, `mentions`, `shareOfVoice`, `sentiment`, `competitorAppearances`, `rawEvidence`.
- **Opcionales**: `version`, `runTrigger`, `providerUsed`.
- **Racional**: metadata de ejecución puede no venir en respuestas históricas antiguas o en proveedores que no la reporten.

### IAVisibilityScheduleContract

- **Obligatorios**: `frequency`, `timezone`, `runHour`, `runMinute`, `status`.
- **Opcionales**: `lastRunAt`, `updatedAt`.
- **Racional**: timestamps pueden faltar cuando no hubo ejecuciones previas.

## Reglas de versionado de contratos

1. **Cambios no rompientes**: agregar campos opcionales en contrato existente.
2. **Cambios rompientes**: crear nueva versión de contrato y endpoint (`v2`) cuando:
   - se elimina un campo,
   - cambia el tipo de un campo existente,
   - o cambia semántica de un campo obligatorio.
3. **Mappers primero**: mantener mappers backend -> UI para absorber cambios y proteger componentes de render.
4. **Migración incremental por módulo**: cada módulo migra a `src/shared/api/contracts` sin bloquear despliegues de otros módulos.

## Regla anti-`any` en capa API del piloto

- En el piloto IA Visibility, la capa API (contratos, servicio y mapper) no usa `any`.
- Para payloads dinámicos se usa `unknown` tipado (`Array<Record<string, unknown>>`) y se transforma en mappers antes de renderizar.

## SEO Checklist (P0/P1 transición frontend-backend)

Fuente de contratos en frontend:
- `frontend/m3/src/shared/api/contracts/seoChecklist.ts`
- Mappers/normalización: `frontend/m3/src/shared/api/mappers/seoChecklistMapper.ts`

### Endpoints

1. `GET /api/seo/checklist/:clientId`
   - Response:
     - `clientId: string`
     - `pages: SeoPage[]`
     - `updatedAt?: string`

2. `POST /api/seo/checklist/:clientId/import`
   - Request:
     - `clientId: string`
     - `pages: SeoPage[]` (snapshot normalizado del import/create)
   - Response:
     - `clientId: string`
     - `pages: SeoPage[]`
     - `updatedAt?: string`

3. `PATCH /api/seo/checklist/:clientId/pages/:pageId`
   - Request:
     - `clientId: string`
     - `pageId: string`
     - `changes: Partial<SeoPage>`
   - Response:
     - `clientId: string`
     - `pages: SeoPage[]`
     - `updatedAt?: string`

4. `PATCH /api/seo/checklist/:clientId/bulk`
   - Request:
     - `clientId: string`
     - `updates: Array<{ id: string; changes: Partial<SeoPage> }>`
   - Response:
     - `clientId: string`
     - `pages: SeoPage[]`
     - `updatedAt?: string`

### Reglas de compatibilidad

- El frontend aplica normalización defensiva de checklist (`normalizeChecklistStatus`) para tolerar estados legacy.
- Mutaciones `update` y `bulkUpdate` invalidan query key del módulo para asegurar refetch post-escritura.
- Durante transición, feature flag `seoChecklistBackendSource` controla fallback local para rollback rápido.


## Trends Media (migración FE/BE)

Fuente de contratos en frontend:
- `frontend/m3/src/shared/api/contracts/trendsMedia.ts`
- Mapper backend -> UI: `frontend/m3/src/features/trends-media/services/trendsMediaMapper.ts`

### Endpoint

`POST /api/trends/media/news`

Request:
- `queries: string[]` (obligatorio)
- `provider?: "serpapi" | "dataforseo"`
- `maxResults?: number`
- `language?: string`
- `country?: string`
- `timePeriod?: "h" | "d" | "w" | "m"`

Response:
- `items: TrendsMediaNewsItemContract[]`
- `provider: "serpapi" | "dataforseo"`
- `traceId?: string`
- `requestId?: string`

Regla de producción: en módulo Trends Media no se permite fallback silencioso a mocks cuando `trendsMediaBackendSource` está activo.
