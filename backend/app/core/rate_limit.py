"""
Rate limiting via slowapi.

Backed by RATE_LIMIT_STORAGE_URI — default memory:// (per-process).
Logs a warning at startup if production uses memory://.
"""

from __future__ import annotations

import logging

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()

limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=settings.rate_limit_storage_uri,
)


def check_rate_limit_storage() -> None:
    """
    Log a warning if production is running with in-memory rate limiting.
    Call once at startup.
    """
    if (
        settings.environment == "production"
        and settings.rate_limit_storage_uri == "memory://"
    ):
        logger.warning(
            "⚠️  rate limiting is per-process (memory://). "
            "Set RATE_LIMIT_STORAGE_URI=redis://... for multi-instance deploys. "
            "Current setup will NOT share rate-limit counters across workers/replicas."
        )
