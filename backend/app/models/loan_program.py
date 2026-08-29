"""
loan_program.py — MicrofinanceProgram model for Phase 4.

Stores the eligibility criteria for each micro-finance institution (MFI)
program. Data is seeded via migration — not entered by users.

IMPORTANT — Rules.md compliance:
  Every field here must reflect real, sourced data. Any placeholder value
  used before real data is confirmed must be marked TODO: replace with real criteria,
  never presented as fact.

  Sources used for seed data (in migration 004):
    - Akhuwat: https://akhuwat.org.pk/islamic-microfinance/products/
    - Kashf Foundation: https://www.kashf.org/products
    - NRSP (National Rural Support Programme): https://www.nrsp.org.pk/
"""

import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    UUID,
    ARRAY,
    Boolean,
    Column,
    DateTime,
    Enum as SAEnum,
    Float,
    Integer,
    String,
    Text,
    DECIMAL,
)
from sqlalchemy.dialects.postgresql import ARRAY as PG_ARRAY
from sqlalchemy import String as SA_String

from app.models.base import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class LoanType(str, enum.Enum):
    business = "business"        # General business loan
    agriculture = "agriculture"  # Farm input / crop loan
    housing = "housing"          # Housing improvement
    education = "education"      # Education support
    emergency = "emergency"      # Emergency relief


class MicrofinanceProgram(Base):
    """
    Represents a single micro-loan product from a Pakistani MFI.

    Eligibility fields are used by the rule-based loan_matching_engine.py.
    All criteria values come from real published sources — see module docstring.
    """
    __tablename__ = "microfinance_programs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)

    # ── Institution ─────────────────────────────────────────────────────────────
    institution_name = Column(String(200), nullable=False)   # e.g. "Akhuwat"
    program_name = Column(String(200), nullable=False)       # e.g. "Akhuwat Business Loan"
    loan_type = Column(SAEnum(LoanType, name="loan_type_enum"), nullable=False)

    # ── Loan size (PKR) ─────────────────────────────────────────────────────────
    min_loan_pkr = Column(Float, nullable=True)    # Minimum loan amount
    max_loan_pkr = Column(Float, nullable=False)   # Maximum loan amount

    # ── Credit score requirements ────────────────────────────────────────────────
    # Our internal 0-100 scale score required to match this program.
    min_credit_score = Column(Float, nullable=False, default=0.0)

    # ── Occupation eligibility ───────────────────────────────────────────────────
    # NULL means all occupations are eligible.
    # Stored as comma-separated string (no ARRAY support needed for simplicity).
    eligible_occupations = Column(Text, nullable=True)

    # ── Location (optional) ─────────────────────────────────────────────────────
    # If set, only users in these districts/provinces qualify. Comma-separated.
    eligible_locations = Column(Text, nullable=True)

    # ── Interest / service charge ────────────────────────────────────────────────
    # Islamic/service-charge products often describe it differently than "interest"
    annual_rate_pct = Column(Float, nullable=True)       # Annual rate % (None = 0% / qard hasan)
    is_interest_free = Column(Boolean, default=False, nullable=False)

    # ── Application info ─────────────────────────────────────────────────────────
    required_documents = Column(Text, nullable=False)    # Newline-separated list
    application_steps_en = Column(Text, nullable=False)  # How to apply (English)
    application_steps_ur = Column(Text, nullable=False)  # How to apply (Urdu)
    contact_info = Column(String(500), nullable=True)    # Phone/website

    # ── Metadata ─────────────────────────────────────────────────────────────────
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<MicrofinanceProgram {self.institution_name} — {self.program_name}>"
