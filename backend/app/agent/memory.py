"""
agent/memory.py — Session memory manager.

Reads/writes chat_sessions, goals, and notifications PocketBase collections.
Provides structured context to the agent loop and manages the needs_replan flag.

Alert storage rule: All proactive alerts (FOIR breach, 80C deadline) are written to the
`notifications` collection ONLY — never into `chat_sessions`. Conversation history
and system alerts are kept cleanly separated.
"""
from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Any

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class MemoryManager:
    """Manages user session memory against PocketBase."""

    def __init__(self, user_id: str, user_token: str) -> None:
        self.user_id = user_id
        self.user_token = user_token
        self._settings = get_settings()
        self._pb_url = self._settings.pocketbase_url
        self._headers = {
            "Authorization": user_token,
            "Content-Type": "application/json",
        }

    # ------------------------------------------------------------------
    # Session history
    # ------------------------------------------------------------------

    async def get_last_session(self) -> dict[str, Any] | None:
        """Return the most recent stored analysis session for this user."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    f"{self._pb_url}/api/collections/analysis_history/records",
                    params={
                        "filter": f'user_id="{self.user_id}"',
                        "sort": "-created",
                        "perPage": 1,
                    },
                    headers=self._headers,
                )
                if resp.status_code == 200:
                    items = resp.json().get("items", [])
                    if items:
                        return items[0]
        except Exception as exc:
            logger.warning("memory.get_last_session failed: %s", type(exc).__name__)
        return None

    async def get_chat_history(self, session_id: str, limit: int = 20) -> list[dict[str, Any]]:
        """Return recent chat messages for a given session."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    f"{self._pb_url}/api/collections/chat_sessions/records",
                    params={
                        "filter": f'user_id="{self.user_id}" && session_id="{session_id}"',
                        "sort": "created",
                        "perPage": limit,
                    },
                    headers=self._headers,
                )
                if resp.status_code == 200:
                    return resp.json().get("items", [])
        except Exception as exc:
            logger.warning("memory.get_chat_history failed: %s", type(exc).__name__)
        return []

    async def save_chat_turn(
        self,
        session_id: str,
        user_message: str,
        agent_reply: str,
        tool_calls_made: list[str],
    ) -> None:
        """Persist one chat turn to PocketBase."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                await client.post(
                    f"{self._pb_url}/api/collections/chat_sessions/records",
                    json={
                        "user_id": self.user_id,
                        "session_id": session_id,
                        "user_message": user_message,
                        "agent_reply": agent_reply,
                        "tool_calls_made": json.dumps(tool_calls_made),
                    },
                    headers=self._headers,
                )
        except Exception as exc:
            logger.warning("memory.save_chat_turn failed (non-fatal): %s", type(exc).__name__)

    # ------------------------------------------------------------------
    # needs_replan detection
    # ------------------------------------------------------------------

    def detect_needs_replan(
        self,
        current_profile: dict[str, Any],
        last_session: dict[str, Any] | None,
    ) -> bool:
        """
        Compare current profile to last session. Returns True if a significant
        change is detected (income ≥10% shift, new/removed debt).

        This flag is consumed by loop.py's context builder — when True, the agent
        loop prepends a warning to Gemini's system context forcing it to re-run
        math tools rather than relying on stale session memory.
        """
        if not last_session:
            return False

        try:
            last_engine = last_session.get("engine_result", {})
            last_income_approx = last_engine.get("surplus", 0)

            current_income = float(current_profile.get("monthly_income", 0))
            current_expenses = float(current_profile.get("monthly_expenses", 0))
            current_surplus = current_income - current_expenses

            if last_income_approx and current_surplus:
                pct_change = abs(current_surplus - last_income_approx) / max(abs(last_income_approx), 1)
                if pct_change >= 0.10:
                    logger.info(
                        "needs_replan=True: surplus changed %.1f%%", pct_change * 100
                    )
                    return True

            current_debt_count = len(current_profile.get("debts", []))
            last_debt_count = len(last_engine.get("action_cards", []))
            if abs(current_debt_count - last_debt_count) >= 1:
                logger.info("needs_replan=True: debt count changed")
                return True

        except Exception as exc:
            logger.warning("needs_replan detection error: %s", type(exc).__name__)

        return False

    def build_context_string(
        self,
        last_session: dict[str, Any] | None,
        needs_replan: bool,
    ) -> str:
        """
        Build a structured context string for Gemini's system prompt.
        PII is never included — only financial aggregates and prior recommendations.
        """
        parts: list[str] = []

        if needs_replan:
            parts.append(
                "⚠️ The user's financial profile has changed significantly since the last session. "
                "You MUST re-run the relevant math tools (run_avalanche, run_tax_shield, run_health_score) "
                "with the current figures rather than relying on previous session data."
            )

        if last_session:
            engine = last_session.get("engine_result", {})
            grade = engine.get("grade", "")
            surplus = engine.get("surplus", 0)
            cards = engine.get("action_cards", [])

            parts.append(
                f"Previous session summary: Grade {grade}, "
                f"surplus ₹{surplus:,.0f}/month. "
                f"Top recommendation was: {cards[0].get('destination', 'N/A') if cards else 'N/A'}."
            )
        else:
            parts.append("No previous session found for this user.")

        return "\n".join(parts)

    # ------------------------------------------------------------------
    # Notifications (proactive alerts only — never chat_sessions)
    # ------------------------------------------------------------------

    async def create_notification(self, notification_type: str, message: str) -> None:
        """
        Store a proactive alert in the `notifications` collection.
        Alerts are NEVER stored in chat_sessions — they are a separate concern.
        """
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                await client.post(
                    f"{self._pb_url}/api/collections/notifications/records",
                    json={
                        "user_id": self.user_id,
                        "type": notification_type,
                        "message": message,
                        "read": False,
                    },
                    headers=self._headers,
                )
        except Exception as exc:
            logger.warning("memory.create_notification failed: %s", type(exc).__name__)

    async def get_unread_notifications(self) -> list[dict[str, Any]]:
        """Return all unread notifications for this user."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    f"{self._pb_url}/api/collections/notifications/records",
                    params={
                        "filter": f'user_id="{self.user_id}" && read=false',
                        "sort": "-created",
                        "perPage": 20,
                    },
                    headers=self._headers,
                )
                if resp.status_code == 200:
                    return resp.json().get("items", [])
        except Exception as exc:
            logger.warning("memory.get_unread_notifications failed: %s", type(exc).__name__)
        return []
