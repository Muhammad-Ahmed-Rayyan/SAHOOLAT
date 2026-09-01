"""006_insurance_schema — Phase 6: Parametric Crop Insurance tables.

Creates insurance_policies, weather_readings, and payout_events tables.

Revision ID: 6a8899b703ef
Revises: 5a7766b962bd
Create Date: 2026-09-01
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '6a8899b703ef'
down_revision: Union[str, None] = '5a7766b962bd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

policy_status_enum = postgresql.ENUM(
    'active', 'monitoring', 'triggered', 'paid', 'expired', 'cancelled',
    name='policy_status_enum',
    create_type=True,
)

threshold_type_enum = postgresql.ENUM(
    'extreme_heat', 'heavy_rainfall', 'drought', 'low_temp',
    name='threshold_type_enum',
    create_type=True,
)

payout_status_enum = postgresql.ENUM(
    'logged', 'simulated', 'paid',
    name='payout_status_enum',
    create_type=True,
)


def upgrade() -> None:
    conn = op.get_bind()
    policy_status_enum.create(conn, checkfirst=True)
    threshold_type_enum.create(conn, checkfirst=True)
    payout_status_enum.create(conn, checkfirst=True)

    op.create_table(
        'insurance_policies',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('crop_type', sa.String(length=50), nullable=False),
        sa.Column('district', sa.String(length=100), nullable=False),
        sa.Column('sum_insured', sa.Numeric(precision=12, scale=2), nullable=False, server_default="50000.00"),
        sa.Column('premium_amount', sa.Numeric(precision=12, scale=2), nullable=False, server_default="2500.00"),
        sa.Column(
            'threshold_type',
            postgresql.ENUM(
                'extreme_heat', 'heavy_rainfall', 'drought', 'low_temp',
                name='threshold_type_enum', create_type=False
            ),
            nullable=False,
        ),
        sa.Column('threshold_value', sa.Numeric(precision=8, scale=2), nullable=False),
        sa.Column(
            'status',
            postgresql.ENUM(
                'active', 'monitoring', 'triggered', 'paid', 'expired', 'cancelled',
                name='policy_status_enum', create_type=False
            ),
            nullable=False,
            server_default="active",
        ),
        sa.Column('coverage_start_date', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('coverage_end_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_insurance_policies_user_id'), 'insurance_policies', ['user_id'], unique=False)
    op.create_index(op.f('ix_insurance_policies_district'), 'insurance_policies', ['district'], unique=False)

    op.create_table(
        'weather_readings',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('district', sa.String(length=100), nullable=False),
        sa.Column('reading_date', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('temp_max', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('temp_min', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('precipitation_mm', sa.Numeric(precision=7, scale=2), nullable=True),
        sa.Column('humidity_pct', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('source', sa.String(length=50), nullable=False, server_default="open_meteo"),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_weather_readings_district'), 'weather_readings', ['district'], unique=False)
    op.create_index(op.f('ix_weather_readings_reading_date'), 'weather_readings', ['reading_date'], unique=False)

    op.create_table(
        'payout_events',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('policy_id', sa.UUID(), nullable=False),
        sa.Column('weather_reading_id', sa.UUID(), nullable=True),
        sa.Column('trigger_date', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('payout_amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('trigger_reason', sa.Text(), nullable=False),
        sa.Column(
            'status',
            postgresql.ENUM(
                'logged', 'simulated', 'paid',
                name='payout_status_enum', create_type=False
            ),
            nullable=False,
            server_default="simulated",
        ),
        sa.Column('notification_sent', sa.Boolean(), nullable=False, server_default="true"),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['policy_id'], ['insurance_policies.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['weather_reading_id'], ['weather_readings.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_payout_events_policy_id'), 'payout_events', ['policy_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_payout_events_policy_id'), table_name='payout_events')
    op.drop_table('payout_events')

    op.drop_index(op.f('ix_weather_readings_reading_date'), table_name='weather_readings')
    op.drop_index(op.f('ix_weather_readings_district'), table_name='weather_readings')
    op.drop_table('weather_readings')

    op.drop_index(op.f('ix_insurance_policies_district'), table_name='insurance_policies')
    op.drop_index(op.f('ix_insurance_policies_user_id'), table_name='insurance_policies')
    op.drop_table('insurance_policies')

    payout_status_enum.drop(op.get_bind(), checkfirst=True)
    threshold_type_enum.drop(op.get_bind(), checkfirst=True)
    policy_status_enum.drop(op.get_bind(), checkfirst=True)
