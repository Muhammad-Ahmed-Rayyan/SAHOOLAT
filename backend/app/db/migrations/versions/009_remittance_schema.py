"""009_remittance_schema

Revision ID: 009_remittance_schema
Revises: 008_literacy_schema
Create Date: 2026-09-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '009_remittance_schema'
down_revision: Union[str, None] = '008_literacy_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'remittance_records',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('amount_received', sa.Float(), nullable=False),
        sa.Column('origin_currency', sa.String(length=3), nullable=False),
        sa.Column('sender_relationship', sa.String(length=60), nullable=True),
        sa.Column('source_country', sa.String(length=60), nullable=True),
        sa.Column('date_received', sa.DateTime(timezone=True), nullable=False),
        sa.Column('fx_rate_snapshot', sa.Float(), nullable=False),
        sa.Column('converted_pkr_amount', sa.Float(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_remittance_records_user_id'), 'remittance_records', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_remittance_records_user_id'), table_name='remittance_records')
    op.drop_table('remittance_records')
