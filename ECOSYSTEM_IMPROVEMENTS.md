# Mejoras del Ecosistema - SEO Suite Ultimate

Basado en la revisión exhaustiva de la base de código y los planes estratégicos, a continuación se detallan las principales áreas de mejora para el ecosistema del proyecto, abarcando arquitectura, backend, frontend y DevOps:

## 1. Arquitectura y Estructura (Backend)
* **Modularización del directorio `apps/`**: Actualmente el directorio es plano con más de 60 archivos mezclando lógica. Se requiere reorganizar en capas semánticas: `apps/web/` (Blueprints y rutas HTTP), `apps/services/` (lógica de negocio pura), `apps/core/` (infraestructura, BD) y `apps/utils/`.
* **Desacoplamiento de `scraper_core.py`**: Este módulo actúa como un "God Object". Se debe aplicar el Patrón Strategy para separar la gestión del navegador (`BrowserManager` con Playwright), la ejecución de peticiones HTTP (Requests) y la lógica de parseo específica de cada motor (ej. `GoogleParser`).
* **Centralización de Datos**: Consolidar todas las bases de datos SQLite (`projects.db`, `trends_jobs.db`, `api_usage.db`) y archivos JSON en un único directorio `data/` gestionado a través de variables de configuración.

## 2. Frontend y Experiencia de Usuario
* **Unificación de Frameworks CSS**: El proyecto mezcla Bootstrap 5 y Tailwind CSS, causando duplicidad de código y posibles conflictos. La meta es estandarizar Tailwind CSS como framework principal y retirar Bootstrap.
* **Navegación Dinámica**: El menú lateral tiene más de 200 líneas hardcodeadas en `base.html`. Se debe migrar a un enfoque "Configuration-Driven UI", definiendo la estructura en un archivo (ej. `navigation.py`) y renderizándolo dinámicamente.
* **Modo Offline Integral**: Eliminar la dependencia crítica de CDNs para fuentes, scripts y estilos. Descargar estos assets localmente en `static/` para garantizar funcionamiento sin internet y mejorar la latencia.

## 3. Concurrencia y Rendimiento
* **Delegación de Tareas y Async Scraping**: El uso bloqueante de hilos (ej. `threading.Lock`) penaliza el rendimiento en Flask. Las tareas pesadas y de scraping asíncrono con Playwright deben delegarse a una cola de trabajos (Task Queue como Celery o RQ) con workers en background.
* **Actualizaciones en Tiempo Real (SSE)**: En lugar de usar *polling* constante desde el cliente para ver el progreso de las tareas, implementar Server-Sent Events (SSE) o WebSockets para una comunicación más ligera y reactiva.

## 4. DevOps, Testing y Calidad de Código
* **Gestión de Dependencias (Pinning)**: El archivo `requirements.txt` actual carece de versiones fijas. Implementar `pip-tools` (`requirements.in`) o `Poetry` para "congelar" las dependencias y evitar roturas futuras.
* **Entornos y `.env`**: Integrar `python-dotenv` para facilitar el manejo local de configuración y secretos sin depender de variables globales en el sistema operativo.
* **Testing "Offline" y Mocking**: Los tests actuales requieren conexión a internet y bases reales. Se debe implementar `pytest-mock` agresivamente y usar SQLite en memoria para tests aislados y predecibles.
* **Pre-commit Hooks**: Instaurar estándares de código mediante herramientas como `ruff` (linting/imports), `black` (formateo) y `mypy` (tipado estático).

## 5. Seguridad y Robustez
* **Validación de Entradas con Pydantic**: Migrar la validación manual de JSON y parámetros de request hacia esquemas estrictos usando Pydantic.
* **Prevención de SSRF**: Forzar la evaluación de la utilidad `is_safe_url` en todos los flujos salientes (Scraping, auditorías) que admitan URLs externas.
* **Hardening de Configuración**: Asegurar que claves críticas como `SECRET_KEY` provengan estrictamente del entorno en producción, erradicando fallbacks inseguros en el código.
