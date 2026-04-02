# Troubleshooting integración FE/BE

## Objetivo

Este documento describe cómo correlacionar errores entre frontend (`frontend/m3`) y backend cuando la UI consume APIs como fuente de verdad.

## Identificador de trazabilidad

En errores API, frontend intenta resolver un identificador de trazabilidad en este orden:

1. Header `x-trace-id` / `trace-id`.
2. Campo `traceId` en payload de error.
3. Header `x-request-id` / `request-id`.
4. Campo `requestId` en payload de error.

El `HttpClientError` normalizado expone:

- `traceId` (puede venir de trace o request id cuando no existe trace id explícito).
- `requestId` (cuando backend lo provee).

## Logging estructurado en frontend

Ante error HTTP, timeout o red, frontend emite un log estructurado:

- `level`: `error`
- `endpoint`: URL completa invocada
- `status`: código HTTP (si aplica)
- `traceId`: identificador de trazabilidad
- `timestamp`: ISO-8601 UTC
- `code` y `message`: error normalizado

Formato actual: `console.error('[api-error]', payload)`.

## Correlación FE/BE paso a paso

1. En UI, copiar el texto `ID de trazabilidad: <valor>` mostrado en estado de error.
2. Buscar ese valor en logs de backend (`traceId` o `requestId`).
3. Verificar el `endpoint` y `status` del log frontend para confirmar ruta y tipo de falla.
4. Revisar payload backend asociado al mismo identificador para aislar causa raíz.

## Módulo piloto (IA Visibility)

- La lista del piloto ya no usa fallback local para datos de producción/desarrollo.
- Errores de carga de listado y programación muestran ID de trazabilidad cuando existe.
- Esto permite soporte L1/L2 con correlación directa sin exponer payloads sensibles en UI.

## Decisiones técnicas

- **Fuente de verdad única:** se eliminó fallback mock en servicio de IA Visibility para evitar divergencia FE/BE.
- **Trazabilidad resiliente:** se soporta `traceId` y `requestId` desde headers o body para compatibilidad con diferentes middlewares backend.
- **Observabilidad incremental:** logging estructurado agregado en `httpClient` para centralizar telemetría de errores API sin modificar cada pantalla.
