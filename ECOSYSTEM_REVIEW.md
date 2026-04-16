# Resumen Integral del Ecosistema y Roadmap (2025)

Este documento consolida el estado actual, la deuda técnica y los planes de mejora para toda la suite MediaFlow SEO. Se basa en una revisión transversal de la arquitectura frontend, backend y sus contratos de integración, sintetizando propuestas clave para evolucionar el sistema hacia un SaaS escalable, multi-tenant y seguro.

---

## 1. Evolución Arquitectónica (Frontend-Only vs Backend)

El proyecto se encuentra en una etapa de transición crítica. Originalmente, un monolito (Flask + Jinja2/React híbrido), actualmente el frontend opera de manera desacoplada (SPA en React) pero aún mantiene dependencias significativas de mockups, persistencia local (`localStorage`) y lógica de negocio implementada en el cliente.

### A. Migración de Fuente de Verdad (Frontend ↔ Backend)
**Objetivo:** Consolidar el backend como única fuente de verdad para toda la lógica de negocio y persistencia de datos.
- **Estado Actual (Pilotos y Flags):** La migración se está gestionando a través de feature flags (ej. `ff_seo_checklist_backend_source`, `ff_ia_visibility_backend_source`). Se requiere retirar progresivamente los `mockups` (ej. `seedRows` en IA Visibility) y asegurar que el frontend delegue toda la orquestación a un BFF o a las API del backend.
- **Flujo de Integración:** La introducción de TanStack Query (React Query) en lugar de llamadas manuales a `useEffect` mejorará la caché y la revalidación.
- **Backend For Frontend (BFF):** Para módulos dependientes de APIs externas directas desde el cliente (como GSC o SerpApi en Trends Media), la lógica de autenticación y proxy debe trasladarse al backend (evitando exposición de tokens/API Keys o bloqueos por CORS en el frontend).

### B. Módulos y Arquitectura "Strategy" (Backend)
- Se propone la migración hacia un **Patrón Strategy / Factory** en el backend para gestionar distintos tipos de proyectos SEO (Local, Ecommerce, Medios). Esto elimina lógica acoplada en el cliente (como en `constants.tsx`) y promueve tablas configurables (`AuditTemplates`) por vertical en PostgreSQL.

---

## 2. Mejoras Estructurales en Backend (Python / Flask)

El backend actual presenta retos de diseño y concurrencia. El directorio `apps/` es demasiado plano (más de 60 archivos mezclados) e introduce efectos secundarios ("side effects") al importar.

### A. Reestructuración de Carpetas
Implementar capas semánticas puras para mejorar el aislamiento y la inyección de dependencias (necesarios para el testing):
- `apps/web/`: Blueprints y controladores de red HTTP.
- `apps/services/`: Lógica de negocio core sin dependencias web HTTP (ej. algoritmos SEO, scraping).
- `apps/core/`: Infraestructura, inicialización centralizada (BD) sin side effects, logs y configuraciones.
- `apps/utils/`: Funciones auxiliares.

### B. Concurrencia y Scraping
- **Bloqueos Síncronos:** El uso actual de hilos y `threading.Lock` para Playwright y requests bloquea a los workers HTTP de Flask/Gunicorn.
- **Migración Asíncrona:** Delegar tareas intensivas a **Celery** o **RQ** (background queues), usando interfaces `ScraperProvider` estandarizadas. Retornar `202 Accepted` a HTTP requets y permitir que el frontend o frontend-engine realice polling.

### C. Persistencia y Base de Datos Centralizada
- Mover todos los artefactos persistentes (actualmente bases SQLite dispares y JSONs locales) a un directorio de volumen `data/`.
- En producción, garantizar el soporte escalable a PostgreSQL, asegurando esquemas robustos con claves subrogadas estandarizadas (uso de IDENTITY en vez de texto) para tenants y usuarios.

### D. Seguridad e Inyección
- Validar esquemas con **Pydantic** a la entrada de todos los payloads HTTP de la API (para suplir validación inconsistente).
- Utilizar de forma omnipresente la función ya existente `is_safe_url` en todos los flujos de Scraping para mitigar ataques SSRF.
- Sustituir consultas dinámicas en SQL con el uso seguro de identificadores de columna y queries parametrizadas (e.g. uso de `psycopg` o ORM ligero como SQLAlchemy core).

---

## 3. Mejoras Estructurales en Frontend (React / Vite)

La refactorización hacia un frontend puro ("Frontend-Only") generó la necesidad de modernizar la UI y simplificar las capas de dependencias.

### A. Consolidación de Framework de Estilos
- **Problema:** Existía un diseño híbrido con Bootstrap 5 y Tailwind (vía CDN), que causaba bloqueos de renderizado y conflictos de clase (ej. `collapse`).
- **Solución:** Estandarización a **Tailwind CSS** localmente compilado en modo Build-step. Todas las pantallas deben aprovechar componentes base (`src/components/ui/`) o design tokens en lugar de clases utilitarias ad-hoc de color.

### B. Gestión de Datos y Estado Global
- Migrar del almacenamiento directo en `localStorage` (con límites de ~5MB y bloqueos del hilo principal) a **IndexedDB** o delegar toda persistencia a backend.
- Eliminar dependencias estáticas (ej. "modo offline" dependiente de CDNs en tiempo de ejecución), en favor de assets servidos estáticamente.

---

## 4. Prácticas de Ingeniería, Calidad y DevOps

- **Dependencias Fijas (Pinning):** Implementar la compilación estricta de `requirements.txt` utilizando `pip-compile` y `requirements.in` para que entornos de Staging y Producción sean predecibles e inmutables, en lugar de versiones dinámicas.
- **Estrategia de Tests (Mocking y Sin Red):** Desacoplar las pruebas de red y de bases de datos. Requerir uso intensivo de dependencias In-Memory (SQLite) y `pytest-mock` para evitar errores durante compilaciones CI por falta de API keys o dependencias externas faltantes (ej. fallos en requests y Playwright).
- **Format y Lints:** Introducir herramientas de automatización de estilo vía `pre-commit` hooks, como **Ruff**, **Black**, y validación estática vía **MyPy** para mejorar el rigor del código.
- **Gestión de Entorno (.env):** Requerir carga robusta mediante librerías como `python-dotenv` y estandarización del uso de variables locales/producción (en sistemas Vercel/Render).
