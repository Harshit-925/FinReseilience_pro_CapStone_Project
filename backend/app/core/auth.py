"""
PocketBase auth verification dependency.

Verifies bearer tokens by calling PocketBase's auth-refresh endpoint.
No shared JWT signing secret needed — uses the call-back approach.
"""

from __future__ import annotations

from typing import Any

import httpx
from fastapi import Header, HTTPException

from app.core.config import get_settings


async def get_current_user(
    authorization: str | None = Header(None, description="Bearer <token>"),
) -> dict[str, Any]:
    """
    FastAPI dependency: verify the caller's PocketBase auth token.

    Uses PocketBase's POST /api/collections/users/auth-refresh endpoint.
    Returns the user record on valid token, raises 401 otherwise.

    This is the call-back approach — no shared signing secret between
    FastAPI and PocketBase. Cost: one network hop per authenticated request.
    Acceptable at this build's rate limits (30/10/60 req/min).
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = authorization.removeprefix("Bearer ").strip()
    pb_url = get_settings().pocketbase_url
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                f"{pb_url}/api/collections/users/auth-refresh",
                headers={"Authorization": f"Bearer {token}"}
            )

        if resp.status_code == 200:
            data = resp.json()
            record = data.get("record", {})
            return {
                "id": record.get("id", ""),
                "email": record.get("email", ""),
                "token": data.get("token", token),
            }

        raise HTTPException(status_code=401, detail="Invalid or expired authentication token")

    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Auth service unavailable")


async def get_optional_user(
    authorization: str | None = Header(None, description="Bearer <token>"),
) -> dict[str, Any] | None:
    """
    FastAPI dependency: Returns user if valid token provided, otherwise None.
    Allows for endpoints to be used by unauthenticated users.
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None
        
    return await get_current_user(authorization)
