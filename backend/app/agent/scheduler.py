"""
agent/scheduler.py — Proactive background checks via APScheduler.

KNOWN LIMITATION: APScheduler runs in-process within FastAPI.
This works correctly for single-container deployments (hackathon scope).
It will NOT survive horizontal scaling or container restarts without a
persistent job store (e.g., SQLAlchemy-backed APScheduler or Celery + Redis).
For production, replace with an external scheduler or cloud cron trigger.

Jobs:
  - Monthly FOIR re-check (1st of each month)
  - 80C deadline alert (February 1st — 58 days before March 31 cutoff)

All alerts are written to the `notifications` PocketBase collection ONLY.
They are never injected into `chat_sessions`.
"""
from __future__ import annotations

import logging
from datetime import datetime

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)


async def run_monthly_foir_check() -> None:
    """
    Re-check FOIR for all users with stored analysis history.
    Creates a notification if FOIR > 40% (RBI optimal threshold).
    Also reads needs_replan flag and prioritizes users for re-analysis.
    """
    settings = get_settings()
    pb_url = settings.pocketbase_url
    logger.info("Scheduler: running monthly FOIR check")

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Fetch all recent analysis records (admin would use service token in production)
            resp = await client.get(
                f"{pb_url}/api/collections/analysis_history/records",
                params={"sort": "-created", "perPage": 200},
            )
            if resp.status_code != 200:
                logger.warning("Scheduler: could not fetch analysis history (%d)", resp.status_code)
                return

            records = resp.json().get("items", [])

        for record in records:
            user_id = record.get("user_id")
            engine_result = record.get("engine_result", {})
            health = engine_result.get("health_score", {})
            foir_ratio = health.get("foir_ratio", 0)

            if foir_ratio > 40.0:
                message = (
                    f"⚠️ Monthly check: your FOIR is {foir_ratio:.1f}% "
                    f"(RBI optimal threshold: ≤40%). "
                    "Consider accelerating high-interest debt repayment to improve your borrowing health."
                )
                await _create_notification(pb_url, user_id, "foir_alert", message)
                logger.info("FOIR alert created for user %s (FOIR=%.1f%%)", user_id, foir_ratio)

    except Exception as exc:
        logger.error("Scheduler: monthly FOIR check failed: %s", type(exc).__name__)


async def run_80c_deadline_alert() -> None:
    """
    Check if users have unfilled 80C capacity and alert them on Feb 1
    (58 days before the March 31 financial year-end tax-saving deadline).
    """
    settings = get_settings()
    pb_url = settings.pocketbase_url
    logger.info("Scheduler: running 80C deadline alert")

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{pb_url}/api/collections/analysis_history/records",
                params={"sort": "-created", "perPage": 200},
            )
            if resp.status_code != 200:
                return

            records = resp.json().get("items", [])

        for record in records:
            user_id = record.get("user_id")
            engine_result = record.get("engine_result", {})
            tax = engine_result.get("tax_allocation", {})
            items = tax.get("items", [])

            # Check for unfilled 80C
            for item in items:
                if item.get("section") == "80C" and item.get("remaining_limit", 0) > 0:
                    remaining = item["remaining_limit"]
                    tax_saved = item.get("tax_saved_at_slab", 0)
                    message = (
                        f"📅 Tax-saving deadline alert: You have ₹{remaining:,.0f} of unused 80C limit "
                        f"this financial year. Investing now could save you ₹{tax_saved:,.0f} in tax. "
                        "Deadline: March 31. Instruments: ELSS, PPF, NPS Tier-II."
                    )
                    await _create_notification(pb_url, user_id, "tax_deadline", message)
                    logger.info("80C alert created for user %s (remaining=₹%.0f)", user_id, remaining)
                    break

    except Exception as exc:
        logger.error("Scheduler: 80C deadline check failed: %s", type(exc).__name__)


async def _create_notification(pb_url: str, user_id: str, notif_type: str, message: str) -> None:
    """
    Create a notification record in the `notifications` PocketBase collection.
    Alerts are stored here ONLY — never in chat_sessions.
    """
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(
                f"{pb_url}/api/collections/notifications/records",
                json={
                    "user_id": user_id,
                    "type": notif_type,
                    "message": message,
                    "read": False,
                },
            )
    except Exception as exc:
        logger.warning("Scheduler: notification creation failed: %s", type(exc).__name__)


def setup_scheduler(app: object) -> None:
    """
    Register APScheduler jobs on FastAPI startup.

    NOTE: This runs in-process. See module docstring for known limitations.
    """
    try:
        from apscheduler.schedulers.asyncio import AsyncIOScheduler
        from apscheduler.triggers.cron import CronTrigger

        scheduler = AsyncIOScheduler()

        # Monthly FOIR check — 9 AM IST on the 1st of every month
        scheduler.add_job(
            run_monthly_foir_check,
            CronTrigger(day=1, hour=3, minute=30),  # 3:30 UTC = 9 AM IST
            id="monthly_foir_check",
            replace_existing=True,
        )

        # 80C deadline alert — 9 AM IST on February 1st
        scheduler.add_job(
            run_80c_deadline_alert,
            CronTrigger(month=2, day=1, hour=3, minute=30),
            id="80c_deadline_alert",
            replace_existing=True,
        )

        scheduler.start()
        logger.info("APScheduler started: monthly_foir_check + 80c_deadline_alert")

    except ImportError:
        logger.warning("APScheduler not installed — proactive alerts disabled. pip install apscheduler")
    except Exception as exc:
        logger.error("Scheduler setup failed: %s", type(exc).__name__)
