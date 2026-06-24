import pytest
from app.agent.guardrails import validate_response, _extract_numbers_from_text, _extract_numbers_from_tool_results

def test_extract_numbers():
    assert _extract_numbers_from_text("Your EMI is ₹5,000.50 and your score is 85.") == [5000.5, 85.0]
    assert _extract_numbers_from_text("You have 10,000 in savings.") == [10000.0]

def test_guardrails_pass():
    tool_results = [{"score": 85.0, "foir": 38.0}]
    response = "Your health score is 85.0. Your FOIR is 38.0%."
    validated = validate_response(response, tool_results)
    assert "85.0" in validated
    assert "38.0" in validated
    assert "score" in validated

def test_guardrails_strip_hallucinated():
    tool_results = [{"score": 85.0, "foir": 38.0}]
    response = "Your health score is 85.0. Your FOIR is 38.0%. The engine says you will save ₹999,999 in tax."
    validated = validate_response(response, tool_results)
    assert "85.0" in validated
    assert "38.0" in validated
    assert "999,999" not in validated
    assert "tax" not in validated

def test_guardrails_precision():
    # User feedback: Test 2 has a subtle bug... The bad response is "Your score is 99.9 and your FOIR is 38.0%."
    # The assertion should verify that "38.0" is preserved even when "99.9" is stripped if they are in different sentences,
    # or stripped together if in same sentence. Since we do sentence-level stripping:
    tool_results = [{"score": 85.0, "foir": 38.0}]
    # 38.0 is valid, 99.9 is hallucinated
    response = "Your FOIR is 38.0%. Your score is 99.9."
    validated = validate_response(response, tool_results)
    
    assert "99.9" not in validated
    assert "38.0" in validated  # The sentence with 38.0 should be preserved!
    
def test_guardrails_currency_tolerance():
    # ₹ currency amounts tolerate ±0.5%
    tool_results = [{"amount": 50000.0}]
    # 50200 is within 0.5% (50000 * 0.005 = 250)
    response = "You have ₹50,200 in the bank."
    validated = validate_response(response, tool_results)
    assert "50,200" in validated

    # 50500 is > 0.5%
    response_bad = "You have ₹50,500 in the bank."
    validated_bad = validate_response(response_bad, tool_results)
    assert "50,500" not in validated_bad
    
def test_guardrails_score_tolerance():
    # scores tolerate ±1.0
    tool_results = [{"score": 72.5}]
    # 72.86 is within 1.0
    response = "Your score is 72.86."
    validated = validate_response(response, tool_results)
    assert "72.86" in validated

    # 74.0 is > 1.0
    response_bad = "Your score is 74.0."
    validated_bad = validate_response(response_bad, tool_results)
    assert "74.0" not in validated_bad

def test_guardrails_decimal_split():
    # Regression test for decimal splitting issue
    # The sentence splitting regex should not break on '38.0%'
    tool_results = [{"foir": 38.0}]
    response = "Your FOIR is 38.0%. This is the end of the sentence."
    # If it splits on '38.', it would process '0%. This is the end of the sentence.' separately.
    validated = validate_response(response, tool_results)
    assert "38.0%" in validated
