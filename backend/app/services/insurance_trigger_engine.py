"""
insurance_trigger_engine.py — Rule-based parametric trigger evaluation (Phase 6: Parametric Crop Insurance).

Design decisions:
- Pure rule-based threshold engine (no black-box ML) per Rules.md.
- Evaluates active policies against weather readings.
- When threshold is breached, updates policy status to 'triggered' and logs a PayoutEvent.
- Supports single-policy evaluation and batch evaluation for daily scheduled job.
"""

import logging
from typing import List, Optional, Tuple, Dict, Any
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.insurance_policy import (
    InsurancePolicy,
    WeatherReading,
    PayoutEvent,
    PolicyStatus,
    ThresholdType,
    PayoutStatus,
)
from app.services.weather_service import fetch_weather_for_district

logger = logging.getLogger(__name__)


def evaluate_policy_against_weather(
    db: Session,
    policy: InsurancePolicy,
    weather_data: Dict[str, Any],
) -> Tuple[bool, Optional[PayoutEvent], Optional[WeatherReading]]:
    """
    Evaluates a single active policy against weather parameters.
    If threshold is breached, creates WeatherReading and PayoutEvent, and updates policy status.

    Returns:
      (is_triggered, payout_event_obj, weather_reading_obj)
    """
    if policy.status not in (PolicyStatus.active, PolicyStatus.monitoring):
        return False, None, None

    # Save weather reading record
    reading = WeatherReading(
        district=policy.district,
        reading_date=datetime.now(timezone.utc),
        temp_max=weather_data.get("temp_max"),
        temp_min=weather_data.get("temp_min"),
        precipitation_mm=weather_data.get("precipitation_mm"),
        humidity_pct=weather_data.get("humidity_pct"),
        source=weather_data.get("source", "open_meteo"),
    )
    db.add(reading)
    db.flush()

    is_triggered = False
    reason = ""
    is_fallback = weather_data.get("is_fallback", False) or weather_data.get("source") == "fallback_mock"


    t_type = policy.threshold_type
    t_val = float(policy.threshold_value)
    temp_max = float(weather_data.get("temp_max") or 0.0)
    temp_min = float(weather_data.get("temp_min") or 0.0)
    precip = float(weather_data.get("precipitation_mm") or 0.0)

    if t_type == ThresholdType.extreme_heat:
        if temp_max >= t_val:
            is_triggered = True
            reason = f"Extreme heatwave detected in {policy.district}: Recorded max temp {temp_max:.1f}°C breached heat threshold of {t_val:.1f}°C."

    elif t_type == ThresholdType.heavy_rainfall:
        if precip >= t_val:
            is_triggered = True
            reason = f"Heavy rainfall/flood risk detected in {policy.district}: Recorded rainfall {precip:.1f}mm breached threshold of {t_val:.1f}mm."

    elif t_type == ThresholdType.drought:
        if precip <= t_val:
            is_triggered = True
            reason = f"Severe drought/rainfall deficit detected in {policy.district}: Recorded rainfall {precip:.1f}mm fell below minimum requirement threshold of {t_val:.1f}mm."

    elif t_type == ThresholdType.low_temp:
        if temp_min <= t_val:
            is_triggered = True
            reason = f"Frost/low temperature detected in {policy.district}: Recorded min temp {temp_min:.1f}°C dropped below frost threshold of {t_val:.1f}°C."

    if is_fallback:
        reason = f"[Simulated / Fallback Weather Data] {reason} (Source: Fallback Simulator — Open-Meteo API unreachable)"

    if is_triggered:
        policy.status = PolicyStatus.triggered
        policy.updated_at = datetime.now(timezone.utc)


        payout = PayoutEvent(
            policy_id=policy.id,
            weather_reading_id=reading.id,
            trigger_date=datetime.now(timezone.utc),
            payout_amount=policy.sum_insured,
            trigger_reason=reason,
            status=PayoutStatus.simulated,
            notification_sent=True,
        )
        db.add(payout)
        db.commit()
        db.refresh(policy)
        db.refresh(payout)
        logger.info(f"Policy {policy.id} triggered! PayoutEvent created: PKR {payout.payout_amount}")
        return True, payout, reading

    db.commit()
    return False, None, reading


async def evaluate_all_active_policies(db: Session) -> List[PayoutEvent]:
    """
    Finds all active/monitoring insurance policies, fetches latest weather for their districts,
    and evaluates each policy. Called by daily background scheduled job.
    """
    policies = (
        db.query(InsurancePolicy)
        .filter(InsurancePolicy.status.in_([PolicyStatus.active, PolicyStatus.monitoring]))
        .all()
    )

    if not policies:
        logger.info("No active insurance policies to evaluate.")
        return []

    logger.info(f"Evaluating {len(policies)} active insurance policies...")
    payout_events = []

    # Cache weather per district to prevent duplicate API requests
    district_weather_cache: Dict[str, Dict[str, Any]] = {}

    for policy in policies:
        district_key = policy.district.strip().lower()
        if district_key not in district_weather_cache:
            weather_data = await fetch_weather_for_district(policy.district)
            district_weather_cache[district_key] = weather_data
        else:
            weather_data = district_weather_cache[district_key]

        triggered, payout_event, _ = evaluate_policy_against_weather(db, policy, weather_data)
        if triggered and payout_event:
            payout_events.append(payout_event)

    return payout_events
