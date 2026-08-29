"""
committee.py — Phase 3 Digital Committee (ROSCA) routes.
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.committee import (
    Committee,
    CommitteeMember,
    CommitteeCycle,
    Contribution,
    CycleFrequency,
    PayoutMethod,
    CommitteeStatus,
)
from app.services.committee_engine import (
    assign_payout_order,
    record_contribution,
)

router = APIRouter(prefix="/committee", tags=["committee"])


# ─── Pydantic Schemas ────────────────────────────────────────────────────────

class CommitteeCreate(BaseModel):
    name: str = Field(..., max_length=120, examples=["Village Savings Group"])
    contribution_amount: float = Field(..., gt=0, examples=[2000.0])
    cycle_frequency: CycleFrequency = CycleFrequency.monthly
    payout_method: PayoutMethod = PayoutMethod.fixed_order
    member_limit: int = Field(..., ge=2, le=50, examples=[5])


class CommitteeMemberOut(BaseModel):
    id: UUID
    user_id: UUID
    user_name: str
    join_order: int
    payout_position: Optional[int] = None
    has_received_payout: bool
    joined_at: datetime

    class Config:
        from_attributes = True


class CommitteeCycleOut(BaseModel):
    id: UUID
    cycle_number: int
    due_date: datetime
    payout_member_id: UUID
    payout_member_name: str
    payout_completed: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ContributionOut(BaseModel):
    id: UUID
    cycle_id: UUID
    cycle_number: int
    member_id: UUID
    member_name: str
    amount: float
    paid_on_time: bool
    contributed_at: datetime

    class Config:
        from_attributes = True


class CommitteeOut(BaseModel):
    id: UUID
    name: str
    created_by: UUID
    contribution_amount: float
    cycle_frequency: CycleFrequency
    payout_method: PayoutMethod
    member_limit: int
    status: CommitteeStatus
    created_at: datetime
    members_count: int

    class Config:
        from_attributes = True


class CommitteeDetailOut(BaseModel):
    id: UUID
    name: str
    created_by: UUID
    contribution_amount: float
    cycle_frequency: CycleFrequency
    payout_method: PayoutMethod
    member_limit: int
    status: CommitteeStatus
    created_at: datetime
    members: List[CommitteeMemberOut]
    current_cycle: Optional[CommitteeCycleOut] = None
    contribution_log: List[ContributionOut] = []

    class Config:
        from_attributes = True


class ContributionIn(BaseModel):
    amount: float = Field(..., gt=0)


# ─── API Routes ──────────────────────────────────────────────────────────────

@router.post(
    "",
    response_model=CommitteeOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new committee",
)
def create_committee(
    payload: CommitteeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Committee:
    """
    Create a new committee (forming). The creator automatically joins as member #1.
    """
    committee = Committee(
        name=payload.name,
        created_by=current_user.id,
        contribution_amount=payload.contribution_amount,
        cycle_frequency=payload.cycle_frequency,
        payout_method=payload.payout_method,
        member_limit=payload.member_limit,
        status=CommitteeStatus.forming,
    )
    db.add(committee)
    db.flush()

    # Creator joins as the first member
    member = CommitteeMember(
        committee_id=committee.id,
        user_id=current_user.id,
        join_order=1,
    )
    db.add(member)
    db.commit()
    db.refresh(committee)

    # Set calculated attribute for schema output
    committee.members_count = 1
    return committee


@router.post(
    "/{id}/join",
    response_model=CommitteeMemberOut,
    status_code=status.HTTP_201_CREATED,
    summary="Join a committee",
)
def join_committee(
    id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CommitteeMember:
    """
    Join an existing forming committee. Auto-activates if member_limit is reached.
    """
    committee = db.query(Committee).filter(Committee.id == id).first()
    if not committee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": True,
                "message": "Committee not found",
                "code": "COMMITTEE_NOT_FOUND",
            },
        )

    if committee.status != CommitteeStatus.forming:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": True,
                "message": "This committee is not forming. Cannot join.",
                "code": "COMMITTEE_NOT_FORMING",
            },
        )

    # Check if already joined
    existing_member = db.query(CommitteeMember).filter(
        and_(CommitteeMember.committee_id == id, CommitteeMember.user_id == current_user.id)
    ).first()
    if existing_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": True,
                "message": "You have already joined this committee",
                "code": "ALREADY_JOINED",
            },
        )

    current_members_count = len(committee.members)
    if current_members_count >= committee.member_limit:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": True,
                "message": "This committee has reached its member limit",
                "code": "MEMBER_LIMIT_REACHED",
            },
        )

    member = CommitteeMember(
        committee_id=id,
        user_id=current_user.id,
        join_order=current_members_count + 1,
    )
    db.add(member)
    db.flush()

    # Auto-activate committee if it has reached its member limit
    if len(committee.members) >= committee.member_limit:
        committee.status = CommitteeStatus.active
        assign_payout_order(db, committee)

    db.commit()
    db.refresh(member)

    # Set user_name for schema output
    member.user_name = current_user.profile.name if current_user.profile and current_user.profile.name else "User"
    return member


@router.get(
    "",
    response_model=List[CommitteeOut],
    summary="List my committees",
)
def list_my_committees(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[Committee]:
    """
    Get all committees the current user is a member of.
    """
    memberships = db.query(CommitteeMember).filter(CommitteeMember.user_id == current_user.id).all()
    committees = []
    for m in memberships:
        c = m.committee
        c.members_count = len(c.members)
        committees.append(c)
    return committees


@router.get(
    "/{id}",
    response_model=CommitteeDetailOut,
    summary="Get committee details",
)
def get_committee_detail(
    id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """
    Get detailed information about a committee, including members, current cycle, and full contribution log.
    """
    committee = db.query(Committee).filter(Committee.id == id).first()
    if not committee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": True,
                "message": "Committee not found",
                "code": "COMMITTEE_NOT_FOUND",
            },
        )

    # Verify user is a member of the committee
    is_member = any(m.user_id == current_user.id for m in committee.members)
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": True,
                "message": "You are not a member of this committee",
                "code": "NOT_A_MEMBER",
            },
        )

    # 1. Format members
    members_out = []
    for m in committee.members:
        members_out.append(
            CommitteeMemberOut(
                id=m.id,
                user_id=m.user_id,
                user_name=m.user.profile.name if m.user.profile and m.user.profile.name else "User",
                join_order=m.join_order,
                payout_position=m.payout_position,
                has_received_payout=m.has_received_payout,
                joined_at=m.joined_at,
            )
        )

    # 2. Get current active cycle
    current_cycle_out = None
    if committee.status == CommitteeStatus.active:
        current_cycle = (
            db.query(CommitteeCycle)
            .filter(
                and_(
                    CommitteeCycle.committee_id == id,
                    CommitteeCycle.payout_completed == False,
                )
            )
            .order_by(CommitteeCycle.cycle_number.asc())
            .first()
        )
        if current_cycle:
            current_cycle_out = CommitteeCycleOut(
                id=current_cycle.id,
                cycle_number=current_cycle.cycle_number,
                due_date=current_cycle.due_date,
                payout_member_id=current_cycle.payout_member_id,
                payout_member_name=current_cycle.payout_member.user.profile.name
                if current_cycle.payout_member.user.profile and current_cycle.payout_member.user.profile.name
                else "User",
                payout_completed=current_cycle.payout_completed,
                created_at=current_cycle.created_at,
            )

    # 3. Get full contribution log
    contributions_out = []
    # Query all contributions for all cycles of this committee
    cycles = db.query(CommitteeCycle).filter(CommitteeCycle.committee_id == id).all()
    cycle_ids = [cy.id for cy in cycles]
    if cycle_ids:
        contributions = (
            db.query(Contribution)
            .filter(Contribution.cycle_id.in_(cycle_ids))
            .order_by(Contribution.contributed_at.desc())
            .all()
        )
        for c in contributions:
            contributions_out.append(
                ContributionOut(
                    id=c.id,
                    cycle_id=c.cycle_id,
                    cycle_number=c.cycle.cycle_number,
                    member_id=c.member_id,
                    member_name=c.member.user.profile.name if c.member.user.profile and c.member.user.profile.name else "User",
                    amount=float(c.amount),
                    paid_on_time=c.paid_on_time,
                    contributed_at=c.contributed_at,
                )
            )

    return {
        "id": committee.id,
        "name": committee.name,
        "created_by": committee.created_by,
        "contribution_amount": float(committee.contribution_amount),
        "cycle_frequency": committee.cycle_frequency,
        "payout_method": committee.payout_method,
        "member_limit": committee.member_limit,
        "status": committee.status,
        "created_at": committee.created_at,
        "members": members_out,
        "current_cycle": current_cycle_out,
        "contribution_log": contributions_out,
    }


@router.post(
    "/{id}/cycles/{cycle_id}/contribute",
    response_model=ContributionOut,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a cycle contribution",
)
def submit_contribution(
    id: UUID,
    cycle_id: UUID,
    payload: ContributionIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ContributionOut:
    """
    Log a member's payment for the active committee cycle.
    """
    committee = db.query(Committee).filter(Committee.id == id).first()
    if not committee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": True,
                "message": "Committee not found",
                "code": "COMMITTEE_NOT_FOUND",
            },
        )

    # Find user's member row in this committee
    member = db.query(CommitteeMember).filter(
        and_(CommitteeMember.committee_id == id, CommitteeMember.user_id == current_user.id)
    ).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": True,
                "message": "You are not a member of this committee",
                "code": "NOT_A_MEMBER",
            },
        )

    if committee.status != CommitteeStatus.active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": True,
                "message": "This committee is not active",
                "code": "COMMITTEE_NOT_ACTIVE",
            },
        )

    try:
        contribution = record_contribution(
            db=db,
            cycle_id=cycle_id,
            member_id=member.id,
            amount=payload.amount,
        )
        db.commit()
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": True,
                "message": str(e),
                "code": "CONTRIBUTION_FAILED",
            },
        )

    # Construct response
    db.refresh(contribution)
    return ContributionOut(
        id=contribution.id,
        cycle_id=contribution.cycle_id,
        cycle_number=contribution.cycle.cycle_number,
        member_id=contribution.member_id,
        member_name=current_user.profile.name if current_user.profile and current_user.profile.name else "User",
        amount=float(contribution.amount),
        paid_on_time=contribution.paid_on_time,
        contributed_at=contribution.contributed_at,
    )


@router.post(
    "/{id}/activate",
    response_model=CommitteeDetailOut,
    summary="Manually activate a committee",
)
def activate_committee(
    id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """
    Lock membership and activate the committee. Requires at least 2 members.
    Assigns payout order positions and generates all cycles upfront.
    """
    committee = db.query(Committee).filter(Committee.id == id).first()
    if not committee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": True,
                "message": "Committee not found",
                "code": "COMMITTEE_NOT_FOUND",
            },
        )

    if committee.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": True,
                "message": "Only the committee creator can activate it",
                "code": "UNAUTHORIZED",
            },
        )

    if committee.status != CommitteeStatus.forming:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": True,
                "message": "Committee is not in forming status",
                "code": "NOT_FORMING",
            },
        )

    members_count = len(committee.members)
    if members_count < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": True,
                "message": "A committee requires at least 2 members to activate",
                "code": "INSUFFICIENT_MEMBERS",
            },
        )

    # Adjust member_limit to actual count if activated manually before limit is reached
    if members_count < committee.member_limit:
        committee.member_limit = members_count

    committee.status = CommitteeStatus.active
    assign_payout_order(db, committee)
    db.commit()

    # Return full detail
    return get_committee_detail(id, current_user, db)
