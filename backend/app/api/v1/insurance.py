"""
insurance.py — Parametric Crop Insurance API routes (Phase 6).

Endpoints:
  GET  /insurance/policies              — List all insurance policies for current user
  POST /insurance/policies              — Create a new insurance policy (crop + district + threshold)
  GET  /insurance/policies/{policy_id}  — Get single policy detail with trigger events
  POST /insurance/run-check             — Trigger daily weather check job (Open-Meteo API evaluation)
  POST /insurance/simulate-trigger/{id} — Helper endpoint to force trigger a policy for demo testing

Error shape: { "error": true, "message": "...", "code": "..." }
"""

from decimal import Decimal
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User

from app.models.insurance_policy import (
    InsurancePolicy,
    WeatherReading,
    PayoutEvent,
    PolicyStatus,
    ThresholdType,
    PayoutStatus,
)
from app.services.insurance_trigger_engine import (
    evaluate_policy_against_weather,
    evaluate_all_active_policies,
)
from app.services.weather_service import fetch_weather_for_district

router = APIRouter(prefix="/insurance", tags=["insurance"])


# ─── Pydantic Schemas ──────────────────────────────────────────────────────────

class PayoutEventOut(BaseModel):
    id: UUID
    policy_id: UUID
    weather_reading_id: Optional[UUID]
    trigger_date: datetime
    payout_amount: float
    trigger_reason: str
    status: str
    notification_sent: bool

    model_config = {"from_attributes": True}


class PolicyCreateIn(BaseModel):
    crop_type: str = Field(..., min_length=2, max_length=50, description="Crop name e.g. Wheat, Rice, Cotton")
    district: str = Field(..., min_length=2, max_length=100, description="Agricultural district e.g. Multan, Faisalabad")
    threshold_type: str = Field(..., description="Threshold rule type: extreme_heat, heavy_rainfall, drought, low_temp")
    threshold_value: float = Field(..., description="Threshold numerical value (°C or mm)")
    sum_insured: Optional[float] = Field(50000.00, gt=0, description="Total sum insured in PKR")
    premium_amount: Optional[float] = Field(2500.00, gt=0, description="Policy premium in PKR")
    coverage_months: Optional[int] = Field(6, ge=1, le=12, description="Coverage duration in months")


class PolicyOut(BaseModel):
    id: UUID
    user_id: UUID
    crop_type: str
    district: str
    sum_insured: float
    premium_amount: float
    threshold_type: str
    threshold_value: float
    status: str
    coverage_start_date: datetime
    coverage_end_date: datetime
    created_at: datetime
    updated_at: datetime
    payout_events: List[PayoutEventOut] = []

    model_config = {"from_attributes": True}


class RunCheckOut(BaseModel):
    message: str
    triggered_count: int
    evaluated: bool


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.get("/policies", response_model=List[PolicyOut], summary="List all insurance policies for current user")
def list_user_policies(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[PolicyOut]:
    """Returns list of all crop insurance policies owned by the logged-in user."""
    policies = (
        db.query(InsurancePolicy)
        .filter(InsurancePolicy.user_id == current_user.id)
        .order_by(InsurancePolicy.created_at.desc())
        .all()
    )

    result = []
    for p in policies:
        result.append(
            PolicyOut(
                id=p.id,
                user_id=p.user_id,
                crop_type=p.crop_type,
                district=p.district,
                sum_insured=float(p.sum_insured),
                premium_amount=float(p.premium_amount),
                threshold_type=p.threshold_type.value,
                threshold_value=float(p.threshold_value),
                status=p.status.value,
                coverage_start_date=p.coverage_start_date,
                coverage_end_date=p.coverage_end_date,
                created_at=p.created_at,
                updated_at=p.updated_at,
                payout_events=[
                    PayoutEventOut(
                        id=e.id,
                        policy_id=e.policy_id,
                        weather_reading_id=e.weather_reading_id,
                        trigger_date=e.trigger_date,
                        payout_amount=float(e.payout_amount),
                        trigger_reason=e.trigger_reason,
                        status=e.status.value,
                        notification_sent=e.notification_sent,
                    )
                    for e in p.payout_events
                ],
            )
        )
    return result


@router.post(
    "/policies",
    response_model=PolicyOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new parametric crop insurance policy",
)
def create_policy(
    body: PolicyCreateIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PolicyOut:
    """Create a new parametric crop policy with threshold rule and district."""
    # Validate threshold_type enum
    try:
        threshold_enum = ThresholdType(body.threshold_type)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": True,
                "message": f"Invalid threshold_type '{body.threshold_type}'. Allowed values: extreme_heat, heavy_rainfall, drought, low_temp.",
                "code": "INVALID_THRESHOLD_TYPE",
            },
        )

    now = datetime.now(timezone.utc)
    months = body.coverage_months or 6
    end_date = now + timedelta(days=30 * months)

    sum_insured_val = Decimal(str(body.sum_insured or 50000.00))
    # Default premium is 5% of sum insured if not specified
    premium_val = Decimal(str(body.premium_amount)) if body.premium_amount else sum_insured_val * Decimal("0.05")

    policy = InsurancePolicy(
        user_id=current_user.id,
        crop_type=body.crop_type.strip(),
        district=body.district.strip(),
        sum_insured=sum_insured_val,
        premium_amount=premium_val,
        threshold_type=threshold_enum,
        threshold_value=Decimal(str(body.threshold_value)),
        status=PolicyStatus.active,
        coverage_start_date=now,
        coverage_end_date=end_date,
    )

    db.add(policy)
    db.commit()
    db.refresh(policy)

    return PolicyOut(
        id=policy.id,
        user_id=policy.user_id,
        crop_type=policy.crop_type,
        district=policy.district,
        sum_insured=float(policy.sum_insured),
        premium_amount=float(policy.premium_amount),
        threshold_type=policy.threshold_type.value,
        threshold_value=float(policy.threshold_value),
        status=policy.status.value,
        coverage_start_date=policy.coverage_start_date,
        coverage_end_date=policy.coverage_end_date,
        created_at=policy.created_at,
        updated_at=policy.updated_at,
        payout_events=[],
    )


