"""005_wallet_schema — Phase 5: Digital Wallet tables.

Creates wallet_accounts and wallet_transactions tables.
The false-positive index/constraint drops detected by autogenerate were removed —
those committee/credit_profile/users constraints already exist in Neon and are correct.

Revision ID: 5a7766b962bd
Revises: 004
Create Date: 2026-08-30
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '5a7766b962bd'
down_revision: Union[str, None] = '004'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

transaction_type_enum = postgresql.ENUM(
    "income", "auto_save", "manual_save",
    name="transaction_type_enum",
    create_type=True,
)


def upgrade() -> None:
    conn = op.get_bind()
    transaction_type_enum.create(conn, checkfirst=True)

    op.create_table(
        'wallet_accounts',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('balance', sa.Numeric(precision=12, scale=2), nullable=False, server_default="0"),
        sa.Column('auto_save_pct', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        op.f('ix_wallet_accounts_user_id'), 'wallet_accounts', ['user_id'], unique=True
    )

    op.create_table(
        'wallet_transactions',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('wallet_id', sa.UUID(), nullable=False),
        sa.Column(
            'type',
            postgresql.ENUM(
                'income', 'auto_save', 'manual_save',
                name='transaction_type_enum', create_type=False
            ),
            nullable=False,
        ),
        sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('note', sa.Text(), nullable=True),
        sa.Column('logged_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['wallet_id'], ['wallet_accounts.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        op.f('ix_wallet_transactions_wallet_id'), 'wallet_transactions', ['wallet_id'], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f('ix_wallet_transactions_wallet_id'), table_name='wallet_transactions')
    op.drop_table('wallet_transactions')
    op.drop_index(op.f('ix_wallet_accounts_user_id'), table_name='wallet_accounts')
    op.drop_table('wallet_accounts')
    transaction_type_enum.drop(op.get_bind(), checkfirst=True)
