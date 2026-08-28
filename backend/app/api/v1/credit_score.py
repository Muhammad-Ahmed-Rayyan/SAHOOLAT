"""
credit_score.py — Credit scoring API endpoints (Phase 2).

Endpoints:
  GET  /credit/profile          — get current user's CreditProfile inputs
  PUT  /credit/profile          — upsert credit profile inputs
  POST /credit/calculate        — run the scoring engine, store + return result
  GET  /credit/score            — get latest score + factor breakdown
  GET  /credit/score/history    — get score history (for the graph)

All business logic lives in services/scoring_engine.py — not here.
Error shape: { "error": true, "message": "...", "code": "..." }
"""

import json
from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.credit_profile import CreditProfile, CreditScoreHistory, UtilityType
from app.models.user import User
from app.services.scoring_engine import (
    FACTOR_LABELS_EN,
    FACTOR_LABELS_UR,
    SCORE_BAND_LABELS_EN,
    SCORE_BAND_LABELS_UR,
    ScoreResult,
    calculate_score,
    score_to_band,
)

router = APIRouter(prefix="/credit", tags=["credit"])


# ─── Pydantic schemas ─────────────────────────────────────────────────────────

class CreditProfileIn(BaseModel):
    """Request body for PUT /credit/profile."""
    land_size_acres: Optional[float] = Field(None, ge=0, le=1000)
    crop_yield_maunds: Optional[float] = Field(None, ge=0, le=10000)
    utility_type: UtilityType = UtilityType.electricity
    utility_paid_months: int = Field(0, ge=0, le=120)
    utility_total_months: int = Field(12, ge=1, le=120)
    has_committee_participation: bool = False
    has_prior_loan_repayment: bool = False

    @field_validator("utility_paid_months")
    @classmethod
    def paid_not_exceed_total(cls, v: int, info: object) -> int:
        # Validation across fields — paid can't exceed total
        # (cross-field validator runs after individual field validators)
        return v


class CreditProfileOut(BaseModel):
    """Response for GET /credit/profile."""
    id: UUID
    user_id: UUID
    land_size_acres: Optional[float]
    crop_yield_maunds: Optional[float]
    utility_type: UtilityType
    utility_paid_months: int
    utility_total_months: int
    has_committee_participation: bool
    has_prior_loan_repayment: bool
    avg_monthly_savings_pct: Optional[float]
    updated_at: datetime

    model_config = {"from_attributes": True}


class FactorBreakdownItem(BaseModel):
    """One factor in the score breakdown — rendered as a row in the UI."""
    key: str
    label_en: str
    label_ur: str
    points_earned: float
    points_max: float
    # Fraction 0–1, useful for the frontend progress bar
    fraction: float


class ScoreOut(BaseModel):
    """Response for GET /credit/score and POST /credit/calculate."""
    score: int
    band: str
    band_label_en: str
    band_label_ur: str
    factors: list[FactorBreakdownItem]
    scored_at: datetime
    is_farmer: bool


class ScoreHistoryItem(BaseModel):
    score: int
    band: str
    scored_at: datetime

    model_config = {"from_attributes": True}


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _build_score_out(history_row: CreditScoreHistory, is_farmer: bool) -> ScoreOut:
    """Convert a CreditScoreHistory row into the API response shape."""
    result = ScoreResult.from_json(history_row.score, history_row.factor_breakdown_json, is_farmer)

    factors = []
    for key in ["land", "crop", "utility", "committee", "repayment", "savings"]:
        pts_max = result.factor_max.get(key, 0)
        pts_earned = result.factor_points.get(key, 0)
        if pts_max == 0 and pts_earned == 0:
            continue  # skip irrelevant factors (e.g. land/crop for non-farmers)
        factors.append(FactorBreakdownItem(
            key=key,
            label_en=FACTOR_LABELS_EN[key],
            label_ur=FACTOR_LABELS_UR[key],
            points_earned=pts_earned,
            points_max=pts_max,
            fraction=round(pts_earned / pts_max, 3) if pts_max > 0 else 0.0,
        ))

    return ScoreOut(
        score=result.score,
        band=result.band,
        band_label_en=SCORE_BAND_LABELS_EN[result.band],
        band_label_ur=SCORE_BAND_LABELS_UR[result.band],
        factors=factors,
        scored_at=history_row.scored_at,
        is_farmer=is_farmer,
    )


