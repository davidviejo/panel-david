# Legacy Cleanup — IA Visibility

Fecha: **2026-04-03**

## Contexto

El módulo IA Visibility cumplió criterio de entrada para limpieza:

- flag en 100% en producción durante el periodo acordado,
- sin incidentes críticos abiertos del módulo,
- smoke y regresión de flujos críticos validados en la operación semanal.

## Removed legacy paths

Se eliminaron los paths legacy y de rollback basados en frontend local para IA Visibility:

1. **Datasource legacy eliminado del servicio productivo**
   - `iaVisibilityService` ahora consume exclusivamente backend para list/run/history/config/schedule.
2. **Eliminación de implementación legacy completa**
   - se borró `src/services/iaVisibilityLegacySource.ts`.
3. **Retiro de flag de datasource del módulo**
   - IA Visibility deja de usar `ff_ia_visibility_backend_source` y `VITE_IA_VISIBILITY_DATA_SOURCE` como mecanismo de rollback.
4. **Tests alineados al estado final**
   - tests de servicio actualizados para validar llamadas a endpoints backend como única ruta.
   - tests de `featureFlags` mantienen cobertura del sistema de flags usando otro módulo activo.

## Verificación de integridad

- búsqueda de referencias legacy del módulo ejecutada y limpia en código frontend,
- suite del servicio y flags ejecutada en verde,
- build frontend validado en verde para confirmar que no quedan importaciones huérfanas.

## Risk assessment

### Riesgos residuales

- Dependencia total de disponibilidad backend para IA Visibility.
- Posibles diferencias de datos si algún cliente tenía estado local legacy no sincronizado.

### Mitigaciones aplicadas

- Mantener observabilidad de errores y `traceId` desde `httpClient`.
- Mantener smoke de flujo crítico (listado, historial, schedule).
- Monitoreo post-release con ventana de observación operativa.

## Rollback status

- **No aplica rollback vía flag para IA Visibility**.
- En caso de incidente, rollback operativo se ejecuta vía reversión de release (git/deploy), no vía data source toggle.

## Inventario final del módulo

- Fuente de verdad en producción: **Backend only**.
- Estado de migración: **Completado y limpiado**.
- Deuda legacy del módulo: **0 paths activos**.
