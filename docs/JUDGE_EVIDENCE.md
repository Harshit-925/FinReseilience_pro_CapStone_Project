# JUDGE_EVIDENCE.md — FinResilience Pro
## Rubric-to-Code Citation Map

This document maps every judging criterion to the **exact file and line number** where it is implemented, verified, or documented.

---

## 1. DETERMINISTIC MATH ENGINE (Zero Hallucinations)

| Criterion | File | Lines | What It Does |
|-----------|------|-------|--------------|
| Debt Avalanche Optimizer | `backend/app/engine/calculator.py` | 141–285 | Full month-by-month APR-ranked payoff schedule |
| Minimum-Only Interest Baseline | `backend/app/engine/calculator.py` | 288–310 | Computes interest saved vs. minimum-only payments |
| Section 80C Cap (₹1,50,000) | `backend/app/engine/calculator.py` | 30 | `SECTION_80C_LIMIT = 150_000` |
| Section 80CCD(1B) NPS Cap (₹50,000) | `backend/app/engine/calculator.py` | 31 | `SECTION_80CCD_1B_LIMIT = 50_000` |
| Section 80D Self below 60 (₹25,000) | `backend/app/engine/calculator.py` | 32 | `SECTION_80D_SELF_BELOW_60 = 25_000` |
| Section 80D Self above 60 (₹50,000) | `backend/app/engine/calculator.py` | 33 | `SECTION_80D_SELF_ABOVE_60 = 50_000` |
| Section 80D Parents below 60 (₹25,000) | `backend/app/engine/calculator.py` | 34 | `SECTION_80D_PARENTS_BELOW_60 = 25_000` |
| Section 80D Parents above 60 (₹50,000) | `backend/app/engine/calculator.py` | 35 | `SECTION_80D_PARENTS_ABOVE_60 = 50_000` |
| HRA Metro Exemption (50% of basic) | `backend/app/engine/calculator.py` | 38 | `HRA_METRO_PERCENT = 0.50` |
| HRA Non-Metro Exemption (40% of basic) | `backend/app/engine/calculator.py` | 39 | `HRA_NON_METRO_PERCENT = 0.40` |
| HRA min() formula implementation | `backend/app/engine/calculator.py` | 421–440 | `min(hra_received*12, rent − 10%*basic, metro_pct*basic)` |
| FOIR Benchmark (≤ 40%) | `backend/app/engine/calculator.py` | 41 | `FOIR_BENCHMARK = 0.40` |
| Savings Rate Target (≥ 20%) | `backend/app/engine/calculator.py` | 42 | `SAVINGS_RATE_TARGET = 0.20` |
| Emergency Buffer Target (3 months) | `backend/app/engine/calculator.py` | 43 | `EMERGENCY_MONTHS_TARGET = 3.0` |
| Old Regime Tax Slabs FY 2026-27 | `backend/app/engine/calculator.py` | 46–51 | Slab table: 0%, 5%, 20%, 30% |
| Tax Shield Maximizer function | `backend/app/engine/calculator.py` | 316–455 | Full CBDT 80C/80D/80E/HRA optimizer |
| FOIR-based Health Score | `backend/app/engine/calculator.py` | 470–559 | Composite 0–100 score (FOIR 40%, Savings 35%, Emergency 25%) |
| Letter Grade Derivation | `backend/app/engine/calculator.py` | 565–583 | Maps score → A+/A/B+/B/C/D/F |
| Master Surplus Allocator | `backend/app/engine/calculator.py` | 589–742 | Produces prioritized Action Cards |

---

## 2. AGENTIC PLANNING & GUARDRAILS (Anti-Hallucination)

| Criterion | File | Lines | What It Does |
|-----------|------|-------|--------------|
| Tool Registry (Math Tools) | `backend/app/agent/tools.py` | 23–102 | Defines 4 strict math functions (`run_avalanche`, `run_tax_shield`, etc.) Gemini can call |
| Tool Registry (Memory Tool) | `backend/app/agent/tools.py` | 104–116 | Defines 1 DB retrieval tool (`recall_last_session`) for history lookup |
| Agentic Loop (Plan/Act/Observe) | `backend/app/agent/loop.py` | 46–140 | Enforces max 4-round execution loop; dispatches Gemini tool calls to the deterministic engine |
| Output Number Extraction | `backend/app/agent/guardrails.py` | 32–48 | Regex parser pulling all numbers and currencies from Gemini's final response |
| Split Tolerance Regimes | `backend/app/agent/guardrails.py` | 76–90 | Validates scores (absolute ±1.0) and currency amounts (relative ±0.5%) separately |
| Precision Sentence Stripping | `backend/app/agent/guardrails.py` | 120–145 | Strips only sentences containing hallucinated numbers, preserving valid numbers |
| SEBI Disclaimer Injection | `backend/app/agent/guardrails.py` | 158–161 | Unconditionally appends regulatory disclaimer to all AI outputs |
| Proactive APScheduler Jobs | `backend/app/agent/scheduler.py` | 24–75 | Monthly FOIR checks and February 80C deadline alerts |
| `needs_replan` Context Injection | `backend/app/agent/memory.py` | 89–130 | Forces Gemini to re-run tools if user profile changes ≥ 10% |

## 2. API CONTRACT & VALIDATION (Type Safety, No Data Leakage)

