"""
agent/loop.py — Agentic planning loop.

Implements a plan → act → observe → respond state machine.
Gemini decides which tools to call; the loop executes them deterministically.

Flow:
  Round 1: Gemini receives user message + context → returns tool_calls list
  Round 2-4: Execute each tool → feed results back to Gemini → repeat if needed
  Final: Gemini synthesizes all tool results → guardrails validates → response sent

Max 4 tool-call rounds to bound latency. Loop exits early when Gemini signals completion.
"""
from __future__ import annotations

import json
import logging
from typing import Any

import httpx

from app.agent.guardrails import add_disclosure, validate_response
from app.agent.tools import TOOL_DECLARATIONS, execute_tool
from app.core.config import get_settings

logger = logging.getLogger(__name__)

MAX_ROUNDS = 4
SYSTEM_PROMPT = """You are a deterministic Indian financial advisor agent. You have access to 4 math tools and 1 memory tool.

RULES (strictly enforced):
1. NEVER invent or calculate numbers yourself. Always use the provided tools for any calculation.
2. Call ONLY the tools relevant to the user's question — do not call all tools for every question.
3. After receiving tool results, synthesize a clear, specific answer using only the numbers from tool outputs.
4. If the user asks about tax → call run_tax_shield. Debt → call run_avalanche. Overall health → run_health_score. Scenario → run_what_if. History → recall_last_session.
5. For comparison questions ("should I prepay or invest?"), call both relevant tools and compare outputs explicitly.
6. Respond in plain, concise English. Reference specific ₹ amounts and months from tool results.
7. Do NOT add caveats like "I recommend consulting..." — the disclaimer is added automatically.
"""

FALLBACK_RESPONSE = (
    "I ran your analysis using the financial engine. "
    "Please refer to the Analysis tab for the complete results with exact figures."
)


async def run_agent_turn(
    user_message: str,
    memory_context: str,
    profile_snapshot: dict[str, Any] | None = None,
    user_id: str | None = None,
    user_token: str | None = None,
) -> dict[str, Any]:
    """
    Execute one full agent turn: user message → tool calls → validated response.

    Returns:
        {
            "reply": str,               # Final agent response (validated + disclaimer)
            "tool_calls_made": list[str], # Names of tools called this turn
            "tool_results": list[dict],   # Raw tool outputs (for source attribution)
            "fallback_used": bool,
        }
    """
    settings = get_settings()

    if not settings.gemini_api_key or settings.gemini_api_key == "your_key_here":
        return {
            "reply": add_disclosure(FALLBACK_RESPONSE),
            "tool_calls_made": [],
            "tool_results": [],
            "fallback_used": True,
        }

    system_context = f"{SYSTEM_PROMPT}\n\nUser context:\n{memory_context}"

    all_tool_results: list[dict[str, Any]] = []
    tool_calls_made: list[str] = []

    # Build conversation history for multi-round loop
    conversation: list[dict[str, Any]] = [
        {"role": "user", "parts": [{"text": f"{system_context}\n\nUser question: {user_message}"}]}
    ]

    try:
        for round_num in range(1, MAX_ROUNDS + 1):
            logger.info("Agent loop round %d/%d", round_num, MAX_ROUNDS)

            # Call Gemini with function-calling enabled
            payload = {
                "contents": conversation,
                "tools": [{"functionDeclarations": TOOL_DECLARATIONS}],
                "tool_config": {"function_calling_config": {"mode": "AUTO"}},
            }

            url = (
                f"https://generativelanguage.googleapis.com/v1beta/"
                f"models/gemini-2.5-flash:generateContent?key={settings.gemini_api_key}"
            )

            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(url, json=payload)
                resp.raise_for_status()
                data = resp.json()

            if not data.get("candidates"):
                logger.warning("Gemini returned no candidates on round %d", round_num)
                break

            candidate = data["candidates"][0]
            content = candidate.get("content", {})
            parts = content.get("parts", [])

            # Check if Gemini wants to call tools
            function_calls = [p.get("functionCall") for p in parts if "functionCall" in p]

            if not function_calls:
                # Gemini is done — synthesize the final text response
                text_parts = [p.get("text", "") for p in parts if "text" in p]
                final_text = " ".join(t.strip() for t in text_parts if t.strip())

                if not final_text:
                    final_text = FALLBACK_RESPONSE

                # Validate numbers against tool results
                validated = validate_response(final_text, all_tool_results)
                return {
                    "reply": add_disclosure(validated),
                    "tool_calls_made": tool_calls_made,
                    "tool_results": all_tool_results,
                    "fallback_used": False,
                }

            # Add Gemini's tool-call request to conversation
            conversation.append({"role": "model", "parts": parts})

            # Execute each requested tool call
            function_responses: list[dict[str, Any]] = []
            for fc in function_calls:
                tool_name = fc.get("name", "")
                tool_args = fc.get("args", {})

                if tool_name not in {t["name"] for t in TOOL_DECLARATIONS}:
                    logger.error("Gemini requested unknown tool: %r", tool_name)
                    continue

                tool_result = await execute_tool(
                    tool_name=tool_name,
                    tool_args=tool_args,
                    user_id=user_id,
                )
                tool_calls_made.append(tool_name)
                all_tool_results.append(tool_result)

                function_responses.append({
                    "functionResponse": {
                        "name": tool_name,
                        "response": {"result": tool_result},
                    }
                })

            # Feed tool results back into the conversation
            conversation.append({"role": "user", "parts": function_responses})

        # Max rounds reached — return what we have
        logger.warning("Agent loop hit MAX_ROUNDS=%d without completion", MAX_ROUNDS)
        return {
            "reply": add_disclosure(FALLBACK_RESPONSE),
            "tool_calls_made": tool_calls_made,
            "tool_results": all_tool_results,
            "fallback_used": True,
        }

    except Exception as exc:
        logger.error("Agent loop failed: %s", type(exc).__name__)
        return {
            "reply": add_disclosure(FALLBACK_RESPONSE),
            "tool_calls_made": tool_calls_made,
            "tool_results": all_tool_results,
            "fallback_used": True,
        }
