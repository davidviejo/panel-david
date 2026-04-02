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

## Pilot adicional: Trends Media (news ingestion)

### Contratos

- Frontend contract source: `frontend/m3/src/shared/api/contracts/trendsMedia.ts`.
- Request: `TrendsMediaNewsRequestContract`.
- Response: `TrendsMediaNewsResponseContract`.
- Mapper backend -> UI: `frontend/m3/src/shared/api/mappers/trendsMediaMapper.ts`.

### TrendsMediaNewsRequestContract

- **Obligatorios**: `queries`.
- **Opcionales**: `geo`, `language`, `limitPerQuery`, `provider`.

### TrendsMediaNewsResponseContract

- **Obligatorios**: `items`.
- **Opcionales**: `meta`, `traceId`, `requestId`.

### Reglas específicas del módulo

1. En producción (`VITE_TRENDS_MEDIA_NEWS_MODE=backend-only`), el frontend no debe usar mocks silenciosos.
2. El fallback de mocks solo se permite en dev/test controlado por flags (`VITE_TRENDS_MEDIA_NEWS_MODE=allow-mock` o `VITE_FF_TRENDS_MEDIA_ALLOW_MOCKS`).
3. Los errores deben preservar trazabilidad (`traceId/requestId`) para soporte cruzado FE/BE.
