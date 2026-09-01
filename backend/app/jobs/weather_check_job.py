"""
weather_check_job.py — Scheduled daily job for crop insurance trigger evaluation (Phase 6: Parametric Crop Insurance).

Design decisions:
- Uses APScheduler / async handler to run daily weather evaluation.
- Obtains DB session via SessionLocal, calls insurance_trigger_engine.evaluate_all_active_policies.
- Includes logging for errors and execution per Rules.md standards.
"""

import asyncio
import logging
from app.db.session import SessionLocal
from app.services.insurance_trigger_engine import evaluate_all_active_policies

logger = logging.getLogger(__name__)


async def run_weather_check_job():
    """
    Main job function called by APScheduler or triggered manually.
    """
    logger.info("Starting scheduled weather check job for parametric crop insurance policies...")
    db = SessionLocal()
    try:
        payouts = await evaluate_all_active_policies(db)
        logger.info(
            f"Weather check job completed successfully. Evaluated policies; {len(payouts)} payout event(s) triggered."
        )
        return len(payouts)
    except Exception as exc:
        logger.error(f"Error executing weather check job: {str(exc)}", exc_info=True)
        raise exc
    finally:
        db.close()


def run_weather_check_job_sync():
    """
    Synchronous wrapper for job execution.
    """
    return asyncio.run(run_weather_check_job())
