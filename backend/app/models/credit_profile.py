"""
credit_profile.py — CreditProfile model (Phase 2).

Stores the raw alternative-data inputs that feed the scoring engine.
One row per user — updated in-place each time the user edits their data.

Score history is stored separately in CreditScoreHistory so we can track
how the score changes over time (shown as a graph in the frontend).

Design decisions:
- All monetary values stored as Numeric(12,2) — avoids float rounding on financial data.
- utility_payment_months: how many of the last N months bills were paid on time.
  Stored as two ints (paid_count / total_months) rather than a percentage — keeps the
  raw data and lets the scoring engine apply its own weighting formula.
- has_committee_participation / has_prior_loan_repayment: boolean flags sourced from
  self-declaration. Marked as self_declared in the docstring because we cannot verify
  these in Phase 2 — Phase 3 will auto-set has_committee_participation from real data.
- land_size_acres: nullable — only relevant for farmers. Daily laborers leave it null.
- crop_yield_maunds: nullable — one maund ≈ 40 kg in Pakistani agricultural usage.
  We store the raw number and document the unit in the column comment, not encode it
  into the column name, so it can be adapted for other units later.
"""

import uuid
import enum
from datetime import datetime, timezone

from sqlalchemy import (
    UUID,
    Boolean,
    Column,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Numeric,
    SmallInteger,
    Text,
)
from sqlalchemy.orm import relationship

from app.models.base import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class UtilityType(str, enum.Enum):
    """Which utility bill the user tracked. Electricity is most common in rural Pakistan."""
    electricity = "electricity"
    gas = "gas"
    water = "water"
    none = "none"  # user has no utility bill (common for rural households)


class CreditProfile(Base):
    """
    Raw inputs for the credit scoring engine (Phase 2).
    One row per user — upserted by PUT /credit/profile.
    """
    __tablename__ = "credit_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    # ── Agricultural inputs (farmers only — null for others) ──────────────────
    # land_size_acres: self-declared. 1 acre ≈ 0.4 hectare.
    land_size_acres = Column(Numeric(8, 2), nullable=True)

    # crop_yield_maunds: last harvest yield. 1 maund (man) ≈ 40 kg (Pakistan standard).
    crop_yield_maunds = Column(Numeric(10, 2), nullable=True)

    # ── Utility payment history ───────────────────────────────────────────────
    # Self-declared. Asked: "In the last 12 months, how many months did you pay
    # your [utility] bill on time?"
    utility_type = Column(
        SAEnum(UtilityType, name="utility_type_enum"),
        nullable=False,
        default=UtilityType.electricity,
    )
    # How many months out of the reference window the user paid on time.
    utility_paid_months = Column(SmallInteger, nullable=False, default=0)
    # Reference window (denominator). Defaults to 12. Can be shorter for new users.
    utility_total_months = Column(SmallInteger, nullable=False, default=12)

    # ── Savings / committee participation ────────────────────────────────────
    # Self-declared for Phase 2. Phase 3 will auto-populate from Committee model.
    has_committee_participation = Column(Boolean, nullable=False, default=False)

    # ── Loan repayment history ────────────────────────────────────────────────
    # Self-declared: "Have you ever taken and fully repaid a loan?"
    has_prior_loan_repayment = Column(Boolean, nullable=False, default=False)

    # ── Savings behaviour (from Wallet module — Phase 5) ─────────────────────
    # Populated by wallet service in Phase 5. Null until then.
    # Represents average monthly savings as % of income over last 3 months.
    avg_monthly_savings_pct = Column(Numeric(5, 2), nullable=True)

    # ── Timestamps ───────────────────────────────────────────────────────────
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at = Column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False
    )

    user = relationship("User", backref="credit_profile")
    score_history = relationship(
        "CreditScoreHistory",
        back_populates="credit_profile",
        order_by="CreditScoreHistory.scored_at.desc()",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<CreditProfile user_id={self.user_id}>"


class CreditScoreHistory(Base):
    """
    Immutable snapshot of a calculated score at a point in time.
    Appended on every score calculation — never updated in place.
    This gives the frontend data to draw a score-over-time graph.
    """
    __tablename__ = "credit_score_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    credit_profile_id = Column(
        UUID(as_uuid=True),
        ForeignKey("credit_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Score: 0–100 integer. Stored as SmallInteger (2 bytes).
    score = Column(SmallInteger, nullable=False)

    # JSON-serialised factor breakdown — Text to avoid JSONB dependency in Phase 2.
    # Format: {"land": 20, "utility": 15, "committee": 10, ...}
    factor_breakdown_json = Column(Text, nullable=False, default="{}")

    scored_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    credit_profile = relationship("CreditProfile", back_populates="score_history")

    def __repr__(self) -> str:
        return f"<CreditScoreHistory credit_profile_id={self.credit_profile_id} score={self.score}>"
