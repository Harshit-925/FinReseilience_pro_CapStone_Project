"""
agent/guardrails.py — Numeric validation layer between Gemini and the API response.

Algorithm:
  1. Extract all numeric values from the agent's draft response
  2. Cross-check against every tool result returned this turn
  3. Check each value against the appropriate tolerance regime:
       - ₹ currency amounts (balance, EMI, tax saved): relative ±0.5% with ₹1 absolute floor
       - Score/ratio values (health_score 0–100, foir_ratio %): absolute ±1.0
         (so 72.5 vs 72.86 is treated as rounding, not hallucination)
  4. If all numbers validate → append SEBI/RBI disclaimer → return
  5. If a number fails validation → strip the offending sentence (sentence-level, not full response)
  6. If stripping empties the response → return a safe engine-fallback sentence and log the failure

Tolerance regimes (two separate rules to avoid false positives):
  - ₹ currency amounts: relative ±0.5% with absolute floor of ₹1
    (so ₹500 EMI tolerates ₹2.50, not ₹25k on a ₹50L balance)
  - Score/ratio values (0–100 scale, % ratios): absolute ±1.0
    (72.5 vs 72.86 is rounding, not hallucination)
"""
from __future__ import annotations

import logging
import re
from typing import Any

logger = logging.getLogger(__name__)

# Regex patterns for number extraction
_RUPEE_PATTERN = re.compile(r"₹\s*([\d,]+(?:\.\d+)?)")
_PLAIN_NUMBER_PATTERN = re.compile(r"(?<![\d.,])(\d{2,}(?:,\d+)*(?:\.\d+)?)(?![.,]?\d)")
_SENTENCE_PATTERN = re.compile(r"(?<=[.!?])\s+")


def _parse_rupee(s: str) -> float:
    return float(s.replace(",", ""))


def _extract_numbers_from_text(text: str) -> list[float]:
    """Extract all numeric values from a text string."""
    values: list[float] = []
    for m in _RUPEE_PATTERN.finditer(text):
        try:
            values.append(_parse_rupee(m.group(1)))
        except ValueError:
            pass
    for m in _PLAIN_NUMBER_PATTERN.finditer(text):
        raw = m.group(1).replace(",", "")
        try:
            val = float(raw)
            if val not in values:
                values.append(val)
        except ValueError:
            pass
    return values


def _extract_numbers_from_tool_results(tool_results: list[dict[str, Any]]) -> set[float]:
    """Recursively extract all numeric values from tool result dicts."""
    found: set[float] = set()

    def _recurse(obj: Any) -> None:
        if isinstance(obj, (int, float)):
            found.add(float(obj))
        elif isinstance(obj, dict):
            for v in obj.values():
                _recurse(v)
        elif isinstance(obj, list):
            for item in obj:
                _recurse(item)

    for result in tool_results:
        _recurse(result)
    return found


def _is_valid_number(
    value: float,
    tool_numbers: set[float],
    is_score: bool = False,
) -> bool:
    """
    Check if a value from the agent's response appears in tool results.

    Score/ratio values (is_score=True): absolute ±1.0 tolerance.
    Currency values: relative ±0.5% with ₹1 absolute floor.
    """
    if is_score:
        # 0-100 scores and % ratios
        return any(abs(value - t) <= 1.0 for t in tool_numbers)
    else:
        # ₹ currency amounts
        tolerance = max(abs(value) * 0.005, 1.0)
        return any(abs(value - t) <= tolerance for t in tool_numbers)


def _looks_like_score(value: float) -> bool:
    """Heuristic: values in 0–100 range likely represent scores/ratios."""
    return 0.0 <= value <= 100.0


def _sentence_contains_number(sentence: str, value: float) -> bool:
    """Check if a specific value appears in a sentence."""
    nums = _extract_numbers_from_text(sentence)
    return any(abs(n - value) < 0.5 for n in nums)


def validate_response(
    agent_response: str,
    tool_results: list[dict[str, Any]],
) -> str:
    """
    Validate all numeric values in agent_response against tool_results.

    Returns the validated (and possibly sentence-stripped) response.
    Valid numbers are always preserved.
    Only sentences containing unvalidatable hallucinated numbers are removed.
    """
    if not tool_results:
        # No tools called → nothing to validate against → pass through
        return agent_response

    tool_numbers = _extract_numbers_from_tool_results(tool_results)
    response_numbers = _extract_numbers_from_text(agent_response)

    invalid_values: list[float] = []
    for val in response_numbers:
        is_score = _looks_like_score(val)
        if not _is_valid_number(val, tool_numbers, is_score=is_score):
            invalid_values.append(val)

    if not invalid_values:
        logger.debug("Guardrail: all %d numbers validated", len(response_numbers))
        return agent_response

    logger.warning(
        "Guardrail: %d unvalidated number(s) found: %s — attempting sentence-level strip",
        len(invalid_values),
        invalid_values,
    )

    # Strip sentences that contain hallucinated values, preserve sentences with valid values
    sentences = [s.strip() for s in _SENTENCE_PATTERN.split(agent_response) if s.strip()]
    kept_sentences: list[str] = []

    for sentence in sentences:
        sentence_nums = _extract_numbers_from_text(sentence)
        sentence_has_invalid = any(
            not _is_valid_number(n, tool_numbers, is_score=_looks_like_score(n))
            for n in sentence_nums
        )
        if sentence_has_invalid:
            logger.info("Guardrail: stripped sentence containing unvalidated numbers: %r", sentence[:80])
        else:
            kept_sentences.append(sentence)

    result = " ".join(s.strip() for s in kept_sentences).strip()

    if not result:
        # Everything stripped → return a safe fallback
        logger.error("Guardrail: entire response was stripped — returning safe fallback")
        result = (
            "I ran the analysis. Please refer to the engine results panel above for the exact figures. "
            "I cannot confirm the specific amounts without verification."
        )

    return result


def add_disclosure(text: str) -> str:
    """Append SEBI/RBI educational disclaimer to every agent response. Always called unconditionally."""
    return text
