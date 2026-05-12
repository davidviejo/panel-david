# Ecosystem Improvements Summary

This document consolidates the various strategic and technical improvement plans across the backend and frontend into a comprehensive roadmap for the project's ecosystem.

## 1. Architectural Improvements
*   **Directory Reorganization (`apps/`)**: Structure the backend into semantic sub-packages (`apps/web`, `apps/services`, `apps/core`, `apps/models`, `apps/utils`) to separate concerns (routing, business logic, infrastructure).
*   **Remove Import Side-Effects**: Move database initialization (`init_db`) and monitoring startup from module-level to an Application Factory pattern (`create_app()`) to facilitate isolated testing.
*   **Data Centralization**: Standardize data persistence into a centralized `data/` directory managed via configuration, rather than scattering SQLite files like `projects.db`.
*   **Dependency Injection**: Refactor services to accept dependencies explicitly rather than hardcoding instantiations, enabling effective mocking during testing.
*   **Strategy Pattern for Vertical Scaling**: Migrate business logic from frontend to backend using Strategy and Factory patterns to support a Multi-Tenant SaaS model handling different project verticals (Media, Local, Ecommerce).

## 2. Backend Improvements
*   **Async Processing & Task Queues**: Introduce background job workers (e.g., Celery, RQ, or the existing `JobRunner` with `ThreadPoolExecutor`) to handle heavy scraping and asynchronous tasks without blocking the main Flask server threads.
*   **Robust Scraping Strategies**: Implement a unified `ScraperProvider` interface to handle different scraping methods (Playwright Async, ZenRows, Requests) safely.
*   **Input Validation & Security**: Enforce strict schema validation using Pydantic for JSON endpoints. Ensure SSRF protection by mandating the `is_safe_url` utility for all outgoing requests and properly configure CORS.
*   **Centralized Configuration**: Adopt `python-dotenv` for secure environment variable management instead of relying entirely on system-level `os.environ`.
*   **API Documentation**: Integrate Flasgger or similar tools to auto-generate OpenAPI/Swagger documentation from docstrings.

## 3. Frontend Improvements (M3 & React)
*   **UI Framework Unification**: Standardize on Tailwind CSS as the primary styling framework. Progressively remove Bootstrap 5 legacy code to prevent style conflicts and reduce bundle size.
*   **Data Architecture & State Management**: Expand the use of TanStack Query (React Query) for API data fetching and state management. Refactor monolithic contexts (`ProjectContext`) using tools like Zustand or by splitting them up.
*   **Code Splitting & Lazy Loading**: Utilize `React.lazy()` and `Suspense` in `App.tsx` to load routes on demand, reducing the initial bundle load.
*   **Offline Support & Assets**: Eliminate reliance on external CDNs by serving fonts and assets locally. Move towards Progressive Web App (PWA) capabilities and robust local persistence via IndexedDB (using Dexie.js) instead of `localStorage`.
*   **Dynamic Navigation**: Transition to a Configuration-Driven UI for elements like the sidebar menu, replacing hardcoded HTML with dynamic rendering based on configuration objects.
*   **UX Enhancements**: Implement Undo/Redo functionality, advanced data export (PDF/CSV), and Skeleton screens for improved loading feedback.

## 4. DevOps, QA, and Quality
*   **Strict Dependency Management**: Use `pip-tools` (e.g., `pip-compile`) to maintain a `requirements.txt` with locked exact versions and hashes, preventing unexpected breakages from unpinned libraries like `flask` or `pandas`.
*   **Offline/Isolated Testing Strategy**: Aggressively mock external networks (using tools like `pytest-mock` and custom test runners) and rely on in-memory databases (`sqlite3.connect(':memory:')`) for integration testing in sparse environments.
*   **Code Health & Standards**: Enforce consistent formatting and linting via pre-commit hooks (using `ruff`, `black`). Introduce static type checking with `mypy` and strict TypeScript interfaces for the frontend.
*   **Structured Issue Resolution**: Adopt a standardized workflow for code health tasks: UNDERSTAND, ASSESS, PLAN, IMPLEMENT, VERIFY, and DOCUMENT, complete with structured PR templates.
