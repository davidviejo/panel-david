# API Contracts Strategy (Pilot: IA Visibility)

## Objetivo

Unificar frontend y backend para que el frontend consuma backend como **fuente de verdad** en producción.

## Contrato estandarizado para auth/session

Los endpoints de auth deben responder errores con shape uniforme:

```json
{
  "code": "AUTH_SESSION_EXPIRED",
  "message": "Invalid or expired session",
  "error": "Invalid or expired session"
}
```

### Códigos esperados

- `AUTH_BAD_REQUEST` → `400` (payload incompleto o inválido).
- `AUTH_INVALID_CREDENTIALS` → `401` (password inválida).
- `AUTH_SESSION_EXPIRED` → `401` (cookie/sesión/token inválido o expirado).
- `AUTH_FORBIDDEN` → `403` (rol insuficiente).
- `AUTH_SCOPE_MISMATCH` → `403` (rol `project` fuera de su `scope`).
- `AUTH_PROJECT_NOT_FOUND` → `404` (slug inexistente).

### Endpoints auth

- `POST /api/auth/clients-area`
- `POST /api/auth/project/:slug`
- `POST /api/auth/operator`
- `GET /api/auth/session`
- `POST /api/auth/logout`

`login/session` exitoso devuelve:

```json
{
  "authenticated": true,
  "role": "clients_area|project|operator",
  "scope": "<slug?>"
}
```

## Reglas de compatibilidad

- FE no depende de token legible para autenticar requests.
- API acepta cookie HttpOnly como mecanismo principal.
- Bearer en header se mantiene como fallback temporal para clientes legacy.
- Frontend normaliza `401/403` con mensajes UX consistentes.
