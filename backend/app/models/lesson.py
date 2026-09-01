"""
lesson.py — Financial Literacy models (Phase 8: Gamified Financial Literacy).

Models:
  - Lesson: metadata + locale key reference (no raw text stored)
  - Quiz: linked to Lesson, questions as structured JSON referencing locale keys
  - UserProgress: per-user lesson completion, quiz score, streak tracking
  - Badge: badge definitions with criteria JSON
  - UserBadge: join table tracking which badges a user has earned and when

Design decisions:
  - All display text is stored as locale KEY references (e.g. "literacy.lessons.credit_score.title"),
    not raw strings — actual copy lives in en.json/ur.json per Rules.md.
  - Quiz questions reference locale keys for question text and options — no hardcoded copy in DB.
  - Streak calculation is handled in literacy_engine.py using UTC date boundaries.
  - Badge award evaluation is idempotent: re-running never double-awards a badge.
  - UUIDs for all PKs, audit timestamps on every table, consistent with Phases 1-7.
"""

import uuid
import enum
from datetime import datetime, timezone

from sqlalchemy import (
    UUID,
    Boolean,
    Column,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship

from app.models.base import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class LessonCategory(str, enum.Enum):
    credit = "credit"
    savings = "savings"
    loans = "loans"
    insurance = "insurance"
    government = "government"
    fraud = "fraud"
    budgeting = "budgeting"
    committees = "committees"


class BadgeCriteriaType(str, enum.Enum):
    lessons_completed = "lessons_completed"   # Complete N total lessons
    streak_days = "streak_days"               # Maintain streak for N days
    quiz_perfect = "quiz_perfect"             # Score 100% on any quiz
    category_complete = "category_complete"   # Complete all lessons in a category
    first_lesson = "first_lesson"             # Complete very first lesson


class Lesson(Base):
    """
    A financial literacy lesson. Display text lives in locale files — this model
    stores only metadata and locale key references.
    """
    __tablename__ = "lessons"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    # Locale key prefix, e.g. "credit_score" → en.json["literacy"]["lessons"]["credit_score"]
    locale_key = Column(String(100), nullable=False, unique=True)
    sequence_order = Column(Integer, nullable=False)          # Display order, 1-indexed
    category = Column(
        SAEnum(LessonCategory, name="lesson_category_enum"),
        nullable=False,
    )
    estimated_minutes = Column(Integer, nullable=False, default=5)
    card_count = Column(Integer, nullable=False, default=5)   # Number of content cards
    # Optional prerequisite lesson (must complete this lesson first)
    prerequisite_lesson_id = Column(
        UUID(as_uuid=True),
        ForeignKey("lessons.id", ondelete="SET NULL"),
        nullable=True,
    )
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False)

    quiz = relationship("Quiz", back_populates="lesson", uselist=False, cascade="all, delete-orphan")
    user_progress = relationship("UserProgress", back_populates="lesson", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Lesson locale_key={self.locale_key} order={self.sequence_order}>"


class Quiz(Base):
    """
    Quiz linked 1-to-1 to a Lesson.
    Questions are stored as JSON array of objects with locale key references:
      [
        {
          "q_key": "q1",          <- maps to literacy.lessons.{locale_key}.quiz.q1
          "options_count": 4,     <- how many options
          "correct_index": 2,     <- 0-based correct answer index
          "explanation_key": "q1_explanation"  <- maps to literacy.lessons.{locale_key}.quiz.q1_explanation
        },
        ...
      ]
    """
    __tablename__ = "quizzes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    lesson_id = Column(
        UUID(as_uuid=True),
        ForeignKey("lessons.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    questions_json = Column(JSON, nullable=False)   # Array of question metadata objects
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    lesson = relationship("Lesson", back_populates="quiz")

    def __repr__(self) -> str:
        return f"<Quiz lesson_id={self.lesson_id}>"


class UserProgress(Base):
    """
    Per-user, per-lesson completion record. One row per (user, lesson) pair.
    Streak and last_activity_date are stored here for the canonical record;
    literacy_engine.py computes the overall streak from the latest entry.
    """
    __tablename__ = "user_progress"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    lesson_id = Column(
        UUID(as_uuid=True),
        ForeignKey("lessons.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    lesson_completed = Column(Boolean, default=False, nullable=False)
    quiz_score = Column(Numeric(5, 2), nullable=True)    # Score 0-100, null if quiz not taken
    quiz_attempts = Column(Integer, default=0, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)  # When lesson was marked complete
    # Stored as UTC date string "YYYY-MM-DD" — engine computes streak from these dates
    last_activity_date = Column(String(10), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False)

    user = relationship("User")
    lesson = relationship("Lesson", back_populates="user_progress")

    def __repr__(self) -> str:
        return f"<UserProgress user_id={self.user_id} lesson={self.lesson_id} done={self.lesson_completed}>"


class Badge(Base):
    """
    Badge definition. Criteria stored as JSON:
      { "type": "lessons_completed", "threshold": 3 }
      { "type": "streak_days", "threshold": 7 }
      { "type": "quiz_perfect" }
      { "type": "category_complete", "category": "credit" }
      { "type": "first_lesson" }
    """
    __tablename__ = "badges"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    badge_key = Column(String(100), nullable=False, unique=True)   # locale key ref
    icon_ref = Column(String(100), nullable=False)                  # icon name in Icons map
    criteria_json = Column(JSON, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    user_badges = relationship("UserBadge", back_populates="badge", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Badge badge_key={self.badge_key}>"


class UserBadge(Base):
    """
    Join table: which badges a user has earned and when.
    Unique on (user_id, badge_id) — idempotent: earning twice is blocked at DB level.
    """
    __tablename__ = "user_badges"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    badge_id = Column(
        UUID(as_uuid=True),
        ForeignKey("badges.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    earned_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    user = relationship("User")
    badge = relationship("Badge", back_populates="user_badges")

    def __repr__(self) -> str:
        return f"<UserBadge user_id={self.user_id} badge={self.badge_id}>"
