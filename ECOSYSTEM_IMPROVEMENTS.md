# Resumen de Mejoras del Ecosistema

Este documento consolida las mejoras técnicas y estratégicas identificadas a lo largo de los diversos planes de mejora en el ecosistema (Frontend y Backend).

## 1. Arquitectura y Estructura Global

### Backend (Python)
- **Reorganización del Directorio `apps/`**: Migrar de una estructura plana a una estructura por capas semánticas (`apps/web/`, `apps/services/`, `apps/core/`, `apps/models/`, `apps/utils/`).
- **Eliminación de "Side Effects" en Importación**: Centralizar la inicialización de recursos en una Application Factory (e.g., `create_app()`) en lugar de inicializar conexiones globales.
- **Inyección de Dependencias**: Pasar dependencias explícitamente a los servicios en lugar de instanciarlas dentro, para facilitar tests unitarios.
- **Patrón Strategy/Factory para Lógica Multi-Tenant**: Migrar la lógica de negocio SEO, que actualmente reside en el frontend (`constants.tsx`), al backend. Instanciar dinámicamente servicios para diferentes tipos de proyectos (Media, Local, Ecommerce) a través de una `ProjectFactory`.

### Centralización de Datos
- **Almacenamiento Centralizado**: Definir un directorio `data/` para archivos SQLite (`projects.db`) y evitar dispersión en la raíz.
- **Bases de Datos Multi-Tenancy**: Esquema relacional (PostgreSQL propuesto) para Tenants, Usuarios, Proyectos, Integraciones (GSC) y Auditorías.

## 2. Backend: Escalabilidad y Concurrencia

- **Scraping Asíncrono y Colas**: Introducir un sistema de colas (Celery o RQ) para mover tareas largas (como Playwright y scraping) a background workers, evitando bloquear a Flask.
- **ScraperProvider (Strategy)**: Abstraer los métodos de scraping para soportar Playwright, ZenRows, Requests bajo una interfaz común.

## 3. Frontend y Experiencia de Usuario (UX)

- **Unificación de Frameworks CSS (Tailwind)**: Eliminar Bootstrap y usar exclusivamente Tailwind CSS mediante un proceso de construcción (build step) para evitar conflictos y dependencias externas.
- **Modo "Offline" y Assets**: Descargar y servir fuentes, JS, CSS desde `static/` y no depender de CDNs para que la UI no se rompa sin internet.
- **Navegación Dinámica (Configuration-Driven UI)**: Extraer menús en código a una configuración en `apps/config/navigation.py`.
- **Arquitectura de Datos (React Query / SWR)**: Implementar estas librerías para la gestión del estado asíncrono y las llamadas de red.
- **Internacionalización (i18n)**: Implementar `react-i18next` para extraer textos hardcodeados.

## 4. Seguridad, Configuración e Integraciones

- **Gestión Segura de Secretos**: Usar `python-dotenv` para configuración `.env` en lugar de variables de entorno manuales.
- **Validación y Protección SSRF**:
  - Validación fuerte de entradas/salidas con Pydantic en endpoints JSON.
  - Aplicar `is_safe_url` en todas las peticiones salientes.
- **Integraciones Google Search Console**: Gestionar de forma segura tokens de actualización (encriptados), permisos e interacciones GSC (creación, verificación de propiedad).

## 5. DevOps y Calidad (QA)

- **Fijar Dependencias (Pinning)**: Usar `pip-tools` (`requirements.in` / `requirements.txt`) para asegurar versiones congeladas de los paquetes Python (evitar roturas silenciosas).
- **Hooks de Pre-commit**: Configurar `ruff`, `black` y validadores YAML para estandarizar estilos e imports automáticamente.
- **Estrategia de Testing "Offline" y Aislada**:
  - Mockear redes (`requests`, `playwright`) de forma agresiva o usar BD en memoria (`sqlite3 :memory:`).
  - Vitest para componentes críticos de UI y hooks de React.
- **Documentación Viva de la API**: Integrar herramientas tipo Swagger/OpenAPI (Flasgger) para los endpoints expuestos.
