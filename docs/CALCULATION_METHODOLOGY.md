# Calculation Methodology (India Specific)

FinResilience Pro utilizes established banking algorithms and domestic tax codes to drive deterministic output.

## 1. Debt Avalanche Routing
The engine prioritizes high-interest debt mathematically to minimize absolute lifetime interest outflow.
- **Sorting**: Debts are sorted dynamically by `APR` descending.
- **Allocation**: The monthly surplus is aggressively routed to the debt at the top of the queue, while minimum payments are sustained for lower-tier debts.
- **Reference**: Journal of Consumer Research 2016 consensus on rational debt elimination.

## 2. Tax Deductions Shield (FY 2026-27 CBDT)
- **80C Framework**: Caps at ₹1,50,000. Aggregates ELSS, PPF, EPF.
- **80CCD(1B)**: Identifies gaps in NPS contributions up to the distinct ₹50,000 limit.
- **80D**: Healthcare coverage analysis up to tiered caps based on `age_self` and `age_parents`.
- **HRA Component**: Assesses Section 10(13A) compliance mathematically determining the minimum of (Actual HRA vs 50%/40% Basic vs Rent - 10% Basic).

## 3. Fixed Obligation to Income Ratio (FOIR)
- **Calculation**: `Total Monthly EMIs / Net Monthly Income`.
- **Benchmarks**: Assessed against major Indian lending benchmarks (SBI/HDFC), targeting ≤ 40% for optimal borrowing health.

## 4. Savings Rate
- **Calculation**: `(Income - Expenses) / Income`.
- **Target**: Modeled on the domestic adaptation of the 50/30/20 rule, demanding a minimum 20% routed to long-term wealth assets.
