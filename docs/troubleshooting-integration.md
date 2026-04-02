# Troubleshooting integración FE/BE

## Objetivo

Este documento describe cómo correlacionar errores entre frontend (`frontend/m3`) y backend cuando la UI consume APIs como fuente de verdad.

## Identificador de trazabilidad

En errores API, frontend intenta resolver un identificador de trazabilidad en este orden:

1. Header `x-trace-id` / `trace-id`.
2. Campos `traceId` / `trace_id` en payload de error (nivel raíz o anidado en `error`/`details`).
3. Header `x-request-id` / `request-id`.
4. Campos `requestId` / `request_id` en payload de error (nivel raíz o anidado en `error`/`details`).

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

- La lista del piloto usa backend por defecto y permite rollback controlado con `VITE_IA_VISIBILITY_DATA_SOURCE=legacy`.
- Errores de carga de listado y programación muestran ID de trazabilidad cuando existe.
- El ID se presenta en una línea separada y en formato monoespaciado para facilitar copia/pegado en soporte.
- Esto permite soporte L1/L2 con correlación directa sin exponer payloads sensibles en UI.

## Decisiones técnicas

- **Fuente de verdad por flag:** `backend` es el valor por defecto del piloto para producción; `legacy` queda disponible solo como rollback operativo.
- **Trazabilidad resiliente:** se soporta `traceId` y `requestId` desde headers o body para compatibilidad con diferentes middlewares backend.
- **Observabilidad incremental:** logging estructurado agregado en `httpClient` para centralizar telemetría de errores API sin modificar cada pantalla.


## Diagnóstico rápido de 401/403 (Portal)

1. Confirmar `traceId/requestId` en el error de UI o en logs `[api-error]`.
2. Verificar respuesta backend:
   - `401 + AUTH_UNAUTHORIZED`: sesión expirada, token inválido o cookie ausente.
   - `403 + AUTH_FORBIDDEN`: sesión válida pero rol/scope sin permisos.
3. Ejecutar `GET /api/auth/session` en el navegador:
   - `200 authenticated=true`: revisar autorización (rol/scope).
   - `401 authenticated=false`: usuario debe reautenticarse.
4. Validar cookie `portal_auth_token`:
   - `SameSite=Lax` por defecto.
   - `Secure=true` en entornos HTTPS productivos.
5. Revisar redirecciones:
   - `httpClient` redirige a login con `reason=session-expired` en 401 para rutas protegidas.
   - Si la pantalla ya es login, no redirige para evitar loops.

**Nota de seguridad:** evitar loggear passwords/tokens en frontend y backend; usar únicamente `traceId/requestId` para soporte.
