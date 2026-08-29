"""
loan_matcher.py — Micro-Loan Eligibility Matcher API (Phase 4).

Endpoints:
  GET /loans/matches — returns ranked list of eligible programs for the current user

Requirements:
  - User must have a credit score calculated (CreditScoreHistory entry exists)
  - User must have completed onboarding (profile.occupation_type set)
  - All match reasoning is returned in the response (explainability per Rules.md)

Error shape: { "error": true, "message": "...", "code": "..." }
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.credit_profile import CreditProfile, CreditScoreHistory
from app.models.loan_program import MicrofinanceProgram
from app.models.user import User
from app.services.loan_matching_engine import match_programs

router = APIRouter(prefix="/loans", tags=["loan_matcher"])


# ─── Response schemas ──────────────────────────────────────────────────────────

class LoanProgramOut(BaseModel):
    """One matched loan program with full explanation."""
    id: UUID
    institution_name: str
    program_name: str
    loan_type: str
    min_loan_pkr: Optional[float]
    max_loan_pkr: float
    annual_rate_pct: Optional[float]
    is_interest_free: bool
    # Eligibility info
    min_credit_score: float
    eligible_occupations: Optional[str]
    # Explainability (Rules.md)
    why_matched: list[str]
    # Application guidance
    required_documents: list[str]
    application_steps_en: str
    application_steps_ur: str
    contact_info: Optional[str]

    model_config = {"from_attributes": True}


class LoanMatchesOut(BaseModel):
    """Response for GET /loans/matches."""
    credit_score_used: int
    total_matches: int
    programs: list[LoanProgramOut]


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.get(
    "/matches",
    response_model=LoanMatchesOut,
    summary="Get eligible loan programs for the current user",
)
def get_loan_matches(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LoanMatchesOut:
    """
    Returns ranked list of micro-loan programs the user is eligible for,
    based on their latest credit score, occupation, and location.

    Requires:
    - A calculated credit score (call POST /credit/calculate first)
    - Completed onboarding (occupation type set)
    """
    # ── Get latest credit score ────────────────────────────────────────────────
    latest_score_row = (
        db.query(CreditScoreHistory)
        .join(CreditProfile, CreditScoreHistory.credit_profile_id == CreditProfile.id)
        .filter(CreditProfile.user_id == current_user.id)
        .order_by(CreditScoreHistory.scored_at.desc())
        .first()
    )
    if latest_score_row is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": True,
                "message": "No credit score found. Calculate your credit score first using POST /credit/calculate.",
                "code": "NO_CREDIT_SCORE",
            },
        )

    # ── Extract profile data ───────────────────────────────────────────────────
    profile = current_user.profile
    occupation = profile.occupation_type.value if profile and profile.occupation_type else None
    location = profile.location if profile else None
    credit_score = float(latest_score_row.score)

    # ── Run matching engine ────────────────────────────────────────────────────
    matched = match_programs(db, credit_score, occupation, location)

    # ── Build response ─────────────────────────────────────────────────────────
    programs_out: list[LoanProgramOut] = []
    for result in matched:
        prog = result.program
        programs_out.append(LoanProgramOut(
            id=prog.id,
            institution_name=prog.institution_name,
            program_name=prog.program_name,
            loan_type=prog.loan_type.value,
            min_loan_pkr=prog.min_loan_pkr,
            max_loan_pkr=prog.max_loan_pkr,
            annual_rate_pct=prog.annual_rate_pct,
            is_interest_free=prog.is_interest_free,
            min_credit_score=prog.min_credit_score,
            eligible_occupations=prog.eligible_occupations,
            why_matched=result.why_matched,
            required_documents=[
                d.strip() for d in prog.required_documents.splitlines() if d.strip()
            ],
            application_steps_en=prog.application_steps_en,
            application_steps_ur=prog.application_steps_ur,
            contact_info=prog.contact_info,
        ))

    return LoanMatchesOut(
        credit_score_used=int(credit_score),
        total_matches=len(programs_out),
        programs=programs_out,
    )