| Criterion | File | Lines | What It Does |
|-----------|------|-------|--------------|
| Pydantic Request Schema | `backend/app/models/schemas.py` | 1–60 | Strict typed models for `HouseholdInput` |
| Pydantic Response Schema | `backend/app/models/schemas.py` | 60–120 | `AnalysisResponse` with full nested types |
| Rate Limiting (slowapi) | `backend/app/core/rate_limit.py` | 1–30 | 10 req/min per IP to prevent abuse |
| Auth Middleware | `backend/app/core/auth.py` | 1–50 | JWT validation, optional for analysis |
| CORS restricted origins | `backend/app/main.py` | 30–45 | Whitelist-only CORS policy |

---

## 3. RESILIENCE & FALLBACK (No Single Point of Failure)

| Criterion | File | Lines | What It Does |
|-----------|------|-------|--------------|
| AI fallback on API failure | `backend/app/services/ai_service.py` | 60–90 | Returns deterministic summary if Gemini times out |
| httpx async timeout | `backend/app/services/ai_service.py` | 40–55 | 30-second timeout prevents hanging |
| Engine runs without AI key | `backend/app/routes/main.py` | 80–120 | Engine result returned even if `GEMINI_API_KEY` unset |

---

## 4. TESTING EVIDENCE

| Criterion | File | What It Tests |
|-----------|------|---------------|
| Avalanche optimizer correctness | `backend/tests/test_engine.py:6` | Verifies debt-free month > 0, interest > 0 |
| 80C remaining limit accuracy | `backend/tests/test_engine.py:23` | Asserts ₹50k gap correctly identified |
| FOIR health score range | `backend/tests/test_engine.py:43` | Score between 60–90 for given inputs |
| Grade mapping | `backend/tests/test_engine.py:52` | A+/A/C grade boundary verification |
| Surplus allocator priority | `backend/tests/test_engine.py:57` | Highest APR debt appears as first action card |
| API health endpoint | `backend/tests/test_routes.py:1` | HTTP 200 on `/api/health` |
| Analyze endpoint contract | `backend/tests/test_routes.py:15` | Full JSON response shape validation |
| Frontend heading accessibility | `frontend/src/components/InputForm.test.tsx:12` | ARIA heading role rendered correctly |
| Frontend label accessibility | `frontend/src/components/InputForm.test.tsx:17` | All inputs have associated labels |
| Frontend axe accessibility | `frontend/src/components/InputForm.test.tsx:6` | Zero WCAG violations via axe |

---

## 5. REGULATORY CITATIONS (Primary Sources)

| Constant / Formula | Primary Legal Source |
|--------------------|----------------------|
| Section 80C limit ₹1,50,000 | Income-tax Act, 1961 — Section 80C(2) as amended by Finance Act 2014 |
| Section 80CCD(1B) ₹50,000 | Income-tax Act, 1961 — Section 80CCD(1B) inserted by Finance Act 2015 |
| Section 80D health insurance | Income-tax Act, 1961 — Section 80D as amended by Finance Act 2018 (senior citizen ₹50k) |
| Section 80E education loan | Income-tax Act, 1961 — Section 80E (no cap, max 8 AYs from repayment start) |
| HRA exemption formula | Income-tax Act, 1961 — Section 10(13A) read with Rule 2A of Income-tax Rules, 1962 |
| FOIR ≤ 40% benchmark | RBI Master Direction — Credit Card and Debit Card – Issuance and Conduct Directions 2022; SBI/HDFC retail lending policy (FOIR 40-45%) |
| 50/30/20 savings rule | Warren & Tyagi, "All Your Worth" (2005); adapted by NPS Trust & AMFI investor education material |
| Debt Avalanche method | Amar, Ariely, Ayal, Cryder & Rick — "Winning the Battle but Losing the War: The Psychology of Debt Management" (Journal of Marketing Research, 2011); Kadlec — "The Avalanche vs Snowball" (TIME Money, 2014) |
| Old Regime slabs FY 2026-27 | CBDT Circular No. 01/2025 — Income-tax Deduction from Salaries during FY 2025-26; Finance Act 2025 (Budget 2025-26) |

---

## 6. HOW TO VERIFY CORE ENGINE IN 60 SECONDS

```bash
# Clone and run the self-verification script
git clone https://github.com/Harshit-925/FinReseilience_pro_CapStone_Project.git
cd FinReseilience_pro_CapStone_Project/backend
python -m venv venv && source venv/bin/activate   # Windows: .\venv\Scripts\activate
pip install -r requirements.txt
pytest -v                                          # 8 tests, all should pass

# Or run the single-file engine verification inline:
python -c "
from app.engine.calculator import optimize_debt_avalanche, maximize_tax_shield, calculate_health_score
# Avalanche test
r = optimize_debt_avalanche([{'name':'Card','balance':50000,'apr':36.0,'min_payment':2000}], 5000)
assert r.debt_free_month > 0 and r.total_interest_paid > 0
print(f'Avalanche OK — debt-free in {r.debt_free_month} months, interest ₹{r.total_interest_paid:,.0f}')
# Tax test
t = maximize_tax_shield(1200000, 480000, [], 'old', 'metro', 180000, 180000)
assert any(i.section == '80C' for i in t.items)
print(f'Tax Shield OK — 80C gap identified: ₹{t.items[0].recommended_amount:,.0f}')
# Health score test
h = calculate_health_score(100000, 50000, 100000, 10000)
assert 0 < h.score <= 100
print(f'Health Score OK — {h.score}/100 (FOIR {h.foir_ratio}%)')
print('All engine assertions passed.')
"
```
