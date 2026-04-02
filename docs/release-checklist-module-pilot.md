# Release Checklist — Módulo Piloto (IA Visibility)

Objetivo: asegurar un rollout/rollback predecible del piloto de migración FE/BE, con backend como fuente de verdad y sin improvisación operativa.

## Checklist previo a release

### 1) Contratos y datos
- [ ] Contratos tipados del módulo vigentes y versionados.
- [ ] Mapper FE ↔ BE validado con casos nominales y edge cases.
- [ ] No existen mocks/seed locales en path de producción.

### 2) Calidad técnica
- [ ] `build` en verde.
- [ ] `lint` en verde.
- [ ] Suite de tests del módulo en verde (unit/integration).
- [ ] Smoke test manual/automático completado en entorno objetivo.

### 3) Errores y observabilidad
- [ ] Errores FE y BE unificados (código, mensaje y acción).
- [ ] `traceId/requestId` propagado en llamadas críticas.
- [ ] Dashboard/alertas con umbrales definidos (error rate, latencia, timeouts).

### 4) Operación de rollout
- [ ] Feature flag activo y verificable por entorno.
- [ ] Plan de exposición gradual documentado (canary por porcentaje).
- [ ] Criterios de rollback definidos y ensayados.
- [ ] Owner de guardia identificado para ventana de release.


### 5) Estados asíncronos unificados (UI)
- [ ] Pantalla usa componentes shared `LoadingState`, `ErrorState`, `EmptyState`.
- [ ] Estado `error` expone CTA `Reintentar` funcional (refetch real).
- [ ] Estado `empty` incluye copy + CTA coherentes con el módulo.
- [ ] Roles ARIA (`status`/`alert`) verificados para feedback accesible.

## Go/No-Go

La decisión se toma en la revisión semanal y antes de cada subida de porcentaje del flag.

### Criterios de **GO**
- Readiness score del módulo **≥ 75/100**.
- Todos los checks críticos en verde (contratos, integración real, observabilidad, QA/release).
- Sin incidentes P1/P0 abiertos vinculados al módulo.
- Rollback probado en entorno de staging/preproducción.

### Criterios de **NO-GO**
- Readiness score **< 75/100**.
- Persistencia de mocks/fallback local en path productivo.
- Falla en trazabilidad (`traceId/requestId`) o en alertado mínimo.
- Smoke fallido o regresión funcional en flujo principal.

### Plan de ejecución (por flag)
1. Activar módulo en **5%** de tráfico elegible.
2. Monitorear 30–60 min métricas y feedback de soporte.
3. Escalar a **25% → 50% → 100%** solo si se mantienen umbrales.
4. Ante degradación, ejecutar rollback inmediato a 0% y abrir postmortem.

## Evidencia mínima requerida para cierre
- Enlace a resultados de build/lint/tests.
- Evidencia de smoke pass.
- Snapshot de métricas de observabilidad durante canary.
- Registro de decisión GO/NO-GO con fecha, owner y riesgos residuales.

## Evidencia módulo Portal Overview (2026-04-02)

- Backend tests endpoint overview: 200/401/403/404 (`backend/p2/tests/test_portal_overview_endpoint.py`).
- Frontend tests overview:
  - render éxito/loading/error/empty + retry (`frontend/m3/src/pages/portal/ProjectOverview.test.tsx`)
  - validación/mapper contrato (`frontend/m3/src/shared/api/mappers/projectOverviewMapper.test.ts`)
- Smoke funcional ejecutado en flujo piloto:
  1. login de proyecto válido,
  2. navegación a `/c/:slug/overview`,
  3. render de métricas desde backend,
  4. validación de mensajes consistentes para 401/403/404/500 vía `normalizeApiError`.


## Actualización auth/session unificada (2026-04-02)

- Estrategia aprobada: **cookie HttpOnly + sesión Flask** (sin dependencia de `portal_token` en frontend).
- `httpClient` usa `credentials: include` y redirección uniforme ante `401` sin loop de login.
- Endpoints nuevos: `GET /api/auth/session` y `POST /api/auth/logout`.
- Validado logout confiable FE/BE (limpieza cookie + sesión + navegación a login).
- Cobertura de tests agregada:
  - frontend `httpClient`: credenciales por cookie y redirect 401.
  - backend auth/session: login, sesión válida/inválida y logout.

## Evidencia módulo Trends Media (2026-04-02)

- Migración completada a backend como fuente de verdad para noticias (`POST /trends/media/news` + alias `/api/v1/trends/media/news`).
- Frontend dejó de consumir SerpApi directo y usa `httpClient` unificado (`frontend/m3/src/features/trends-media/services/serp.ts`).
- Rollback controlado por flag temporal:
  - `VITE_TRENDS_MEDIA_DATA_SOURCE=backend` (default)
  - `VITE_TRENDS_MEDIA_DATA_SOURCE=legacy` (solo dev/test; en producción falla explícitamente para evitar fallback silencioso).
- Evidencia de checks ejecutados:
  - build/lint/tests frontend del módulo (`trendsMediaMapper`, `serp service`).
  - tests backend endpoint (`test_trends_media_news_endpoint.py`).
  - smoke mínimo: flujo Trends con estados loading/error/empty y trazabilidad visible en errores.
