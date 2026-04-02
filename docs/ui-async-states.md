# UI Async States — patrón unificado FE/BE

## Objetivo

Estandarizar cómo representamos estados asíncronos en frontend cuando backend es la fuente de verdad: `loading`, `error`, `empty`.

## Componentes shared

Ruta: `frontend/m3/src/shared/ui/async-states/`

- `LoadingState`
- `ErrorState`
- `EmptyState`

Todos los componentes incorporan accesibilidad básica (`role`, `aria-live`) y estilos compatibles con tema claro/oscuro.

---

## Guía de uso

### 1) ¿Spinner o Skeleton?

Usar **spinner** (`LoadingState mode="spinner"`) cuando:
- No existe estructura previa en pantalla.
- La espera es corta y de acción puntual (ej. reintento manual).

Usar **skeleton** (`LoadingState mode="skeleton"`) cuando:
- Se está cargando una vista tabular/listado con layout estable.
- Queremos reducir salto visual y mantener contexto de contenido.

### 2) Jerarquía de mensajes de error

Orden de prioridad (de mayor a menor):
1. **Negocio/permiso conocido** (ej. `401`, `403`, `404`, `500` mapeado por `normalizeApiError`).
2. **Red/transporte** (`NETWORK_ERROR`, timeout).
3. **Fallback genérico** cuando no hay señal suficiente.

Regla operativa:
- Siempre mostrar mensaje legible para usuario final.
- Si existe `traceId`/`requestId`, mostrarlo en `ErrorState` para soporte.

### 3) CTA por estado

- `LoadingState`: sin CTA.
- `ErrorState`: CTA principal `Reintentar`, conectado a `refetch`/fetch handler.
- `EmptyState`: CTA contextual (ej. `Actualizar datos`, `Reintentar carga`).

### 4) Mapeo HTTP a `ErrorState` consistente

Se mantiene el mapeo centralizado en `shared/api/errorHandling.ts`:
- `401`: sesión expirada
- `403`: permisos insuficientes
- `404`: recurso no encontrado
- `500`: error interno

En componentes, consumir `getUiApiErrorDisplay` y renderizar:
- `message`
- `traceabilityId` (si existe)
- `onRetry`

---

## Módulos aplicados en esta iteración

1. **Portal Overview (módulo piloto)**
   - `loading/error/empty` migrados a componentes shared.
   - `retry` conectado al fetch del overview.

2. **IA Visibility (migración activa)**
   - `results` usa `LoadingState`, `ErrorState`, `EmptyState`.
   - `retry` conectado a `refetch` de React Query.
   - errores de programación también usan `ErrorState`.

---

## Ejemplo rápido

```tsx
const errorDisplay = getUiApiErrorDisplay(error, 'No fue posible cargar resultados.');

<ErrorState
  title="No pudimos cargar los resultados"
  message={errorDisplay.message}
  traceId={errorDisplay.traceabilityId}
  onRetry={() => refetch()}
/>
```

---

## Checklist de validación por módulo

Antes de cerrar una migración de módulo:

- [ ] `loading`, `error`, `empty` implementados con componentes shared.
- [ ] `retry` dispara refetch real (sin mocks en path productivo).
- [ ] `traceId/requestId` visible cuando backend lo envía.
- [ ] Mensajes legibles en light/dark.
- [ ] Tests de integración: success, loading, error, empty.
