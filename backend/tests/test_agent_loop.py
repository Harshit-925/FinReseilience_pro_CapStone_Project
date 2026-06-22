import pytest
from unittest.mock import patch, AsyncMock
from app.agent.loop import run_agent_turn

@pytest.mark.asyncio
async def test_agent_loop_no_api_key():
    # If API key is not set, it should return fallback immediately
    with patch("app.agent.loop.get_settings") as mock_settings:
        mock_settings.return_value.gemini_api_key = None
        result = await run_agent_turn("Hello", "Context")
        assert result["fallback_used"] is True
        assert "exact figures" in result["reply"]

@pytest.mark.asyncio
async def test_agent_loop_what_if_routing():
    # Test that run_agent_turn correctly calls Gemini and processes tools
    # We will mock httpx.AsyncClient to return a fake Gemini response with a tool call
    
    mock_gemini_response_1 = {
        "candidates": [
            {
                "content": {
                    "parts": [
                        {
                            "functionCall": {
                                "name": "run_what_if",
                                "args": {
                                    "change_type": "income_raise",
                                    "change_value": 150000,
                                    "base_income": 100000,
                                    "base_expenses": 50000,
                                    "base_debts": []
                                }
                            }
                        }
                    ]
                }
            }
        ]
    }
    
    mock_gemini_response_2 = {
        "candidates": [
            {
                "content": {
                    "parts": [
                        {"text": "Your new surplus will be ₹100,000."}
                    ]
                }
            }
        ]
    }
    
    # We need to mock httpx post
    class MockResponse:
        def __init__(self, json_data, status_code=200):
            self._json_data = json_data
            self.status_code = status_code
        def json(self):
            return self._json_data
        def raise_for_status(self):
            pass

    call_count = 0
    async def mock_post(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return MockResponse(mock_gemini_response_1)
        return MockResponse(mock_gemini_response_2)

    with patch("httpx.AsyncClient.post", side_effect=mock_post):
        with patch("app.agent.loop.get_settings") as mock_settings:
            mock_settings.return_value.gemini_api_key = "fake_key"
            result = await run_agent_turn("What if I get a raise to 150000?", "Context")
            
            assert "run_what_if" in result["tool_calls_made"]
            assert len(result["tool_results"]) == 1
            assert result["tool_results"][0]["tool"] == "run_what_if"
            assert result["fallback_used"] is False
            assert "100,000" in result["reply"]

@pytest.mark.asyncio
async def test_agent_loop_health_routing():
    mock_gemini_response_1 = {
        "candidates": [{"content": {"parts": [{"functionCall": {"name": "run_health_score", "args": {"income": 100000, "expenses": 50000, "total_debt": 0, "total_emi": 0}}}}]}}]
    }
    mock_gemini_response_2 = {
        "candidates": [{"content": {"parts": [{"text": "Your score is 99.0."}]}}]
    }
    
    class MockResponse:
        def __init__(self, json_data):
            self._json_data = json_data
        def json(self): return self._json_data
        def raise_for_status(self): pass

    call_count = 0
    async def mock_post(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        if call_count == 1: return MockResponse(mock_gemini_response_1)
        return MockResponse(mock_gemini_response_2)

    with patch("httpx.AsyncClient.post", side_effect=mock_post), \
         patch("app.agent.loop.get_settings") as mock_settings:
        mock_settings.return_value.gemini_api_key = "fake_key"
        result = await run_agent_turn("What is my health score?", "Context")
        
        assert "run_health_score" in result["tool_calls_made"]
        assert result["tool_results"][0]["tool"] == "run_health_score"
        assert "99.0" in result["reply"]
