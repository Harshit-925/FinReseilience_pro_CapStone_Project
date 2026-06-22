"""
FinResilience Pro — Domain Engine (calculator.py)

Pure deterministic financial optimization engine.
No external calls, no AI, no side effects.

All functions are pure: same input → same output, every time.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

# ---------------------------------------------------------------------------
# Cited sources — every constant/formula traces back to one of these
# ---------------------------------------------------------------------------
SOURCE = (
    "RBI & Major Indian Banking Lending Benchmarks — SBI/HDFC FOIR Guidelines "
    "(FOIR ≤ 40-45% optimal for retail individuals); "
    "CBDT Section 80C/80CCC/80CCD(1B)/80D/80E (Income Tax Act, FY 2026-27); "
    "Section 10(13A) HRA Exemption Rules; "
    "50/30/20 Rule (All Your Worth, 2005) adapted to domestic income streams; "
    "Debt Avalanche Method (Academic Consensus — Journal of Consumer Research 2016)"
)

# ---------------------------------------------------------------------------
# Constants — Indian FY 2026-27
# ---------------------------------------------------------------------------
SECTION_80C_LIMIT = 150_000       # ₹1,50,000 combined cap (incl. 80CCC)
SECTION_80CCD_1B_LIMIT = 50_000   # ₹50,000 additional NPS
SECTION_80D_SELF_BELOW_60 = 25_000
SECTION_80D_SELF_ABOVE_60 = 50_000
SECTION_80D_PARENTS_BELOW_60 = 25_000
SECTION_80D_PARENTS_ABOVE_60 = 50_000
SECTION_80D_PREVENTIVE_SUBLIMIT = 5_000
# 80E: no cap (full education loan interest, max 8 years)
HRA_METRO_PERCENT = 0.50          # 50% of basic for metro cities
HRA_NON_METRO_PERCENT = 0.40      # 40% of basic for non-metro

FOIR_BENCHMARK = 0.40             # ≤ 40% is optimal (RBI/SBI/HDFC)
SAVINGS_RATE_TARGET = 0.20        # ≥ 20% target (50/30/20 rule)
EMERGENCY_MONTHS_TARGET = 3.0     # ≥ 3 months of expenses

# Income tax slabs — Old Regime FY 2026-27
OLD_REGIME_SLABS: list[tuple[float, float, float]] = [
    (0, 250_000, 0.00),
    (250_000, 500_000, 0.05),
    (500_000, 1_000_000, 0.20),
    (1_000_000, float("inf"), 0.30),
]


# ---------------------------------------------------------------------------
# Data classes for structured output
# ---------------------------------------------------------------------------
@dataclass
class DebtPayment:
    """A single debt's payment detail for one month."""
    debt_name: str
    payment_amount: float
    running_balance: float


@dataclass
class MonthRow:
    """One month in the payoff schedule."""
    month: int
    payments: list[DebtPayment]
    cumulative_interest: float
    total_paid_this_month: float


@dataclass
class PayoffSchedule:
    """Full avalanche payoff result."""
    schedule: list[MonthRow]
    total_interest_paid: float
    total_interest_saved_vs_minimum: float
    debt_free_month: int
    total_months: int


@dataclass
class TaxAllocationItem:
    """One recommended tax-saving investment."""
    section: str
    instrument: str
    recommended_amount: float
    tax_saved_at_slab: float
    priority: int
    remaining_limit: float


@dataclass
class TaxAllocation:
    """Full tax shield recommendation."""
    items: list[TaxAllocationItem]
    total_tax_saved: float
    total_invested: float
    note: str = ""


@dataclass
class HealthScore:
    """Composite financial health assessment."""
    score: float
    foir_ratio: float
    savings_rate: float
    emergency_months: float
    component_scores: dict[str, float] = field(default_factory=dict)
    component_benchmarks: dict[str, str] = field(default_factory=dict)


@dataclass
class ActionCard:
    """A single prioritized action recommendation."""
    priority: int
    action_type: str       # PAY_DEBT, INVEST_TAX, SAVE
    destination: str
    amount: float
    rationale: str
    impact_metric: str


@dataclass
class AllocationPlan:
    """Master allocation output — the hero result."""
    action_cards: list[ActionCard]
    payoff_schedule: PayoffSchedule
    tax_allocation: TaxAllocation
    health_score: HealthScore
    grade: str
    grade_label: str
    surplus: float


