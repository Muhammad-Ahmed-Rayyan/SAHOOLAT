"""Phase 1 — Initial schema: users + user_profiles tables.

Revision ID: 001
Revises: 
Create Date: 2026-08-26

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Enums ──────────────────────────────────────────────────────────────────
    occupation_type_enum = sa.Enum(
        "farmer", "daily_laborer", "shopkeeper", "other",
        name="occupation_type_enum",
    )
    language_enum = sa.Enum("en", "ur", name="language_enum")

    # ── users table ───────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("phone_number", sa.String(20), unique=True, nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_users_phone_number", "users", ["phone_number"], unique=True)

    # ── user_profiles table ───────────────────────────────────────────────────
    op.create_table(
        "user_profiles",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "user_id",
            sa.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            unique=True,
            nullable=False,
        ),
        sa.Column("name", sa.String(120), nullable=True),
        sa.Column("location", sa.String(120), nullable=True),
        sa.Column("occupation_type", occupation_type_enum, nullable=True),
        sa.Column("receives_remittances", sa.Boolean(), nullable=True),
        sa.Column(
            "preferred_language",
            language_enum,
            nullable=False,
            server_default="ur",
        ),
        sa.Column(
            "onboarding_completed",
            sa.Boolean(),
            nullable=False,
            server_default="false",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )


def downgrade() -> None:
    op.drop_table("user_profiles")
    op.drop_table("users")
    sa.Enum(name="occupation_type_enum").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="language_enum").drop(op.get_bind(), checkfirst=True)
