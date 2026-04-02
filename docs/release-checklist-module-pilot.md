# Release Checklist - Module Pilot

## Trends Media

- [x] Frontend consume backend como fuente de verdad (`api/trends/media/news`).
- [x] Sin fallback silencioso a mock en producción (`VITE_TRENDS_MEDIA_NEWS_MODE=backend-only`).
- [x] Mapper backend -> UI implementado y testeado.
- [x] Errores FE muestran trazabilidad (`traceId/requestId`) cuando backend la provee.
- [x] Endpoint backend agrega headers `x-request-id`/`x-trace-id` y payload con `requestId`/`traceId`.

### Evidencia de calidad (build/lint/tests/smoke)

- Build/Lint/Tests: ver salida de comandos ejecutados en la tarea (sección Testing del reporte del agente).
- Smoke manual sugerido:
  1. Abrir `/#/app/trends-media`.
  2. Ejecutar pipeline con queries por defecto.
  3. Verificar estados `loading`, `empty` y `error`.
  4. Confirmar que errores muestren ID de trazabilidad cuando aplique.
