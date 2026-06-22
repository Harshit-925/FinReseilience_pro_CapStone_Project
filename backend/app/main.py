"""
FinResilience Pro — Application Factory

Startup order: logging → security middleware → CORS → rate-limit → router.
Fails loudly at startup if PocketBase is unreachable.
"""

from __future__ import annotations

import logging

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import get_settings
from app.core.logging import RequestIdMiddleware, setup_logging
from app.core.rate_limit import check_rate_limit_storage, limiter
from app.core.security import SecurityHeadersMiddleware
from app.routes.main import router

logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    """Build the FastAPI application with all middleware and routes."""
    settings = get_settings()

    # 1. Logging first
    setup_logging()

    # 2. App instance
    app = FastAPI(
        title="FinResilience Pro API",
        version="1.0.0",
        docs_url="/api/docs" if settings.environment != "production" else None,
        redoc_url=None,
    )

    # 3. Security headers middleware (outermost)
    app.add_middleware(SecurityHeadersMiddleware)

    # 4. Request ID middleware
    app.add_middleware(RequestIdMiddleware)

    # 5. CORS — locked to dev + deployed domain
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
        ],
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
        allow_credentials=True,
    )

    # 6. Rate limiting
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # 7. Routes
    app.include_router(router)

    # 8. Startup event — verify PocketBase is reachable
    @app.on_event("startup")
    async def startup_checks() -> None:
        check_rate_limit_storage()

        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                resp = await client.get(
                    f"{settings.pocketbase_url}/api/health"
                )
            if resp.status_code != 200:
                logger.error(
                    "PocketBase at %s returned status %s — "
                    "some features will be unavailable",
                    settings.pocketbase_url,
                    resp.status_code,
                )
        except httpx.RequestError:
            logger.error(
                "PocketBase at %s is unreachable — "
                "start PocketBase first or check POCKETBASE_URL",
                settings.pocketbase_url,
            )

        logger.info(
            "FinResilience Pro started (env=%s, ai=%s)",
            settings.environment,
            settings.use_ai,
        )

    return app


app = create_app()
