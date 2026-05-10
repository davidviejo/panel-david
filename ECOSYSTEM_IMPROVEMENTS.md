# Ecosystem Improvements Summary

This document synthesizes the strategic, architectural, backend, frontend, and DevOps improvement plans identified across the codebase.

## 1. Backend Refactoring & Architecture

- **Dependency Injection & Separation of Concerns**: Extract business logic from `apps/` into structured layers (`apps/web`, `apps/services`, `apps/core`, `apps/models`).
- **Remove Side Effects**: Prevent implicit connections (e.g., `init_db()`) on import, moving initialization into application factories (`create_app`).
- **Centralized Data Storage**: Ensure SQLite DBs and reports are saved to a central `data/` directory rather than project root.
- **Factory/Strategy Pattern**: Implement Factory/Strategy patterns to support multi-tenant SaaS features (Media, Local, Ecommerce) and decouple logic currently in frontend `constants.tsx`.

## 2. Frontend Modernization & UX

- **Tailwind Standardization**: Unify CSS framework to use Tailwind CSS exclusively, gradually deprecating Bootstrap. Remove CDN dependence by implementing a build step for offline assets.
- **Data Management**: Integrate React Query (TanStack Query) or SWR for API fetching and state management.
- **Internationalization (i18n)**: Migrate hardcoded text to translation files using `react-i18next`.

## 3. DevOps, QA & Security

- **Environment & Secrets**: Introduce `python-dotenv` for backend secret management.
- **Dependency Pinning**: Use `pip-tools` to generate strict `requirements.txt` with locked versions and hashes.
- **SSRF Protection & Validation**: Ensure `is_safe_url` is mandatory for outgoing requests; apply Pydantic for input validation.
- **Testing Strategy**: Expand frontend test coverage using `vitest`; improve backend tests using memory databases (`:memory:`) and network mocking.
- **Async Processing**: Transition synchronous web scraping tasks to background workers (e.g., Playwright Async API).
