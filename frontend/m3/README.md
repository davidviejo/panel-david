# Mediaflow SEO - Frontend Only

Esta aplicación es una suite de herramientas SEO moderna construida con **React (Vite)**. Anteriormente contenía un backend en Python, pero ha sido refactorizada para funcionar exclusivamente como una aplicación frontend.

## 📋 Requisitos Previos

- **Node.js** (v18 o superior)
- **npm** (incluido con Node.js)
- **Git**

## 🚀 Instalación

Sigue estos pasos para configurar el entorno de desarrollo local.

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd mediaflow-seo
```

### 2. Instalar dependencias

```bash
npm install
```

## ⚙️ Configuración (.env)

Crea un archivo `.env` en la raíz del proyecto (puedes copiar `.env.example`).

### Variables de backend/API internas

```ini
# URL base del backend principal (opcional)
VITE_API_URL=

# Puerto del backend principal cuando no se define VITE_API_URL (opcional)
VITE_API_PORT=5000

# URL base del motor Python (opcional)
VITE_PYTHON_ENGINE_URL=
```

Comportamiento por defecto:

- Si `VITE_API_URL` está definida, el frontend la usa como base para el servicio `api`.
- Si `VITE_API_URL` no está definida, el frontend construye la URL con el host/protocolo actuales del navegador y `VITE_API_PORT` (por defecto `5000`).
- Si `VITE_PYTHON_ENGINE_URL` está definida, se usa para el servicio `engine`.
- Si `VITE_PYTHON_ENGINE_URL` no está definida, el servicio `engine` reutiliza la base resuelta del servicio `api`.

### Variables de integraciones externas

```ini
# APIs Externas (Requerido para funcionalidades AI del cliente)
VITE_GEMINI_API_KEY=...
# Google Search Console (Si vas a usar el módulo GSC)
VITE_GOOGLE_CLIENT_ID=...
```

## ▶️ Ejecución de la App

```bash
npm run dev
```

_La aplicación se iniciará en `http://localhost:5173`_

### Módulo Trends Media integrado

El antiguo proyecto standalone de Tendencias/Brief editorial ya no debe arrancarse por separado: ahora vive dentro de esta SPA en la ruta:

```text
/#/app/trends-media
```

Esto significa que:

- se inicia con el mismo `npm run dev` del frontend principal;
- comparte dependencias, navegación y despliegue con MediaFlow SEO;
- el backend puede redirigir a esta vista integrada.

Si ejecutas el backend Flask en otro host/puerto y quieres que `/trends/media` redirija correctamente a la SPA, define:

```ini
MEDIAFLOW_FRONTEND_URL=http://localhost:5173
```

## 🛠 Funcionalidades

- **Dashboard de Madurez SEO:** Seguimiento de tareas y progreso por módulos.
- **Roadmap Dinámico:** Gestión de tareas para diferentes verticales (Media, Ecommerce, Local, etc.).
- **Integración GSC:** Visualización de datos de Google Search Console directamente en el navegador (OAuth Client-Side).
- **AI Tools:** Herramientas de generación y análisis potenciadas por Gemini (Client-Side).

---
