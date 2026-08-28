"""002_credit_scoring_schema.py — Phase 2: credit_profiles + credit_score_history tables.

Revision: 002
Down revision: 001
"""

from alembic import op
import sqlalchemy as sa


revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create the enum idempotently — PostgreSQL has no CREATE TYPE IF NOT EXISTS,
    # so we check pg_type manually.
    op.execute(
        """
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'utility_type_enum') THEN
                CREATE TYPE utility_type_enum AS ENUM ('electricity', 'gas', 'water', 'none');
            END IF;
        END $$;
        """
    )

    # Drop partially created table from any prior failed run so this migration is idempotent
    op.execute("DROP TABLE IF EXISTS credit_profiles CASCADE")

    # ── credit_profiles ───────────────────────────────────────────────────────
    op.create_table(
        "credit_profiles",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "user_id",
            sa.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            unique=True,
            nullable=False,
        ),
        # Agricultural inputs
        sa.Column("land_size_acres", sa.Numeric(8, 2), nullable=True),
        sa.Column("crop_yield_maunds", sa.Numeric(10, 2), nullable=True),
        # Utility — create as VARCHAR first, then cast to enum below
        # (avoids SQLAlchemy auto-emitting a second CREATE TYPE inside op.create_table)
        sa.Column("utility_type", sa.String(20), nullable=False, server_default="electricity"),
        sa.Column("utility_paid_months", sa.SmallInteger, nullable=False, server_default="0"),
        sa.Column("utility_total_months", sa.SmallInteger, nullable=False, server_default="12"),
        # Committee / savings
        sa.Column("has_committee_participation", sa.Boolean, nullable=False, server_default="false"),
        # Loan repayment
        sa.Column("has_prior_loan_repayment", sa.Boolean, nullable=False, server_default="false"),
        # Wallet hook (Phase 5)
        sa.Column("avg_monthly_savings_pct", sa.Numeric(5, 2), nullable=True),
        # Timestamps
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
    op.create_index("ix_credit_profiles_user_id", "credit_profiles", ["user_id"])

    # Cast VARCHAR → enum:
    # Must drop the default first (PostgreSQL can't auto-cast a string literal default)
    op.execute("ALTER TABLE credit_profiles ALTER COLUMN utility_type DROP DEFAULT")
    op.execute(
        "ALTER TABLE credit_profiles "
        "ALTER COLUMN utility_type TYPE utility_type_enum "
        "USING utility_type::utility_type_enum"
    )
    # Restore the default now that the column type is correct
    op.execute(
        "ALTER TABLE credit_profiles "
        "ALTER COLUMN utility_type SET DEFAULT 'electricity'::utility_type_enum"
    )

    # ── credit_score_history ──────────────────────────────────────────────────
    op.create_table(
        "credit_score_history",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "credit_profile_id",
            sa.UUID(as_uuid=True),
            sa.ForeignKey("credit_profiles.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("score", sa.SmallInteger, nullable=False),
        sa.Column("factor_breakdown_json", sa.Text, nullable=False, server_default="{}"),
        sa.Column(
            "scored_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index(
        "ix_credit_score_history_credit_profile_id",
        "credit_score_history",
        ["credit_profile_id"],
    )


def downgrade() -> None:
    op.drop_table("credit_score_history")
    op.drop_table("credit_profiles")
    sa.Enum(name="utility_type_enum").drop(op.get_bind(), checkfirst=True)