# ---------------------------------------------------------------------------
# 1. Debt Avalanche Optimizer
# ---------------------------------------------------------------------------
def optimize_debt_avalanche(
    debts: list[dict[str, Any]],
    monthly_surplus: float,
) -> PayoffSchedule:
    """
    Full month-by-month payoff schedule using the Avalanche method.

    Each debt dict: {name: str, balance: float, apr: float, min_payment: float}
    Surplus is applied to highest-APR debt first after all minimums are paid.

    Returns a PayoffSchedule with per-month detail.
    """
    if not debts or monthly_surplus <= 0:
        return PayoffSchedule(
            schedule=[],
            total_interest_paid=0.0,
            total_interest_saved_vs_minimum=0.0,
            debt_free_month=0,
            total_months=0,
        )

    # Deep copy balances so we don't mutate input
    active_debts = [
        {
            "name": d["name"],
            "balance": float(d["balance"]),
            "apr": float(d["apr"]),
            "min_payment": float(d["min_payment"]),
        }
        for d in debts
    ]

    # Also compute minimum-only scenario for interest comparison
    min_only_interest = _compute_minimum_only_interest(debts)

    schedule: list[MonthRow] = []
    cumulative_interest = 0.0
    month = 0
    max_months = 600  # 50-year safety cap

    while any(d["balance"] > 0.01 for d in active_debts) and month < max_months:
        month += 1
        month_interest = 0.0
        month_payments: list[DebtPayment] = []
        remaining_surplus = monthly_surplus

        # Step 1: Accrue interest on all debts
        for debt in active_debts:
            if debt["balance"] > 0:
                interest = debt["balance"] * (debt["apr"] / 100.0 / 12.0)
                debt["balance"] += interest
                month_interest += interest

        cumulative_interest += month_interest

        # Step 2: Pay minimums on all debts
        for debt in active_debts:
            if debt["balance"] > 0:
                payment = min(debt["min_payment"], debt["balance"])
                debt["balance"] -= payment
                remaining_surplus -= payment
                # We'll update the DebtPayment after surplus allocation

        # Step 3: Avalanche — route remaining surplus to highest-APR debt
        # Sort by APR descending for surplus allocation
        sorted_indices = sorted(
            range(len(active_debts)),
            key=lambda i: active_debts[i]["apr"],
            reverse=True,
        )

        for idx in sorted_indices:
            if remaining_surplus <= 0:
                break
            debt = active_debts[idx]
            if debt["balance"] > 0:
                extra = min(remaining_surplus, debt["balance"])
                debt["balance"] -= extra
                remaining_surplus -= extra

        # Record payments for this month
        total_paid = 0.0
        for debt in active_debts:
            original_balance = 0.0
            # Find what the balance was before this month's payments
            for d in debts:
                if d["name"] == debt["name"]:
                    original_balance = float(d["balance"])
                    break
            # Current balance after payments
            payment_entry = DebtPayment(
                debt_name=debt["name"],
                payment_amount=0.0,  # Will compute below
                running_balance=round(max(debt["balance"], 0), 2),
            )
            month_payments.append(payment_entry)

        # Compute actual payments by comparing with previous month
        if len(schedule) > 0:
            prev_row = schedule[-1]
            for i, pm in enumerate(month_payments):
                prev_balance = prev_row.payments[i].running_balance
                # Payment = prev_balance + interest_accrued - current_balance
                debt_apr = active_debts[i]["apr"]
                interest_on_this = prev_balance * (debt_apr / 100.0 / 12.0)
                pm.payment_amount = round(
                    max(prev_balance + interest_on_this - pm.running_balance, 0), 2
                )
                total_paid += pm.payment_amount
        else:
            # First month: compare against original balances
            for i, pm in enumerate(month_payments):
                orig_bal = float(debts[i]["balance"])
                debt_apr = active_debts[i]["apr"]
                interest_on_this = orig_bal * (debt_apr / 100.0 / 12.0)
                pm.payment_amount = round(
                    max(orig_bal + interest_on_this - pm.running_balance, 0), 2
                )
                total_paid += pm.payment_amount

        # Clamp negative balances
        for debt in active_debts:
            debt["balance"] = max(debt["balance"], 0)
            for pm in month_payments:
                if pm.debt_name == debt["name"]:
                    pm.running_balance = round(debt["balance"], 2)

        schedule.append(
            MonthRow(
                month=month,
                payments=month_payments,
                cumulative_interest=round(cumulative_interest, 2),
                total_paid_this_month=round(total_paid, 2),
            )
        )

    interest_saved = max(min_only_interest - cumulative_interest, 0)

    return PayoffSchedule(
        schedule=schedule,
        total_interest_paid=round(cumulative_interest, 2),
        total_interest_saved_vs_minimum=round(interest_saved, 2),
        debt_free_month=month,
        total_months=month,
    )


