# ECOSYSTEM_IMPROVEMENTS.md

This document summarizes the comprehensive ecosystem improvements identified across the project, including Architectural, Backend, Frontend, and DevOps dimensions. It serves as a unified roadmap derived from multiple existing improvement proposals (`PLAN_DE_MEJORA_INTEGRAL.md`, `PLAN_MEJORA_ESTRATEGICO.md`, `ARCHITECTURE_SCALE_ROADMAP.md`, `PLAN_MEJORA_TECNICA_2025.md`, etc.).

## 1. Architectural & Ecosystem Scale Roadmap

- **Multi-Tenant SaaS Migration**: Transition from a single-user Desktop/Local application to a multi-tenant SaaS architecture supporting vertical-specific configurations (Media, Local, Ecommerce).
- **Strategy & Factory Patterns**: Decouple business logic currently embedded in the frontend and use Strategy/Factory patterns in the backend to instantiate proper rule sets for each SEO project type.
- **Data Centralization & Relational Shift**: Move from distributed SQLite/JSON files (`projects.db`, `projects_db.json`) towards a centralized PostgreSQL schema capable of handling multi-tenancy, user roles, and scalable project states.
- **Directory Restructuring**: Reorganize the flat `apps/` directory (60+ files) into layered semantic sub-packages: `apps/web` (Routes/Controllers), `apps/services` (Business logic), `apps/core` (Infrastructure), `apps/models`, and `apps/utils`.

## 2. Backend Improvements

- **Eliminate Import Side-Effects**: Refactor files like `apps/database.py` and `apps/__init__.py` to avoid executing logic (e.g., `init_db()`, `start_monitor()`) at import time. Strictly use the Flask Application Factory pattern.
- **Asynchronous Processing (Task Queues)**: Migrate blocking logic (e.g., Playwright scraping using `threading.Lock`) to background workers via Celery or RQ (Redis Queue) to free up Flask workers and prevent deadlocks.
- **Dependency Injection & Decoupling**: Pass dependencies (HTTP clients, DB connections) explicitly to services to enable proper isolated unit testing.
- **Security & Validations**:
  - Standardize schema validation using Pydantic for all JSON endpoints.
  - Apply SSRF protections (e.g., `is_safe_url`) universally to all outbound HTTP/Scraping requests.
  - Implement robust secret management using `python-dotenv` instead of relying on pure environment variables in `config.py`.

## 3. Frontend Improvements (React SPA)

- **State Management & Async Calls**: Migrate manual API state management (`useEffect`) to TanStack Query (React Query) for improved caching, retries, and synchronization.
- **CSS Framework Unification**: Eliminate the legacy hybrid approach combining Bootstrap 5 and Tailwind CSS. Standardize entirely on Tailwind CSS to prevent style conflicts and reduce bundle size.
- **Offline / Local Assets Resilience**: Implement a build step to vendor all critical assets (fonts, icons) locally rather than depending entirely on CDNs, preventing UI breakage in offline or restricted-network modes.
- **Internationalization (i18n)**: Implement `react-i18next` and extract hardcoded Spanish strings to JSON resource files to support multi-language scalability.
- **Data Persistence Strategy**: Transition from `localStorage` to IndexedDB (e.g., Dexie.js) for robust local state management, overcoming the 5MB storage limit and preventing main-thread blocking.

## 4. DevOps, Testing & Quality Assurance

- **Strict Dependency Pinning**: Transition from broad `requirements.txt` to `requirements.in` and use `pip-compile` to lock precise dependency versions and generate SHA hashes, ensuring reproducible builds.
- **Testing Environments**:
  - Implement aggressive mocking of network calls (`requests`, `playwright`) for offline and rapid unit testing.
  - Use in-memory databases (`sqlite3.connect(':memory:')`) for integration testing.
  - Increase frontend test coverage using `vitest` for critical UI components and hooks.
- **Code Standards & Pre-commit Hooks**: Enforce styling and quality through tools like `black`, `ruff`, and `mypy` via `.pre-commit-config.yaml`.
- **API Documentation**: Integrate OpenAPI/Swagger generation (e.g., Flasgger) to maintain live, sync-verified API contracts between backend and frontend.
