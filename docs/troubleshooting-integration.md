# Troubleshooting integración FE/BE

## Diagnóstico rápido 401/403 con traceId/requestId

1. Identificar endpoint y status en consola frontend (`[api-error]`).
2. Copiar `traceId` o `requestId` si existe.
3. Buscar ese identificador en logs backend para correlación exacta.
4. Validar causa:
   - `401 AUTH_SESSION_INVALID`: cookie expirada/ausente o token inválido.
   - `401 AUTH_REQUIRED`: request protegida sin sesión.
   - `403 AUTH_FORBIDDEN`: rol insuficiente.
   - `403 AUTH_SCOPE_FORBIDDEN`: rol `project` fuera de su `scope`.

## Checklist técnico auth (cookie strategy)

- CORS con `supports_credentials=true`.
- Orígenes explícitos permitidos para frontend.
- Cookie `portal_auth_token` con:
  - `HttpOnly=true`
  - `SameSite=Lax` (o política explícita por entorno)
  - `Secure=true` en producción HTTPS.

## Señales típicas y solución

- **Loop de redirección a login:** revisar guardia de redirección en frontend y endpoint `/api/auth/session`.
- **401 después de login exitoso:** confirmar que el navegador recibió cookie y que se envía con `credentials: include`.
- **403 inesperado en proyecto:** validar `role=project` y `scope` contra slug solicitado.

## Observabilidad y seguridad

- No loggear passwords ni secretos.
- Usar `traceId/requestId` para soporte L1/L2 sin exponer payload sensible.