def _compute_minimum_only_interest(debts: list[dict[str, Any]]) -> float:
    """Simulate minimum-only payments to compute total interest for comparison."""
    sim_debts = [
        {"balance": float(d["balance"]), "apr": float(d["apr"]),
         "min_payment": float(d["min_payment"])}
        for d in debts
    ]
    total_interest = 0.0
    month = 0
    max_months = 600

    while any(d["balance"] > 0.01 for d in sim_debts) and month < max_months:
        month += 1
        for debt in sim_debts:
            if debt["balance"] > 0:
                interest = debt["balance"] * (debt["apr"] / 100.0 / 12.0)
                total_interest += interest
                debt["balance"] += interest
                payment = min(debt["min_payment"], debt["balance"])
                debt["balance"] -= payment
                debt["balance"] = max(debt["balance"], 0)

    return total_interest


# ---------------------------------------------------------------------------
# 2. Indian Tax Shield Maximizer
# ---------------------------------------------------------------------------
def maximize_tax_shield(
    annual_income: float,
    basic_salary: float,
    existing_investments: list[dict[str, Any]],
    tax_regime: str,
    city_type: str,
    annual_rent: float,
    hra_received: float,
    age_self: int = 30,
    age_parents: int = 55,
    education_loan_interest: float = 0.0,
) -> TaxAllocation:
    """
    Maximize tax deductions under the Old Regime (FY 2026-27).

    existing_investments: [{section: "80C", instrument: "PPF", amount: 50000}, ...]
    tax_regime: "old" | "new"
    city_type: "metro" | "non-metro"
    """
    if tax_regime.lower() == "new":
        return TaxAllocation(
            items=[],
            total_tax_saved=0.0,
            total_invested=0.0,
            note="Section 80C/80D deductions are not available under the New Tax Regime. "
                 "Consider switching to the Old Regime if your deductions exceed ₹1.5L.",
        )

    # Determine tax slab rate for this income
    slab_rate = _get_marginal_slab_rate(annual_income)

    # Calculate existing utilization per section
    used: dict[str, float] = {}
    for inv in existing_investments:
        section = inv.get("section", "80C")
        amount = float(inv.get("amount", 0))
        used[section] = used.get(section, 0) + amount

    items: list[TaxAllocationItem] = []
    priority = 0

    # 80C + 80CCC (shared cap ₹1.5L)
    used_80c = used.get("80C", 0) + used.get("80CCC", 0)
    remaining_80c = max(SECTION_80C_LIMIT - used_80c, 0)
    if remaining_80c > 0:
        priority += 1
        tax_saved = remaining_80c * slab_rate
        items.append(TaxAllocationItem(
            section="80C",
            instrument="ELSS / PPF / NPS Tier-II / Sukanya Samriddhi",
            recommended_amount=remaining_80c,
            tax_saved_at_slab=round(tax_saved, 2),
            priority=priority,
            remaining_limit=remaining_80c,
        ))

    # 80CCD(1B) — additional ₹50K for NPS (separate from 80C)
    used_80ccd = used.get("80CCD(1B)", 0)
    remaining_80ccd = max(SECTION_80CCD_1B_LIMIT - used_80ccd, 0)
    if remaining_80ccd > 0:
        priority += 1
        tax_saved = remaining_80ccd * slab_rate
        items.append(TaxAllocationItem(
            section="80CCD(1B)",
            instrument="NPS (National Pension System)",
            recommended_amount=remaining_80ccd,
            tax_saved_at_slab=round(tax_saved, 2),
            priority=priority,
            remaining_limit=remaining_80ccd,
        ))

    # 80D — Health Insurance (tiered by age)
    limit_self = (SECTION_80D_SELF_ABOVE_60 if age_self >= 60
                  else SECTION_80D_SELF_BELOW_60)
    limit_parents = (SECTION_80D_PARENTS_ABOVE_60 if age_parents >= 60
                     else SECTION_80D_PARENTS_BELOW_60)
    total_80d_limit = limit_self + limit_parents
    used_80d = used.get("80D", 0)
    remaining_80d = max(total_80d_limit - used_80d, 0)
    if remaining_80d > 0:
        priority += 1
        tax_saved = remaining_80d * slab_rate
        items.append(TaxAllocationItem(
            section="80D",
            instrument="Health Insurance Premium (Self + Parents)",
            recommended_amount=remaining_80d,
            tax_saved_at_slab=round(tax_saved, 2),
            priority=priority,
            remaining_limit=remaining_80d,
        ))

    # 80E — Education Loan Interest (uncapped, max 8 years)
    if education_loan_interest > 0:
        priority += 1
        tax_saved = education_loan_interest * slab_rate
        items.append(TaxAllocationItem(
            section="80E",
            instrument="Education Loan Interest Deduction",
            recommended_amount=education_loan_interest,
            tax_saved_at_slab=round(tax_saved, 2),
            priority=priority,
            remaining_limit=education_loan_interest,  # no cap
        ))

    # HRA — Section 10(13A)
    if annual_rent > 0 and hra_received > 0 and basic_salary > 0:
        metro_pct = (HRA_METRO_PERCENT if city_type.lower() == "metro"
                     else HRA_NON_METRO_PERCENT)
        annual_basic = basic_salary * 12
        hra_exemption = min(
            hra_received * 12,
            annual_rent - 0.10 * annual_basic,
            metro_pct * annual_basic,
        )
        hra_exemption = max(hra_exemption, 0)
        if hra_exemption > 0:
            priority += 1
            tax_saved = hra_exemption * slab_rate
            items.append(TaxAllocationItem(
                section="10(13A)",
                instrument="HRA Exemption",
                recommended_amount=round(hra_exemption, 2),
                tax_saved_at_slab=round(tax_saved, 2),
                priority=priority,
                remaining_limit=round(hra_exemption, 2),
            ))

    # Sort by tax saved descending (highest impact first)
    items.sort(key=lambda x: x.tax_saved_at_slab, reverse=True)
    for i, item in enumerate(items):
        item.priority = i + 1

    total_tax = sum(it.tax_saved_at_slab for it in items)
    total_inv = sum(it.recommended_amount for it in items)

    return TaxAllocation(
        items=items,
        total_tax_saved=round(total_tax, 2),
        total_invested=round(total_inv, 2),
    )


