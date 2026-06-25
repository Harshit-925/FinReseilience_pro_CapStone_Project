"""
MCP Math Server for FinResilience Pro.

Exposes deterministic math engine tools to Google ADK via FastMCP.
"""
import sys
from typing import Any, List, Dict

from fastmcp import FastMCP
from pydantic import BaseModel, Field

from app.engine.calculator import (
    optimize_debt_avalanche,
    maximize_tax_shield,
    calculate_health_score,
    allocate_surplus
)

# Initialize FastMCP Server
mcp = FastMCP("finresilience-mcp")

# Define Tool Input Schemas (to help MCP typed generation)

class DebtInput(BaseModel):
    name: str
    balance: float
    apr: float
    min_payment: float

@mcp.tool()
def run_avalanche(debts: List[DebtInput], monthly_surplus: float) -> dict:
    """
    Calculate the optimal debt payoff schedule using the Avalanche method (highest APR first).
    """
    debt_dicts = [{"name": d.name, "balance": d.balance, "apr": d.apr, "min_payment": d.min_payment} for d in debts]
    result = optimize_debt_avalanche(debts=debt_dicts, monthly_surplus=monthly_surplus)
    
    return {
        "debt_free_month": result.debt_free_month,
        "total_months": result.total_months,
        "total_interest_paid": result.total_interest_paid,
        "total_interest_saved_vs_minimum": result.total_interest_saved_vs_minimum,
        "schedule_preview": [
            {
                "month": row.month,
                "total_paid": row.total_paid_this_month,
                "cumulative_interest": row.cumulative_interest,
            }
            for row in result.schedule[:6]  # First 6 months for context
        ],
    }

class InvestmentInput(BaseModel):
    section: str
    instrument: str
    amount: float

@mcp.tool()
def run_tax_shield(
    annual_income: float,
    basic_salary: float,
    tax_regime: str,
    city_type: str,
    existing_investments: List[InvestmentInput] = [],
    annual_rent: float = 0.0,
    hra_received: float = 0.0,
    age_self: int = 30,
    age_parents: int = 55
) -> dict:
    """
    Calculate optimal tax-saving investment recommendations under CBDT FY 2026-27 rules.
    """
    inv_dicts = [{"section": i.section, "instrument": i.instrument, "amount": i.amount} for i in existing_investments]
    result = maximize_tax_shield(
        annual_income=annual_income,
        basic_salary=basic_salary,
        existing_investments=inv_dicts,
        tax_regime=tax_regime,
        city_type=city_type,
        annual_rent=annual_rent,
        hra_received=hra_received,
        age_self=age_self,
        age_parents=age_parents,
    )
    return {
        "total_tax_saved": result.total_tax_saved,
        "total_invested": result.total_invested,
        "note": result.note,
        "items": [
            {
                "section": it.section,
                "instrument": it.instrument,
                "recommended_amount": it.recommended_amount,
                "tax_saved_at_slab": it.tax_saved_at_slab,
                "remaining_limit": it.remaining_limit,
            }
            for it in result.items
        ],
    }

@mcp.tool()
def run_health_score(
    income: float,
    expenses: float,
    total_debt: float,
    total_emi: float
) -> dict:
    """
    Calculate the composite financial health score (0-100) based on FOIR, savings rate, and emergency buffer.
    """
    result = calculate_health_score(
        income=income,
        expenses=expenses,
        total_debt=total_debt,
        total_emi=total_emi,
    )
    from app.engine.calculator import grade_health
    grade, grade_label = grade_health(result.score)
    return {
        "score": result.score,
        "grade": grade,
        "grade_label": grade_label,
        "foir_ratio": result.foir_ratio,
        "savings_rate": result.savings_rate,
        "emergency_months": result.emergency_months,
        "component_scores": result.component_scores,
        "component_benchmarks": result.component_benchmarks,
    }


if __name__ == "__main__":
    # Provides stdio support for MCP client
    mcp.run()
