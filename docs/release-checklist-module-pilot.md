# Release checklist - módulo piloto (auth/session)

## Pre-release

- [ ] FE usa backend como fuente de verdad para auth/sesión (sin token legible en producción).
- [ ] `httpClient` con `credentials: include` activo para rutas autenticadas.
- [ ] Manejo uniforme de `401/403` validado en login, dashboard de clientes, overview de proyecto y operador.
- [ ] Logout invalida sesión backend y limpia estado UX frontend.
- [ ] CORS/`SameSite`/`Secure` revisado para entorno objetivo.

## Testing mínimo obligatorio

- [ ] Frontend: login/logout y redirecciones por 401.
- [ ] Frontend: mensaje consistente de sesión expirada.
- [ ] Backend: login por rol + `/api/auth/session` + `/api/auth/logout`.
- [ ] Backend: permisos por rol y `scope` (`403` esperado).

## Rollout

- [ ] Deploy en entorno staging con verificación manual de cookies.
- [ ] Monitorear errores `AUTH_*` y correlación con `traceId/requestId`.
- [ ] Confirmar ausencia de regresiones en módulos no migrados.
