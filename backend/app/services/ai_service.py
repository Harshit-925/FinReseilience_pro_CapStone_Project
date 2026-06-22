"""
AI narrative service — Gemini 2.5 Flash.

Takes engine output as context → generates 2-4 sentences of personalized
narrative in plain language. Falls back to engine text on 429/failure.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any

from app.core.config import get_settings

logger = logging.getLogger(__name__)


async def generate_narrative(
    engine_result: dict[str, Any],
) -> tuple[str, bool]:
    """
    Generate AI narrative from engine output.

    Returns (narrative_text, fallback_used).
    Never crashes — always returns something usable.
    """
    settings = get_settings()

    if not settings.use_ai or not settings.gemini_api_key or settings.gemini_api_key == "your_key_here":
        logger.info("AI narrative disabled or no valid API key provided — using engine fallback")
        return _build_fallback_narrative(engine_result), True

    try:
        import httpx

        # Build prompt from engine output
        prompt = _build_prompt(engine_result)

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={settings.gemini_api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}]
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, timeout=15.0)
            response.raise_for_status()
            data = response.json()

        if "candidates" in data and data["candidates"]:
            candidate = data["candidates"][0]
            if "content" in candidate and "parts" in candidate["content"]:
                text = candidate["content"]["parts"][0].get("text", "").strip()

                # Strip markdown code fences defensively
                text = re.sub(r"^```(?:json)?\s*", "", text)
                text = re.sub(r"\s*```$", "", text)

                # Try to parse as JSON if it looks like it
                if text.startswith("{"):
                    try:
                        parsed = json.loads(text)
                        text = parsed.get("narrative", text)
                    except json.JSONDecodeError:
                        pass

                return text, False

        logger.warning("AI returned empty response — using fallback")
        return _build_fallback_narrative(engine_result), True

    except Exception as exc:
        # Log failure type, never raw exception text or request content
        exc_type = type(exc).__name__
        logger.warning(
            "AI service failed (%s) — using engine fallback narrative",
            exc_type,
        )
        return _build_fallback_narrative(engine_result), True


def _build_prompt(engine_result: dict[str, Any]) -> str:
    """Build a concise prompt grounded in engine output."""
    cards = engine_result.get("action_cards", [])
    health = engine_result.get("health_score", {})
    grade = engine_result.get("grade", "")
    surplus = engine_result.get("surplus", 0)

    cards_text = "\n".join(
        f"- {c.get('destination', '')}: ₹{c.get('amount', 0):,.0f} — {c.get('impact_metric', '')}"
        for c in cards
    )

    return (
        "You are a concise Indian financial advisor. Based on this engine-computed analysis, "
        "write 2-4 sentences of personalized advice in plain language. "
        "Reference the specific amounts and actions. Do NOT invent numbers — only use what's provided.\n\n"
        f"Monthly surplus: ₹{surplus:,.0f}\n"
        f"Health score: {health.get('score', 0)}/100 (Grade: {grade})\n"
        f"FOIR: {health.get('foir_ratio', 0)}% (benchmark ≤ 40%)\n"
        f"Savings rate: {health.get('savings_rate', 0)}% (target ≥ 20%)\n\n"
        f"Recommended actions:\n{cards_text}\n\n"
        "Respond with ONLY the narrative text, no markdown or JSON."
    )


def _build_fallback_narrative(engine_result: dict[str, Any]) -> str:
    """Build a specific, non-generic fallback from engine data."""
    cards = engine_result.get("action_cards", [])
    health = engine_result.get("health_score", {})
    grade = engine_result.get("grade", "")
    surplus = engine_result.get("surplus", 0)

    if not cards:
        return (
            f"Your financial health score is {health.get('score', 0)}/100 ({grade}). "
            f"Monthly surplus: ₹{surplus:,.0f}. "
            "Add your debts and investments to get a personalized allocation plan."
        )

    # Build narrative from top 2 action cards
    parts = [
        f"With a monthly surplus of ₹{surplus:,.0f} and a health score of "
        f"{health.get('score', 0)}/100 ({grade}), here's your optimal allocation:"
    ]

    for card in cards[:2]:
        action = card.get("action_type", "")
        dest = card.get("destination", "")
        amount = card.get("amount", 0)
        impact = card.get("impact_metric", "")

        if action == "PAY_DEBT":
            parts.append(
                f"Prioritize paying ₹{amount:,.0f}/month towards {dest}. {impact}."
            )
        elif action == "INVEST_TAX":
            parts.append(
                f"Invest ₹{amount:,.0f}/month in {dest}. {impact}."
            )
        elif action == "SAVE":
            parts.append(
                f"Route ₹{amount:,.0f}/month to {dest} for your emergency buffer. {impact}."
            )

    return " ".join(parts)
