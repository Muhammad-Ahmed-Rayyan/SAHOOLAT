"""
RemittanceRecord model — Phase 9 entity for tracking cross-border remittances.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    UUID,
    Column,
    DateTime,
    Float,
    ForeignKey,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.models.base import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class RemittanceRecord(Base):
    __tablename__ = "remittance_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Remittance transaction fields
    amount_received = Column(Float, nullable=False)           # Amount in origin currency (e.g. 500.0)
    origin_currency = Column(String(3), nullable=False)        # E.g. "USD", "AED", "SAR", "GBP"
    sender_relationship = Column(String(60), nullable=True)    # E.g. "spouse", "child", "parent", "sibling", "other"
    source_country = Column(String(60), nullable=True)         # E.g. "United Arab Emirates", "Saudi Arabia"
    date_received = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
    
    # Snapshot rates at creation time
    fx_rate_snapshot = Column(Float, nullable=False)          # 1 origin_currency = X PKR at log time
    converted_pkr_amount = Column(Float, nullable=False)      # amount_received * fx_rate_snapshot
    
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at = Column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False
    )

    user = relationship("User", backref="remittances")

    def __repr__(self) -> str:
        return f"<RemittanceRecord id={self.id} user_id={self.user_id} {self.amount_received} {self.origin_currency} = PKR {self.converted_pkr_amount}>"
