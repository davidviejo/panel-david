# Frontend ↔ Backend Inventory de Migración

Objetivo: inventariar el estado actual por módulo para migrar gradualmente a backend como fuente de verdad, minimizando riesgo y manteniendo funcionalidades existentes.

## Tabla de inventario

| Módulo/Pantalla | Fuente actual (mock/local/api) | Endpoint backend esperado | Riesgo de migración (alto/medio/bajo) | Prioridad (P0/P1/P2) |
|---|---|---|---|---|
| Portal clientes/proyectos (`src/pages/portal/*`, `src/services/api.ts`) | API-first en auth/listados/overview. Overview usa contrato tipado + mapper (`project-overview.v1`) y sin payload dummy en backend. | `POST /api/auth/clients-area`, `POST /api/auth/project/:slug`, `POST /api/auth/operator`, `GET /api/clients`, `GET /api/public/clients`, `GET /api/:slug/overview`, `POST /api/tools/run/:tool`. | **Medio→Bajo**: se elimina mock de overview; se mantiene riesgo acotado por landing con mezcla local+remoto. | **P0 (completado para overview)** |
| IA Visibility (`src/pages/IAVisibility.tsx`, `src/services/iaVisibilityService.ts`) | Backend-only: listado/resultados, historial, configuración y scheduling consumen API; sin fallback legacy en producción. | `POST /api/ai/visibility/run`, `GET /api/ai/visibility/history/:clientId`, `POST /api/ai/visibility/config/:clientId`, `GET/POST /api/ai/visibility/schedule/:clientId`, `POST /api/ai/visibility/schedule/:clientId/:action`. | **Medio**: riesgo residual operativo acotado a disponibilidad backend, sin divergencia por datos locales. | **P0 (completado + cleanup)** |
| SEO Checklist (`src/hooks/useSeoChecklist.ts`) | Transición a backend vía React Query + flag de fallback local (`seoChecklistBackendSource`). | `GET /api/seo/checklist/:clientId`, `POST /api/seo/checklist/:clientId/import`, `PATCH /api/seo/checklist/:clientId/pages/:pageId`, `PATCH /api/seo/checklist/:clientId/bulk`. | **Alto**: mantiene reglas de negocio (normalización, anti-overwrite IA, deduplicación) con invalidación/refetch tras mutaciones. | **P0/P1** |
| Dashboard + GSC (`src/hooks/useGSCData.ts`, `src/services/googleSearchConsole.ts`) | API externa directa desde frontend (Google Webmasters + OAuth userinfo) + persistencia local de sitio seleccionado (`localStorage`). | Recomendado BFF backend: `GET /api/gsc/sites`, `POST /api/gsc/search-analytics`, `POST /api/gsc/query-page`, con token/cuenta gestionados server-side. | **Medio**: riesgo técnico por auth OAuth/CORS/cupos, pero acotado porque flujo ya está encapsulado en servicio/hook. | **P1** |
| Trends Media (`src/features/trends-media/services/serp.ts`) | Mixto con fuerte dependencia mock: usa proveedor SerpApi directo en frontend; si proveedor ≠ `serpapi`, falta API key o falla red, retorna `MOCK_GOOGLE_NEWS_RESPONSE`. | Recomendado backend único: `POST /api/trends-media/serp/search` (query batch + proveedor configurable), evitando exposición de API keys en cliente. | **Alto**: actualmente hay fallback masivo a mock, por lo que la “fuente de verdad” puede no ser real en producción. | **P0** |

## Notas de migración incremental

1. Mantener el patrón de “strangler fig”: introducir endpoint backend por módulo, consumirlo detrás de una capa de servicio y retirar fallback local solo tras validación funcional.
2. Preservar reglas de negocio existentes en frontend durante la transición (especialmente SEO Checklist) hasta que estén replicadas/testeadas en backend.
3. Añadir telemetría y flags por módulo para rollback rápido sin degradar la UX.

## Propuesta de módulo piloto

**Piloto propuesto: IA Visibility (tabla de resultados + historial/scheduling).**

**Justificación de riesgo/impacto:**
- **Impacto alto y visible:** ya existe base de endpoints IA en producción y la pantalla tiene flujos activos (historial/schedule), por lo que el valor de unificar fuente es inmediato.
- **Alcance controlado:** cleanup completado; se retiró el path legacy y el módulo quedó backend-only.
- **Riesgo gestionable:** aunque el riesgo funcional es alto, está encapsulado en un módulo y en un servicio dedicado (`iaVisibilityService`), facilitando pruebas y rollback.

Resultado esperado del piloto: eliminar datos hardcodeados en una pantalla crítica y validar el playbook de migración para replicarlo en SEO Checklist y Trends Media.


## Estado final IA Visibility (2026-04-03)

- Fuente de verdad: backend.
- Flag de datasource del módulo: retirado.
- Referencia de limpieza: `docs/legacy-cleanup-ia-visibility.md`.
