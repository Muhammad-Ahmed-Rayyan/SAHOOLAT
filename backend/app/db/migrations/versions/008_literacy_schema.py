"""008_literacy_schema

Revision ID: 008_literacy_schema
Revises: 007_gov_scheme_schema
Create Date: 2026-09-01

Seeds:
  - 10 financial literacy lessons (locale-key referenced, no raw text)
  - 10 quizzes (one per lesson, 3-5 questions each, locale-key referenced)
  - 7 badges with rule-based criteria
"""
import uuid
from datetime import datetime, timezone
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '008_literacy_schema'
down_revision = '007_gov_scheme_schema'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── 1. Create lessons table ───────────────────────────────────────────────
    op.create_table(
        'lessons',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('locale_key', sa.String(100), nullable=False, unique=True),
        sa.Column('sequence_order', sa.Integer(), nullable=False),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('estimated_minutes', sa.Integer(), nullable=False, server_default='5'),
        sa.Column('card_count', sa.Integer(), nullable=False, server_default='5'),
        sa.Column('prerequisite_lesson_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_lessons_sequence_order', 'lessons', ['sequence_order'], unique=False)
    op.create_index('ix_lessons_category', 'lessons', ['category'], unique=False)

    # ── 2. Create quizzes table ───────────────────────────────────────────────
    op.create_table(
        'quizzes',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('lesson_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('lessons.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('questions_json', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_quizzes_lesson_id', 'quizzes', ['lesson_id'], unique=True)

    # ── 3. Create user_progress table ─────────────────────────────────────────
    op.create_table(
        'user_progress',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('lesson_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('lessons.id', ondelete='CASCADE'), nullable=False),
        sa.Column('lesson_completed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('quiz_score', sa.Numeric(5, 2), nullable=True),
        sa.Column('quiz_attempts', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_activity_date', sa.String(10), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint('user_id', 'lesson_id', name='uq_user_progress_user_lesson'),
    )
    op.create_index('ix_user_progress_user_id', 'user_progress', ['user_id'], unique=False)

    # ── 4. Create badges table ────────────────────────────────────────────────
    op.create_table(
        'badges',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('badge_key', sa.String(100), nullable=False, unique=True),
        sa.Column('icon_ref', sa.String(100), nullable=False),
        sa.Column('criteria_json', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    # ── 5. Create user_badges join table ──────────────────────────────────────
    op.create_table(
        'user_badges',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('badge_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('badges.id', ondelete='CASCADE'), nullable=False),
        sa.Column('earned_at', sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint('user_id', 'badge_id', name='uq_user_badges_user_badge'),
    )
    op.create_index('ix_user_badges_user_id', 'user_badges', ['user_id'], unique=False)

    # ── 6. Seed lesson and quiz data ──────────────────────────────────────────
    lessons_table = sa.table(
        'lessons',
        sa.column('id', postgresql.UUID(as_uuid=True)),
        sa.column('locale_key', sa.String),
        sa.column('sequence_order', sa.Integer),
        sa.column('category', sa.String),
        sa.column('estimated_minutes', sa.Integer),
        sa.column('card_count', sa.Integer),
        sa.column('prerequisite_lesson_id', postgresql.UUID(as_uuid=True)),
        sa.column('is_active', sa.Boolean),
        sa.column('created_at', sa.DateTime(timezone=True)),
        sa.column('updated_at', sa.DateTime(timezone=True)),
    )
    quizzes_table = sa.table(
        'quizzes',
        sa.column('id', postgresql.UUID(as_uuid=True)),
        sa.column('lesson_id', postgresql.UUID(as_uuid=True)),
        sa.column('questions_json', postgresql.JSON),
        sa.column('created_at', sa.DateTime(timezone=True)),
    )
    badges_table = sa.table(
        'badges',
        sa.column('id', postgresql.UUID(as_uuid=True)),
        sa.column('badge_key', sa.String),
        sa.column('icon_ref', sa.String),
        sa.column('criteria_json', postgresql.JSON),
        sa.column('is_active', sa.Boolean),
        sa.column('created_at', sa.DateTime(timezone=True)),
    )

    now = datetime.now(timezone.utc)

    # Define lesson UUIDs so we can reference them in quizzes + prerequisites
    lesson_ids = {
        'credit_score': str(uuid.uuid4()),
        'committees': str(uuid.uuid4()),
        'saving_regularly': str(uuid.uuid4()),
        'microloans': str(uuid.uuid4()),
        'crop_insurance': str(uuid.uuid4()),
        'govt_schemes': str(uuid.uuid4()),
        'fraud_awareness': str(uuid.uuid4()),
        'budgeting_irregular': str(uuid.uuid4()),
        'digital_banking': str(uuid.uuid4()),
        'family_financial_goals': str(uuid.uuid4()),
    }

    op.bulk_insert(lessons_table, [
        # 1. What is a Credit Score?
        {
            'id': lesson_ids['credit_score'],
            'locale_key': 'credit_score',
            'sequence_order': 1,
            'category': 'credit',
            'estimated_minutes': 5,
            'card_count': 5,
            'prerequisite_lesson_id': None,
            'is_active': True,
            'created_at': now,
            'updated_at': now,
        },
        # 2. How Committees (BC/ROSCA) Work
        {
            'id': lesson_ids['committees'],
            'locale_key': 'committees',
            'sequence_order': 2,
            'category': 'committees',
            'estimated_minutes': 6,
            'card_count': 6,
            'prerequisite_lesson_id': None,
            'is_active': True,
            'created_at': now,
            'updated_at': now,
        },
        # 3. The Power of Saving Regularly
        {
            'id': lesson_ids['saving_regularly'],
            'locale_key': 'saving_regularly',
            'sequence_order': 3,
            'category': 'savings',
            'estimated_minutes': 4,
            'card_count': 4,
            'prerequisite_lesson_id': None,
            'is_active': True,
            'created_at': now,
            'updated_at': now,
        },
        # 4. How Microloans Work
        {
            'id': lesson_ids['microloans'],
            'locale_key': 'microloans',
            'sequence_order': 4,
            'category': 'loans',
            'estimated_minutes': 6,
            'card_count': 6,
            'prerequisite_lesson_id': lesson_ids['credit_score'],  # understand credit first
            'is_active': True,
            'created_at': now,
            'updated_at': now,
        },
        # 5. Parametric Crop Insurance
        {
            'id': lesson_ids['crop_insurance'],
            'locale_key': 'crop_insurance',
            'sequence_order': 5,
            'category': 'insurance',
            'estimated_minutes': 5,
            'card_count': 5,
            'prerequisite_lesson_id': None,
            'is_active': True,
            'created_at': now,
            'updated_at': now,
        },
        # 6. Check Your BISP / Kissan Card Eligibility
        {
            'id': lesson_ids['govt_schemes'],
            'locale_key': 'govt_schemes',
            'sequence_order': 6,
            'category': 'government',
            'estimated_minutes': 5,
            'card_count': 5,
            'prerequisite_lesson_id': None,
            'is_active': True,
            'created_at': now,
            'updated_at': now,
        },
        # 7. Recognizing Financial Fraud & Scams
        {
            'id': lesson_ids['fraud_awareness'],
            'locale_key': 'fraud_awareness',
            'sequence_order': 7,
            'category': 'fraud',
            'estimated_minutes': 5,
            'card_count': 5,
            'prerequisite_lesson_id': None,
            'is_active': True,
            'created_at': now,
            'updated_at': now,
        },
        # 8. Budgeting on Irregular Income
        {
            'id': lesson_ids['budgeting_irregular'],
            'locale_key': 'budgeting_irregular',
            'sequence_order': 8,
            'category': 'budgeting',
            'estimated_minutes': 6,
            'card_count': 6,
            'prerequisite_lesson_id': lesson_ids['saving_regularly'],
            'is_active': True,
            'created_at': now,
            'updated_at': now,
        },
        # 9. Getting Started with Digital Banking
        {
            'id': lesson_ids['digital_banking'],
            'locale_key': 'digital_banking',
            'sequence_order': 9,
            'category': 'savings',
            'estimated_minutes': 5,
            'card_count': 5,
            'prerequisite_lesson_id': None,
            'is_active': True,
            'created_at': now,
            'updated_at': now,
        },
        # 10. Setting Family Financial Goals
        {
            'id': lesson_ids['family_financial_goals'],
            'locale_key': 'family_financial_goals',
            'sequence_order': 10,
            'category': 'budgeting',
            'estimated_minutes': 5,
            'card_count': 5,
            'prerequisite_lesson_id': lesson_ids['budgeting_irregular'],
            'is_active': True,
            'created_at': now,
            'updated_at': now,
        },
    ])

    # Seed quizzes — questions reference locale keys, correct_index is 0-based
    op.bulk_insert(quizzes_table, [
        # Quiz 1: Credit Score
        {
            'id': str(uuid.uuid4()),
            'lesson_id': lesson_ids['credit_score'],
            'questions_json': [
                {'q_key': 'q1', 'options_count': 4, 'correct_index': 1, 'explanation_key': 'q1_exp'},
                {'q_key': 'q2', 'options_count': 4, 'correct_index': 2, 'explanation_key': 'q2_exp'},
                {'q_key': 'q3', 'options_count': 3, 'correct_index': 0, 'explanation_key': 'q3_exp'},
                {'q_key': 'q4', 'options_count': 4, 'correct_index': 3, 'explanation_key': 'q4_exp'},
            ],
            'created_at': now,
        },
        # Quiz 2: Committees
        {
            'id': str(uuid.uuid4()),
            'lesson_id': lesson_ids['committees'],
            'questions_json': [
                {'q_key': 'q1', 'options_count': 4, 'correct_index': 2, 'explanation_key': 'q1_exp'},
                {'q_key': 'q2', 'options_count': 4, 'correct_index': 0, 'explanation_key': 'q2_exp'},
                {'q_key': 'q3', 'options_count': 3, 'correct_index': 1, 'explanation_key': 'q3_exp'},
                {'q_key': 'q4', 'options_count': 4, 'correct_index': 2, 'explanation_key': 'q4_exp'},
            ],
            'created_at': now,
        },
        # Quiz 3: Saving Regularly
        {
            'id': str(uuid.uuid4()),
            'lesson_id': lesson_ids['saving_regularly'],
            'questions_json': [
                {'q_key': 'q1', 'options_count': 3, 'correct_index': 1, 'explanation_key': 'q1_exp'},
                {'q_key': 'q2', 'options_count': 4, 'correct_index': 0, 'explanation_key': 'q2_exp'},
                {'q_key': 'q3', 'options_count': 3, 'correct_index': 2, 'explanation_key': 'q3_exp'},
            ],
            'created_at': now,
        },
        # Quiz 4: Microloans
        {
            'id': str(uuid.uuid4()),
            'lesson_id': lesson_ids['microloans'],
            'questions_json': [
                {'q_key': 'q1', 'options_count': 4, 'correct_index': 2, 'explanation_key': 'q1_exp'},
                {'q_key': 'q2', 'options_count': 4, 'correct_index': 1, 'explanation_key': 'q2_exp'},
                {'q_key': 'q3', 'options_count': 3, 'correct_index': 0, 'explanation_key': 'q3_exp'},
                {'q_key': 'q4', 'options_count': 4, 'correct_index': 3, 'explanation_key': 'q4_exp'},
                {'q_key': 'q5', 'options_count': 4, 'correct_index': 1, 'explanation_key': 'q5_exp'},
            ],
            'created_at': now,
        },
        # Quiz 5: Crop Insurance
        {
            'id': str(uuid.uuid4()),
            'lesson_id': lesson_ids['crop_insurance'],
            'questions_json': [
                {'q_key': 'q1', 'options_count': 4, 'correct_index': 2, 'explanation_key': 'q1_exp'},
                {'q_key': 'q2', 'options_count': 3, 'correct_index': 1, 'explanation_key': 'q2_exp'},
                {'q_key': 'q3', 'options_count': 4, 'correct_index': 0, 'explanation_key': 'q3_exp'},
                {'q_key': 'q4', 'options_count': 4, 'correct_index': 3, 'explanation_key': 'q4_exp'},
            ],
            'created_at': now,
        },
        # Quiz 6: Govt Schemes
        {
            'id': str(uuid.uuid4()),
            'lesson_id': lesson_ids['govt_schemes'],
            'questions_json': [
                {'q_key': 'q1', 'options_count': 4, 'correct_index': 1, 'explanation_key': 'q1_exp'},
                {'q_key': 'q2', 'options_count': 4, 'correct_index': 0, 'explanation_key': 'q2_exp'},
                {'q_key': 'q3', 'options_count': 3, 'correct_index': 2, 'explanation_key': 'q3_exp'},
                {'q_key': 'q4', 'options_count': 4, 'correct_index': 1, 'explanation_key': 'q4_exp'},
            ],
            'created_at': now,
        },
        # Quiz 7: Fraud Awareness
        {
            'id': str(uuid.uuid4()),
            'lesson_id': lesson_ids['fraud_awareness'],
            'questions_json': [
                {'q_key': 'q1', 'options_count': 4, 'correct_index': 3, 'explanation_key': 'q1_exp'},
                {'q_key': 'q2', 'options_count': 4, 'correct_index': 0, 'explanation_key': 'q2_exp'},
                {'q_key': 'q3', 'options_count': 3, 'correct_index': 1, 'explanation_key': 'q3_exp'},
                {'q_key': 'q4', 'options_count': 4, 'correct_index': 2, 'explanation_key': 'q4_exp'},
                {'q_key': 'q5', 'options_count': 4, 'correct_index': 0, 'explanation_key': 'q5_exp'},
            ],
            'created_at': now,
        },
        # Quiz 8: Budgeting on Irregular Income
        {
            'id': str(uuid.uuid4()),
            'lesson_id': lesson_ids['budgeting_irregular'],
            'questions_json': [
                {'q_key': 'q1', 'options_count': 4, 'correct_index': 1, 'explanation_key': 'q1_exp'},
                {'q_key': 'q2', 'options_count': 3, 'correct_index': 2, 'explanation_key': 'q2_exp'},
                {'q_key': 'q3', 'options_count': 4, 'correct_index': 0, 'explanation_key': 'q3_exp'},
                {'q_key': 'q4', 'options_count': 4, 'correct_index': 3, 'explanation_key': 'q4_exp'},
            ],
            'created_at': now,
        },
        # Quiz 9: Digital Banking
        {
            'id': str(uuid.uuid4()),
            'lesson_id': lesson_ids['digital_banking'],
            'questions_json': [
                {'q_key': 'q1', 'options_count': 4, 'correct_index': 2, 'explanation_key': 'q1_exp'},
                {'q_key': 'q2', 'options_count': 4, 'correct_index': 1, 'explanation_key': 'q2_exp'},
                {'q_key': 'q3', 'options_count': 3, 'correct_index': 0, 'explanation_key': 'q3_exp'},
            ],
            'created_at': now,
        },
        # Quiz 10: Family Financial Goals
        {
            'id': str(uuid.uuid4()),
            'lesson_id': lesson_ids['family_financial_goals'],
            'questions_json': [
                {'q_key': 'q1', 'options_count': 4, 'correct_index': 2, 'explanation_key': 'q1_exp'},
                {'q_key': 'q2', 'options_count': 4, 'correct_index': 0, 'explanation_key': 'q2_exp'},
                {'q_key': 'q3', 'options_count': 3, 'correct_index': 1, 'explanation_key': 'q3_exp'},
                {'q_key': 'q4', 'options_count': 4, 'correct_index': 3, 'explanation_key': 'q4_exp'},
            ],
            'created_at': now,
        },
    ])

    # Seed badges
    op.bulk_insert(badges_table, [
        {
            'id': str(uuid.uuid4()),
            'badge_key': 'first_step',
            'icon_ref': 'badgeFirstStep',
            'criteria_json': {'type': 'first_lesson'},
            'is_active': True,
            'created_at': now,
        },
        {
            'id': str(uuid.uuid4()),
            'badge_key': 'quick_learner',
            'icon_ref': 'badgeQuickLearner',
            'criteria_json': {'type': 'lessons_completed', 'threshold': 3},
            'is_active': True,
            'created_at': now,
        },
        {
            'id': str(uuid.uuid4()),
            'badge_key': 'halfway_there',
            'icon_ref': 'badgeHalfway',
            'criteria_json': {'type': 'lessons_completed', 'threshold': 5},
            'is_active': True,
            'created_at': now,
        },
        {
            'id': str(uuid.uuid4()),
            'badge_key': 'knowledge_master',
            'icon_ref': 'badgeMaster',
            'criteria_json': {'type': 'lessons_completed', 'threshold': 10},
            'is_active': True,
            'created_at': now,
        },
        {
            'id': str(uuid.uuid4()),
            'badge_key': 'perfect_score',
            'icon_ref': 'badgePerfect',
            'criteria_json': {'type': 'quiz_perfect'},
            'is_active': True,
            'created_at': now,
        },
        {
            'id': str(uuid.uuid4()),
            'badge_key': 'week_streak',
            'icon_ref': 'badgeStreak',
            'criteria_json': {'type': 'streak_days', 'threshold': 7},
            'is_active': True,
            'created_at': now,
        },
        {
            'id': str(uuid.uuid4()),
            'badge_key': 'fraud_fighter',
            'icon_ref': 'badgeFraud',
            'criteria_json': {'type': 'category_complete', 'category': 'fraud'},
            'is_active': True,
            'created_at': now,
        },
    ])


def downgrade() -> None:
    op.drop_table('user_badges')
    op.drop_table('badges')
    op.drop_index('ix_user_progress_user_id', table_name='user_progress')
    op.drop_table('user_progress')
    op.drop_index('ix_quizzes_lesson_id', table_name='quizzes')
    op.drop_table('quizzes')
    op.drop_index('ix_lessons_category', table_name='lessons')
    op.drop_index('ix_lessons_sequence_order', table_name='lessons')
    op.drop_table('lessons')
