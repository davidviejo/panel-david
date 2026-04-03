# Feature Flags Rollout FE/BE (backend source of truth)

## Objetivo

Permitir activación gradual por módulo y por entorno (dev/staging/prod), con rollback inmediato sin redeploy obligatorio del frontend.

## Convención de flags

Por cada módulo migrado se utiliza:

- `ff_<modulo>_backend_source`

Módulos activos actualmente:

- `ff_seo_checklist_backend_source`
- `ff_ia_visibility_backend_source`
- `ff_portal_overview_backend_source`
- `ff_trends_media_backend_source`

### Alcance soportado

- **Entorno**: vía variables `VITE_*` por entorno (`development`, `staging`, `production`).
- **Tenant (opcional)**: `VITE_FF_BACKEND_SOURCE_TENANT_OVERRIDES` (JSON por módulo/tenant).
- **Canary por porcentaje**: `VITE_FF_<MODULO>_BACKEND_SOURCE_ROLLOUT` (0–100).

Ejemplo de override por tenant:

```json
{
  "ia_visibility": {
    "cliente-a": true,
    "cliente-b": false
  }
}
```

## Punto único de resolución

Toda la decisión backend vs legacy se centraliza en:

- `frontend/m3/src/config/featureFlags.ts` (`resolveBackendSource`)
- `frontend/m3/src/shared/data-hooks/backendSourceResolver.ts` (`resolveModuleDataSource`)

Regla: componentes UI **no** deben implementar condicionales de flags; solo capa de datos (servicios/hooks).

## Estrategia de rollout

### Dev

- `rollout=100` para módulos en desarrollo.
- QA técnico continuo (unit + integración).

### Staging

- `rollout=100` con QA completo y smoke manual ON/OFF por módulo.

### Prod (canary)

1. 5%
2. 25%
3. 50%
4. 100%

Subir únicamente si error rate y latencia permanecen bajo umbral.

## Rollback (runbook operativo)

### Objetivo de rollback

Volver a flujo legacy del módulo afectado en minutos, sin redeploy.

### Pasos

1. Identificar módulo degradado (ej: `ia_visibility`).
2. Reducir rollout a `0` o forzar `legacy`:
   - preferente: `VITE_FF_<MODULO>_BACKEND_SOURCE_ROLLOUT=0`
   - alternativa temporal: `VITE_<MODULO>_DATA_SOURCE=legacy`
3. Confirmar en logs de resolución de fuente (`[data-source-resolution]`) que el módulo quedó en `backendSourceEnabled=false`.
4. Ejecutar smoke funcional mínimo del módulo.
5. Comunicar rollback + abrir ticket/postmortem.

### Tiempos esperados

- Aplicación del cambio en sistema de flags/config runtime: **1–5 min**.
- Verificación funcional y de métricas: **5–15 min**.

## Observabilidad mínima por etapa

### Logs/eventos obligatorios

Cada llamada de resolución de fuente debe incluir:

- `module`
- `tenantId`
- `backendSourceEnabled`
- `rolloutPercentage`
- `source`
- `flagKey`
- `environment`

### Monitoreo

Por cada salto de canary:

- Error rate FE/BE por módulo
- Latencia p50/p95 por endpoint backend del módulo
- Volumen de respuestas con `traceId/requestId`

### Criterio de detener rollout

- incremento sostenido de error rate,
- degradación significativa de p95,
- regresiones funcionales en smoke.
