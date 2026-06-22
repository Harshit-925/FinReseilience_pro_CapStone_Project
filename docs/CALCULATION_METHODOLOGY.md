# Calculation Methodology — FinResilience Pro
**FY 2026-27 | Indian Tax Law | RBI Banking Benchmarks**

All constants and formulas in this document are implemented verbatim in
`backend/app/engine/calculator.py`. Every claim is traceable to a primary legal or academic source.

---

## 1. Debt Avalanche Optimizer

**Algorithm:** Debts are sorted by APR (descending). After all minimum payments are made, the entire monthly surplus is applied to the highest-APR debt. Once cleared, the freed-up minimum is rolled into the next debt.

**Source:** Amar, Ariely, Ayal, Cryder & Rick — *"Winning the Battle but Losing the War"*, Journal of Marketing Research, 2011. Also: Kadlec, *TIME Money*, 2014.

**Implementation:** `backend/app/engine/calculator.py`, Lines 141–285 (`optimize_debt_avalanche`)

### Worked Example
```
Input:
  Debt A: Balance ₹50,000, APR 36%, Min ₹2,000/month
  Debt B: Balance ₹1,00,000, APR 14%, Min ₹3,000/month
  Monthly Surplus: ₹8,000

Month 1:
  Interest Accrued: A = ₹50,000 × 36%/12 = ₹1,500  |  B = ₹1,00,000 × 14%/12 = ₹1,167
  Balances after interest: A = ₹51,500  |  B = ₹1,01,167
  Minimums paid: A = ₹2,000  |  B = ₹3,000  →  Remaining = ₹8,000 - ₹5,000 = ₹3,000
  Avalanche surplus routed to A (36% APR > 14%): A balance → ₹51,500 - ₹2,000 - ₹3,000 = ₹46,500

Month 14 (approx.):
  Debt A cleared → ₹2,000 minimum freed and rolled into Debt B
  Effective monthly payment on B = ₹3,000 + ₹2,000 + ₹3,000 (surplus) = ₹8,000
  → B clears months faster than minimum-only scenario
```

---

## 2. Tax Shield Maximizer (CBDT FY 2026-27)

**Primary Source:** Income-tax Act, 1961; Finance Act 2025.

**Implementation:** `backend/app/engine/calculator.py`, Lines 316–455 (`maximize_tax_shield`)

### Constants (hard-coded at lines 30–39)

| Section | Limit | Legal Reference |
|---------|-------|-----------------|
| 80C + 80CCC (combined) | ₹1,50,000 | Section 80C(2), IT Act 1961 (as amended Finance Act 2014) |
| 80CCD(1B) NPS additional | ₹50,000 | Section 80CCD(1B), IT Act 1961 (inserted Finance Act 2015) |
| 80D Self below 60 | ₹25,000 | Section 80D, IT Act 1961 |
| 80D Self 60+ (Senior) | ₹50,000 | Section 80D (as amended Finance Act 2018) |
| 80D Parents below 60 | ₹25,000 | Section 80D, IT Act 1961 |
| 80D Parents 60+ (Senior) | ₹50,000 | Section 80D (as amended Finance Act 2018) |
| 80E Education Loan Interest | No cap, max 8 years | Section 80E, IT Act 1961 |
| HRA Metro exemption | 50% of Basic Salary | Section 10(13A), Rule 2A IT Rules 1962 |
| HRA Non-Metro exemption | 40% of Basic Salary | Section 10(13A), Rule 2A IT Rules 1962 |

### HRA Exemption Formula
```
HRA Exempt = min(
    Actual HRA Received × 12,
    Annual Rent Paid − 10% × Annual Basic Salary,
    Metro% × Annual Basic Salary          ← 50% metro / 40% non-metro
)
```
**Implemented at:** `backend/app/engine/calculator.py`, Lines 421–440

