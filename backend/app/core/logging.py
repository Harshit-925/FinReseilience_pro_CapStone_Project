"""
Structured logging + RequestIdMiddleware.

JSON formatter + UUID per request echoed as X-Request-Id.
"""

from __future__ import annotations

import logging
import time
import uuid
from typing import Any

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response


class JsonFormatter(logging.Formatter):
    """Simple JSON log formatter — no extra dependency."""

    def format(self, record: logging.LogRecord) -> str:
        log_data: dict[str, Any] = {
            "timestamp": self.formatTime(record),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        # Attach request_id if present
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id  # type: ignore[attr-defined]
        if record.exc_info and record.exc_info[1]:
            log_data["exception"] = str(record.exc_info[1])
        # Use repr for JSON-like output without importing json
        return str(log_data)


class RequestIdMiddleware(BaseHTTPMiddleware):
    """Assign a UUID to each request, echo as X-Request-Id, bind to logs."""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = round((time.perf_counter() - start) * 1000, 1)

        response.headers["X-Request-Id"] = request_id

        logger = logging.getLogger("finresilience.request")
        logger.info(
            "%s %s → %s (%.1fms)",
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
            extra={"request_id": request_id},
        )

        return response


def setup_logging() -> None:
    """Configure root logger with JSON formatter."""
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())

    root = logging.getLogger()
    root.setLevel(logging.INFO)
    root.addHandler(handler)

    # Quiet noisy libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
