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

> **Estado de migración (2026-03-30):** el código legacy de `Tendencias-medios-main/Tendencias-medios-main` fue retirado del flujo activo y archivado como referencia histórica en `Tendencias-medios-main/README.md`. El único módulo canónico es `src/features/trends-media`.

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

## 🎨 Guía visual mínima (Design Layer compartida)

La capa visual base vive en:

- `tailwind.config.js` (tokens consumibles en Tailwind)
- `src/index.css` (variables CSS de marca)
- `src/components/ui/*` (componentes semánticos reutilizables)

### Tokens de marca disponibles

- **Colores**: `primary`, `secondary`, `success`, `warning`, `danger`, `surface`, `surface-alt`, `border`, `foreground`, `muted`, `overlay`.
- **Radios**: `rounded-brand-sm`, `rounded-brand-md`, `rounded-brand-lg`.
- **Sombras**: `shadow-card`, `shadow-brand`.
- **Spacing**: `space-18`.
- **Tipografía**: `font-sans` basada en `--font-sans`.

### Componentes semánticos permitidos

- `Button` → variantes: `primary`, `secondary`, `ghost`, `danger`.
- `Badge`
- `Card`
- `Input`
- `Select`
- `Textarea`
- `Modal`

### Ejemplos rápidos

```tsx
<Card className="space-y-4">
  <h2 className="section-title">Título</h2>
  <Input placeholder="Buscar..." />
  <div className="flex gap-2">
    <Button variant="primary">Guardar</Button>
    <Button variant="secondary">Cancelar</Button>
    <Badge variant="success">Activo</Badge>
  </div>
</Card>
```

### Regla de revisión (obligatoria)

- Evitar clases de color directas en páginas (por ejemplo `text-slate-*`, `bg-blue-*`, `border-red-*`).
- Preferir tokens (`text-foreground`, `bg-surface`, `border-border`, etc.) y componentes semánticos de `src/components/ui`.
