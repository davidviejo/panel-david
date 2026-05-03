# Resumen Integral de Mejoras del Ecosistema

Este documento consolida las áreas clave de mejora (Arquitectura, Backend, Frontend y DevOps) extraídas de varios planes de mejora a lo largo del repositorio (`PLAN_DE_MEJORA_INTEGRAL.md`, `PLAN_MEJORA_ESTRATEGICO.md`, `PLAN_MEJORA_TECNICA_2025.md`, `ARCHITECTURE_SCALE_ROADMAP.md`, `RECOMMENDED_IMPROVEMENTS.md`).

## 1. Arquitectura

-   **Reorganización del Directorio `apps/`:** Reestructurar el directorio plano en sub-paquetes semánticos (`apps/web/`, `apps/services/`, `apps/core/`, `apps/models/`, `apps/utils/`) para separar responsabilidades.
-   **Eliminar "Side Effects" en Importación:** Mover la lógica de inicialización (como `init_db()` o hilos de monitoreo) a funciones de tipo "Application Factory" (`create_app()`) para facilitar el testing.
-   **Centralización de Datos:** Definir un directorio `data/` centralizado para bases de datos SQLite y reportes.
-   **Patrón Strategy/Factory para Escalabilidad Multi-Tenant:** Refactorizar el backend para utilizar un Patrón Strategy (ej., `MediaProject`, `LocalProject`, `EcomProject`) y encapsular la lógica de negocio específica de cada vertical de SEO. Implementar una Factory para instanciar la clase correcta.
-   **Modelo Relacional Multi-Tenancy:** Transicionar hacia un esquema de base de datos relacional (ej. PostgreSQL) con soporte para Tenants, Users, Projects, Google Integrations (GSC) y Audits/Tasks.

## 2. Backend

-   **Gestión Segura de Configuración (.env):** Utilizar `python-dotenv` para cargar variables de configuración desde archivos locales en lugar de depender únicamente de variables del entorno del sistema.
-   **Validación de Entradas:** Implementar **Pydantic** para validar los esquemas de todos los endpoints JSON.
-   **Protección SSRF Obligatoria:** Aplicar la función existente `is_safe_url` de forma estricta a *todas* las peticiones salientes. Manejo seguro de archivos con `werkzeug.utils.secure_filename`.
-   **Scraping Asíncrono (Task Queue):** Migrar el scraping (que actualmente bloquea workers con hilos/Locks) a llamadas asíncronas con **Playwright Async API** y delegar trabajos de fondo largos usando colas como **Celery** o **RQ**.
-   **API GSC (Gestión de Proyectos):** Crear flujos automatizados para incorporar proyectos, incluyendo conectar GSC, asignar permisos y verificar la propiedad a través de llamadas seguras a la API.

## 3. Frontend y Experiencia de Usuario (UX)

-   **Unificación de Framework CSS (Tailwind):** Estandarizar **Tailwind CSS** como el framework principal. Identificar y eliminar progresivamente dependencias e importaciones heredadas de **Bootstrap 5** (que causan carga doble y conflictos).
-   **Configuración UI Driven (Navegación Dinámica):** Refactorizar el menú de navegación (actualmente código HTML hardcodeado) hacia una configuración centralizada (ej. en `apps/config/navigation.py`) inyectada globalmente.
-   **Modo "Offline" (Assets Locales):** Implementar un proceso de compilación para descargar y servir archivos estáticos, fuentes y scripts localmente, eliminando la dependencia de CDNs externos y garantizando la funcionalidad sin conexión.
-   **React Query para Gestión de Estado:** Introducir **TanStack Query (React Query)** o **SWR** para llamadas a APIs y un manejo más robusto del estado asíncrono.
-   **Internacionalización (i18n):** Implementar **react-i18next** para extraer y gestionar el texto del front end en archivos JSON (`es.json`, `en.json`).
-   **Optimización UI:** Adoptar **Server-Sent Events (SSE)** en lugar de polling o llamadas bloqueantes para actualizar barras de progreso.

## 4. DevOps y Calidad de Código (QA)

-   **Pinning Estricto de Dependencias:** Usar `pip-tools` (`pip-compile`) para generar un archivo `requirements.txt` o `requirements.lock` congelado con versiones exactas y hashes para prevenir roturas por actualizaciones automáticas.
-   **Estrategia de Testing "Offline":** Mockear de forma agresiva todas las llamadas de red externas (ej., `requests`, `playwright`) y APIs de terceros. Transicionar a bases de datos SQLite en memoria (`:memory:`) para pruebas de integración rápidas. Implementar `vitest` para pruebas de componentes críticos del frontend.
-   **Estándares y Tipado:** Implementar progresivamente Type Hints en Python y verificarlos con **MyPy**. Usar **Black** o **Ruff** para el formateo consistente del código. Configurar hooks de `pre-commit` para asegurar el cumplimiento del estilo y formato.
-   **Documentación de API:** Introducir flujos de documentación viva (como **Flasgger**) para generar especificaciones OpenAPI/Swagger a partir de docstrings.
-   **Dockerización:** Crear un `Dockerfile` multi-stage optimizado que instale apropiadamente dependencias del sistema, incluyendo Playwright.