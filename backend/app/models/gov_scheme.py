"""
gov_scheme.py — GovScheme model (Phase 7: Gov Subsidy & Scheme Eligibility Bot).

Design decisions:
- Stores official government financial support schemes (Kissan Card, BISP Kafaalat, PM Youth Loan).
- Uses structured criteria_json so the deterministic subsidy_rule_engine can evaluate rules without ML.
- Short descriptions & step-by-step guidance per Rules.md guidelines ("no dense text walls").
- Preserves full source citations referencing government portals (.gov.pk).
- Standard UUID primary keys and audit timestamps.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    UUID,
    Boolean,
    Column,
    DateTime,
    JSON,
    String,
    Text,
)

from app.models.base import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class GovScheme(Base):
    """
    Official Government Subsidy / Assistance Scheme model.
    """
    __tablename__ = "gov_schemes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    code = Column(String(50), unique=True, nullable=False, index=True)  # e.g., kissan_card, bisp_kafaalat
    title = Column(String(150), nullable=False)
    title_ur = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    description_ur = Column(Text, nullable=False)
    category = Column(String(50), nullable=False, index=True)  # agriculture, social_welfare, youth_loan
    provider = Column(String(100), nullable=False)  # e.g., Govt of Punjab / BOP
    benefit_summary = Column(String(255), nullable=False)
    benefit_summary_ur = Column(String(255), nullable=False)
    
    # Structured criteria dictionary for rule engine evaluation
    criteria_json = Column(JSON, nullable=False)
    
    # Ordered step strings for applying
    application_steps = Column(JSON, nullable=False)
    application_steps_ur = Column(JSON, nullable=False)
    
    official_portal_url = Column(String(255), nullable=True)
    sms_service_code = Column(String(20), nullable=True)  # e.g. "8070", "8171"
    source_citation = Column(Text, nullable=False)
    
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at = Column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False
    )

    def __repr__(self) -> str:
        return f"<GovScheme code={self.code} title={self.title} is_active={self.is_active}>"
