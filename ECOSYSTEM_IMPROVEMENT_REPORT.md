# ECOSYSTEM IMPROVEMENT REPORT - SEO Suite Ultimate

Este documento consolida y unifica todos los hallazgos técnicos, vulnerabilidades y propuestas de arquitectura detectadas en el ecosistema (Frontend y Backend). Sirve como hoja de ruta única para futuras iteraciones y desarrollo.

---

## 1. Arquitectura del Sistema (Alto Impacto)

### 1.1. Backend (Python/Flask)
*   **Modularización del directorio `apps/`**: Actualmente, la lógica de controladores, rutas, utilidades y acceso a base de datos están mezclados en más de 60 archivos en un solo nivel.
    *   **Acción**: Implementar patrón de capas separando responsabilidades: `apps/web/` (Rutas y Blueprints), `apps/services/` (Lógica de negocio), `apps/core/` (Base de datos y configuración) y `apps/utils/`.
*   **"Side Effects" en importaciones**: Módulos como `apps/database.py` inicializan la conexión a BD u otras tareas automáticas al ser importados (`init_db()`), lo cual rompe los tests y acopla el código.
    *   **Acción**: Remover inicializaciones globales. Usar estrictamente el patrón Application Factory de Flask (`create_app()`).
*   **Centralización de Datos**: Varias bases de datos SQLite y archivos de caché/json se generan libremente en la raíz o carpetas relativas.
    *   **Acción**: Mover todos los artefactos de datos a un directorio `data/` usando configuración.
*   **Asincronía (Scraping)**: El módulo `scraper_core.py` es bloqueante. Las ejecuciones síncronas bajo Flask (usando `ThreadPoolExecutor`) son ineficientes para tareas pesadas en red.
    *   **Acción**: Migrar procesos pesados a Playwright Async y derivarlos a colas de trabajo externas (como Celery o RQ) separando los "Web Workers" de los "Background Workers".

### 1.2. Frontend (React/Vite)
*   **Gestión de Estado y Persistencia**: Actualmente se depende de `localStorage`, limitando el almacenamiento a ~5MB, lo cual bloquea el main thread al cargar proyectos pesados o clusters IA.
    *   **Acción**: Migrar la persistencia local a **IndexedDB** a través de librerías como `Dexie.js`.
*   **Gestión de APIs Asíncronas**: El código hace `fetch` usando hooks de efecto estándar.
    *   **Acción**: Integrar **TanStack Query (React Query)** o SWR para gestionar estados de carga, caché y reintentos de forma declarativa.
*   **Estructura de Componentes**: Existen "God components" (como `ProjectContext.tsx`) que gestionan la lógica de múltiples entidades a la vez.
    *   **Acción**: Separar responsabilidades usando Zustand o contextos específicos. Emplear Lazy Loading (`React.lazy`) en `App.tsx` para optimizar el bundle inicial.

---

## 2. Seguridad y Configuración (Crítico)

### 2.1 Backend Configuración y Dependencias
*   **Variables de Entorno Hardcodeadas**: `config.py` lee directamente de `os.environ` pero asume fallbacks inseguros (como tokens generados en caliente o contraseñas por defecto "123456").
    *   **Acción**: Implementar lectura forzada desde un archivo `.env` local (`python-dotenv`). Lanzar errores en producción si faltan secretos como `SECRET_KEY` en vez de usar fallbacks temporales.
*   **Prevención SSRF (Server-Side Request Forgery)**:
    *   **Acción**: Es imperativo hacer uso exhaustivo de la utilidad `is_safe_url()` en todas las herramientas que hagan "fetch" externo para prevenir que un usuario haga peticiones a IPs internas.
*   **Validación Estricta de Modelos**:
    *   **Acción**: Implementar `Pydantic` o schemas similares para validar fuertemente el Request Body JSON en todas las API routes, dejando de confiar implícitamente en diccionarios.
*   **Gestión de Dependencias**:
    *   **Acción**: Mantener `requirements.txt` pineado con versiones y hashes usando `pip-tools`.

---

## 3. UI/UX y Funcionalidad del Producto

### 3.1. Unificación de Estilos
*   **Problema de Frontend CSS**: Hay rastros híbridos de Bootstrap 5 (cargado via CDN) y Tailwind.
    *   **Acción**: Eliminar dependencias a CDN. Empaquetar todo en Tailwind CSS y servir assets de manera local, asegurando soporte "offline" y reduciendo conflictos de clases.
### 3.2. Funcionalidades Pendientes
*   **Tablero Kanban Global**: Actualmente las tareas se aíslan por módulos; añadir un Kanban unificado permitirá mejor control del roadmap.
*   **Memoria IA (Project Context)**: Proveer una sección para configurar el Tono de Marca, Target, etc., para ser inyectado automáticamente en cada prompt de la IA.
*   **Internacionalización**: Múltiples textos quemados en español en la UI; introducir `react-i18next`.

---

## 4. Testing y Calidad (QA)

### 4.1 Testing de Red
*   Los tests actuales tienden a tocar infraestructura real o red, fallando en entornos cerrados o sin API Keys.
    *   **Acción**: Mockear agresivamente todas las librerías HTTP (`requests`, `playwright`) y la BD (usar in-memory SQLite).

### 4.2 Linting
*   Existe código inestable y mezcla de estilos.
    *   **Acción**: Establecer como obligatorio el uso de `Black`, `flake8` y Mypy en el backend; y `Prettier`/`ESLint` estrictos en el frontend.

---
*Report generated based on exploration and pre-existing improvement docs in `backend/p2` and `frontend/m3`.*