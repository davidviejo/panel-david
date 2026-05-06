# Mejoras del Ecosistema (Backend y Frontend)

Tras un análisis exhaustivo del código base y de los distintos planes de mejora existentes en el repositorio, a continuación se presenta un resumen consolidado de las áreas clave donde el ecosistema puede mejorar:

## 1. Arquitectura y Estructura (Backend)
- **Reorganización del directorio `apps/`**: Actualmente es un directorio plano con más de 60 archivos. Se debe estructurar en subpaquetes semánticos (`apps/web`, `apps/services`, `apps/core`, `apps/models`, `apps/utils`) para separar controladores de lógica de negocio e infraestructura.
- **Eliminación de "Side Effects"**: Archivos como `apps/database.py` inicializan conexiones al importarse. Esto debe moverse a una "Application Factory" (`create_app()`) para facilitar el testing aislado.
- **Centralización de Datos**: Los archivos SQLite (`projects.db`, etc.) están dispersos. Se debe crear un directorio `data/` centralizado para su correcta gestión y persistencia.

## 2. Rendimiento y Concurrencia
- **Scraping Asíncrono (Backend)**: El uso intensivo de scraping bloquea los hilos de Flask. Se debe migrar a la API asíncrona de Playwright y gestionar las tareas largas mediante colas (Redis/Celery/RQ) en lugar de usar variables globales que no son *thread-safe*.
- **Persistencia Escalable en Frontend (IndexedDB)**: Actualmente se usa `localStorage` para guardar el estado, el cual es síncrono y está limitado a ~5MB. Se sugiere migrar a **IndexedDB** (usando Dexie.js) para manejar mayores volúmenes de datos sin bloquear el hilo principal.
- **Code Splitting (Frontend)**: Utilizar `React.lazy()` y `Suspense` para cargar las páginas bajo demanda, reduciendo así el tamaño del bundle inicial.

## 3. Calidad de Código y Mantenibilidad
- **Gestión de Dependencias (Backend)**: El archivo `requirements.txt` no fija versiones exactas. Usar `pip-tools` o `poetry` para generar un `requirements.in/lock` y prevenir roturas por actualizaciones incompatibles.
- **Refactorización de Estado (Frontend)**: El `ProjectContext` actual es monolítico, lo que provoca renderizados innecesarios y *prop drilling* en `App.tsx`. Se recomienda dividir contextos o usar un gestor de estado como **Zustand**.
- **Tipado Estricto (Frontend y Backend)**: Añadir *Type Hints* y verificar con `mypy` en el backend. En el frontend, reemplazar los tipos `any` por interfaces estrictas en TypeScript.

## 4. Experiencia de Usuario (UX) y Frontend
- **Unificación CSS**: Eliminar la dependencia híbrida actual entre Bootstrap y Tailwind en las plantillas del backend (`templates/base.html`), estandarizando todo bajo **Tailwind CSS**.
- **Deshacer/Rehacer (Undo/Redo)**: Implementar un historial de acciones en el frontend para evitar pérdidas accidentales de información.
- **Exportación Avanzada**: Permitir la exportación de reportes a PDF y CSV, no limitándose solo a JSON.
- **Feedback de Carga Mejorado**: Reemplazar los simples "spinners" de carga por **Skeletons** para mejorar la percepción visual de carga.

## 5. Seguridad y Testing
- **Protección y Validación (Backend)**:
  - Cargar configuración sensible de forma segura mediante `.env` (usando `python-dotenv`).
  - Utilizar **Pydantic** para la validación estricta de las entradas (*Request Bodies*) de la API.
  - Asegurar que todas las peticiones salientes utilicen la utilidad `is_safe_url` para mitigar ataques SSRF.
- **Testing (Full-stack)**:
  - *Backend*: Mockear llamadas a red e integraciones (`requests`, `playwright`) para tests rápidos, y utilizar `sqlite3.connect(':memory:')` en integraciones.
  - *Frontend*: Ampliar la cobertura usando **Vitest** para la lógica crítica de negocio (ej. algoritmos de análisis).

## 6. DevOps y PWA
- **Modo Offline y Assets (Backend)**: Servir todos los assets de forma local (`static/`) para que la aplicación base no dependa de CDNs ni requiera conexión constante a internet.
- **Progressive Web App (Frontend)**: Configurar la aplicación React para soportar capacidades offline completas ("Instalar app").
