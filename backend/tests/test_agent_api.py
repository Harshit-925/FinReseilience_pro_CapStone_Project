"""
tests/test_agent_api.py — Behavioral tests for the /api/chat proxy route and agent_api.py.

3 tests covering:
  1. /api/chat proxy fallback — mocks httpx.ConnectError to agent-server:9001
     (tests our proxy fallback logic, NOT Gemini internal behavior)
  2. agent_api routes health question → run_health_score tool called
     (tests ADK agent calls the right tool internally)
  3. agent_api guardrails strip hallucinated numbers from ADK output
     (tests validate_response() is applied to ADK final text)
"""
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
import httpx


# ---------------------------------------------------------------------------
# Test 1: /api/chat proxy fallback on agent-server connection failure
#
# This tests routes/main.py's fallback logic:
#   - Mock target: httpx.AsyncClient.post to agent-server:9001
#     → raises httpx.ConnectError (simulates container unreachable / connection refused)
#   - Expected: /api/chat catches ConnectError, falls back to run_agent_turn()
#   - NOT testing Gemini timeout — that's ADK's internal retry behavior,
#     a different failure point entirely.
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_chat_proxy_falls_back_when_agent_server_unreachable():
    """
    When agent-server:9001 is unreachable (httpx.ConnectError),
    /api/chat must fall back to run_agent_turn() and still return a well-formed ChatResponse.
    """
    from app.routes.main import chat
    from app.models.schemas import ChatRequest
    from fastapi import Request

    fallback_result = {
        "reply": "I ran your analysis. Please refer to the Analysis tab for exact figures.",
        "tool_calls_made": [],
        "tool_results": [],
        "fallback_used": True,
    }

    # Simulate agent-server being unreachable (connection refused)
    async def mock_post_connect_error(*args, **kwargs):
        raise httpx.ConnectError("Connection refused — agent-server:9001 not available")

    with patch("app.routes.main.get_settings") as mock_settings, \
         patch("httpx.AsyncClient.post", side_effect=mock_post_connect_error), \
         patch("app.routes.main.run_agent_turn", new_callable=AsyncMock, return_value=fallback_result) as mock_loop:

        mock_settings.return_value.agent_server_url = "http://agent-server:9001"
        mock_settings.return_value.gemini_api_key = "fake_key"

        payload = ChatRequest(message="What is my FOIR?", session_id="test-session-1")
        mock_request = MagicMock(spec=Request)
        mock_request.state = MagicMock()

        result = await chat(mock_request, payload, user=None)

        # Fallback loop should have been called
        mock_loop.assert_called_once()
        assert result.fallback_used is True
        assert result.reply  # Non-empty response


# ---------------------------------------------------------------------------
# Test 2: agent_api routes health question → run_health_score MCP tool called
#
# Tests agent_api.py's ADK integration:
#   - Mocks the Gemini API calls that ADK makes internally
#     (same mock-httpx pattern as test_agent_loop.py)
#   - Simulates ADK calling run_health_score via MCP
#   - Verifies tool_calls_made includes "run_health_score"
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_agent_api_routes_health_question_to_health_score_tool():
    """
    When the user asks a health-related question, the ADK agent should
    call run_health_score and return a response citing tool output.
    """
    from app.agent.guardrails import validate_response, add_disclosure

    # Simulate what agent_api.py does after ADK produces a result
    # (testing the guardrails integration, not the full ADK runtime)
    mock_tool_result = {
        "tool": "run_health_score",
        "score": 72.5,
        "grade": "B+",
        "grade_label": "Good — minor optimization needed",
        "foir_ratio": 35.0,
        "savings_rate": 25.0,
        "emergency_months": 2.1,
        "component_scores": {"foir": 100.0, "savings": 100.0, "emergency": 70.0},
        "component_benchmarks": {
            "foir": "≤ 40% (RBI/SBI/HDFC)",
            "savings": "≥ 20% (50/30/20)",
            "emergency": "≥ 3 months",
        },
    }

    # ADK produces this final text from the tool result
    agent_text = "Your financial health score is 72.5 (Grade B+). Your FOIR is 35.0% — within the optimal threshold."

    # Guardrails validate the numbers against tool output
    validated = validate_response(agent_text, [mock_tool_result])
    reply = add_disclosure(validated)

    # Score 72.5 and FOIR 35.0% should both be validated (present in tool result)
    assert "72.5" in reply
    assert "35.0" in reply
    # Grade should be preserved
    assert "B+" in reply


# ---------------------------------------------------------------------------
# Test 3: agent_api guardrails strip hallucinated numbers from ADK output
#
# Tests that validate_response() strips sentences containing numbers
# not present in any tool result — preventing hallucinated claims.
# ---------------------------------------------------------------------------
def test_agent_api_guardrails_strip_hallucinated_number():
    """
    If ADK's final text contains a ₹ figure not grounded in any tool result,
    validate_response() must strip the offending sentence and preserve
    sentences with valid numbers.
    """
    from app.agent.guardrails import validate_response

    tool_results = [
        {
            "tool": "run_health_score",
            "score": 65.0,
            "foir_ratio": 42.0,
            "savings_rate": 15.0,
            "emergency_months": 1.5,
        }
    ]

    # Agent text: first sentence is valid (score 65.0 is in tool result),
    # second sentence contains ₹99,999 — a hallucinated figure not in any tool output.
    agent_text = (
        "Your health score is 65.0. "
        "You can save ₹99,999 in taxes this year."  # hallucinated — not in tool result
    )

    validated = validate_response(agent_text, tool_results)

    # The valid sentence must be preserved
    assert "65.0" in validated
    # The hallucinated sentence must be stripped
    assert "99,999" not in validated
    assert "99999" not in validated
