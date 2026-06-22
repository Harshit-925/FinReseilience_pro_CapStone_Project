import pytest
from app.engine.calculator import (
    calculate_avalanche_schedule,
    calculate_tax_shield,
    calculate_health_score,
    get_grade,
    allocate_surplus
)
from app.models.schemas import DebtInput, TaxInvestmentInput, HouseholdInput

def test_calculate_avalanche_schedule():
    debts = [
        DebtInput(name="Card A", balance=10000, apr=36.0, min_payment=500),
        DebtInput(name="Loan B", balance=20000, apr=12.0, min_payment=1000)
    ]
    surplus = 2000
    
    schedule, total_int, saved, df_month = calculate_avalanche_schedule(debts, surplus)
    
    # Assertions
    assert df_month > 0
    assert total_int > 0
    assert len(schedule) == df_month
    
    # Month 1 should route the extra surplus to Card A (highest APR)
    m1_cardA = next(p for p in schedule[0]["payments"] if p["debt_name"] == "Card A")
    m1_loanB = next(p for p in schedule[0]["payments"] if p["debt_name"] == "Loan B")
    
    # Loan B should just get min payment, Card A gets min payment + surplus
    assert m1_loanB["payment_amount"] == 1000
    assert m1_cardA["payment_amount"] == 500 + 2000

def test_calculate_tax_shield():
    # Setup
    investments = [
        TaxInvestmentInput(section="80C", instrument="PPF", amount=100000)
    ]
    
    result = calculate_tax_shield(investments, "old", 50000, 20000, 20000, "metro", 30, 55, 0)
    
    # 80C should have 50000 remaining
    item_80c = next(i for i in result["items"] if i["section"] == "80C")
    assert item_80c["recommended_amount"] == 50000
    assert item_80c["remaining_limit"] == 50000
    
    # HRA check (Metro = 50% basic = 25000, Rent - 10% basic = 20000 - 5000 = 15000, Actual = 20000)
    # Exemption should be 15000
    item_hra = next(i for i in result["items"] if i["section"] == "HRA")
    assert item_hra["remaining_limit"] == 0 # HRA is purely informational for remaining limit

def test_calculate_health_score():
    score = calculate_health_score(100000, 50000, 100000, 10000)
    
    # FOIR = 10000 / 100000 = 10% (Optimal)
    # Savings = 50000 / 100000 = 50% (Optimal)
    # Emergency = Liquid savings not modeled deeply here, default 0 months = 0 score for that component
    # FOIR (40%) + Savings (35%) = 40 + 35 = 75 base
    
    assert 60 <= score["score"] <= 80
    assert score["foir_ratio"] == 10.0
    assert score["savings_rate"] == 50.0

def test_get_grade():
    assert get_grade(95) == ("A+", "Exceptional financial resilience")
    assert get_grade(85) == ("B+", "Strong foundation with minor optimization potential")
    assert get_grade(45) == ("D", "High vulnerability — immediate restructuring required")

def test_allocate_surplus():
    debts = [DebtInput(name="Card", balance=50000, apr=36, min_payment=2000)]
    tax = {
        "items": [
            {"section": "80C", "instrument": "ELSS/PPF", "recommended_amount": 50000, "priority": 1}
        ]
    }
    
    cards = allocate_surplus(20000, debts, tax)
    
    # Action cards should prioritize Debt first (APR 36 > Threshold)
    assert len(cards) >= 1
    assert cards[0]["action_type"] == "PAY_DEBT"
    assert cards[0]["amount"] == 20000
