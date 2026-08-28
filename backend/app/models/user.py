"""
User and UserProfile models — Phase 1 core entities.

User       — authentication identity (phone number + JWT linkage)
UserProfile — product identity (name, location, occupation, preferences)

Design decisions:
- UUIDs as PKs (not sequential integers) — avoids enumeration attacks on a financial app.
- phone_number stored in E.164 format (e.g. +923001234567) — normalised on write.
- occupation_type uses a Python Enum so the constraint lives in the model, not ad-hoc strings.
- receives_remittances: optional boolean flag — NOT an occupation type.
  Placed on UserProfile as a soft signal for Module 8 personalisation.
  Defaults to None (unknown), not False — lets the onboarding form skip the question
  without implying a negative answer.
- onboarding_completed: gate used by the frontend navigator to decide whether
  to show OnboardingScreen or Dashboard on app launch.
- preferred_language: 'en' | 'ur' — persisted after language-select screen.
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
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.models.base import Base


class OccupationType(str, enum.Enum):
    farmer = "farmer"
    daily_laborer = "daily_laborer"
    shopkeeper = "shopkeeper"
    other = "other"


class Language(str, enum.Enum):
    en = "en"
    ur = "ur"


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    phone_number = Column(String(20), unique=True, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at = Column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False
    )

    # one-to-one relationship — profile created during onboarding
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User id={self.id} phone={self.phone_number}>"


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    # ── Onboarding fields ──────────────────────────────────────────────────────
    name = Column(String(120), nullable=True)
    location = Column(String(120), nullable=True)          # city / district free-text for now
    occupation_type = Column(
        SAEnum(OccupationType, name="occupation_type_enum"), nullable=True
    )

    # ── Optional soft signal for Remittance module (Phase 9) ──────────────────
    # None = not asked / unknown.  True/False = explicitly set during onboarding.
    receives_remittances = Column(Boolean, nullable=True, default=None)

    # ── App preferences ───────────────────────────────────────────────────────
    preferred_language = Column(
        SAEnum(Language, name="language_enum"), default=Language.ur, nullable=False
    )
    onboarding_completed = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at = Column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False
    )

    user = relationship("User", back_populates="profile")

    def __repr__(self) -> str:
        return f"<UserProfile user_id={self.user_id} name={self.name}>"
