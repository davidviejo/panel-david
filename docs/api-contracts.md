# API Contracts Strategy

## Objetivo

Unificar frontend y backend para que el frontend consuma backend como **fuente de verdad** en producción.

## Contrato estandarizado de auth/session

### Login exitoso

Todos los endpoints de login devuelven:

```json
{
  "authenticated": true,
  "role": "clients_area | project | operator",
  "scope": "<slug-opcional>",
  "session": {
    "strategy": "httpOnlyCookie",
    "expiresInSeconds": 86400
  }
}
```

### Error auth

Formato estándar para errores `401/403`:

```json
{
  "code": "AUTH_*",
  "error": "mensaje",
  "message": "mensaje"
}
```

Códigos actuales:

- `AUTH_REQUIRED` → 401
- `AUTH_SESSION_INVALID` → 401
- `AUTH_FORBIDDEN` → 403
- `AUTH_SCOPE_FORBIDDEN` → 403
- `AUTH_INVALID_CREDENTIALS` → 401
- `AUTH_PASSWORD_REQUIRED` → 400

## Reglas de compatibilidad

1. Agregar campos opcionales = no rompiente.
2. Cambios de tipo/campos obligatorios = versión nueva.
3. Mantener respuestas de error estables para manejo UI uniforme.
