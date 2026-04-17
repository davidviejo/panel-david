# Ecosystem Review and Technical Roadmap (2025)

This document consolidates the technical roadmap, architectural improvement plans, and feature proposals across both the Frontend (`frontend/m3`) and Backend (`backend/p2`) of the Mediaflow SEO Suite. It serves as the single source of truth for all planned technical debt resolution and system evolution.

---

## 1. Backend Improvements & Stabilization (`backend/p2`)

The backend is transitioning from a monolithic script-like structure to a robust, modular, and scalable Flask application.

### 1.1 Architectural Restructuring
*   **Modularize `apps/` Directory:** The current flat structure (>60 files) will be reorganized into semantic sub-packages:
    *   `apps/web/`: Blueprints, routes, and controllers.
    *   `apps/services/`: Core business logic, background jobs, and integrations.
    *   `apps/core/`: Infrastructure, database management, and configuration.
    *   `apps/models/`: Data models and schemas.
    *   `apps/utils/`: Pure utility functions.
*   **Application Factory Pattern:** Eliminate side-effects on module import (e.g., `init_db()`, `start_monitor()`). Initialization logic will be explicitly handled inside `create_app()` or via CLI commands (`flask init-db`) to ensure safe and isolated testing.
*   **Centralized Data Storage:** Consolidate all SQLite databases (`.db`) and JSON state files into a single `data/` directory managed via environment variables, avoiding relative hardcoded paths.

### 1.2 Concurrency and Performance
*   **Asynchronous Scraping & Task Queues:** Move away from synchronous scraping that blocks Flask workers and relies on fragile thread locks (`_BROWSER_LOCK`). Implement a background task queue (e.g., Celery or RQ) and leverage Playwright's Async API for heavy jobs.
*   **Thread-Safe Playwright:** Refactor `scraper_core.py` to ensure `BrowserManager` is a thread-safe Singleton, preventing state corruption in multi-threaded environments.

### 1.3 Security, Quality, and DevOps
*   **Dependency Management:** Transition from unpinned dependencies to strict pinning using `pip-tools` (`pip-compile` with `requirements.in`) or Poetry to guarantee deterministic builds.
*   **Configuration & Secrets:** Adopt `python-dotenv` for secure environment variable management, replacing direct OS environment calls.
*   **SSRF Protection & Validation:** Enforce `Pydantic` schema validations for all JSON endpoints and strictly use `is_safe_url` for all outgoing requests to prevent Server-Side Request Forgery.
*   **Offline Testing Strategy:** Implement extensive mocking for network requests (`requests`, `playwright`) and utilize in-memory SQLite databases (`:memory:`) to allow rapid, offline unit and integration testing.

---

## 2. Frontend Modernization & Scaling (`frontend/m3`)

The frontend is evolving into a highly performant, scalable, and maintainable React SPA (Single Page Application).

### 2.1 State Management & Architecture
*   **Data Fetching & Caching:** Migrate manual `useEffect` data fetching logic to **TanStack Query (React Query)** or **SWR** for robust asynchronous state management and caching.
*   **Persisting Data (IndexedDB):** Replace `localStorage` with **IndexedDB** (via `Dexie.js`) to overcome the 5MB storage limit and prevent synchronous main-thread blocking, which is critical as logs and roadmaps grow.
*   **Prop Drilling Reduction:** Further utilize the Context API (e.g., `ProjectContext`, `ClientContext`) to eliminate manual prop passing deep into component trees, especially within `App.tsx`.
*   **Code Splitting:** Implement `React.lazy()` and `Suspense` for dynamic imports of routes and heavy components to drastically reduce initial bundle size and improve load times.

### 2.2 UX/UI and Styling
*   **Tailwind CSS Standardization:** Fully deprecate Bootstrap 5 in favor of a pure Tailwind CSS architecture. This eliminates conflicting styles, dual framework loading, and external CDN dependencies (enabling full offline support).
*   **Semantic UI System:** Enforce the usage of a centralized Design Layer (`src/components/ui/` like `Button`, `Badge`, `Card`) and avoid hardcoded color utility classes in page components to ensure consistency.

### 2.3 Proposed Features & Product Enhancements
*   **Project Memory (Global AI Context):** Introduce a system to store client-specific contexts (brand tone, target audience, competitors) in IndexedDB, automatically injecting them into AI prompts to prevent repetitive manual input.
*   **Global Kanban Board:** Implement a unified Kanban view (`/@hello-pangea/dnd`) to manage tasks globally across all modules (To Do, In Progress, Review, Done) rather than being siloed per module.
*   **Content Decay Monitor:** Extend the Google Search Console (GSC) integration to compare performance periods and identify URLs experiencing significant traffic drops (>20%).

### 2.4 Testing and Internationalization
*   **Frontend Testing:** Configure and expand `vitest` coverage for critical business logic hooks and UI components.
*   **i18n Readiness:** Complete the implementation of `react-i18next` to extract hardcoded strings into translation files (`es.json`, `en.json`).
