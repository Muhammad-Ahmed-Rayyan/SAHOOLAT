"""
literacy_engine.py — Rule-based gamification engine (Phase 8: Gamified Financial Literacy).

Design decisions:
  - Pure rule-based logic: no ML, no black-box scoring per Rules.md.
  - Streak calculation uses UTC date strings ("YYYY-MM-DD") to avoid timezone edge cases.
    A "day" is a UTC calendar day. Two completions on consecutive UTC dates = streak +1.
    Same-day completions don't double-increment the streak.
  - Badge evaluation is idempotent: checking criteria and awarding badges is safe to re-run;
    the UserBadge unique constraint prevents double-awarding at DB level.
  - All badge criteria types: first_lesson, lessons_completed, quiz_perfect,
    category_complete, streak_days.
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional, Tuple
from decimal import Decimal

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.lesson import Lesson, Quiz, UserProgress, Badge, UserBadge, LessonCategory
from app.models.user import User

logger = logging.getLogger(__name__)

# ── Streak helpers ─────────────────────────────────────────────────────────────

def _utc_date_str(dt: Optional[datetime] = None) -> str:
    """Returns a UTC date string 'YYYY-MM-DD' for the given datetime, or now."""
    if dt is None:
        dt = datetime.now(timezone.utc)
    # Ensure timezone-aware
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.strftime("%Y-%m-%d")


def _compute_current_streak(db: Session, user_id: str) -> int:
    """
    Computes the current consecutive-day activity streak for a user.
    Looks at all distinct last_activity_date values across user_progress rows.
    Counts backward from today (UTC): how many consecutive days have at least one activity?

    Example: activities on [2026-09-01, 2026-08-31, 2026-08-30] → streak = 3
    Gaps break the streak.
    """
    progress_rows = (
        db.query(UserProgress.last_activity_date)
        .filter(
            UserProgress.user_id == user_id,
            UserProgress.last_activity_date.isnot(None),
        )
        .all()
    )

    # Collect unique dates
    active_dates = set(row.last_activity_date for row in progress_rows if row.last_activity_date)
    if not active_dates:
        return 0

    today_str = _utc_date_str()
    yesterday_str = _utc_date_str(datetime.now(timezone.utc) - timedelta(days=1))

    # Streak must include today or yesterday (if user has activity within last 2 days)
    if today_str not in active_dates and yesterday_str not in active_dates:
        return 0

    # Count backward from today
    streak = 0
    check_date = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    while _utc_date_str(check_date) in active_dates:
        streak += 1
        check_date -= timedelta(days=1)

    return streak


def _compute_longest_streak(db: Session, user_id: str) -> int:
    """
    Computes the all-time longest streak for a user across their activity dates.
    """
    progress_rows = (
        db.query(UserProgress.last_activity_date)
        .filter(
            UserProgress.user_id == user_id,
            UserProgress.last_activity_date.isnot(None),
        )
        .all()
    )

    active_dates = sorted(set(row.last_activity_date for row in progress_rows if row.last_activity_date))
    if not active_dates:
        return 0

    longest = 1
    current = 1
    for i in range(1, len(active_dates)):
        prev = datetime.strptime(active_dates[i - 1], "%Y-%m-%d")
        curr = datetime.strptime(active_dates[i], "%Y-%m-%d")
        if (curr - prev).days == 1:
            current += 1
            longest = max(longest, current)
        else:
            current = 1

    return longest


# ── Core lesson/quiz logic ─────────────────────────────────────────────────────

def get_or_create_progress(db: Session, user_id: str, lesson_id: str) -> UserProgress:
    """Get existing progress row or create a new one."""
    progress = (
        db.query(UserProgress)
        .filter(UserProgress.user_id == user_id, UserProgress.lesson_id == lesson_id)
        .first()
    )
    if not progress:
        progress = UserProgress(
            user_id=user_id,
            lesson_id=lesson_id,
            lesson_completed=False,
            quiz_attempts=0,
        )
        db.add(progress)
        db.flush()
    return progress


def mark_lesson_complete(db: Session, user_id: str, lesson_id: str) -> Dict[str, Any]:
    """
    Mark a lesson as completed for the given user.
    Updates last_activity_date (UTC date string) for streak calculation.
    Returns updated progress summary.
    """
    progress = get_or_create_progress(db, user_id, lesson_id)
    today_str = _utc_date_str()
    now = datetime.now(timezone.utc)

    progress.lesson_completed = True
    progress.last_activity_date = today_str
    if not progress.completed_at:
        progress.completed_at = now
    progress.updated_at = now

    db.commit()
    db.refresh(progress)

    # Evaluate and award badges after completion
    newly_awarded = evaluate_and_award_badges(db, user_id)

    streak = _compute_current_streak(db, user_id)

    return {
        "lesson_id": str(lesson_id),
        "lesson_completed": True,
        "streak": streak,
        "newly_awarded_badges": [b.badge_key for b in newly_awarded],
    }


def submit_quiz(
    db: Session,
    user_id: str,
    lesson_id: str,
    quiz: Quiz,
    submitted_answers: List[int],
) -> Dict[str, Any]:
    """
    Evaluates submitted quiz answers against correct indices.
    Returns score, per-question results with explanation keys, and newly awarded badges.

    Args:
        submitted_answers: list of 0-based selected option indices, one per question.
    """
    questions = quiz.questions_json
    if len(submitted_answers) != len(questions):
        raise ValueError(
            f"Expected {len(questions)} answers, got {len(submitted_answers)}."
        )

    results = []
    correct_count = 0

    for i, (q, selected) in enumerate(zip(questions, submitted_answers)):
        is_correct = selected == q["correct_index"]
        if is_correct:
            correct_count += 1
        results.append({
            "q_key": q["q_key"],
            "selected_index": selected,
            "correct_index": q["correct_index"],
            "is_correct": is_correct,
            "explanation_key": q["explanation_key"],
        })

    score = round((correct_count / len(questions)) * 100, 2)
    today_str = _utc_date_str()
    now = datetime.now(timezone.utc)

    progress = get_or_create_progress(db, user_id, lesson_id)
    progress.quiz_score = Decimal(str(score))
    progress.quiz_attempts += 1
    progress.last_activity_date = today_str
    progress.updated_at = now

    db.commit()
    db.refresh(progress)

    newly_awarded = evaluate_and_award_badges(db, user_id)
    streak = _compute_current_streak(db, user_id)

    return {
        "score": score,
        "correct_count": correct_count,
        "total_questions": len(questions),
        "results": results,
        "streak": streak,
        "newly_awarded_badges": [b.badge_key for b in newly_awarded],
    }


# ── Badge engine ───────────────────────────────────────────────────────────────

def _already_earned(db: Session, user_id: str, badge_id: str) -> bool:
    return (
        db.query(UserBadge)
        .filter(UserBadge.user_id == user_id, UserBadge.badge_id == badge_id)
        .first()
    ) is not None


def evaluate_and_award_badges(db: Session, user_id: str) -> List[Badge]:
    """
    Checks all active badge criteria for the given user.
    Awards any badges not yet earned if criteria are met.
    Idempotent: safe to call multiple times — never double-awards (DB unique constraint + pre-check).

    Returns list of Badge objects newly awarded in this call.
    """
    badges = db.query(Badge).filter(Badge.is_active.is_(True)).all()
    newly_awarded: List[Badge] = []

    # Collect user stats once
    completed_lessons = (
        db.query(UserProgress)
        .filter(UserProgress.user_id == user_id, UserProgress.lesson_completed.is_(True))
        .all()
    )
    completed_count = len(completed_lessons)
    completed_lesson_ids = {str(p.lesson_id) for p in completed_lessons}

    # Check perfect quiz scores
    perfect_quiz_exists = any(
        p.quiz_score is not None and float(p.quiz_score) == 100.0
        for p in completed_lessons
    )

    # Current streak
    streak = _compute_current_streak(db, user_id)

    # Category completion check: get lesson IDs per category
    all_lessons = db.query(Lesson).filter(Lesson.is_active.is_(True)).all()
    lessons_by_category: Dict[str, List[str]] = {}
    for lesson in all_lessons:
        cat = lesson.category.value if hasattr(lesson.category, 'value') else lesson.category
        lessons_by_category.setdefault(cat, []).append(str(lesson.id))

    for badge in badges:
        if _already_earned(db, user_id, str(badge.id)):
            continue

        criteria = badge.criteria_json
        ctype = criteria.get("type")
        earned = False

        if ctype == "first_lesson":
            earned = completed_count >= 1

        elif ctype == "lessons_completed":
            threshold = criteria.get("threshold", 1)
            earned = completed_count >= threshold

        elif ctype == "quiz_perfect":
            earned = perfect_quiz_exists

        elif ctype == "streak_days":
            threshold = criteria.get("threshold", 7)
            earned = streak >= threshold

        elif ctype == "category_complete":
            target_cat = criteria.get("category")
            if target_cat and target_cat in lessons_by_category:
                cat_lesson_ids = set(lessons_by_category[target_cat])
                earned = cat_lesson_ids.issubset(completed_lesson_ids)

        if earned:
            try:
                user_badge = UserBadge(
                    user_id=user_id,
                    badge_id=str(badge.id),
                    earned_at=datetime.now(timezone.utc),
                )
                db.add(user_badge)
                db.flush()  # flush to catch UniqueConstraint violation early
                newly_awarded.append(badge)
                logger.info(f"Badge '{badge.badge_key}' awarded to user {user_id}")
            except IntegrityError:
                db.rollback()
                logger.info(f"Badge '{badge.badge_key}' already earned (race condition caught).")

    if newly_awarded:
        db.commit()

    return newly_awarded


# ── Progress summary ───────────────────────────────────────────────────────────

def get_user_progress_summary(db: Session, user_id: str) -> Dict[str, Any]:
    """
    Returns a full progress snapshot for the user:
    - Lessons completed count / total
    - Current streak and longest streak
    - Badges earned (with earned_at timestamps)
    """
    all_lessons = db.query(Lesson).filter(Lesson.is_active.is_(True)).all()
    total_lessons = len(all_lessons)

    progress_rows = (
        db.query(UserProgress)
        .filter(UserProgress.user_id == user_id)
        .all()
    )
    completed_count = sum(1 for p in progress_rows if p.lesson_completed)

    streak = _compute_current_streak(db, user_id)
    longest = _compute_longest_streak(db, user_id)

    user_badges = (
        db.query(UserBadge)
        .filter(UserBadge.user_id == user_id)
        .all()
    )
    earned_badge_keys = []
    for ub in user_badges:
        badge = db.query(Badge).filter(Badge.id == ub.badge_id).first()
        if badge:
            earned_badge_keys.append({
                "badge_key": badge.badge_key,
                "icon_ref": badge.icon_ref,
                "earned_at": ub.earned_at.isoformat(),
            })

    return {
        "total_lessons": total_lessons,
        "lessons_completed": completed_count,
        "current_streak": streak,
        "longest_streak": longest,
        "badges_earned": earned_badge_keys,
        "badges_count": len(earned_badge_keys),
    }
