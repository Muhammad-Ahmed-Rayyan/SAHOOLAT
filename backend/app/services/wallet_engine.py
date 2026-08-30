"""
wallet_engine.py — Digital Wallet service layer (Phase 5).

DESIGN PRINCIPLES:
  - balance on WalletAccount = savings only (auto_save + manual_save txns), NOT gross income.
    This matches Phases.md's "savings balance" definition.
  - log_income() is the primary entry point: it creates an income transaction, then if
    auto_save_pct is set, creates an auto_save transaction and increments wallet.balance.
  - After every income log, get_wallet_score_signal() is called to recompute
    avg_monthly_savings_pct on CreditProfile. This is a live signal (not scheduled),
    consistent with how committee_engine hooks into the scoring engine.
  - avg_monthly_savings_pct = (total auto_save in last 3 months / total income in last 3 months) * 100.
    Matches CreditProfile docstring: "average monthly savings as % of income over last 3 months".
"""

from __future__ import annotations

from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.wallet import WalletAccount, Transaction, TransactionType
from app.models.credit_profile import CreditProfile


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ── Wallet retrieval / creation ───────────────────────────────────────────────

def get_or_create_wallet(db: Session, user_id: UUID) -> WalletAccount:
    """Get the user's wallet, creating one if it doesn't exist yet."""
    wallet = db.query(WalletAccount).filter(WalletAccount.user_id == user_id).first()
    if wallet is None:
        wallet = WalletAccount(user_id=user_id, balance=Decimal("0.00"), auto_save_pct=None)
        db.add(wallet)
        db.flush()  # get the id assigned without committing
    return wallet


# ── Income logging ────────────────────────────────────────────────────────────

def log_income(
    db: Session,
    user_id: UUID,
    amount: Decimal,
    note: Optional[str] = None,
) -> dict:
    """
    Log an income entry for the user. If auto_save_pct is set on their wallet,
    automatically create a matching auto_save transaction and increment the balance.

    Returns a dict with keys: income_txn, auto_save_txn (may be None), updated_wallet.
    """
    wallet = get_or_create_wallet(db, user_id)

    # 1. Record the income transaction
    income_txn = Transaction(
        wallet_id=wallet.id,
        type=TransactionType.income,
        amount=amount,
        note=note,
        logged_at=_utcnow(),
    )
    db.add(income_txn)

    auto_save_txn = None

    # 2. If auto-save is enabled, create auto_save transaction and update balance
    if wallet.auto_save_pct is not None and wallet.auto_save_pct > 0:
        save_amount = (amount * wallet.auto_save_pct / Decimal("100")).quantize(Decimal("0.01"))
        auto_save_txn = Transaction(
            wallet_id=wallet.id,
            type=TransactionType.auto_save,
            amount=save_amount,
            note=f"Auto-save {wallet.auto_save_pct}% of Rs. {amount}",
            logged_at=_utcnow(),
        )
        db.add(auto_save_txn)
        wallet.balance = (wallet.balance or Decimal("0.00")) + save_amount

    db.flush()

    # 3. Update credit score signal immediately after every income log
    _update_score_signal(db, user_id, wallet)

    return {
        "income_txn": income_txn,
        "auto_save_txn": auto_save_txn,
        "wallet": wallet,
    }


# ── Credit score signal ───────────────────────────────────────────────────────

def _update_score_signal(db: Session, user_id: UUID, wallet: WalletAccount) -> None:
    """
    Compute avg_monthly_savings_pct from last 3 months of real transactions
    and write it into CreditProfile.avg_monthly_savings_pct.

    Formula: (total savings in last 3 months / total income in last 3 months) * 100.
    Matches the CreditProfile column docstring exactly.
    If there is no income in the last 3 months, the signal is set to None (unknown).
    """
    three_months_ago = _utcnow() - timedelta(days=90)

    # Total income in the last 3 months
    total_income = db.query(func.sum(Transaction.amount)).filter(
        Transaction.wallet_id == wallet.id,
        Transaction.type == TransactionType.income,
        Transaction.logged_at >= three_months_ago,
    ).scalar() or Decimal("0.00")

    # Total savings (auto_save + manual_save) in the last 3 months
    total_savings = db.query(func.sum(Transaction.amount)).filter(
        Transaction.wallet_id == wallet.id,
        Transaction.type.in_([TransactionType.auto_save, TransactionType.manual_save]),
        Transaction.logged_at >= three_months_ago,
    ).scalar() or Decimal("0.00")

    if total_income > 0:
        savings_pct = float((total_savings / total_income) * 100)
    else:
        savings_pct = None

    # Update CreditProfile
    profile = db.query(CreditProfile).filter(CreditProfile.user_id == user_id).first()
    if profile is not None:
        profile.avg_monthly_savings_pct = savings_pct


def get_wallet_score_signal(db: Session, user_id: UUID) -> Optional[float]:
    """
    Public accessor: returns the current avg_monthly_savings_pct for the user,
    computed from real wallet transaction data. Returns None if no wallet/income exists.
    """
    wallet = db.query(WalletAccount).filter(WalletAccount.user_id == user_id).first()
    if wallet is None:
        return None
    profile = db.query(CreditProfile).filter(CreditProfile.user_id == user_id).first()
    if profile is None:
        return None
    return float(profile.avg_monthly_savings_pct) if profile.avg_monthly_savings_pct is not None else None


# ── Trend aggregation ─────────────────────────────────────────────────────────

def get_savings_trend(db: Session, user_id: UUID, months: int = 6) -> list[dict]:
    """
    Aggregate income and savings by month for the trend chart.
    Returns a list of dicts sorted by month ascending:
      [{"month": "2026-08", "income": 15000.0, "savings": 1500.0}, ...]
    Months with no transactions are included with 0 values for a continuous chart.
    """
    wallet = db.query(WalletAccount).filter(WalletAccount.user_id == user_id).first()
    if wallet is None:
        return []

    cutoff = _utcnow() - timedelta(days=months * 30)

    # Get all transactions in range
    txns = (
        db.query(Transaction)
        .filter(
            Transaction.wallet_id == wallet.id,
            Transaction.logged_at >= cutoff,
        )
        .order_by(Transaction.logged_at.asc())
        .all()
    )

    # Build month buckets
    month_data: dict[str, dict] = {}
    for txn in txns:
        month_key = txn.logged_at.strftime("%Y-%m")
        if month_key not in month_data:
            month_data[month_key] = {"month": month_key, "income": 0.0, "savings": 0.0}
        if txn.type == TransactionType.income:
            month_data[month_key]["income"] += float(txn.amount)
        elif txn.type in (TransactionType.auto_save, TransactionType.manual_save):
            month_data[month_key]["savings"] += float(txn.amount)

    # Fill missing months with zeros so the chart always has `months` data points
    result = []
    now = _utcnow()
    for i in range(months - 1, -1, -1):
        d = now - timedelta(days=i * 30)
        key = d.strftime("%Y-%m")
        result.append(month_data.get(key, {"month": key, "income": 0.0, "savings": 0.0}))

    return result
