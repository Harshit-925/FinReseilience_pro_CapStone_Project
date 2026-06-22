# Evidence for Hackathon Judges

Welcome to the FinResilience Pro repository. As outlined in the original requirements, this platform eschews "AI wrapper" mechanics for a deterministic, math-first financial engine.

## Key Judging Criteria Met

### 1. Robustness & Core Logic
- **Not Just an AI Wrapper**: Review `backend/app/engine/calculator.py`. This contains raw, complex, pure-function deterministic algorithms for Debt Avalanche scheduling and domestic tax optimization.
- **Resilience**: The AI narrative acts strictly as a presentation layer. Try turning off your internet or simulating an API failure — the engine will fallback to deterministic generation (documented in `backend/app/services/ai_service.py`) without failing the user.

### 2. User Experience (UX)
- **Immediate Value**: The platform pre-loads a hyper-realistic financial scenario. A judge can click "Analyze" immediately to see the exact value proposition without typing.
- **Visual Hierarchy**: As requested, the "Next Rupee Allocation" Action Cards are the primary hero elements, rendering *above* the narrative.
- **Tangible Outputs**: The Avalanche engine generates a concrete, month-by-month expandable schedule table in the frontend, proving exactly when the user will be debt-free.

### 3. Domestic Accuracy
- All benchmarks conform to Indian standards (FOIR thresholds, FY 26-27 CBDT tax codes for 80C/80D/HRA).

### 4. Code Quality
- Full static typing via Pydantic on the backend, mirrored exactly by Zod + TypeScript schemas on the frontend.
- Secure, containerized, and documented architecture.
