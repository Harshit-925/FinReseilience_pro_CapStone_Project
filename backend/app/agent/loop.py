"""
agent/loop.py — Agentic planning loop.

PRIMARY:  OpenRouter free model (Llama 3.1 8B — fast, free, supports tool calling)
FALLBACK: Gemini 2.5 Flash via Google Generative Language API

Implements a plan → act → observe → respond state machine.
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

# Free OpenRouter models that support tool/function calling (in priority order)
OPENROUTER_FREE_MODELS = [
    "meta-llama/llama-3.1-8b-instruct:free",
    "mistralai/mistral-7b-instruct:free",
    "microsoft/phi-3-mini-128k-instruct:free",
]

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

# Optional Google ADK Integration (structural definition only)
try:
    from google.adk.agents.llm_agent import LlmAgent

    def adk_run_avalanche(debts: list, monthly_surplus: float) -> dict:
        """Calculate the optimal debt payoff schedule using the Avalanche method."""
        return {}

    def adk_run_tax_shield(annual_income: float, basic_salary: float, tax_regime: str, city_type: str) -> dict:
        """Calculate optimal tax-saving investment recommendations."""
        return {}

    FinancialAdvisorAgent = LlmAgent(
        name="FinancialAdvisorAgent",
        model="gemini-2.5-flash",
        instruction=SYSTEM_PROMPT,
        tools=[adk_run_avalanche, adk_run_tax_shield]
    )
    ADK_AVAILABLE = True
except ImportError:
    ADK_AVAILABLE = False


async def run_agent_turn(
    user_message: str,
    memory_context: str,
    chat_history: list[dict[str, Any]] | None = None,
    profile_snapshot: dict[str, Any] | None = None,
    user_id: str | None = None,
    user_token: str | None = None,
) -> dict[str, Any]:
    """
    Execute one full agent turn.
    Primary:  OpenRouter free model (fast, no quota limits)
    Fallback: Gemini 2.5 Flash (used only if OpenRouter fails)
    """
    settings = get_settings()

    # ── PRIMARY: OpenRouter free model ──────────────────────────────────────
    if settings.openrouter_api_key:
        result = await _run_openrouter_primary(
            user_message=user_message,
            memory_context=memory_context,
            chat_history=chat_history,
            user_id=user_id,
        )
        if result is not None:
            return result
        logger.warning("OpenRouter primary failed — falling back to Gemini")
    else:
        logger.warning("No OPENROUTER_API_KEY set — skipping to Gemini fallback")

    # ── FALLBACK: Gemini 2.5 Flash ───────────────────────────────────────────
    if settings.gemini_api_key and settings.gemini_api_key != "your_key_here":
        return await _run_gemini_fallback(
            user_message=user_message,
            memory_context=memory_context,
            chat_history=chat_history,
            user_id=user_id,
        )

    # Both providers unavailable
    return {
        "reply": add_disclosure(FALLBACK_RESPONSE),
        "tool_calls_made": [],
        "tool_results": [],
        "fallback_used": True,
    }


async def _run_openrouter_primary(
    user_message: str,
    memory_context: str,
    chat_history: list[dict[str, Any]] | None = None,
    user_id: str | None = None,
) -> dict[str, Any] | None:
    """
    Primary chat loop via OpenRouter free models with function calling.
    Returns None if it fails so the caller can try the Gemini fallback.
    """
    settings = get_settings()

    openai_tools = [
        {
            "type": "function",
            "function": {
                "name": t["name"],
                "description": t["description"],
                "parameters": t["parameters"],
            },
        }
        for t in TOOL_DECLARATIONS
    ]

    system_content = f"{SYSTEM_PROMPT}\n\nUser context:\n{memory_context}"
    messages: list[dict[str, Any]] = [{"role": "system", "content": system_content}]

    if chat_history:
        for msg in chat_history:
            if msg.get("user_message"):
                messages.append({"role": "user", "content": msg["user_message"]})
            if msg.get("agent_reply"):
                messages.append({"role": "assistant", "content": msg["agent_reply"]})

    messages.append({"role": "user", "content": user_message})

    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "FinResilience Pro",
    }

    all_tool_results: list[dict[str, Any]] = []
    tool_calls_made: list[str] = []

    # Try each free model in order until one works
    for model in OPENROUTER_FREE_MODELS:
        try:
            logger.info("OpenRouter primary: trying model %s", model)
            msgs_copy = [m.copy() for m in messages]

            for round_num in range(1, MAX_ROUNDS + 1):
                payload = {
                    "model": model,
                    "messages": msgs_copy,
                    "tools": openai_tools,
                    "tool_choice": "auto",
                    "max_tokens": 1024,
                }

                async with httpx.AsyncClient(timeout=25.0) as client:
                    resp = await client.post(
                        "https://openrouter.ai/api/v1/chat/completions",
                        json=payload,
                        headers=headers,
                    )
                    resp.raise_for_status()
                    data = resp.json()

                choice = data["choices"][0]
                message = choice["message"]
                msgs_copy.append(message)

                if message.get("tool_calls"):
                    for tc in message["tool_calls"]:
                        func = tc["function"]
                        tool_name = func["name"]
                        try:
                            tool_args = json.loads(func["arguments"])
                        except Exception:
                            tool_args = {}

                        if tool_name not in {t["name"] for t in TOOL_DECLARATIONS}:
                            tool_result: dict[str, Any] = {"error": f"Unknown tool: {tool_name}"}
                        else:
                            tool_result = await execute_tool(tool_name, tool_args, user_id)
                            tool_calls_made.append(tool_name)
                            all_tool_results.append(tool_result)

                        msgs_copy.append({
                            "role": "tool",
                            "tool_call_id": tc["id"],
                            "name": tool_name,
                            "content": json.dumps(tool_result),
                        })
                else:
                    final_text = message.get("content", "") or ""
                    if not final_text.strip():
                        final_text = FALLBACK_RESPONSE
                    validated = validate_response(final_text, all_tool_results)
                    logger.info("OpenRouter (%s) responded — tools used: %s", model, tool_calls_made)
                    return {
                        "reply": add_disclosure(validated),
                        "tool_calls_made": tool_calls_made,
                        "tool_results": all_tool_results,
                        "fallback_used": False,
                    }

            # Exceeded MAX_ROUNDS for this model — try next model
            logger.warning("OpenRouter model %s hit MAX_ROUNDS without final answer", model)

        except Exception as exc:
            logger.warning("OpenRouter model %s failed: %s — trying next", model, type(exc).__name__)
            # Reset tool state between model attempts
            all_tool_results = []
            tool_calls_made = []
            continue

    # All free models failed
    return None


async def _run_gemini_fallback(
    user_message: str,
    memory_context: str,
    chat_history: list[dict[str, Any]] | None = None,
    user_id: str | None = None,
) -> dict[str, Any]:
    """
    Fallback loop using Gemini 2.5 Flash via the Generative Language REST API.
    Used only when OpenRouter is unavailable or all free models fail.
    """
    settings = get_settings()

    system_context = f"{SYSTEM_PROMPT}\n\nUser context:\n{memory_context}"
    conversation: list[dict[str, Any]] = []

    if chat_history:
        for msg in chat_history:
            if msg.get("user_message"):
                conversation.append({"role": "user", "parts": [{"text": msg["user_message"]}]})
            if msg.get("agent_reply"):
                conversation.append({"role": "model", "parts": [{"text": msg["agent_reply"]}]})

    conversation.append(
        {"role": "user", "parts": [{"text": f"{system_context}\n\nUser question: {user_message}"}]}
    )

    all_tool_results: list[dict[str, Any]] = []
    tool_calls_made: list[str] = []

    try:
        for round_num in range(1, MAX_ROUNDS + 1):
            logger.info("Gemini fallback round %d/%d", round_num, MAX_ROUNDS)

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
                break

            candidate = data["candidates"][0]
            parts = candidate.get("content", {}).get("parts", [])
            function_calls = [p.get("functionCall") for p in parts if "functionCall" in p]

            if not function_calls:
                text_parts = [p.get("text", "") for p in parts if "text" in p]
                final_text = " ".join(t.strip() for t in text_parts if t.strip())
                if not final_text:
                    final_text = FALLBACK_RESPONSE
                validated = validate_response(final_text, all_tool_results)
                logger.info("Gemini fallback responded — tools: %s", tool_calls_made)
                return {
                    "reply": add_disclosure(validated),
                    "tool_calls_made": tool_calls_made,
                    "tool_results": all_tool_results,
                    "fallback_used": False,
                }

            conversation.append({"role": "model", "parts": parts})

            function_responses: list[dict[str, Any]] = []
            for fc in function_calls:
                tool_name = fc.get("name", "")
                tool_args = fc.get("args", {})
                if tool_name not in {t["name"] for t in TOOL_DECLARATIONS}:
                    continue
                tool_result = await execute_tool(tool_name=tool_name, tool_args=tool_args, user_id=user_id)
                tool_calls_made.append(tool_name)
                all_tool_results.append(tool_result)
                function_responses.append({
                    "functionResponse": {
                        "name": tool_name,
                        "response": {"result": tool_result},
                    }
                })

            conversation.append({"role": "user", "parts": function_responses})

    except Exception as exc:
        logger.error("Gemini fallback failed: %s", type(exc).__name__)

    return {
        "reply": add_disclosure(FALLBACK_RESPONSE),
        "tool_calls_made": tool_calls_made,
        "tool_results": all_tool_results,
        "fallback_used": True,
    }
