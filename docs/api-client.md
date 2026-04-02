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
- `Authorization: Bearer <token>` cuando existe token de sesión y `includeAuth` está activo.

## Auth token

El token se lee de `sessionStorage` usando la clave:

- `portal_token`

Si necesitas desactivar auth para una llamada puntual:

```ts
client.get<MyType>('public/endpoint', { includeAuth: false });
```

## Métodos HTTP tipados

El cliente expone:

- `get<T>(path, config?)`
- `post<T>(path, body?, config?)`
- `put<T>(path, body?, config?)`
- `patch<T>(path, body?, config?)`
- `delete<T>(path, config?)`

Ejemplo:

```ts
const httpClient = createHttpClient({ service: 'api' });
const response = await httpClient.put<{ id: string; status: string }>('v1/items/1', { status: 'active' });
```

## Errores normalizados

Todos los errores (HTTP, red, timeout) se normalizan al mismo shape:

```ts
interface NormalizedHttpError {
  code: string;
  message: string;
  status?: number;
  traceId?: string;
  details?: unknown;
}
```

`HttpClientError` implementa ese contrato.

Casos comunes:

- HTTP error (`response.ok === false`):
  - `code`: `payload.code` o fallback `HTTP_<status>`
  - `message`: `payload.error` o `payload.message`
  - `status`: status HTTP
  - `traceId` y `details`: si vienen en payload
- Timeout:
  - `code`: `TIMEOUT_ERROR`
  - `message`: `Request timeout after <ms>ms`
- Network / fetch:
  - `code`: `NETWORK_ERROR`
  - `message`: mensaje original de fetch (si existe)

Consumo recomendado:

```ts
try {
  await httpClient.get<MyType>('v1/resource');
} catch (error) {
  const normalized = error as HttpClientError;
  console.error(normalized.code, normalized.message, normalized.status, normalized.traceId, normalized.details);
}
```

## Ejemplo real (IA Visibility)

En `frontend/m3/src/services/iaVisibilityService.ts` se consume el cliente tipado para operaciones de IA Visibility:

```ts
export const iaVisibilityService = {
  run: (payload: IAVisibilityRequest) =>
    httpClient.post<IAVisibilityResponse>(endpoints.ai.visibilityRun(), payload),

  getHistory: (clientId: string) =>
    httpClient.get<IAVisibilityHistoryResponse>(endpoints.ai.visibilityHistory(clientId)),

  saveConfig: (clientId: string, payload: IAVisibilityRequest) =>
    httpClient.post<IAVisibilityConfigResponse>(endpoints.ai.visibilityConfig(clientId), payload),
};
```

Este patrón permite migraciones incrementales módulo por módulo sin romper funcionalidades existentes.


## Ejemplo real (Trends Media)

```ts
import { fetchTrendsMediaNews } from "../features/trends-media/services/trendsMediaApi";

const articles = await fetchTrendsMediaNews({
  searchQueries: ["economia valencia", "puerto valencia"],
  targetSources: [],
});
```

- El cliente usa `httpClient` unificado y `endpoints.trendsMedia.news()`.
- Errores se normalizan con `normalizeApiError` y se muestran con ID de trazabilidad (`traceId/requestId`) cuando existe.
- El fallback legacy (mock) solo puede usarse en dev/test cuando el flag de Trends Media apunta a `legacy`; en producción lanza error explícito.
