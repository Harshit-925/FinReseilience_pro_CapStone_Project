"""
API routes — /api/health and /api/analyze.

/api/analyze is the only route that touches the engine + AI.
Frontend reads/writes PocketBase collections directly for history/goals/reports.
"""

import logging
from dataclasses import asdict
from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter

from app.core.auth import get_optional_user
from app.core.config import get_settings
from app.core.rate_limit import limiter
from app.engine.calculator import allocate_surplus
from app.models.schemas import AnalysisResponse, HouseholdInput, HealthResponse
from app.services.ai_service import generate_narrative
from app.services.pocketbase_client import save_result

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Health check — also pings PocketBase."""
    settings = get_settings()
    pb_status = "unknown"

    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"{settings.pocketbase_url}/api/health")
            pb_status = "healthy" if resp.status_code == 200 else "unhealthy"
    except httpx.RequestError:
        pb_status = "unreachable"

    return HealthResponse(status="ok", pocketbase=pb_status)


@router.post("/analyze", response_model=AnalysisResponse)
@limiter.limit("10/minute")
async def analyze(
    request: Request,
    household: HouseholdInput,
    user: dict[str, Any] | None = Depends(get_optional_user),
) -> AnalysisResponse:
    """
    Run the full analysis pipeline:
    1. Engine computes allocation plan (deterministic)
    2. AI generates narrative (with fallback)
    3. Save to PocketBase history (if authenticated)
    4. Return typed response
    """
    try:
        # Convert debts and investments to dicts for the engine
        debts = [d.model_dump() for d in household.debts]
        investments = [i.model_dump() for i in household.existing_investments]

        # Run the engine — pure, deterministic, no external calls
        plan = allocate_surplus(
            monthly_income=household.monthly_income,
            monthly_expenses=household.monthly_expenses,
            debts=debts,
            existing_investments=investments,
            basic_salary=household.basic_salary,
            tax_regime=household.tax_regime,
            city_type=household.city_type,
            monthly_rent=household.monthly_rent,
            monthly_hra=household.monthly_hra,
            age_self=household.age_self,
            age_parents=household.age_parents,
            education_loan_interest=household.education_loan_interest,
        )

        # Convert engine output to serializable dicts
        engine_dict = asdict(plan)

        # Generate AI narrative
        narrative, fallback_used = await generate_narrative(engine_dict)

        if fallback_used:
            user_id = user.get("id", "") if user else "anonymous"
            logger.info("AI fallback used for user=%s", user_id)

        # Save to PocketBase history (non-blocking — don't fail the response)
        if user:
            await save_result(
                user_token=user.get("token", ""),
                user_id=user.get("id", ""),
                engine_result=engine_dict,
                ai_result={"narrative": narrative},
                fallback_used=fallback_used,
            )

        # Build response
        return AnalysisResponse(
            action_cards=[
                {
                    "priority": c.priority,
                    "action_type": c.action_type,
                    "destination": c.destination,
                    "amount": c.amount,
                    "rationale": c.rationale,
                    "impact_metric": c.impact_metric,
                }
                for c in plan.action_cards
            ],
            payoff_schedule={
                "schedule": [
                    {
                        "month": row.month,
                        "payments": [
                            {
                                "debt_name": p.debt_name,
                                "payment_amount": p.payment_amount,
                                "running_balance": p.running_balance,
                            }
                            for p in row.payments
                        ],
                        "cumulative_interest": row.cumulative_interest,
                        "total_paid_this_month": row.total_paid_this_month,
                    }
                    for row in plan.payoff_schedule.schedule
                ],
                "total_interest_paid": plan.payoff_schedule.total_interest_paid,
                "total_interest_saved_vs_minimum": plan.payoff_schedule.total_interest_saved_vs_minimum,
                "debt_free_month": plan.payoff_schedule.debt_free_month,
                "total_months": plan.payoff_schedule.total_months,
            },
            tax_allocation={
                "items": [
                    {
                        "section": t.section,
                        "instrument": t.instrument,
                        "recommended_amount": t.recommended_amount,
                        "tax_saved_at_slab": t.tax_saved_at_slab,
                        "priority": t.priority,
                        "remaining_limit": t.remaining_limit,
                    }
                    for t in plan.tax_allocation.items
                ],
                "total_tax_saved": plan.tax_allocation.total_tax_saved,
                "total_invested": plan.tax_allocation.total_invested,
                "note": plan.tax_allocation.note,
            },
            health_score={
                "score": plan.health_score.score,
                "foir_ratio": plan.health_score.foir_ratio,
                "savings_rate": plan.health_score.savings_rate,
                "emergency_months": plan.health_score.emergency_months,
                "component_scores": plan.health_score.component_scores,
                "component_benchmarks": plan.health_score.component_benchmarks,
            },
            grade=plan.grade,
            grade_label=plan.grade_label,
            surplus=plan.surplus,
            ai_narrative=narrative,
            fallback_used=fallback_used,
        )

    except Exception as exc:
        logger.error(
            "Analysis failed: %s",
            type(exc).__name__,
        )
        raise HTTPException(
            status_code=500,
            detail="Analysis failed — please try again",
        )
