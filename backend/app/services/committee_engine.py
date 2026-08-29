"""
committee_engine.py — Service layer for Digital Committee (ROSCA) business logic.
"""

import random
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.committee import (
    Committee,
    CommitteeMember,
    CommitteeCycle,
    Contribution,
    CommitteeStatus,
    PayoutMethod,
    CycleFrequency,
)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def assign_payout_order(db: Session, committee: Committee) -> None:
    """
    On committee activation (once member_limit is reached), assigns payout_position
    to each member — either by join_order (fixed_order) or a seeded random shuffle
    (random_draw), and creates the CommitteeCycle rows for the full rotation up front.
    """
    members = list(committee.members)
    if not members:
        return

    # 1. Determine the payout position for each member
    if committee.payout_method == PayoutMethod.fixed_order:
        # Sort by join_order and assign positions sequentially
        members.sort(key=lambda m: m.join_order)
        for i, member in enumerate(members, start=1):
            member.payout_position = i
    elif committee.payout_method == PayoutMethod.random_draw:
        # Seeded random shuffle using the committee ID to ensure deterministic order
        r = random.Random(committee.id.int)
        shuffled = list(members)
        r.shuffle(shuffled)
        for i, member in enumerate(shuffled, start=1):
            member.payout_position = i

    # Commit the updated member positions
    db.flush()

    # 2. Create the CommitteeCycle rows up front
    activation_time = _utcnow()
    cycle_days = 7 if committee.cycle_frequency == CycleFrequency.weekly else 30

    for i in range(1, len(members) + 1):
        # Find the member assigned to this payout position
        payout_member = next(m for m in members if m.payout_position == i)
        due_date = activation_time + timedelta(days=cycle_days * i)

        cycle = CommitteeCycle(
            committee_id=committee.id,
            cycle_number=i,
            due_date=due_date,
            payout_member_id=payout_member.id,
            payout_completed=False,
            created_at=activation_time,
        )
        db.add(cycle)

    db.flush()


def record_contribution(db: Session, cycle_id: UUID, member_id: UUID, amount: Decimal) -> Contribution:
    """
    Creates a Contribution, flags paid_on_time against the cycle's due_date.
    Auto-completes the cycle payout if all members have paid for this cycle.
    """
    cycle = db.query(CommitteeCycle).filter(CommitteeCycle.id == cycle_id).first()
    if not cycle:
        raise ValueError("Cycle not found")

    member = db.query(CommitteeMember).filter(CommitteeMember.id == member_id).first()
    if not member:
        raise ValueError("Committee member not found")

    # Double check membership matching
    if member.committee_id != cycle.committee_id:
        raise ValueError("Member does not belong to this committee")

    # Check if already contributed for this cycle
    existing = db.query(Contribution).filter(
        and_(Contribution.cycle_id == cycle_id, Contribution.member_id == member_id)
    ).first()
    if existing:
        raise ValueError("Member has already contributed for this cycle")

    contributed_at = _utcnow()
    paid_on_time = contributed_at <= cycle.due_date

    contribution = Contribution(
        cycle_id=cycle_id,
        member_id=member_id,
        amount=amount,
        paid_on_time=paid_on_time,
        contributed_at=contributed_at,
    )
    db.add(contribution)
    db.flush()

    # Check if all members have now contributed for this cycle
    committee = cycle.committee
    total_members = len(committee.members)
    contributions_count = db.query(Contribution).filter(Contribution.cycle_id == cycle_id).count()

    if contributions_count >= total_members:
        # All members paid, complete the cycle's payout
        cycle.payout_completed = True
        # Mark the payout recipient as having received the payout
        cycle.payout_member.has_received_payout = True
        
        # If this was the last cycle, mark the committee as completed
        if cycle.cycle_number == total_members:
            committee.status = CommitteeStatus.completed

    db.flush()
    return contribution


def get_committee_score_signal(db: Session, user_id: UUID) -> dict:
    """
    Returns {has_active_committee: bool | None, on_time_contribution_rate: float | None}
    computed from real Contribution records.
    Returns has_active_committee=None if user has zero committee memberships in the DB.
    """
    # Find all committee memberships for the user
    memberships = db.query(CommitteeMember).filter(CommitteeMember.user_id == user_id).all()
    if not memberships:
        return {"has_active_committee": None, "on_time_contribution_rate": None}

    # Check if user is in any active committee
    has_active = any(m.committee.status == CommitteeStatus.active for m in memberships)

    # Calculate on-time contribution rate across all committees
    member_ids = [m.id for m in memberships]
    contributions = db.query(Contribution).filter(Contribution.member_id.in_(member_ids)).all()

    if not contributions:
        return {"has_active_committee": has_active, "on_time_contribution_rate": None}

    on_time_count = sum(1 for c in contributions if c.paid_on_time)
    rate = on_time_count / len(contributions)

    return {
        "has_active_committee": has_active,
        "on_time_contribution_rate": rate,
    }
