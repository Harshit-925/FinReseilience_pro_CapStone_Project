import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.auth import get_current_user

@pytest.fixture
def client():
    """Client with authentication bypassed."""
    async def override_verify_token():
        return {"id": "test_user_123", "email": "test@example.com", "token": "mock_token"}
        
    app.dependency_overrides[get_current_user] = override_verify_token
    
    with TestClient(app) as client:
        yield client
        
    app.dependency_overrides.clear()

@pytest.fixture
def valid_household_payload():
    return {
        "monthly_income": 100000,
        "monthly_expenses": 50000,
        "basic_salary": 50000,
        "monthly_rent": 20000,
        "monthly_hra": 20000,
        "city_type": "metro",
        "tax_regime": "old",
        "age_self": 30,
        "age_parents": 55,
        "education_loan_interest": 0,
        "debts": [
            {
                "name": "Credit Card",
                "balance": 100000,
                "apr": 36,
                "min_payment": 5000
            }
        ],
        "existing_investments": []
    }
