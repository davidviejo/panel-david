# Ecosystem Review & Improvement Roadmap

This document provides a comprehensive review of the current ecosystem (Backend: `backend/p2`, Frontend: `frontend/m3`) and outlines the strategic, architectural, and technical improvements needed to scale the application into a robust, secure, and maintainable platform.

## 1. Backend Improvements (`backend/p2`)

### 🏗️ Architecture & Organization
- **Refactor `apps/` Directory**: The current flat structure mixes web routes, business logic, and utilities. It should be reorganized into semantic sub-packages: `web` (Blueprints), `services` (Business logic like `llm_service`, `scraper_core`), `core` (Infrastructure), `models`, and `utils`.
- **Eliminate Import Side Effects**: Move database initializations and thread startups from module-level imports into a strict `create_app()` Application Factory pattern. This ensures modules can be safely imported for isolated unit testing.
- **Centralize Data Storage**: Move scattered SQLite databases (e.g., `projects.db`) and generated reports to a centralized `data/` directory managed via configuration.

### 🛡️ Security & Reliability
- **Input Validation**: Implement robust schema validation using **Pydantic** for all JSON API endpoints.
- **SSRF Protection**: Make the use of `is_safe_url` mandatory for *all* outgoing HTTP requests (e.g., tools processing external URLs).
- **Environment Configuration**: Integrate `python-dotenv` for secure and automatic loading of `.env` files instead of manual `os.environ` usage.

### ⚡ Performance & Concurrency
- **Asynchronous Processing**: Transition from synchronous `threading.Lock` and `ThreadPoolExecutor` in web requests (like `scraper_core.py`) to asynchronous task queues (e.g., Celery, RQ) to prevent blocking Flask workers during long-running scraping or API tasks.
- **Robust Session Handling**: Ensure all HTTP requests use connection pooling (via a shared `requests.Session`) to reduce connection overhead, especially in concurrent URL processing.

### 🧪 Quality Assurance
- **Dependency Pinning**: Use `pip-compile` to generate a strict `requirements.txt` with exact versions and hashes to prevent breaking changes.
- **Offline Testing Strategy**: Expand the `pytest` suite by aggressively mocking external API calls (`requests`, Playwright, OpenAI) so tests can run reliably without internet access or real API keys.

---

## 2. Frontend Improvements (`frontend/m3`)

### 🏗️ Architecture & State Management
- **Resolve Prop Drilling**: Refactor components (especially `App.tsx`) to consume global state directly via React Context (`useProject()`) rather than manually passing props deep into the component tree.
- **Data Fetching Migration**: Standardize asynchronous state management and API calls using **TanStack Query (React Query)** instead of manual `useEffect` implementations.
- **Dynamic Routing & Code Splitting**: Implement `React.lazy()` and `Suspense` for page components to reduce the initial bundle size and improve load times.

### 🚀 Performance & Storage
- **Migrate to IndexedDB**: Replace `localStorage` (which is synchronous and limited to 5MB) with IndexedDB (via `Dexie.js`) for robust client-side data persistence without blocking the main thread.
- **Service Workers & PWA**: Add Progressive Web App capabilities for offline support and caching of static assets.

### 🎨 UI/UX Consistency
- **Unify CSS Frameworks**: Eliminate the hybrid usage of Bootstrap and Tailwind CSS. Standardize on **Tailwind CSS** as the sole framework, utilizing a proper build step rather than a CDN script to minimize bundle size and prevent style conflicts.
- **Semantic UI Components**: Strictly adhere to the shared Design Layer (`src/components/ui/`) using predefined design tokens instead of hardcoding utility classes on a per-page basis.

### 🧠 Domain Logic Migration
- **Backend Strategy Pattern Integration**: Move hardcoded audit templates and specific business logic out of frontend constants (`constants.tsx`). Implement a Strategy Pattern in the backend to serve specific tasks based on the project vertical (Media, Local, Ecommerce) dynamically.

---

## 3. DevOps & Tooling

- **Documentation**: Implement auto-generated API documentation (e.g., Flasgger for OpenAPI/Swagger) based on backend docstrings.
- **Code Formatting & Linting**: Enforce strict Python formatting with `black`/`isort` and type-checking with `mypy`. Ensure frontend PRs pass ESLint and Prettier checks automatically.
