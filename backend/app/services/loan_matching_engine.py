"""
loan_matching_engine.py — Rule-based micro-loan eligibility matcher (Phase 4).

DESIGN PRINCIPLE (Rules.md):
  No ML — pure deterministic rules. Every match/no-match decision must be
  traceable to a named criterion with an explicit reason.

  Output always includes why_matched and why_not_matched lists — even for
  perfectly matching programs — so the UI can explain the reasoning.

MATCHING CRITERIA (checked in order):
  1. credit_score >= program.min_credit_score
  2. user occupation in program.eligible_occupations (if set)
  3. user location in program.eligible_locations (if set, fuzzy case-insensitive substring match)

RANKING:
  Matched programs are ranked by max_loan_pkr descending (most generous first).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from sqlalchemy.orm import Session

from app.models.loan_program import MicrofinanceProgram


@dataclass
class MatchResult:
    """The result of matching a user against one MicrofinanceProgram."""
    program: MicrofinanceProgram
    is_match: bool
    why_matched: list[str] = field(default_factory=list)     # Reasons this program matched
    why_not_matched: list[str] = field(default_factory=list)  # Blocking criteria that failed


def _occupation_eligible(program: MicrofinanceProgram, occupation: Optional[str]) -> tuple[bool, str]:
    """Check occupation eligibility. Returns (eligible, reason)."""
    if not program.eligible_occupations:
        return True, "Open to all occupations"
    eligible_list = [o.strip() for o in program.eligible_occupations.split(",")]
    if occupation and occupation in eligible_list:
        readable = {
            "farmer": "farmers",
            "daily_laborer": "daily laborers",
            "shopkeeper": "shopkeepers",
            "other": "all occupations",
        }.get(occupation, occupation)
        return True, f"Available to {readable}"
    readable_list = ", ".join(eligible_list)
    return False, f"This program is for: {readable_list} — your occupation doesn't qualify"


def _location_eligible(program: MicrofinanceProgram, location: Optional[str]) -> tuple[bool, str]:
    """Check location eligibility using case-insensitive substring matching."""
    if not program.eligible_locations:
        return True, "Available nationwide"
    if not location:
        return True, "Location eligibility could not be verified — confirm with institution"
    eligible_list = [loc.strip().lower() for loc in program.eligible_locations.split(",")]
    user_loc = location.lower()
    for loc in eligible_list:
        if loc in user_loc or user_loc in loc:
            return True, f"Available in your area ({location})"
    return False, f"This program currently operates in: {program.eligible_locations}"


def _score_eligible(program: MicrofinanceProgram, credit_score: float) -> tuple[bool, str]:
    """Check credit score eligibility."""
    if credit_score >= program.min_credit_score:
        return True, f"Your credit score ({credit_score:.0f}) meets the minimum ({program.min_credit_score:.0f})"
    return False, (
        f"Your credit score ({credit_score:.0f}) is below the minimum required "
        f"({program.min_credit_score:.0f}) — improve your score by adding utility payment history "
        f"or joining a committee"
    )


def match_programs(
    db: Session,
    credit_score: float,
    occupation: Optional[str],
    location: Optional[str],
) -> list[MatchResult]:
    """
    Run all active programs against the user's profile and return only matched results.
    Ranked by max_loan_pkr descending (most generous program first).
    """
    programs = (
        db.query(MicrofinanceProgram)
        .filter(MicrofinanceProgram.is_active.is_(True))
        .order_by(MicrofinanceProgram.max_loan_pkr.desc())
        .all()
    )

    results: list[MatchResult] = []

    for program in programs:
        why_matched: list[str] = []
        why_not: list[str] = []

        # ── Check 1: credit score ──────────────────────────────────────────────
        score_ok, score_reason = _score_eligible(program, credit_score)
        if score_ok:
            why_matched.append(score_reason)
        else:
            why_not.append(score_reason)

        # ── Check 2: occupation ────────────────────────────────────────────────
        occ_ok, occ_reason = _occupation_eligible(program, occupation)
        if occ_ok:
            why_matched.append(occ_reason)
        else:
            why_not.append(occ_reason)

        # ── Check 3: location ──────────────────────────────────────────────────
        loc_ok, loc_reason = _location_eligible(program, location)
        if loc_ok:
            why_matched.append(loc_reason)
        else:
            why_not.append(loc_reason)

        is_match = not why_not

        results.append(MatchResult(
            program=program,
            is_match=is_match,
            why_matched=why_matched,
            why_not_matched=why_not,
        ))

    return [r for r in results if r.is_match]
