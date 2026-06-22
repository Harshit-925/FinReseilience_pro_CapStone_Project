import pytest
from app.engine.calculator import (
    optimize_debt_avalanche,
    maximize_tax_shield,
    calculate_health_score,
    grade_health,
    allocate_surplus,
)

def test_optimize_debt_avalanche():
    debts = [
        {"name": "Card A", "balance": 10000, "apr": 36.0, "min_payment": 500},
        {"name": "Loan B", "balance": 20000, "apr": 12.0, "min_payment": 1000}
    ]
    surplus = 2000
    
    payoff = optimize_debt_avalanche(debts, surplus)
    
    assert payoff.debt_free_month > 0
    assert payoff.total_interest_paid > 0
    assert len(payoff.schedule) == payoff.debt_free_month

def test_maximize_tax_shield():
    investments = [
        {"section": "80C", "instrument": "PPF", "amount": 100000}
    ]
    
    result = maximize_tax_shield(
        annual_income=1000000,
        basic_salary=400000,
        existing_investments=investments,
        tax_regime="old",
        city_type="metro",
        annual_rent=150000,
        hra_received=150000,
        age_self=30,
        age_parents=55,
        education_loan_interest=0,
    )
    
    item_80c = next(i for i in result.items if i.section == "80C")
    assert item_80c.recommended_amount == 50000
    assert item_80c.remaining_limit == 50000

def test_calculate_health_score():
    score = calculate_health_score(100000, 50000, 100000, 10000)
    
    assert 60 <= score.score <= 90
    assert score.foir_ratio == 10.0
    assert score.savings_rate == 50.0

def test_grade_health():
    assert grade_health(95)[0] == "A+"
    assert grade_health(85)[0] == "A"
    assert grade_health(45)[0] == "C"

def test_allocate_surplus():
    debts = [{"name": "Card", "balance": 50000, "apr": 36, "min_payment": 2000}]
    investments = []
    
    plan = allocate_surplus(
        monthly_income=100000,
        monthly_expenses=50000,
        debts=debts,
        existing_investments=investments,
    )
    
    assert len(plan.action_cards) >= 1
    assert plan.action_cards[0].action_type == "PAY_DEBT"
