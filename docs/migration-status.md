# Migration Status FE/BE por módulo

Objetivo: tener visibilidad operativa y criterio objetivo de salida a producción para la migración incremental frontend/backend, evitando uso de mocks o datos locales en producción.

## 1) Tablero de estado

| Módulo | Estado | Fuente actual (mock/local/api) | Feature flag | Cobertura de tests | Riesgo | Owner |
|---|---|---|---|---|---|---|
| Portal clientes/proyectos | En progreso | api + local (mezcla en landing) | `portalBackendSource` (propuesto) | Media (smoke + integración parcial) | Medio | FE Platform + BE Core |
| IA Visibility | En validación | api + mock local (`seedRows`) | `iaVisibilityBackendResults` | Media-Alta (servicio/mappers + smoke UI) | Alto | Growth FE + Data/AI BE |
| SEO Checklist | En progreso | api + fallback local | `seoChecklistBackendSource` | Alta (hooks/mappers/mutaciones) | Alto | SEO FE + Content API |
| Dashboard + GSC | No iniciado | api externa directa + localStorage | `gscBffSource` (propuesto) | Media (hook/servicio, falta e2e con BFF) | Medio | Analytics FE + Integrations BE |
| Trends Media | En progreso | api proveedor + mock fallback | `trendsMediaBackendSource` (propuesto) | Baja-Media (servicio con fallback, falta contrato e2e) | Alto | Trends FE + Data Connectors BE |

> Convención de estado:
> - **No iniciado**: sin integración con backend objetivo.
> - **En progreso**: implementación parcial detrás de flag.
> - **En validación**: integración lista y en smoke/QA.
> - **En producción**: backend como fuente de verdad y rollback controlado.

## 2) Definition of Done (DoD) por módulo

Un módulo se considera **listo para producción** cuando cumple todos los criterios:

1. **Sin mocks en producción**: el path productivo no depende de fixtures ni seeds locales.
2. **Errores unificados**: taxonomía de errores FE/BE alineada (códigos + mensajes + acción sugerida).
3. **Estados asíncronos unificados**: `loading/error/empty` implementados con patrón shared y CTA de retry.
4. **Trazabilidad completa**: toda request relevante incluye y propaga `traceId`/`requestId`.
5. **Calidad técnica verde**: `build`, `lint` y `tests` del módulo en estado OK.
6. **Smoke validado**: happy path + fallo controlado verificados en entorno de release.

## 3) Readiness score (0–100)

### Fórmula

**Readiness = C + I + O + Q**, donde:

- **C: Contratos tipados** (0–25)
- **I: Integración backend real** (0–25)
- **O: Errores y observabilidad** (0–25)
- **Q: QA y release checklist** (0–25)

### Score inicial por módulo

| Módulo | C (25) | I (25) | O (25) | Q (25) | Score total |
|---|---:|---:|---:|---:|---:|
| Portal clientes/proyectos | 16 | 14 | 12 | 11 | **53/100** |
| IA Visibility | 20 | 18 | 14 | 15 | **67/100** |
| SEO Checklist | 22 | 19 | 16 | 16 | **73/100** |
| Dashboard + GSC | 10 | 8 | 9 | 8 | **35/100** |
| Trends Media | 12 | 11 | 10 | 9 | **42/100** |

### Interpretación operativa

- **0–49**: no apto para rollout productivo.
- **50–74**: rollout limitado por flag (canary/controlado).
- **75–100**: candidato a producción general (go-live).

## 4) Cadencia de revisión y decisiones de rollout

- **Weekly review** (30 min, FE+BE+QA+Producto):
  - revisar cambio de estado por módulo,
  - actualizar score y bloqueos,
  - registrar incidentes/regresiones de la semana.
- **Decisión de rollout por feature flag**:
  - subir exposición de tráfico por etapas (ej. 5% → 25% → 50% → 100%),
  - validar métricas de error y UX por etapa,
  - ejecutar rollback inmediato si se cruza umbral de riesgo definido.

## 5) Riesgos abiertos y mitigaciones por módulo

### Portal clientes/proyectos
- **Riesgo abierto**: divergencia por mezcla de datos locales y remotos en landing.
- **Mitigación**: consolidar en un único selector de fuente (backend-first) detrás de `portalBackendSource`; bloquear merge de datos locales en modo productivo.

### IA Visibility
- **Riesgo abierto**: inconsistencia entre tabla (seed local) e historial/schedule (backend).
- **Mitigación**: migrar tabla principal a contrato backend tipado, mantener fallback solo en no-prod y cortar `seedRows` en release.

### SEO Checklist
- **Riesgo abierto**: regresiones en reglas de negocio al retirar fallback local.
- **Mitigación**: reforzar tests de normalización y mutaciones + rollout gradual con `seoChecklistBackendSource`.

### Dashboard + GSC
- **Riesgo abierto**: dependencia de OAuth/API externa desde frontend (CORS/cupos/tokens).
- **Mitigación**: mover a BFF backend para manejo server-side de credenciales y cuotas, con contrato estable para frontend.

### Trends Media
- **Riesgo abierto**: fallback silencioso a mock puede ocultar fallas reales de proveedor.
- **Mitigación**: endpoint backend único con observabilidad obligatoria y política explícita de fallo (sin mock en prod).
