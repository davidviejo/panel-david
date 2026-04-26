# Resumen Integral de Mejoras del Ecosistema

Este documento consolida las mejoras técnicas, estratégicas y arquitectónicas necesarias en todo el ecosistema del proyecto, abarcando tanto el backend (`backend/p2`) como el frontend (`frontend/m3`).

## 1. Arquitectura Global y Estructura

### Backend (Python/Flask)
- **Reorganización del Directorio `apps/`:** Mover la estructura plana actual (más de 60 archivos) hacia sub-paquetes semánticos (`apps/web`, `apps/services`, `apps/core`, `apps/models`, `apps/utils`).
- **Eliminación de "Side Effects":** Remover inicializaciones globales (ej. `init_db()` o hilos de monitoreo en importación) para facilitar el testing. Implementar estrictamente el patrón "Application Factory" de Flask (`create_app()`).
- **Inyección de Dependencias:** Modificar servicios para recibir sus dependencias explícitamente, permitiendo tests aislados y mockeo de recursos.
- **Centralización de Datos:** Definir un directorio `data/` configurado por entorno para todas las bases de datos SQLite y reportes locales.

### Frontend (React/Vite)
- **Transición a SaaS Multi-Tenant:** Migrar la lógica de negocio acoplada en el frontend (e.g. `constants.tsx`) hacia un backend robusto.
- **Implementación del Patrón Strategy/Factory:** Para encapsular las diferentes reglas de negocio según la vertical del proyecto (Media, Local, Ecommerce, etc.).
- **Estructura Estándar:** Mover los componentes estáticos, layouts y páginas que residen actualmente en la raíz hacia una jerarquía más organizada (`src/components`, `src/pages`, `src/context`).
- **Code Splitting y Lazy Loading:** Aplicar `React.lazy()` en el enrutamiento para disminuir el tamaño del bundle inicial.

## 2. Frontend y Experiencia de Usuario (UX)

- **Unificación de Frameworks CSS:** Remover Bootstrap por completo en favor de Tailwind CSS (actualmente conviven). Utilizar componentes semánticos de la UI de Tailwind de forma exclusiva en las nuevas vistas.
- **Modo "Offline" (Assets Locales):** Asegurar que fuentes, scripts e iconos se sirvan en el build final en vez de depender de CDNs, garantizando operación sin internet si la caché lo permite.
- **Arquitectura de Datos Frontend:** Adoptar de forma generalizada `@tanstack/react-query` o `SWR` para manejo asíncrono y llamadas API, eliminando `useEffect` anidados.
- **Almacenamiento Local (Persistencia):** Migrar de `localStorage` a **IndexedDB** (`Dexie.js`) debido al límite de 5MB y evitar bloqueos en el hilo principal.
- **UI/UX:** Solucionar prop-drilling con el `Context API` (`ClientContext` y `ProjectContext`), e implementar esqueletos (Skeletons) en vez de Spinners para cargas.

## 3. Seguridad y Validación

- **Backend SSRF & Validación:**
  - Exigir validación mediante `is_safe_url()` en todas las peticiones salientes (ej. en `scraper_core`).
  - Utilizar **Pydantic** para validar los *payloads* entrantes de todos los endpoints JSON.
- **Gestión de Secretos:** Implementar `python-dotenv` para que `config.py` cargue variables de un archivo local `.env` y no dependa únicamente de variables de entorno de sistema explícitas.
- **Multi-Tenant (BBDD):** En un futuro entorno SaaS, almacenar tokens y claves (ej. OAuth de GSC) encriptados y definir jerarquía de usuarios con distintos roles en PostgreSQL.

## 4. Rendimiento y Escalabilidad

- **Scraping Asíncrono (Backend):**
  - El scraping actual usando `threading.Lock` para sincronizar Playwright bloquea workers síncronos en Flask.
  - Se debe migrar a tareas de fondo asíncronas con colas de mensajes (`Celery` o `RQ` sobre Redis), retornando un HTTP 202 que permita al cliente hacer polling del progreso, o implementando WebSockets/SSE.
- **Frontend Optimizado:** Minimizar peticiones repetidas, cachear con React Query y limitar re-renderizados innecesarios.

## 5. DevOps, Testing y Mantenimiento

- **Pinning de Dependencias:** Mover `requirements.txt` a un sistema estricto (ej. `requirements.in` + `pip-compile` usando `pip-tools`) que fije las versiones (`flask==3.0.0`) y evite caídas por actualizaciones forzadas.
- **Tests Offline (Backend):** Utilizar SQLite en memoria y mockear activamente peticiones de red y APIs (`requests`, `playwright`) para tests unitarios/integración.
- **Tests (Frontend):** Configurar y extender el uso de `vitest` para la capa visual, custom hooks, utils (ej. métricas de GSC) y lógicas complejas de estrategias.
- **Documentación Dinámica:** Integrar Swagger/OpenAPI (ej. `Flasgger`) para generar documentación estandarizada y en tiempo real del API en el backend.
- **Calidad de Código:** Imponer el uso de **Black** o **Ruff** en el backend para formateo de código, pre-commits y estricto tipado (`mypy`). Requerir tipos estrictos en TypeScript (`Frontend`), y eliminar usos de `any`.