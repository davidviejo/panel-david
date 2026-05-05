# Resumen de Mejoras del Ecosistema (ECOSYSTEM_IMPROVEMENTS)

Este documento consolida el plan integral de mejoras para todo el ecosistema del proyecto (Backend `p2`, Frontend `m3`, Arquitectura y DevOps), unificando las propuestas estratégicas y técnicas actuales.

## 1. Arquitectura y Backend (p2)
* **Reorganización Estructural:** El directorio `apps/` debe refactorizarse en sub-paquetes semánticos (`apps/web`, `apps/services`, `apps/core`, `apps/models`, `apps/utils`) para separar las rutas HTTP de la lógica de negocio.
* **Patrón Application Factory:** Eliminar los *side effects* (efectos secundarios) en las importaciones (ej. `database.py`) centralizando la inicialización a través de una función `create_app()` u otro mecanismo de factory para facilitar pruebas aisladas.
* **SaaS Multi-Tenant (Strategy/Factory):** Migrar lógica de negocio actualmente acoplada en el frontend hacia el backend, implementando el Patrón Strategy para manejar distintas verticales (Medios, Local, Ecommerce) de forma escalable.
* **Gestión de Asincronía:** Reemplazar los bloqueos síncronos de hilos (`threading.Lock`) en los procesos de scraping por sistemas de colas de tareas asíncronas (como Celery o RQ) para evitar bloquear los *workers* de Flask.
* **Centralización de Datos:** Mover los archivos de bases de datos SQLite (`projects.db`) y archivos generados a un directorio estandarizado `data/`.

## 2. Frontend y Experiencia de Usuario (m3)
* **Gestión de Estado y Fetching:** Implementar **TanStack Query (React Query)** o SWR para el manejo asíncrono y llamadas API, reemplazando la gestión manual con `useEffect`.
* **Persistencia Escalable (IndexedDB):** Migrar el almacenamiento del cliente desde `localStorage` (síncrono, límite de ~5MB) hacia **IndexedDB** usando Dexie.js para soportar grandes volúmenes de datos y logs de IA sin congelar la UI.
* **Estandarización de UI (Tailwind CSS):** Utilizar exclusivamente Tailwind CSS como framework principal, eliminando progresivamente Bootstrap para reducir el peso del *bundle* y evitar conflictos de estilos.
* **Internacionalización (i18n):** Implementar `react-i18next` para extraer textos harcodeados en español y dar soporte multi-idioma.
* **Dependencia de Assets Locales:** Servir recursos estáticos (fuentes, iconos, estilos) de manera local para permitir el funcionamiento en entornos sin acceso a internet (Offline Mode) o con restricciones de red.

## 3. Seguridad y Configuración
* **Protección SSRF y Validación:** Aplicar validación estricta de esquemas con **Pydantic** para los endpoints y usar sistemáticamente la utilidad `is_safe_url` en todas las peticiones externas para prevenir ataques SSRF.
* **Manejo Seguro de Secretos:** Integrar `python-dotenv` en la configuración para la carga automática y segura de variables de entorno, abandonando la configuración manual de `os.environ`.
* **Seguridad de Componentes (Frontend):** Evitar `dangerouslySetInnerHTML` al renderizar Markdown en el frontend, priorizando componentes como `SafeMarkdown` que aprovechan la protección nativa XSS de React.

## 4. Testing, Calidad y DevOps
* **Infraestructura de Testing:**
  * **Backend:** Incrementar la cobertura usando `pytest` con *mocks* (ej. `sys.modules`) para dependencias ausentes en entornos ligeros.
  * **Frontend:** Configurar y utilizar `vitest` para los componentes y *hooks* críticos de React.
* **Linting y Estándares:** Empleo de herramientas de análisis estático como `ruff` (`ruff check --select F401`) para eliminar importaciones no utilizadas y mantener la limpieza del código. Estandarizar docstrings y logs en inglés.

## 5. Capacidades Avanzadas e IA
* **Memoria Global de IA:** Dotar a los proyectos de una capa de memoria y contexto para enriquecer las respuestas de los prompts con conocimiento acumulado del sitio y las interacciones previas.
