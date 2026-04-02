# Frontend ↔ Backend Inventory de Migración

Objetivo: inventariar el estado actual por módulo para migrar gradualmente a backend como fuente de verdad, minimizando riesgo y manteniendo funcionalidades existentes.

## Tabla de inventario

| Módulo/Pantalla | Fuente actual (mock/local/api) | Endpoint backend esperado | Riesgo de migración (alto/medio/bajo) | Prioridad (P0/P1/P2) |
|---|---|---|---|---|
| Portal clientes/proyectos (`src/pages/portal/*`, `src/services/api.ts`) | API-first en auth/listados/overview. El overview dejó payload dummy y consume contrato tipado `projectOverview` con mapper de UI y errores normalizados. Landing mantiene mezcla incremental local+`/api/public/clients` hasta fase siguiente. | `POST /api/auth/clients-area`, `POST /api/auth/project/:slug`, `POST /api/auth/operator`, `GET /api/clients`, `GET /api/public/clients`, `GET /api/:slug/overview`, `POST /api/tools/run/:tool`. | **Medio-bajo**: seguridad rol/scope intacta; pendiente desacoplar por completo la mezcla local en landing para cerrar migración del módulo Portal. | **P0** |
| IA Visibility (`src/pages/IAVisibility.tsx`, `src/services/iaVisibilityService.ts`) | Mixto: scheduling e historial por API; tabla principal de resultados usa `seedRows` local hardcodeado. | `POST /api/ai/visibility/run`, `GET /api/ai/visibility/history/:clientId`, `POST /api/ai/visibility/config/:clientId`, `GET/POST /api/ai/visibility/schedule/:clientId`, `POST /api/ai/visibility/schedule/:clientId/:action`. | **Alto**: requiere reemplazar datos visuales core (tabla) y alinear modelo de respuesta para evitar regresiones UX. | **P0** |
| SEO Checklist (`src/hooks/useSeoChecklist.ts`) | LocalStorage por cliente (`mediaflow_seo_checklist_<clientId>`), sin sincronización backend para páginas/checklist. | Recomendado introducir: `GET /api/seo/checklist/:clientId`, `PUT /api/seo/checklist/:clientId` (bulk), `PATCH /api/seo/checklist/:clientId/pages/:pageId` (incremental). | **Alto**: mucha lógica de negocio en cliente (normalización, reglas anti-overwrite IA, deduplicación keywords). Migrar sin contrato claro puede romper reglas existentes. | **P0** |
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
- **Alcance controlado:** se puede migrar por fases (1: tabla desde backend, 2: ajuste de filtros, 3: retiro de `seedRows`) sin tocar todo el portal.
- **Riesgo gestionable:** aunque el riesgo funcional es alto, está encapsulado en un módulo y en un servicio dedicado (`iaVisibilityService`), facilitando pruebas y rollback.

Resultado esperado del piloto: eliminar datos hardcodeados en una pantalla crítica y validar el playbook de migración para replicarlo en SEO Checklist y Trends Media.
