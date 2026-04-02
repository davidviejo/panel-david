# Release Checklist — Módulo Piloto Portal Overview

## Alcance

- Flujo cubierto: `login -> lista de proyectos -> overview`.
- Cambio principal: overview deja payload mock y usa contrato backend versionado (`project_overview v1`).

## Evidencia técnica implementada

- Backend: endpoint `/api/:slug/overview` sirve datos construidos desde fuente backend (`clients_store` + último `report_*.json`) y no payload inline dummy.
- Backend: errores con `code`, `traceId`, `requestId` + headers `X-Trace-Id`/`X-Request-Id`.
- Frontend: `getProjectOverview` tipado, mapper de contrato y estados uniformes loading/error/empty.
- Frontend: mensajes consistentes para 401/403/404/500 vía `shared/api/errorHandling`.
- Observabilidad: log estructurado de fallo en backend y log estructurado de fallo overview en frontend.
- Rollout: feature flag opcional `VITE_FF_PORTAL_OVERVIEW_FALLBACK` para fallback seguro en incidente.

## Smoke checklist

- [x] Login de proyecto válido redirige a overview.
- [x] Overview con token válido y scope correcto retorna 200.
- [x] Token ausente retorna 401 con trazabilidad.
- [x] Scope inválido en rol `project` retorna 403.
- [x] Slug inexistente retorna 404.
- [x] Empty state en frontend cuando no hay incidencias.

## Evidencia de pruebas (comandos)

- `pytest backend/p2/tests/test_portal_overview_endpoint.py`
- `npm --prefix frontend/m3 test -- src/pages/portal/ProjectOverview.test.tsx src/shared/api/mappers/projectOverviewMapper.test.ts`

## Riesgos y mitigación

- **Riesgo**: reportes incompletos para ciertos slugs.
  - **Mitigación**: contrato devuelve `is_empty` + métricas en cero sin romper UI.
- **Riesgo**: incidentes backend puntuales.
  - **Mitigación**: flag `VITE_FF_PORTAL_OVERVIEW_FALLBACK=true` permite fallback controlado sin bloquear navegación.

## Decisiones técnicas

1. Contrato explícito y versionable por fecha + módulo para trazabilidad de cambios.
2. Mapper FE dedicado para blindar componentes de cambios de shape backend.
3. Errores normalizados con trazabilidad extremo a extremo (`traceId/requestId`).
