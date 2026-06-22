# Security Architecture & Data Privacy Model

FinResilience Pro operates on a "Privacy-First, Deterministic Math" security model.

## 1. Authentication & Authorization
- **Provider**: PocketBase Local Instance (SQLite).
- **Strategy**: JWT-based session tokens.
- **Enforcement**: FastAPI backend strictly verifies incoming JWT tokens by proxying `auth-refresh` back to PocketBase before performing any analysis or data modifications.
- **Rule**: `user.id = @request.auth.id` enforced at the database level for goals, history, and reports.

## 2. Data Retention & Privacy
- User financial data (income, expenses, debts) is strictly processed in-memory for the analysis.
- Summarized health scores are persisted only if the user is authenticated.
- **No AI Model Training**: Financial data routed to the Google Gemini AI Service fallback is isolated, transient, and stripped of PII. We explicitly guarantee that user financial structures are not used to train global LLM models.

## 3. Network Security
- **Content Security Policy (CSP)**: Strictly locked down to `self`, PocketBase (8090), and API (8000).
- **HSTS**: Strict-Transport-Security enabled.
- **Rate Limiting**: `slowapi` enforces limits on the `/api/analyze` endpoint (e.g., 5 requests/minute) to prevent brute-force attacks and abuse of the AI service.

## 4. Dependencies
- Pinned explicitly in `requirements.txt` and `package-lock.json`.
- Handled locally without external CDN leakage where possible.
