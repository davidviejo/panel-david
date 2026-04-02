# API Client (frontend/m3)

Este documento define el uso del cliente HTTP tipado para unificar consumo de backend como fuente de verdad.

## Auth/Sesión unificada (decisión)

**Estrategia elegida: Opción A (cookie HttpOnly + sesión backend).**

- El frontend **no depende de tokens legibles** en `sessionStorage` para autenticar requests.
- El backend emite `portal_auth_token` como cookie `HttpOnly` y mantiene estado de sesión en Flask.
- `httpClient` usa `credentials: 'include'` por defecto para enviar cookie en cada request autenticada.

### Tradeoffs

- ✅ Menor superficie de exposición XSS (no hay bearer token accesible por JS).
- ✅ Política única FE/BE para login/expiración/logout.
- ⚠️ Requiere CORS con `supports_credentials=true` y orígenes explícitos.
- ⚠️ Si el frontend y backend están en distintos dominios, hay que validar `SameSite`/`Secure` por entorno.

## Configuración base (baseURL / headers / timeout)

El cliente se crea con `createHttpClient(config)` en `frontend/m3/src/services/httpClient.ts`.

- `service`: `'api' | 'engine'`
- `baseURL` (opcional)
- `timeoutMs` (opcional)
- `includeAuth` (opcional, `true` por defecto)

Headers automáticos:

- `Content-Type: application/json` cuando aplica.
- Para auth se usa cookie HttpOnly (no header `Authorization` inyectado por defecto).

## Flujo estándar de autenticación

- `POST /api/auth/clients-area`
- `POST /api/auth/project/:slug`
- `POST /api/auth/operator`
- `GET /api/auth/session` (estado de sesión actual)
- `POST /api/auth/logout` (invalidación FE/BE)

En `api.ts`, el `registerAuthErrorHandler` redirige de forma uniforme ante `401` usando `redirectToLoginForExpiredSession()`.

## Errores normalizados

`HttpClientError` conserva contrato único: `code`, `message`, `status`, `traceId`, `requestId`, `details`.

- `401`: sesión inválida/expirada → redirección uniforme y mensaje UX consistente.
- `403`: falta de permisos/alcance (scope) → mensaje de permisos.

Este patrón permite migraciones incrementales por módulo sin romper funcionalidades existentes.
