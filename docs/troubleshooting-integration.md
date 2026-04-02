# Troubleshooting integración FE/BE

## Objetivo

Diagnosticar errores `401/403` y correlacionarlos con backend usando `traceId/requestId`.

## Identificador de trazabilidad

Frontend resuelve trazabilidad en este orden:

1. Header `x-trace-id` / `trace-id`.
2. `traceId|trace_id` en payload (`root`, `error`, `details`).
3. Header `x-request-id` / `request-id`.
4. `requestId|request_id` en payload (`root`, `error`, `details`).

`HttpClientError` expone `traceId` y `requestId`.

## Diagnóstico rápido de 401/403

### 401 (AUTH_SESSION_EXPIRED)

1. Verifica request en DevTools:
   - ¿la request lleva `credentials: include`?
   - ¿existe cookie `portal_auth_token` vigente?
2. Comprueba endpoint `GET /api/auth/session`.
3. Revisa backend:
   - expiración JWT,
   - sesión Flask,
   - configuración `SameSite/Secure` por entorno,
   - CORS con `supports_credentials=True`.
4. Correlaciona con `traceId/requestId` en logs.

### 403 (AUTH_FORBIDDEN / AUTH_SCOPE_MISMATCH)

1. Verifica rol actual (`clients_area|project|operator`).
2. Para `project`, valida `scope` (slug) contra la ruta solicitada.
3. Correlaciona evento en logs con `traceId/requestId`.

## Logging estructurado FE

Formato: `console.error('[api-error]', payload)`.

Campos clave:

- `endpoint`
- `status`
- `code`
- `traceId`
- `requestId`
- `timestamp`

## Anti-patterns a evitar

- Loggear tokens/cookies o secretos en cliente/servidor.
- Reintentos ciegos sobre `401` (genera loops).
- Redirecciones múltiples sin guardas de ruta login.