@router.get("/policies/{policy_id}", response_model=PolicyOut, summary="Get policy details")
def get_policy_detail(
    policy_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PolicyOut:
    policy = (
        db.query(InsurancePolicy)
        .filter(InsurancePolicy.id == policy_id, InsurancePolicy.user_id == current_user.id)
        .first()
    )

    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": True,
                "message": "Insurance policy not found.",
                "code": "POLICY_NOT_FOUND",
            },
        )

    return PolicyOut(
        id=policy.id,
        user_id=policy.user_id,
        crop_type=policy.crop_type,
        district=policy.district,
        sum_insured=float(policy.sum_insured),
        premium_amount=float(policy.premium_amount),
        threshold_type=policy.threshold_type.value,
        threshold_value=float(policy.threshold_value),
        status=policy.status.value,
        coverage_start_date=policy.coverage_start_date,
        coverage_end_date=policy.coverage_end_date,
        created_at=policy.created_at,
        updated_at=policy.updated_at,
        payout_events=[
            PayoutEventOut(
                id=e.id,
                policy_id=e.policy_id,
                weather_reading_id=e.weather_reading_id,
                trigger_date=e.trigger_date,
                payout_amount=float(e.payout_amount),
                trigger_reason=e.trigger_reason,
                status=e.status.value,
                notification_sent=e.notification_sent,
            )
            for e in policy.payout_events
        ],
    )


@router.post("/run-check", response_model=RunCheckOut, summary="Trigger weather check job across active policies")
async def trigger_weather_check_job(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RunCheckOut:
    """Manual execution endpoint for daily weather evaluation against live Open-Meteo API."""
    payout_events = await evaluate_all_active_policies(db)
    return RunCheckOut(
        message=f"Weather check complete. Evaluated active policies; {len(payout_events)} payout trigger(s) generated.",
        triggered_count=len(payout_events),
        evaluated=True,
    )


@router.post(
    "/simulate-trigger/{policy_id}",
    response_model=PolicyOut,
    summary="Simulate a threshold breach on a policy for demo testing",
)
def simulate_trigger_route(
    policy_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PolicyOut:
    settings = get_settings()
    if settings.APP_ENV.lower() == "production" and not settings.ENABLE_DEMO_SIMULATION:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": True,
                "message": "Demo simulation endpoints are restricted in production environment.",
                "code": "DEMO_SIMULATION_DISABLED",
            },
        )

    policy = (
        db.query(InsurancePolicy)
        .filter(InsurancePolicy.id == policy_id, InsurancePolicy.user_id == current_user.id)
        .first()
    )


    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": True, "message": "Policy not found.", "code": "POLICY_NOT_FOUND"},
        )

    # Construct extreme mock weather data matching policy threshold
    val = float(policy.threshold_value)
    if policy.threshold_type == ThresholdType.extreme_heat:
        mock_weather = {"temp_max": val + 2.5, "temp_min": 26.0, "precipitation_mm": 0.0, "humidity_pct": 30.0, "source": "simulated_demo"}
    elif policy.threshold_type == ThresholdType.heavy_rainfall:
        mock_weather = {"temp_max": 28.0, "temp_min": 20.0, "precipitation_mm": val + 25.0, "humidity_pct": 90.0, "source": "simulated_demo"}
    elif policy.threshold_type == ThresholdType.drought:
        mock_weather = {"temp_max": 42.0, "temp_min": 28.0, "precipitation_mm": 0.0, "humidity_pct": 20.0, "source": "simulated_demo"}
    else:  # low_temp
        mock_weather = {"temp_max": 12.0, "temp_min": val - 2.0, "precipitation_mm": 0.0, "humidity_pct": 60.0, "source": "simulated_demo"}

    # Reset policy status to active if already triggered so demo can re-run
    policy.status = PolicyStatus.active
    evaluate_policy_against_weather(db, policy, mock_weather)
    db.refresh(policy)

    return PolicyOut(
        id=policy.id,
        user_id=policy.user_id,
        crop_type=policy.crop_type,
        district=policy.district,
        sum_insured=float(policy.sum_insured),
        premium_amount=float(policy.premium_amount),
        threshold_type=policy.threshold_type.value,
        threshold_value=float(policy.threshold_value),
        status=policy.status.value,
        coverage_start_date=policy.coverage_start_date,
        coverage_end_date=policy.coverage_end_date,
        created_at=policy.created_at,
        updated_at=policy.updated_at,
        payout_events=[
            PayoutEventOut(
                id=e.id,
                policy_id=e.policy_id,
                weather_reading_id=e.weather_reading_id,
                trigger_date=e.trigger_date,
                payout_amount=float(e.payout_amount),
                trigger_reason=e.trigger_reason,
                status=e.status.value,
                notification_sent=e.notification_sent,
            )
            for e in policy.payout_events
        ],
    )
