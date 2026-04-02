# API Client (frontend/m3)

Este documento define el uso del cliente HTTP tipado para unificar consumo de backend como fuente de verdad.

## Configuración base (baseURL / headers / timeout)

El cliente se crea con `createHttpClient(config)` en `frontend/m3/src/services/httpClient.ts`.

- `service`: `'api' | 'engine'`
  - `'api'` usa `resolveApiUrl()`.
  - `'engine'` usa `resolveEngineUrl()`.
- `baseURL` (opcional): sobreescribe la URL base resuelta.
- `timeoutMs` (opcional): timeout por defecto para todas las requests del cliente.
  - default API: `12000ms`
  - default Engine: `90000ms`
- `includeAuth` (opcional): `true` por defecto.

Headers automáticos:

- `Content-Type: application/json` cuando hay `body` serializable y no es `FormData`.
- `credentials: 'include'` en todas las requests para enviar cookie de sesión HttpOnly.

## Auth / Session (política unificada)

### Decisión adoptada

Se adopta **Opción A (recomendada)**: cookie HttpOnly (`portal_auth_token`) + sesión Flask como fuente principal de autenticación.

- El frontend **no guarda ni lee tokens JWT** para autenticar requests.
- El backend mantiene validación de cookie/sesión y conserva bearer header como compatibilidad legacy.
- Login responde `authenticated`, `role`, `scope` (sin token legible), y setea cookie segura.
- Logout (`POST /api/auth/logout`) limpia estado en backend (cookie + sesión).

### Trade-offs

**Ventajas**
- Menor exposición de credenciales (sin token en `sessionStorage/localStorage`).
- Expiración y revocación centralizadas en backend.
- Comportamiento consistente entre frontend y backend.

**Costes / consideraciones**
- Requiere `credentials: include` y CORS con `supports_credentials=True`.
- CSRF debe evaluarse endpoint por endpoint cuando haya mutaciones sensibles cross-site.
- Integraciones no navegador pueden seguir usando bearer como fallback temporal.

### Flujos estandarizados

1. Login (`clients-area`, `project/:slug`, `operator`): backend setea cookie + sesión.
2. Expiración (`401`): `httpClient` aplica redirección uniforme por tipo de ruta y mensaje estándar de sesión expirada.
3. Logout: frontend llama `POST /api/auth/logout`; backend invalida cookie/sesión.

## Métodos HTTP tipados

El cliente expone:

- `get<T>(path, config?)`
- `post<T>(path, body?, config?)`
- `put<T>(path, body?, config?)`
- `patch<T>(path, body?, config?)`
- `delete<T>(path, config?)`

## Errores normalizados

Todos los errores (HTTP, red, timeout) se normalizan al mismo shape:

```ts
interface NormalizedHttpError {
  code: string;
  message: string;
  status?: number;
  traceId?: string;
  requestId?: string;
  details?: unknown;
}
```

`HttpClientError` implementa ese contrato.

Casos comunes:

- HTTP error (`response.ok === false`): `HTTP_<status>` o `payload.code`.
- Timeout: `TIMEOUT_ERROR`.
- Network / fetch: `NETWORK_ERROR`.

## Integración incremental por módulo

Este patrón permite migraciones incrementales módulo por módulo sin romper funcionalidades existentes.
