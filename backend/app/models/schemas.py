"""
Pydantic v2 models — strict field constraints, ₹ currency.

Mirrors the engine's data classes for API request/response validation.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------
class DebtInput(BaseModel):
    """A single debt/liability."""

    name: str = Field(..., min_length=1, max_length=100, description="Debt identifier")
    balance: float = Field(..., gt=0, description="Outstanding balance in ₹")
    apr: float = Field(..., gt=0, le=100, description="Annual percentage rate")
    min_payment: float = Field(..., gt=0, description="Minimum monthly EMI in ₹")


class TaxInvestmentInput(BaseModel):
    """An existing tax-saving investment."""

    section: str = Field(..., description="Tax section (80C, 80CCD(1B), 80D, etc.)")
    instrument: str = Field(..., description="Investment instrument name")
    amount: float = Field(..., ge=0, description="Amount already invested in ₹")


class HouseholdInput(BaseModel):
    """Full household financial snapshot for analysis."""

    monthly_income: float = Field(..., gt=0, description="Gross monthly income in ₹")
    monthly_expenses: float = Field(..., ge=0, description="Monthly expenses in ₹")
    basic_salary: float = Field(0, ge=0, description="Monthly basic salary for HRA calc")
    monthly_rent: float = Field(0, ge=0, description="Monthly rent paid in ₹")
    monthly_hra: float = Field(0, ge=0, description="Monthly HRA received in ₹")
    city_type: str = Field("metro", pattern="^(metro|non-metro)$")
    tax_regime: str = Field("old", pattern="^(old|new)$")
    age_self: int = Field(30, ge=18, le=100)
    age_parents: int = Field(55, ge=30, le=100)
    education_loan_interest: float = Field(0, ge=0, description="Annual education loan interest")
    debts: list[DebtInput] = Field(default_factory=list)
    existing_investments: list[TaxInvestmentInput] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------
class DebtPaymentResponse(BaseModel):
    """One debt's payment in a month."""

    debt_name: str
    payment_amount: float
    running_balance: float


class MonthRowResponse(BaseModel):
    """One month in the payoff schedule."""

    month: int
    payments: list[DebtPaymentResponse]
    cumulative_interest: float
    total_paid_this_month: float


class PayoffScheduleResponse(BaseModel):
    """Full avalanche payoff result."""

    schedule: list[MonthRowResponse]
    total_interest_paid: float
    total_interest_saved_vs_minimum: float
    debt_free_month: int
    total_months: int


class TaxAllocationItemResponse(BaseModel):
    """One tax-saving recommendation."""

    section: str
    instrument: str
    recommended_amount: float
    tax_saved_at_slab: float
    priority: int
    remaining_limit: float


class TaxAllocationResponse(BaseModel):
    """Full tax shield output."""

    items: list[TaxAllocationItemResponse]
    total_tax_saved: float
    total_invested: float
    note: str = ""


class HealthScoreResponse(BaseModel):
    """Financial health assessment."""

    score: float
    foir_ratio: float
    savings_rate: float
    emergency_months: float
    component_scores: dict[str, float]
    component_benchmarks: dict[str, str]


class ActionCardResponse(BaseModel):
    """A single prioritized action recommendation."""

    priority: int
    action_type: str
    destination: str
    amount: float
    rationale: str
    impact_metric: str


class AnalysisResponse(BaseModel):
    """Complete analysis result — the API response."""

    action_cards: list[ActionCardResponse]
    payoff_schedule: PayoffScheduleResponse
    tax_allocation: TaxAllocationResponse
    health_score: HealthScoreResponse
    grade: str
    grade_label: str
    surplus: float
    ai_narrative: str = ""
    fallback_used: bool = False


class HealthResponse(BaseModel):
    """Health check response."""

    status: str
    pocketbase: str


# ---------------------------------------------------------------------------
# Agentic Upgrade Models
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    """Request payload for /api/chat"""
    message: str
    session_id: str
    profile_snapshot: HouseholdInput | None = None


class ChatResponse(BaseModel):
    """Response payload for /api/chat"""
    reply: str
    tool_calls_made: list[str]
    tool_results: list[dict[str, Any]]
    fallback_used: bool


class WhatIfChange(BaseModel):
    type: str = Field(..., description="income_raise, income_cut, new_debt, remove_debt, expense_change")
    value: float = Field(..., description="Absolute ₹ amount")
    extra: dict[str, Any] = Field(default_factory=dict)


class WhatIfRequest(BaseModel):
    """Request payload for /api/whatif"""
    base_profile: HouseholdInput
    change: WhatIfChange


class WhatIfResponse(BaseModel):
    """Response payload for /api/whatif"""
    change_type: str
    before: dict[str, Any]
    after: dict[str, Any]
    delta: dict[str, Any]


class GoalInput(BaseModel):
    title: str
    target_date: str
    metric_type: str
    target_value: float


class GoalProgress(BaseModel):
    id: str
    title: str
    target_date: str
    metric_type: str
    target_value: float
    current_value: float
    status: str


class NotificationResponse(BaseModel):
    id: str
    type: str
    message: str
    read: bool
    created: str