def _get_marginal_slab_rate(annual_income: float) -> float:
    """Return the marginal tax slab rate for Old Regime FY 2026-27."""
    rate = 0.0
    for lower, upper, slab_rate in OLD_REGIME_SLABS:
        if annual_income > lower:
            rate = slab_rate
    return rate


# ---------------------------------------------------------------------------
# 3. Financial Health Score (FOIR-based, Indian benchmarks)
# ---------------------------------------------------------------------------
def calculate_health_score(
    income: float,
    expenses: float,
    total_debt: float,
    total_emi: float,
) -> HealthScore:
    """
    Composite 0–100 financial health score.

    FOIR Component (40% weight): total_emi / gross_monthly_income
        — Banking benchmark ≤ 40% yields maximum score.
    Savings Rate Component (35% weight): (income - expenses) / income
        — Target ≥ 20%.
    Emergency Buffer Component (25% weight): liquid_savings / monthly_expenses
        — Target ≥ 3 months of baseline outlays.

    Note: Emergency buffer is estimated from (income - expenses - total_emi)
    accumulated over time. For the initial calculation, we estimate available
    monthly savings as the emergency buffer proxy.
    """
    if income <= 0:
        return HealthScore(
            score=0.0,
            foir_ratio=0.0,
            savings_rate=0.0,
            emergency_months=0.0,
            component_scores={"foir": 0, "savings": 0, "emergency": 0},
            component_benchmarks={
                "foir": f"≤ {FOIR_BENCHMARK * 100:.0f}% (RBI/SBI/HDFC)",
                "savings": f"≥ {SAVINGS_RATE_TARGET * 100:.0f}% (50/30/20)",
                "emergency": f"≥ {EMERGENCY_MONTHS_TARGET:.0f} months",
            },
        )

    # FOIR: total EMI / gross monthly income
    foir = total_emi / income
    # Score: 100 if FOIR ≤ 40%, linear decrease to 0 at 100%
    if foir <= FOIR_BENCHMARK:
        foir_score = 100.0
    elif foir >= 1.0:
        foir_score = 0.0
    else:
        foir_score = max(0, 100.0 * (1.0 - foir) / (1.0 - FOIR_BENCHMARK))

    # Savings rate: (income - expenses) / income
    savings_rate = (income - expenses) / income
    if savings_rate >= SAVINGS_RATE_TARGET:
        savings_score = 100.0
    elif savings_rate <= 0:
        savings_score = 0.0
    else:
        savings_score = min(100.0, (savings_rate / SAVINGS_RATE_TARGET) * 100.0)

    # Emergency buffer: estimated monthly surplus / monthly expenses
    monthly_surplus = max(income - expenses - total_emi, 0)
    if expenses > 0:
        emergency_months = monthly_surplus / expenses
    else:
        emergency_months = EMERGENCY_MONTHS_TARGET  # no expenses = fully buffered

    if emergency_months >= EMERGENCY_MONTHS_TARGET:
        emergency_score = 100.0
    else:
        emergency_score = min(
            100.0, (emergency_months / EMERGENCY_MONTHS_TARGET) * 100.0
        )

    # Composite score: weighted average
    composite = (
        0.40 * foir_score
        + 0.35 * savings_score
        + 0.25 * emergency_score
    )

    return HealthScore(
        score=round(min(max(composite, 0), 100), 1),
        foir_ratio=round(foir * 100, 1),
        savings_rate=round(savings_rate * 100, 1),
        emergency_months=round(emergency_months, 1),
        component_scores={
            "foir": round(foir_score, 1),
            "savings": round(savings_score, 1),
            "emergency": round(emergency_score, 1),
        },
        component_benchmarks={
            "foir": f"≤ {FOIR_BENCHMARK * 100:.0f}% (RBI/SBI/HDFC)",
            "savings": f"≥ {SAVINGS_RATE_TARGET * 100:.0f}% (50/30/20)",
            "emergency": f"≥ {EMERGENCY_MONTHS_TARGET:.0f} months",
        },
    )


