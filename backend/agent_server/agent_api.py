"""
agent_server/agent_api.py — FastAPI app exposing POST /agent/chat via ADK Runner.

This is the primary path for /api/chat (proxied from the main backend).
The main backend's routes/main.py calls this service first; if unreachable,
it falls back to the existing loop.py custom agent loop.

Flow:
  1. Build MCPToolset connecting to the MCP server (SSE on port 9000)
  2. Merge MCP tools with recall_last_session FunctionTool
  3. Run ADK Runner for one agent turn
  4. Apply guardrails (numeric validation + sentence stripping)
  5. Return ChatResponse-compatible JSON
"""
from __future__ import annotations

import logging
import os
import sys
import uuid
from typing import Any

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from google.adk import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.tools import FunctionTool, McpToolset
from google.adk.tools.mcp_tool import SseConnectionParams

from agent_server.agent import root_agent, recall_last_session_tool, CONCIERGE_SYSTEM_PROMPT
from app.agent.guardrails import add_disclosure, validate_response

logger = logging.getLogger(__name__)

# MCP server URL — within the same container, MCP runs on port 9000
MCP_SERVER_URL = os.environ.get("MCP_SERVER_URL", "http://localhost:9000/sse")

app = FastAPI(
    title="FinResilience Agent Server",
    version="1.0.0",
    docs_url="/agent/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restricted by main backend's CORS — this service is internal
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# In-memory session service — one per agent-server process
# NOTE: Sessions are not persisted across container restarts.
# Conversation history is saved to PocketBase by the main backend.
# ---------------------------------------------------------------------------
session_service = InMemorySessionService()

FALLBACK_REPLY = (
    "I ran your analysis using the financial engine. "
    "Please refer to the Analysis tab for the complete results with exact figures."
)


# ---------------------------------------------------------------------------
# Request / Response schemas (mirroring main backend's ChatRequest/ChatResponse)
# ---------------------------------------------------------------------------
class AgentChatRequest(BaseModel):
    message: str
    session_id: str
    user_id: str = "anonymous"
    memory_context: str = ""
    profile_snapshot: dict[str, Any] | None = None


class AgentChatResponse(BaseModel):
    reply: str
    tool_calls_made: list[str]
    tool_results: list[dict[str, Any]]
    fallback_used: bool


# ---------------------------------------------------------------------------
# POST /agent/chat
# ---------------------------------------------------------------------------
@app.post("/agent/chat", response_model=AgentChatResponse)
async def agent_chat(payload: AgentChatRequest) -> AgentChatResponse:
    """
    Run one ADK agent turn and return a validated response.

    The ADK Runner manages tool calling internally — we don't implement
    a custom plan/act/observe loop here. ADK handles that.
    """
    tool_calls_made: list[str] = []
    tool_results: list[dict[str, Any]] = []

    try:
        # Build MCPToolset connecting to the MCP server over SSE
        # This wraps run_avalanche, run_tax_shield, run_health_score, run_what_if
        async def get_mcp_toolset() -> McpToolset:
            return McpToolset(
                connection_params=SseConnectionParams(
                    url=f"http://127.0.0.1:{MCP_PORT}/sse"
                )
            )

        mcp_toolset = await get_mcp_toolset()

        # Compose the full tool list: MCP math tools + recall FunctionTool
        # (recall is not in MCP — it's a DB read, not a math operation)
        tools = [mcp_toolset, recall_last_session_tool]

        # Build an agent instance with the full tool list for this request
        # We create a fresh agent per request to ensure MCP connection is fresh
        agent_with_tools = Agent(
            name=root_agent.name,
            model=root_agent.model,
            instruction=_build_instruction(payload.memory_context, payload.profile_snapshot),
            tools=tools,
        )

        # Get or create a session for this user
        session_id = payload.session_id or str(uuid.uuid4())
        try:
            session = session_service.get_session(
                app_name="finresilience_concierge",
                user_id=payload.user_id,
                session_id=session_id,
            )
        except Exception:
            session = session_service.create_session(
                app_name="finresilience_concierge",
                user_id=payload.user_id,
                session_id=session_id,
            )

        # Run the agent turn via ADK Runner
        runner = Runner(
            agent=agent_with_tools,
            app_name="finresilience_concierge",
            session_service=session_service,
        )

        final_text = ""
        async for event in runner.run_async(
            user_id=payload.user_id,
            session_id=session_id,
            new_message=_build_user_message(payload.message),
        ):
            # Collect tool call information from ADK events
            if hasattr(event, "tool_call") and event.tool_call:
                tc = event.tool_call
                tool_name = getattr(tc, "name", "")
                if tool_name and tool_name not in tool_calls_made:
                    tool_calls_made.append(tool_name)

            if hasattr(event, "tool_response") and event.tool_response:
                tr = event.tool_response
                result_data = getattr(tr, "output", {})
                if result_data:
                    tool_results.append(result_data if isinstance(result_data, dict) else {"raw": str(result_data)})

            # Capture final text response
            if hasattr(event, "content") and event.content:
                content = event.content
                if hasattr(content, "parts"):
                    for part in content.parts:
                        if hasattr(part, "text") and part.text:
                            final_text = part.text

        if not final_text:
            final_text = FALLBACK_REPLY
            fallback_used = True
        else:
            fallback_used = False

        # Apply numeric guardrails — strip sentences with hallucinated numbers
        validated = validate_response(final_text, tool_results)
        reply = add_disclosure(validated)

        return AgentChatResponse(
            reply=reply,
            tool_calls_made=tool_calls_made,
            tool_results=tool_results,
            fallback_used=fallback_used,
        )

    except Exception as exc:
        logger.error("agent_chat failed: %s", type(exc).__name__, exc_info=True)
        return AgentChatResponse(
            reply=add_disclosure(FALLBACK_REPLY),
            tool_calls_made=tool_calls_made,
            tool_results=tool_results,
            fallback_used=True,
        )


def _build_instruction(memory_context: str, profile_snapshot: dict | None) -> str:
    """Inject memory context and current profile into the agent's instruction."""
    extra_parts: list[str] = []

    if memory_context:
        extra_parts.append(f"\n\nSESSION MEMORY:\n{memory_context}")

    if profile_snapshot:
        income = profile_snapshot.get("monthly_income", 0)
        expenses = profile_snapshot.get("monthly_expenses", 0)
        debt_count = len(profile_snapshot.get("debts", []))
        extra_parts.append(
            f"\n\nCURRENT FINANCIAL SNAPSHOT:\n"
            f"- Monthly Income: ₹{income:,.0f}\n"
            f"- Monthly Expenses: ₹{expenses:,.0f}\n"
            f"- Active Debts: {debt_count}\n"
            f"Use these figures when calling math tools if the user doesn't specify otherwise."
        )

    return CONCIERGE_SYSTEM_PROMPT + "".join(extra_parts)


def _build_user_message(text: str) -> Any:
    """Build an ADK-compatible user message."""
    from google.genai import types
    return types.Content(
        role="user",
        parts=[types.Part(text=text)],
    )


@app.get("/agent/health")
async def health() -> dict[str, str]:
    """Health check for the agent server."""
    return {"status": "ok", "service": "finresilience-agent-server"}