### Worked Example (80C + HRA)
```
Input:
  Annual Income: ₹12,00,000  |  Basic: ₹4,80,000/year  |  City: Metro
  Annual Rent: ₹1,80,000  |  HRA Received: ₹15,000/month = ₹1,80,000/year
  Existing 80C investments: ₹1,00,000 (PPF)

80C gap: ₹1,50,000 − ₹1,00,000 = ₹50,000 recommended (ELSS/NPS)
  Tax saved at 20% slab: ₹50,000 × 0.20 = ₹10,000

HRA Exempt = min(₹1,80,000, ₹1,80,000 − ₹48,000, ₹2,40,000)
           = min(₹1,80,000, ₹1,32,000, ₹2,40,000) = ₹1,32,000
  Tax saved at 20% slab: ₹1,32,000 × 0.20 = ₹26,400
```

### Income Tax Slabs — Old Regime FY 2026-27
| Slab | Rate | Source |
|------|------|--------|
| ₹0 – ₹2,50,000 | 0% | Finance Act 2025 / CBDT Circular 01/2025 |
| ₹2,50,001 – ₹5,00,000 | 5% | Finance Act 2025 |
| ₹5,00,001 – ₹10,00,000 | 20% | Finance Act 2025 |
| ₹10,00,001 and above | 30% | Finance Act 2025 |

---

## 3. Fixed Obligation to Income Ratio (FOIR)

**Formula:** `FOIR = Total Monthly EMIs / Gross Monthly Income`

**Benchmark:** ≤ 40% is considered optimal by major Indian retail lenders.

**Source:** RBI Master Direction on Credit Card and Debit Card Issuance (2022); SBI/HDFC published retail FOIR guidelines (40–45%).

**Implementation:** `backend/app/engine/calculator.py`, Lines 470–559 (`calculate_health_score`)

### Worked Example
```
Monthly Income: ₹1,00,000  |  Total EMIs: ₹28,000
FOIR = ₹28,000 / ₹1,00,000 = 28%  →  Grade: Excellent (≤ 40%)

Monthly Income: ₹80,000  |  Total EMIs: ₹42,000
FOIR = ₹42,000 / ₹80,000 = 52.5%  →  Grade: Needs Attention (> 40%)
```

---

## 4. Savings Rate (50/30/20 Rule)

**Formula:** `Savings Rate = (Income − Total Expenses) / Income`

**Target:** ≥ 20% allocated to long-term wealth assets.

**Source:** Warren & Tyagi, *"All Your Worth"* (2005); adapted by AMFI/NPS Trust investor education material.

**Implementation:** `backend/app/engine/calculator.py`, Line 515

### Worked Example
```
Income: ₹1,00,000  |  Expenses (incl. EMI): ₹72,000
Savings Rate = (₹1,00,000 − ₹72,000) / ₹1,00,000 = 28%  → Target met ✓

Income: ₹60,000  |  Expenses: ₹55,000
Savings Rate = ₹5,000 / ₹60,000 = 8.3%  → Below 20% target ✗
```

---

## 5. Composite Financial Health Score

**Formula:** `Score = 0.40 × FOIR_score + 0.35 × Savings_score + 0.25 × Emergency_score`

| Component | Weight | 100-point Benchmark |
|-----------|--------|---------------------|
| FOIR | 40% | ≤ 40% EMI/Income → 100 pts, linear decay to 0 at 100% |
| Savings Rate | 35% | ≥ 20% → 100 pts, linear decay to 0 below |
| Emergency Buffer | 25% | ≥ 3 months expenses → 100 pts |

**Implementation:** `backend/app/engine/calculator.py`, Lines 537–559

### Grade Mapping
| Score | Grade | Label |
|-------|-------|-------|
| 90–100 | A+ | Excellent |
| 80–89 | A | Very Good |
| 70–79 | B+ | Good |
| 60–69 | B | Fair |
| 40–59 | C | Needs Attention |
| 20–39 | D | At Risk |
| 0–19 | F | Critical |
