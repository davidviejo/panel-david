# Ecosystem Improvements

This document provides a comprehensive summary of the project's technical ecosystem improvements, covering Architecture, Backend, Frontend, and DevOps, synthesizing the various improvement plans across the codebase.

## 1. Architecture

* **Directory Reorganization (`apps/`)**: Restructure the flat backend directory into semantic sub-packages: `web/` (routes), `services/` (business logic), `core/` (infrastructure), `models/`, and `utils/`.
* **Strategy/Factory Pattern for SaaS Multi-Tenant Model**: Descouple business logic (audit tasks, recipes) from the frontend and migrate it to the backend using Strategy and Factory patterns to handle different project verticals dynamically (Media, Local, Ecommerce).
* **Data Centralization**: Define a centralized `data/` directory for database files (e.g., SQLite `projects.db`) and generated reports to prevent scattering files across the root directory.

## 2. Backend

* **Eliminate Import Side-Effects**: Refactor modules like `database.py` to prevent executing functions such as `init_db()` upon module import. Implement strict use of the Flask Application Factory pattern (`create_app()`).
* **Input Validation & Types**: Implement rigorous validation using **Pydantic** for all JSON endpoint inputs and enforce type hints (statically verified with `mypy`).
* **Asynchronous Execution & Scraping**: Transition from synchronous threading to **Playwright Async API** and utilize task queues (e.g., Redis/RQ/Celery) to prevent blocking the main Flask worker threads during heavy scraping tasks.
* **Database Schema Standardization**: Manage relationships properly for multi-tenancy (Tenants, Users, Project Integrations) with PostgreSQL, replacing flat schema structures.

## 3. Frontend

* **CSS Unification (Tailwind)**: Standardize styling exclusively on **Tailwind CSS**. Incrementally deprecate Bootstrap to prevent duplicate assets and style conflicts. Implement a CSS build step rather than relying on CDNs.
* **Scalable Persistence (IndexedDB)**: Migrate frontend data persistence from synchronous `localStorage` (limited to 5MB) to **IndexedDB** (using Dexie.js) to support larger project payloads and prevent main-thread blocking.
* **State Management (React Query)**: Replace manual `useEffect` asynchronous data fetching and state management with **TanStack Query (React Query)** or similar tools.
* **Performance Enhancements (Code Splitting)**: Implement `React.lazy()` and `Suspense` in the main application router (`App.tsx`) to reduce initial bundle load times.
* **Offline Asset Support**: Download and serve all external dependencies (fonts, icons, JS) locally to allow the application to function correctly without continuous external internet access.

## 4. DevOps & Maintenance

* **Dependency Pinning**: Replace loose `requirements.txt` with rigorous dependency pinning using `pip-tools` (`requirements.in` and compiled `requirements.txt` with hashes) to avoid breakages from unversioned package updates.
* **Secrets Management**: Integrate `python-dotenv` to manage application environment configurations via `.env` files safely and locally rather than relying exclusively on system OS environment variables.
* **API Documentation**: Implement automated OpenAPI/Swagger documentation generation using Flasgger or similar tools for all backend endpoints.
* **Testing Infrastructure**: Improve local test robustness by aggressively mocking external API calls (`requests`, `playwright`) and running tests over isolated, in-memory databases (`sqlite3.connect(':memory:')`). Implement `vitest` for the React components.