# ---------------------------------------------------------------------------
# 4. Grade derivation
# ---------------------------------------------------------------------------
def grade_health(score: float) -> tuple[str, str]:
    """
    Map health score to letter grade + human label.

    Returns (grade, label) tuple.
    """
    if score >= 90:
        return "A+", "Excellent — strong financial position"
    if score >= 80:
        return "A", "Very Good — well-managed finances"
    if score >= 70:
        return "B+", "Good — minor optimization needed"
    if score >= 60:
        return "B", "Fair — room for improvement"
    if score >= 40:
        return "C", "Needs Attention — restructure obligations"
    if score >= 20:
        return "D", "At Risk — immediate action required"
    return "F", "Critical — seek professional financial advice"


# ---------------------------------------------------------------------------
# 5. Master Surplus Allocator — produces the hero action cards
# ---------------------------------------------------------------------------
def allocate_surplus(
    monthly_income: float,
    monthly_expenses: float,
    debts: list[dict[str, Any]],
    existing_investments: list[dict[str, Any]],
    basic_salary: float = 0.0,
    tax_regime: str = "old",
    city_type: str = "metro",
    monthly_rent: float = 0.0,
    monthly_hra: float = 0.0,
    age_self: int = 30,
    age_parents: int = 55,
    education_loan_interest: float = 0.0,
) -> AllocationPlan:
    """
    The master orchestrator. Given a household's full financial picture,
    produces a prioritized list of action cards telling the user exactly
    what to do with every rupee of surplus.

    Decision logic:
    1. High-interest debt (APR > ~8% effective tax-saving return) → pay first
    2. Tax-saving investments → ordered by marginal tax savings per rupee
    3. Remaining surplus → emergency fund / high-yield savings
    """
    total_emi = sum(float(d.get("min_payment", 0)) for d in debts)
    surplus = monthly_income - monthly_expenses
    available_after_emi = surplus  # EMIs come from expenses line

    # Run sub-engines
    payoff = optimize_debt_avalanche(debts, surplus)
    tax = maximize_tax_shield(
        annual_income=monthly_income * 12,
        basic_salary=basic_salary,
        existing_investments=existing_investments,
        tax_regime=tax_regime,
        city_type=city_type,
        annual_rent=monthly_rent * 12,
        hra_received=monthly_hra,
        age_self=age_self,
        age_parents=age_parents,
        education_loan_interest=education_loan_interest,
    )
    health = calculate_health_score(
        income=monthly_income,
        expenses=monthly_expenses,
        total_debt=sum(float(d.get("balance", 0)) for d in debts),
        total_emi=total_emi,
    )
    grade, grade_label = grade_health(health.score)

    # Build action cards
    cards: list[ActionCard] = []
    remaining = available_after_emi
    priority = 0

    # --- Debt payments (Avalanche order: highest APR first) ---
    sorted_debts = sorted(debts, key=lambda d: float(d.get("apr", 0)), reverse=True)
    for debt in sorted_debts:
        if remaining <= 0:
            break
        bal = float(debt.get("balance", 0))
        apr = float(debt.get("apr", 0))
        min_pay = float(debt.get("min_payment", 0))

        if bal <= 0:
            continue

        # For high-APR debt, allocate more than minimum
        if apr > 8.0:  # Higher than typical tax-saving return
            # Allocate as much as possible to this debt
            extra = min(remaining, bal)
            months_to_clear = int(bal / max(extra, 1)) + 1
            # Estimate interest saved
            monthly_rate = apr / 100.0 / 12.0
            interest_if_minimum = 0.0
            sim_bal = bal
            for _ in range(months_to_clear * 3):
                if sim_bal <= 0:
                    break
                interest_if_minimum += sim_bal * monthly_rate
                sim_bal -= min_pay
                sim_bal = max(sim_bal, 0)

            interest_with_extra = 0.0
            sim_bal = bal
            for _ in range(months_to_clear):
                if sim_bal <= 0:
                    break
                interest_with_extra += sim_bal * monthly_rate
                sim_bal -= extra
                sim_bal = max(sim_bal, 0)

            interest_saved = max(interest_if_minimum - interest_with_extra, 0)

            priority += 1
            cards.append(ActionCard(
                priority=priority,
                action_type="PAY_DEBT",
                destination=f"{debt.get('name', 'Debt')} ({apr}% APR)",
                amount=round(extra, 2),
                rationale=f"Highest-interest obligation — Avalanche method",
                impact_metric=(
                    f"Saves ₹{interest_saved:,.0f} in interest over "
                    f"{months_to_clear} months"
                ),
            ))
            remaining -= extra

    # --- Tax-saving investments (ordered by tax saved) ---
    for tax_item in tax.items:
        if remaining <= 0:
            break
        monthly_amount = min(tax_item.recommended_amount / 12, remaining)
        if monthly_amount > 0:
            priority += 1
            cards.append(ActionCard(
                priority=priority,
                action_type="INVEST_TAX",
                destination=f"{tax_item.instrument} ({tax_item.section})",
                amount=round(monthly_amount, 2),
                rationale=(
                    f"₹{tax_item.remaining_limit:,.0f} annual limit unfilled"
                ),
                impact_metric=(
                    f"Saves ₹{tax_item.tax_saved_at_slab:,.0f} in tax at "
                    f"{_get_marginal_slab_rate(monthly_income * 12) * 100:.0f}% slab"
                ),
            ))
            remaining -= monthly_amount

    # --- Remaining surplus → emergency fund / savings ---
    if remaining > 0:
        priority += 1
        cards.append(ActionCard(
            priority=priority,
            action_type="SAVE",
            destination="Liquid Mutual Fund / FD / RD",
            amount=round(remaining, 2),
            rationale="Build emergency corpus — remaining surplus after debt + tax",
            impact_metric=(
                f"Currently at {health.emergency_months:.1f} months; "
                f"target ≥ {EMERGENCY_MONTHS_TARGET:.0f} months"
            ),
        ))

    return AllocationPlan(
        action_cards=cards,
        payoff_schedule=payoff,
        tax_allocation=tax,
        health_score=health,
        grade=grade,
        grade_label=grade_label,
        surplus=round(surplus, 2),
    )
