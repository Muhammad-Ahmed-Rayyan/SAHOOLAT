"""003_committee_schema.py — Phase 3: committee tables.

Revision ID: 003
Revises: 002
Create Date: 2026-08-29
"""

from typing import Sequence, Union
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Define enums once so they can be shared across create_table calls and downgrade
cycle_frequency_enum = postgresql.ENUM(
    "weekly", "monthly", name="cycle_frequency_enum", create_type=True
)
payout_method_enum = postgresql.ENUM(
    "fixed_order", "random_draw", name="payout_method_enum", create_type=True
)
committee_status_enum = postgresql.ENUM(
    "forming", "active", "completed", name="committee_status_enum", create_type=True
)


def upgrade() -> None:
    bind = op.get_bind()

    # Create enums explicitly with checkfirst so the migration is safe to replay
    cycle_frequency_enum.create(bind, checkfirst=True)
    payout_method_enum.create(bind, checkfirst=True)
    committee_status_enum.create(bind, checkfirst=True)

    # ── committees ─────────────────────────────────────────────────────────────
    op.create_table(
        "committees",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column(
            "created_by",
            sa.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("contribution_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column(
            "cycle_frequency",
            postgresql.ENUM("weekly", "monthly", name="cycle_frequency_enum", create_type=False),
            nullable=False,
        ),
        sa.Column(
            "payout_method",
            postgresql.ENUM("fixed_order", "random_draw", name="payout_method_enum", create_type=False),
            nullable=False,
        ),
        sa.Column("member_limit", sa.Integer, nullable=False),
        sa.Column(
            "status",
            postgresql.ENUM("forming", "active", "completed", name="committee_status_enum", create_type=False),
            nullable=False,
            server_default="forming",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )

    # ── committee_members ──────────────────────────────────────────────────────
    op.create_table(
        "committee_members",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "committee_id",
            sa.UUID(as_uuid=True),
            sa.ForeignKey("committees.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            sa.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("join_order", sa.Integer, nullable=False),
        sa.Column("payout_position", sa.Integer, nullable=True),
        sa.Column("has_received_payout", sa.Boolean, nullable=False, server_default="false"),
        sa.Column(
            "joined_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.UniqueConstraint("committee_id", "user_id", name="uq_committee_user"),
    )
    op.create_index("ix_committee_members_committee_id", "committee_members", ["committee_id"])
    op.create_index("ix_committee_members_user_id", "committee_members", ["user_id"])

    # ── committee_cycles ───────────────────────────────────────────────────────
    op.create_table(
        "committee_cycles",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "committee_id",
            sa.UUID(as_uuid=True),
            sa.ForeignKey("committees.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("cycle_number", sa.Integer, nullable=False),
        sa.Column("due_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "payout_member_id",
            sa.UUID(as_uuid=True),
            sa.ForeignKey("committee_members.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("payout_completed", sa.Boolean, nullable=False, server_default="false"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.UniqueConstraint("committee_id", "cycle_number", name="uq_committee_cycle_number"),
    )
    op.create_index("ix_committee_cycles_committee_id", "committee_cycles", ["committee_id"])

    # ── contributions ──────────────────────────────────────────────────────────
    op.create_table(
        "contributions",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "cycle_id",
            sa.UUID(as_uuid=True),
            sa.ForeignKey("committee_cycles.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "member_id",
            sa.UUID(as_uuid=True),
            sa.ForeignKey("committee_members.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("paid_on_time", sa.Boolean, nullable=False),
        sa.Column(
            "contributed_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.UniqueConstraint("cycle_id", "member_id", name="uq_cycle_member_contribution"),
    )
    op.create_index("ix_contributions_cycle_id", "contributions", ["cycle_id"])
    op.create_index("ix_contributions_member_id", "contributions", ["member_id"])


def downgrade() -> None:
    op.drop_table("contributions")
    op.drop_table("committee_cycles")
    op.drop_table("committee_members")
    op.drop_table("committees")
    bind = op.get_bind()
    committee_status_enum.drop(bind, checkfirst=True)
    payout_method_enum.drop(bind, checkfirst=True)
    cycle_frequency_enum.drop(bind, checkfirst=True)
