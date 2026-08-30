"""
wallet.py — Digital Wallet API routes (Phase 5).

Endpoints:
  GET  /wallet              — balance and auto-save setting
  PUT  /wallet/auto-save    — set/update auto_save_pct
  POST /wallet/income       — log income (triggers auto-save + credit score signal)
  GET  /wallet/transactions — paginated transaction history
  GET  /wallet/trend        — monthly earnings/savings trend for the chart

Error shape: { "error": true, "message": "...", "code": "..." }
"""

from decimal import Decimal
from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.wallet import WalletAccount, Transaction, TransactionType
from app.services.wallet_engine import (
    get_or_create_wallet,
    log_income,
    get_savings_trend,
)

router = APIRouter(prefix="/wallet", tags=["wallet"])


# ─── Pydantic schemas ──────────────────────────────────────────────────────────

class WalletOut(BaseModel):
    id: UUID
    balance: float
    auto_save_pct: Optional[float]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AutoSaveIn(BaseModel):
    auto_save_pct: Optional[float] = Field(
        None,
        ge=0,
        le=100,
        description="Percentage of each income entry to auto-save (0–100). Pass null to disable.",
    )


class AutoSaveOut(BaseModel):
    auto_save_pct: Optional[float]
    message: str


class IncomeIn(BaseModel):
    amount: float = Field(..., gt=0, description="Income amount in PKR (must be positive)")
    note: Optional[str] = Field(None, max_length=500)


class IncomeOut(BaseModel):
    income_amount: float
    saved_amount: Optional[float]    # None if auto-save is off
    new_balance: float
    message: str


class TransactionOut(BaseModel):
    id: UUID
    type: str
    amount: float
    note: Optional[str]
    logged_at: datetime

    model_config = {"from_attributes": True}


class TransactionListOut(BaseModel):
    total: int
    page: int
    page_size: int
    transactions: list[TransactionOut]


class TrendPoint(BaseModel):
    month: str
    income: float
    savings: float


class TrendOut(BaseModel):
    months: int
    data: list[TrendPoint]


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.get("", response_model=WalletOut, summary="Get wallet balance and settings")
def get_wallet(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> WalletOut:
    """Returns the current balance and auto-save setting. Creates wallet if first visit."""
    wallet = get_or_create_wallet(db, current_user.id)
    db.commit()
    return WalletOut(
        id=wallet.id,
        balance=float(wallet.balance or 0),
        auto_save_pct=float(wallet.auto_save_pct) if wallet.auto_save_pct is not None else None,
        created_at=wallet.created_at,
        updated_at=wallet.updated_at,
    )


@router.put("/auto-save", response_model=AutoSaveOut, summary="Set or disable auto-save percentage")
def set_auto_save(
    body: AutoSaveIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AutoSaveOut:
    """Set what % of each income entry is automatically saved. Pass null to disable."""
    wallet = get_or_create_wallet(db, current_user.id)
    wallet.auto_save_pct = Decimal(str(body.auto_save_pct)) if body.auto_save_pct is not None else None
    db.commit()

    if wallet.auto_save_pct is None:
        msg = "Auto-save disabled."
    else:
        msg = f"Auto-save set to {float(wallet.auto_save_pct):.1f}% of each income entry."

    return AutoSaveOut(
        auto_save_pct=float(wallet.auto_save_pct) if wallet.auto_save_pct is not None else None,
        message=msg,
    )


@router.post(
    "/income",
    response_model=IncomeOut,
    status_code=status.HTTP_201_CREATED,
    summary="Log an income entry (triggers auto-save and credit score signal update)",
)
def log_income_route(
    body: IncomeIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> IncomeOut:
    """
    Log an income entry. If auto-save is enabled, an auto_save transaction is
    created automatically and balance updated. Credit score savings signal is also
    recomputed and stored immediately.
    """
    result = log_income(
        db=db,
        user_id=current_user.id,
        amount=Decimal(str(body.amount)),
        note=body.note,
    )
    db.commit()

    wallet = result["wallet"]
    auto_txn = result["auto_save_txn"]

    return IncomeOut(
        income_amount=float(body.amount),
        saved_amount=float(auto_txn.amount) if auto_txn else None,
        new_balance=float(wallet.balance or 0),
        message=(
            f"Income of Rs. {body.amount:,.0f} logged."
            + (f" Rs. {float(auto_txn.amount):,.0f} auto-saved." if auto_txn else "")
        ),
    )


@router.get(
    "/transactions",
    response_model=TransactionListOut,
    summary="Get paginated transaction history",
)
def get_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TransactionListOut:
    wallet = db.query(WalletAccount).filter(WalletAccount.user_id == current_user.id).first()
    if wallet is None:
        return TransactionListOut(total=0, page=page, page_size=page_size, transactions=[])

    total = db.query(Transaction).filter(Transaction.wallet_id == wallet.id).count()
    txns = (
        db.query(Transaction)
        .filter(Transaction.wallet_id == wallet.id)
        .order_by(Transaction.logged_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return TransactionListOut(
        total=total,
        page=page,
        page_size=page_size,
        transactions=[
            TransactionOut(
                id=t.id,
                type=t.type.value,
                amount=float(t.amount),
                note=t.note,
                logged_at=t.logged_at,
            )
            for t in txns
        ],
    )


@router.get("/trend", response_model=TrendOut, summary="Monthly income/savings trend for chart")
def get_trend(
    months: int = Query(6, ge=1, le=24),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TrendOut:
    data = get_savings_trend(db, current_user.id, months=months)
    return TrendOut(
        months=months,
        data=[TrendPoint(**d) for d in data],
    )
