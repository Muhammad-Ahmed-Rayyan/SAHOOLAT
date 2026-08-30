"""
wallet.py — WalletAccount and Transaction models (Phase 5: Digital Wallet).

Design decisions:
- One WalletAccount per user (unique FK on user_id — mirrors CreditProfile pattern).
- Transaction types: income (user logs earnings), auto_save (system creates from auto_save_pct),
  manual_save (future: direct save transfers). The balance field on WalletAccount reflects
  SAVINGS balance only (auto_save + manual_save transactions), NOT gross income logged.
  This matches Phases.md's "savings balance" intent.
- auto_save_pct stored as Numeric(5,2) — e.g. 10.00 means save 10% of each income entry.
  Null means auto-save is disabled.
- UUIDs for all PKs, matching every other model in the project.
"""

import uuid
import enum
from datetime import datetime, timezone

from sqlalchemy import (
    UUID,
    Column,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Numeric,
    Text,
)
from sqlalchemy.orm import relationship

from app.models.base import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class TransactionType(str, enum.Enum):
    income = "income"           # User logs earned income
    auto_save = "auto_save"     # System-created: % of income auto-allocated to savings
    manual_save = "manual_save" # Future: user explicitly moves money to savings


class WalletAccount(Base):
    """
    One savings wallet per user. Created lazily on first wallet interaction.
    balance = sum of auto_save + manual_save transactions (savings only, not gross income).
    """
    __tablename__ = "wallet_accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    # Savings balance (not gross income — see module docstring)
    balance = Column(Numeric(12, 2), nullable=False, default=0)

    # Percentage of each logged income to automatically allocate to savings.
    # Null = auto-save off. e.g. 10.00 = save 10%.
    auto_save_pct = Column(Numeric(5, 2), nullable=True)

    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at = Column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False
    )

    transactions = relationship(
        "Transaction",
        back_populates="wallet",
        order_by="Transaction.logged_at.desc()",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<WalletAccount user_id={self.user_id} balance={self.balance}>"


class Transaction(Base):
    """
    Immutable ledger entry. One row per income log or auto-save allocation.
    Never updated — corrections are new opposing transactions (audit-trail pattern).
    """
    __tablename__ = "wallet_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    wallet_id = Column(
        UUID(as_uuid=True),
        ForeignKey("wallet_accounts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    type = Column(
        SAEnum(TransactionType, name="transaction_type_enum"),
        nullable=False,
    )
    amount = Column(Numeric(12, 2), nullable=False)
    note = Column(Text, nullable=True)
    logged_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    wallet = relationship("WalletAccount", back_populates="transactions")

    def __repr__(self) -> str:
        return f"<Transaction type={self.type} amount={self.amount}>"
