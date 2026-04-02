# API Contracts Strategy (Pilot: IA Visibility + Portal Overview)

## Objetivo

Unificar frontend y backend para que el frontend consuma el backend como **fuente de verdad** en producción, reduciendo dependencias de mocks y tipos dispersos.

## Fuente de verdad de tipos

- IA Visibility mantiene sus contratos en `frontend/m3/src/shared/api/contracts/iaVisibility.ts`.
- Portal Overview ahora define contrato tipado en `frontend/m3/src/shared/api/contracts/projectOverview.ts`.
- `src/services/api.ts` tipa `getProjectOverview` contra ese contrato y `ProjectOverview.tsx` consume un view model mapeado por `projectOverviewMapper`.

## Contrato Portal Overview (`GET /api/:slug/overview`)

### Versión

- Campo obligatorio: `contract_version` (ejemplo actual: `2026-04-portal-overview-v1`).
- Regla: cambios rompientes requieren nueva versión de contrato/endpoint.

### Response (v1)

```json
{
  "contract_version": "2026-04-portal-overview-v1",
  "generated_at": "2026-04-02T12:00:00+00:00",
  "project": {
    "slug": "demo-project",
    "name": "Demo Project",
    "status": "active"
  },
  "metrics": {
    "organic_traffic_estimate": {
      "value": 12500,
      "formatted": "12.5K",
      "unit": "monthly_visits"
    },
    "keywords_top3": { "value": 9 },
    "health_score": { "value": 88, "scale_max": 100 },
    "recent_issues": [
      { "issue": "Missing H1", "count": 2 }
    ],
    "source": "crawler_report",
    "is_empty": false
  }
}
```

### Reglas de errores estandarizados

- 401 -> `AUTH_HEADER_MISSING` / `AUTH_TOKEN_INVALID`.
- 403 -> `AUTH_FORBIDDEN` / `PROJECT_SCOPE_FORBIDDEN`.
- 404 -> `PROJECT_NOT_FOUND`.
- 500 -> `PROJECT_OVERVIEW_FETCH_FAILED`.
- Todos incluyen `traceId` y `requestId` en payload y headers (`X-Trace-Id`, `X-Request-Id`).

## Campos obligatorios y opcionales (IA Visibility)

### IAVisibilityRunRequestContract

- **Obligatorios**: `clientId`, `brand`, `competitors`, `promptTemplate`, `sources`, `providerPriority`.

### IAVisibilityRunResponseContract

- **Obligatorios**: `clientId`, `mentions`, `shareOfVoice`, `sentiment`, `competitorAppearances`, `rawEvidence`.
- **Opcionales**: `version`, `runTrigger`, `providerUsed`.

### IAVisibilityScheduleContract

- **Obligatorios**: `frequency`, `timezone`, `runHour`, `runMinute`, `status`.
- **Opcionales**: `lastRunAt`, `updatedAt`.

## Reglas de versionado de contratos

1. **Cambios no rompientes**: agregar campos opcionales.
2. **Cambios rompientes**: crear versión nueva (`v2`) si se elimina/cambia tipo/cambia semántica obligatoria.
3. **Mappers primero**: backend -> UI para blindar componentes.
4. **Migración incremental por módulo**: desacoplada por dominio.

## Regla anti-`any` en capa API

- Capa API/mapper de IA Visibility y Portal Overview sin `any`.
- Para payloads dinámicos se usa `unknown` + transformación explícita en mappers.
