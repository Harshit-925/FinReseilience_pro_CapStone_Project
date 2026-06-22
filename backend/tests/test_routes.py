def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_analyze_endpoint_unauthenticated_success(client):
    # Clear overrides to test unauthenticated access
    client.app.dependency_overrides.clear()
    
    payload = {
        "monthly_income": 100000,
        "monthly_expenses": 50000,
        "city_type": "metro",
        "tax_regime": "old"
    }
    
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 200
    assert "action_cards" in response.json()

def test_analyze_endpoint_success(client, valid_household_payload):
    response = client.post("/api/analyze", json=valid_household_payload)
    assert response.status_code == 200
    
    data = response.json()
    assert "health_score" in data
    assert "payoff_schedule" in data
    assert "action_cards" in data
    assert "grade" in data
    assert "surplus" in data
    
    assert data["surplus"] == 50000
    
    # Security headers check
    assert "X-Frame-Options" in response.headers
    assert response.headers["X-Content-Type-Options"] == "nosniff"
