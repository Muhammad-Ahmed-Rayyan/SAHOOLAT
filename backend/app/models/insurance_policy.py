"""
insurance_policy.py — InsurancePolicy, WeatherReading, PayoutEvent models (Phase 6: Parametric Crop Insurance).

Design decisions:
- Parametric crop insurance triggers payout based on verifiable, rule-based weather thresholds
  (e.g., extreme heat, heavy rainfall/flood, drought, low temperature/frost).
- Open-Meteo API provides live daily weather readings per district.
- PayoutEvent logs triggered policies with simulated payouts (no real payment gateway integration).
- UUIDs for all PKs, matching every other model in the project.
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
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.models.base import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class PolicyStatus(str, enum.Enum):
    active = "active"          # Policy active and monitoring weather
    monitoring = "monitoring"  # Policy under active weather watch
    triggered = "triggered"    # Threshold breached; payout event generated
    paid = "paid"              # Payout logged/simulated complete
    expired = "expired"        # Coverage window ended without trigger
    cancelled = "cancelled"    # Policy cancelled by user or admin


class ThresholdType(str, enum.Enum):
    extreme_heat = "extreme_heat"      # Max temperature exceeds threshold (°C)
    heavy_rainfall = "heavy_rainfall"  # Daily precipitation exceeds threshold (mm)
    drought = "drought"                # Daily precipitation falls below threshold (mm)
    low_temp = "low_temp"              # Min temperature drops below threshold (°C)


class PayoutStatus(str, enum.Enum):
    logged = "logged"        # Trigger logged in DB
    simulated = "simulated"  # Simulated payout completed
    paid = "paid"            # Marked as paid in system


class InsurancePolicy(Base):
    """
    Parametric Crop Insurance Policy created by a farmer or user.
    """
    __tablename__ = "insurance_policies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    crop_type = Column(String(50), nullable=False)  # e.g., Wheat, Rice, Cotton, Maize, Sugarcane
    district = Column(String(100), nullable=False, index=True)  # e.g., Multan, Faisalabad
    sum_insured = Column(Numeric(12, 2), nullable=False, default=50000.00)
    premium_amount = Column(Numeric(12, 2), nullable=False, default=2500.00)
    threshold_type = Column(
        SAEnum(ThresholdType, name="threshold_type_enum"),
        nullable=False,
    )
    threshold_value = Column(Numeric(8, 2), nullable=False)
    status = Column(
        SAEnum(PolicyStatus, name="policy_status_enum"),
        nullable=False,
        default=PolicyStatus.active,
    )
    coverage_start_date = Column(DateTime(timezone=True), nullable=False, default=_utcnow)
    coverage_end_date = Column(DateTime(timezone=True), nullable=False)

    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at = Column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False
    )

    payout_events = relationship(
        "PayoutEvent",
        back_populates="policy",
        order_by="PayoutEvent.created_at.desc()",
        cascade="all, delete-orphan",
    )
    user = relationship("User")

    def __repr__(self) -> str:
        return f"<InsurancePolicy crop={self.crop_type} district={self.district} status={self.status}>"


class WeatherReading(Base):
    """
    Recorded weather observation from Open-Meteo API or fallback source.
    """
    __tablename__ = "weather_readings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    district = Column(String(100), nullable=False, index=True)
    reading_date = Column(DateTime(timezone=True), nullable=False, default=_utcnow, index=True)
    temp_max = Column(Numeric(5, 2), nullable=True)
    temp_min = Column(Numeric(5, 2), nullable=True)
    precipitation_mm = Column(Numeric(7, 2), nullable=True)
    humidity_pct = Column(Numeric(5, 2), nullable=True)
    source = Column(String(50), nullable=False, default="open_meteo")
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<WeatherReading district={self.district} date={self.reading_date} temp_max={self.temp_max}>"


class PayoutEvent(Base):
    """
    Trigger event record created when an insurance threshold is breached.
    """
    __tablename__ = "payout_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    policy_id = Column(
        UUID(as_uuid=True),
        ForeignKey("insurance_policies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    weather_reading_id = Column(
        UUID(as_uuid=True),
        ForeignKey("weather_readings.id", ondelete="SET NULL"),
        nullable=True,
    )
    trigger_date = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
    payout_amount = Column(Numeric(12, 2), nullable=False)
    trigger_reason = Column(Text, nullable=False)
    status = Column(
        SAEnum(PayoutStatus, name="payout_status_enum"),
        nullable=False,
        default=PayoutStatus.simulated,
    )
    notification_sent = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    policy = relationship("InsurancePolicy", back_populates="payout_events")
    weather_reading = relationship("WeatherReading")

    def __repr__(self) -> str:
        return f"<PayoutEvent policy_id={self.policy_id} amount={self.payout_amount} status={self.status}>"