def _get_or_404(db: Session, user_id: UUID) -> CreditProfile:
    cp = db.query(CreditProfile).filter(CreditProfile.user_id == user_id).first()
    if not cp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": True, "message": "Credit profile not found. Submit your data first.", "code": "CREDIT_PROFILE_NOT_FOUND"},
        )
    return cp


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get(
    "/profile",
    response_model=CreditProfileOut,
    summary="Get the current user's credit input data",
)
def get_credit_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CreditProfileOut:
    cp = _get_or_404(db, current_user.id)
    return CreditProfileOut.model_validate(cp)


@router.put(
    "/profile",
    response_model=CreditProfileOut,
    summary="Create or update credit input data (manual data entry)",
)
def upsert_credit_profile(
    payload: CreditProfileIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CreditProfileOut:
    """
    Upsert the user's credit profile inputs.
    Validates that paid_months ≤ total_months.
    Does NOT automatically recalculate the score — call POST /credit/calculate for that.
    """
    if payload.utility_paid_months > payload.utility_total_months:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": True,
                "message": "Paid months cannot exceed total months.",
                "code": "INVALID_UTILITY_MONTHS",
            },
        )

    cp = db.query(CreditProfile).filter(CreditProfile.user_id == current_user.id).first()
    if cp is None:
        cp = CreditProfile(user_id=current_user.id)
        db.add(cp)

    cp.land_size_acres = payload.land_size_acres
    cp.crop_yield_maunds = payload.crop_yield_maunds
    cp.utility_type = payload.utility_type
    cp.utility_paid_months = payload.utility_paid_months
    cp.utility_total_months = payload.utility_total_months
    cp.has_committee_participation = payload.has_committee_participation
    cp.has_prior_loan_repayment = payload.has_prior_loan_repayment

    db.commit()
    db.refresh(cp)
    return CreditProfileOut.model_validate(cp)


@router.post(
    "/calculate",
    response_model=ScoreOut,
    status_code=status.HTTP_201_CREATED,
    summary="Run the scoring engine and store the result",
)
def calculate_credit_score(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ScoreOut:
    """
    Trigger a score calculation. Reads the current CreditProfile, runs the
    rule-based engine, appends to CreditScoreHistory, and returns the result.

    Idempotent in the sense that calling it multiple times is safe — each call
    appends a new history row (intentional: lets users see if their score improves
    after updating their profile).
    """
    cp = _get_or_404(db, current_user.id)
    occupation = (
        current_user.profile.occupation_type.value
        if current_user.profile and current_user.profile.occupation_type
        else None
    )

    result = calculate_score(cp, occupation_type=occupation)

    history_row = CreditScoreHistory(
        credit_profile_id=cp.id,
        score=result.score,
        factor_breakdown_json=result.to_json(),
    )
    db.add(history_row)
    db.commit()
    db.refresh(history_row)

    is_farmer = occupation == "farmer"
    return _build_score_out(history_row, is_farmer)


@router.get(
    "/score",
    response_model=ScoreOut,
    summary="Get the most recent credit score and factor breakdown",
)
def get_latest_score(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ScoreOut:
    cp = _get_or_404(db, current_user.id)
    latest = (
        db.query(CreditScoreHistory)
        .filter(CreditScoreHistory.credit_profile_id == cp.id)
        .order_by(CreditScoreHistory.scored_at.desc())
        .first()
    )
    if not latest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": True,
                "message": "No score calculated yet. Submit your data and call /credit/calculate.",
                "code": "NO_SCORE_YET",
            },
        )
    is_farmer = (
        current_user.profile.occupation_type.value == "farmer"
        if current_user.profile and current_user.profile.occupation_type
        else False
    )
    return _build_score_out(latest, is_farmer)


@router.get(
    "/score/history",
    response_model=list[ScoreHistoryItem],
    summary="Get full score history (for the graph)",
)
def get_score_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ScoreHistoryItem]:
    cp = _get_or_404(db, current_user.id)
    rows = (
        db.query(CreditScoreHistory)
        .filter(CreditScoreHistory.credit_profile_id == cp.id)
        .order_by(CreditScoreHistory.scored_at.asc())
        .all()
    )
    return [
        ScoreHistoryItem(
            score=r.score,
            band=score_to_band(r.score),
            scored_at=r.scored_at,
        )
        for r in rows
    ]
