# Release Checklist — Módulo Piloto (IA Visibility + Auth/Session)

Objetivo: asegurar rollout/rollback predecible del piloto FE/BE, con backend como fuente de verdad.

## Checklist previo a release

### 1) Contratos y datos
- [ ] Contratos tipados del módulo vigentes y versionados.
- [ ] Contrato de auth/session estandarizado (`AUTH_*` codes) validado en FE/BE.
- [ ] No existen mocks de sesión/token en path de producción.

### 2) Calidad técnica
- [ ] `build` en verde.
- [ ] `lint` en verde.
- [ ] Suite de tests FE/BE en verde (incluye login/logout/401/403).
- [ ] Smoke test manual completado en entorno objetivo.

### 3) Seguridad y observabilidad
- [ ] `portal_auth_token` con `HttpOnly` + `SameSite` + `Secure` según entorno.
- [ ] CORS permite credenciales solo para orígenes explícitos.
- [ ] Sin datos sensibles en logs.
- [ ] `traceId/requestId` propagado en errores críticos.

### 4) UX y operación
- [ ] Mensajes homogéneos para sesión expirada y permisos.
- [ ] Redirecciones por 401 sin loops.
- [ ] Logout invalida estado FE/BE de forma confiable.
- [ ] Plan de rollback documentado.

## Go/No-Go

### GO
- Consistencia de sesión validada en módulos clave.
- 401/403 manejados de forma uniforme.
- Logout fiable confirmado en smoke.

### NO-GO
- Persisten flujos mixtos token + cookie en FE productivo.
- Errores auth sin `code/message` consistente.
- Loops de redirección o expiración no controlada.
