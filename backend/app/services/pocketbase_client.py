"""
PocketBase client — thin httpx wrapper.

Forwards the user's own bearer token for writes.
No superuser credentials needed.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)


async def save_result(
    user_token: str,
    user_id: str,
    engine_result: dict[str, Any],
    ai_result: dict[str, Any] | None,
    fallback_used: bool,
) -> bool:
    """
    Save analysis result to PocketBase history collection.

    Uses the user's own token — PocketBase's API rule enforces ownership.
    Never crashes the request on write failure.

    Returns True on success, False on failure.
    """
    settings = get_settings()
    url = f"{settings.pocketbase_url}/api/collections/history/records"

    payload = {
        "user": user_id,
        "engine_result": engine_result,
        "ai_result": ai_result or {},
        "fallback_used": fallback_used,
    }

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                url,
                json=payload,
                headers={"Authorization": f"Bearer {user_token}"},
            )

        if resp.status_code in (200, 201):
            return True

        logger.warning(
            "PocketBase history write failed: status=%s",
            resp.status_code,
        )
        return False

    except httpx.RequestError as exc:
        logger.warning(
            "PocketBase history write error: %s",
            type(exc).__name__,
        )
        return False
