"""
committee.py — Phase 3 Digital Committee (ROSCA) models.

Entities:
- Committee: The ROSCA group itself, defining rules (contribution, frequency, limit).
- CommitteeMember: The mapping of User to Committee, tracking payout turn order and receipt.
- CommitteeCycle: Individual rounds (e.g. month 1, month 2) with assigned payout recipients.
- Contribution: Log of a member's payment for a specific cycle, tracking timeliness.
"""

import uuid
import enum
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import (
    UUID,
    Boolean,
    Column,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Numeric,
    SmallInteger,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.models.base import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class CycleFrequency(str, enum.Enum):
    weekly = "weekly"
    monthly = "monthly"


class PayoutMethod(str, enum.Enum):
    fixed_order = "fixed_order"
    random_draw = "random_draw"


class CommitteeStatus(str, enum.Enum):
    forming = "forming"
    active = "active"
    completed = "completed"


class Committee(Base):
    __tablename__ = "committees"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    name = Column(String(120), nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    contribution_amount = Column(Numeric(12, 2), nullable=False)
    cycle_frequency = Column(SAEnum(CycleFrequency, name="cycle_frequency_enum"), nullable=False)
    payout_method = Column(SAEnum(PayoutMethod, name="payout_method_enum"), nullable=False)
    member_limit = Column(Integer, nullable=False)
    status = Column(SAEnum(CommitteeStatus, name="committee_status_enum"), default=CommitteeStatus.forming, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    creator = relationship("User", backref="created_committees")
    members = relationship(
        "CommitteeMember",
        back_populates="committee",
        cascade="all, delete-orphan",
        order_by="CommitteeMember.join_order",
    )
    cycles = relationship(
        "CommitteeCycle",
        back_populates="committee",
        cascade="all, delete-orphan",
        order_by="CommitteeCycle.cycle_number",
    )

    def __repr__(self) -> str:
        return f"<Committee id={self.id} name={self.name} status={self.status}>"


class CommitteeMember(Base):
    __tablename__ = "committee_members"
    __table_args__ = (
        UniqueConstraint("committee_id", "user_id", name="uq_committee_user"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    committee_id = Column(UUID(as_uuid=True), ForeignKey("committees.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    join_order = Column(Integer, nullable=False)  # 1-indexed join order
    payout_position = Column(Integer, nullable=True)  # Assigned when activated (1-indexed)
    has_received_payout = Column(Boolean, default=False, nullable=False)
    joined_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    committee = relationship("Committee", back_populates="members")
    user = relationship("User", backref="committee_memberships")
    contributions = relationship("Contribution", back_populates="member", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<CommitteeMember id={self.id} committee_id={self.committee_id} user_id={self.user_id} position={self.payout_position}>"


class CommitteeCycle(Base):
    __tablename__ = "committee_cycles"
    __table_args__ = (
        UniqueConstraint("committee_id", "cycle_number", name="uq_committee_cycle_number"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    committee_id = Column(UUID(as_uuid=True), ForeignKey("committees.id", ondelete="CASCADE"), nullable=False)
    cycle_number = Column(Integer, nullable=False)  # 1-indexed
    due_date = Column(DateTime(timezone=True), nullable=False)
    payout_member_id = Column(UUID(as_uuid=True), ForeignKey("committee_members.id", ondelete="CASCADE"), nullable=False)
    payout_completed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    committee = relationship("Committee", back_populates="cycles")
    payout_member = relationship("CommitteeMember", foreign_keys=[payout_member_id])
    contributions = relationship("Contribution", back_populates="cycle", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<CommitteeCycle id={self.id} committee_id={self.committee_id} cycle_number={self.cycle_number}>"


class Contribution(Base):
    __tablename__ = "contributions"
    __table_args__ = (
        UniqueConstraint("cycle_id", "member_id", name="uq_cycle_member_contribution"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    cycle_id = Column(UUID(as_uuid=True), ForeignKey("committee_cycles.id", ondelete="CASCADE"), nullable=False)
    member_id = Column(UUID(as_uuid=True), ForeignKey("committee_members.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    paid_on_time = Column(Boolean, nullable=False)
    contributed_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    cycle = relationship("CommitteeCycle", back_populates="contributions")
    member = relationship("CommitteeMember", back_populates="contributions")

    def __repr__(self) -> str:
        return f"<Contribution id={self.id} cycle_id={self.cycle_id} member_id={self.member_id} paid_on_time={self.paid_on_time}>"
