# Code Quality & Architecture Standards

## Backend (Python / FastAPI)
- **Type Checking**: 100% Type Hints via Pydantic v2. Zero `Any` usage in core domain models.
- **Linting & Formatting**: Enforced via Ruff (or Flake8) and Black.
- **Architecture**: Domain-Driven Design (DDD) principles. The deterministic engine (`app.engine.calculator`) is a pure functional core completely decoupled from HTTP transport layers and database side-effects.

## Frontend (React / TypeScript / Vite)
- **Strict Typing**: TypeScript `strict: true`. No implicit `any`. All schemas explicitly match the backend Pydantic models via `types/index.ts`.
- **State Management**: Zustand for global application state (`useAppStore`, `useAuthStore`) ensuring predictable, immutable state transitions.
- **Styling**: Vanilla CSS custom properties (variables) combined with utility classes, strictly adhering to an established Design Token system. No inline magic numbers.

## CI/CD Enforcement
- GitHub Actions automatically runs backend tests (`pytest`) and frontend tests (`vitest`).
- Pull requests are blocked if code coverage drops below established thresholds or if ESLint rules fail.
