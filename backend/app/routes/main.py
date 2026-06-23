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

from app.agent.loop import run_agent_turn
from app.agent.memory import MemoryManager
from app.agent.tools import execute_tool
from app.core.auth import get_optional_user, get_current_user
from app.core.config import get_settings
from app.core.rate_limit import limiter
from app.engine.calculator import allocate_surplus
from app.models.schemas import (
    AnalysisResponse, ChatRequest, ChatResponse, GoalInput, GoalProgress,
    HealthResponse, HouseholdInput, NotificationResponse, WhatIfRequest, WhatIfResponse
)
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


@router.post("/chat", response_model=ChatResponse)
@limiter.limit("20/minute")
async def chat(
    request: Request,
    payload: ChatRequest,
    user: dict[str, Any] | None = Depends(get_optional_user),
) -> ChatResponse:
    """Agentic chat loop with function calling and session memory."""
    try:
        user_id = user.get("id", "anonymous") if user else "anonymous"
        user_token = user.get("token", "") if user else ""
        
        memory = MemoryManager(user_id, user_token) if user else None
        last_session = await memory.get_last_session() if memory else None
        
        # Build context
        needs_replan = False
        snapshot_context = ""
        if payload.profile_snapshot:
            # Inject profile_snapshot numbers into context
            snapshot_context = (
                f"\n\nCURRENT FINANCIAL SNAPSHOT:\n"
                f"- Income: ₹{payload.profile_snapshot.monthly_income}\n"
                f"- Expenses: ₹{payload.profile_snapshot.monthly_expenses}\n"
                f"- Debts Count: {len(payload.profile_snapshot.debts)}\n"
            )
            if memory:
                needs_replan = memory.detect_needs_replan(
                    current_profile=payload.profile_snapshot.model_dump(),
                    last_session=last_session,
                )
            
        base_memory_context = memory.build_context_string(last_session, needs_replan) if memory else "No previous session found."
        memory_context = base_memory_context + snapshot_context
        
        chat_history = await memory.get_chat_history(payload.session_id, limit=20) if memory else []
        
        # Run agent loop
        result = await run_agent_turn(
            user_message=payload.message,
            memory_context=memory_context,
            chat_history=chat_history,
            profile_snapshot=payload.profile_snapshot.model_dump() if payload.profile_snapshot else None,
            user_id=user_id,
            user_token=user_token,
        )
        
        # Save chat turn if authenticated
        if memory:
            await memory.save_chat_turn(
                session_id=payload.session_id,
                user_message=payload.message,
                agent_reply=result["reply"],
                tool_calls_made=result["tool_calls_made"],
            )
            
        return ChatResponse(
            reply=result["reply"],
            tool_calls_made=result["tool_calls_made"],
            tool_results=result["tool_results"],
            fallback_used=result["fallback_used"],
        )
        
    except Exception as exc:
        logger.error("Chat failed: %s", type(exc).__name__)
        raise HTTPException(status_code=500, detail="Chat failed")

@router.get("/chat/sessions")
@limiter.limit("30/minute")
async def get_chat_sessions(
    request: Request,
    user: dict[str, Any] = Depends(get_current_user),
) -> list[dict[str, Any]]:
    """Return unique chat sessions for the authenticated user."""
    try:
        user_token = user.get("token", "")
        settings = get_settings()
        
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                f"{settings.pocketbase_url}/api/collections/chat_sessions/records",
                params={
                    "filter": f'user_id="{user["id"]}"',
                    "sort": "-created",
                    "perPage": 100,
                },
                headers={
                    "Authorization": user_token,
                    "Content-Type": "application/json",
                },
            )
            
        if resp.status_code != 200:
            return []
            
        items = resp.json().get("items", [])
        
        # Deduplicate by session_id
        seen = set()
        unique_sessions = []
        for item in items:
            sid = item.get("session_id")
            if sid and sid not in seen:
                seen.add(sid)
                unique_sessions.append({
                    "session_id": sid,
                    "created": item.get("created"),
                })
                
        return unique_sessions

    except Exception as exc:
        logger.error("Fetching chat sessions failed: %s", type(exc).__name__)
        return []


@router.post("/whatif", response_model=WhatIfResponse)
@limiter.limit("30/minute")
async def whatif(
    request: Request,
    payload: WhatIfRequest,
    user: dict[str, Any] | None = Depends(get_optional_user),
) -> WhatIfResponse:
    """Synchronous what-if simulation tool endpoint."""
    try:
        tool_args = {
            "base_income": payload.base_profile.monthly_income,
            "base_expenses": payload.base_profile.monthly_expenses,
            "base_debts": [d.model_dump() for d in payload.base_profile.debts],
            "base_investments": [i.model_dump() for i in payload.base_profile.existing_investments],
            "change_type": payload.change.type,
            "change_value": payload.change.value,
            "change_extra": payload.change.extra,
        }
        
        result = await execute_tool("run_what_if", tool_args)
        
        return WhatIfResponse(
            change_type=result["change_type"],
            before=result["before"],
            after=result["after"],
            delta=result["delta"],
        )
        
    except Exception as exc:
        logger.error("Whatif failed: %s", type(exc).__name__)
        raise HTTPException(status_code=500, detail="Simulation failed")


@router.get("/notifications", response_model=list[NotificationResponse])
async def get_notifications(user: dict[str, Any] = Depends(get_current_user)) -> list[NotificationResponse]:
    """Get unread proactive alerts."""
    memory = MemoryManager(user["id"], user["token"])
    return await memory.get_unread_notifications()
