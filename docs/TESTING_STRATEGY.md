# Testing Strategy

Our testing strategy follows the Testing Pyramid to ensure rapid feedback and robust coverage.

## 1. Unit Testing (Engine Core)
- **Scope**: The determinist math engine (`calculator.py`).
- **Framework**: `pytest`.
- **Coverage**: Mathematical edge cases for the Debt Avalanche algorithm (handling negative balances, APR edge cases) and Tax Shield logic (maximizing 80C vs 80D).
- **Execution**: Runs in `< 100ms`.

## 2. Integration Testing (API Layer)
- **Scope**: FastAPI endpoints (`/api/analyze`, `/api/health`).
- **Framework**: `pytest` + `TestClient`.
- **Coverage**: Dependency override mocking for PocketBase authentication middleware, ensuring 401s on unauthorized access and valid JSON schema responses on success.

## 3. Frontend & Accessibility Testing
- **Scope**: React components (`InputForm.tsx`, `LoginForm.tsx`).
- **Framework**: `Vitest` + `@testing-library/react`.
- **Coverage**: Interaction testing and A11y assertions via `jest-axe` ensuring no WCAG violations.

## 4. End-to-End (E2E) Testing
- **Scope**: Full user journey from sign-up, input provision, and report export.
- **Tooling**: TestSprite E2E AI Agent integration for continuous automated visual and functional verification.
