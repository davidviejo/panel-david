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


## Sección Trends Media — evidencia de migración

- [x] Build FE del módulo Trends Media (`npm run build`)
- [ ] Lint FE del módulo (`npm run lint`) — pendiente por errores preexistentes fuera del alcance de Trends Media
- [x] Tests Trends Media (mapper + servicio) en verde
- [x] Test backend endpoint `/api/trends/media/news` en verde
- [x] Smoke: estado `loading/error/empty` del pipeline mantenido
- [x] Verificada ausencia de fallback silencioso a mocks en producción (flag `VITE_TRENDS_MEDIA_DATA_SOURCE=legacy` + `PROD=true` => error explícito).
