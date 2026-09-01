"""
literacy.py — Gamified Financial Literacy API routes (Phase 8).

Endpoints (all scoped to get_current_user — confirmed):
  GET  /literacy/lessons                          — list all lessons with per-user completion status
  GET  /literacy/lessons/{lesson_id}              — lesson detail/content (locale keys)
  POST /literacy/lessons/{lesson_id}/complete     — mark complete
  GET  /literacy/lessons/{lesson_id}/quiz         — quiz questions for a lesson
  POST /literacy/lessons/{lesson_id}/quiz/submit  — submit answers, get score + explanation
  GET  /literacy/progress                         — overall progress: completed, streak, badges
  GET  /literacy/badges                           — all badges (earned + locked)

Error shape: { "error": true, "message": "...", "code": "..." } — confirmed on every path.
"""

from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.lesson import Lesson, Quiz, UserProgress, Badge, UserBadge
from app.models.user import User
from app.services.literacy_engine import (
    mark_lesson_complete,
    submit_quiz,
    get_user_progress_summary,
    get_or_create_progress,
)

router = APIRouter(prefix="/literacy", tags=["literacy"])


# ── Pydantic schemas ───────────────────────────────────────────────────────────

class LessonListItem(BaseModel):
    id: str
    locale_key: str
    sequence_order: int
    category: str
    estimated_minutes: int
    card_count: int
    prerequisite_lesson_id: Optional[str]
    is_completed: bool
    quiz_score: Optional[float]
    is_locked: bool


class LessonDetail(BaseModel):
    id: str
    locale_key: str
    sequence_order: int
    category: str
    estimated_minutes: int
    card_count: int
    prerequisite_lesson_id: Optional[str]
    is_completed: bool
    quiz_score: Optional[float]
    is_locked: bool


class QuizQuestion(BaseModel):
    q_key: str
    options_count: int
    explanation_key: str


class QuizOut(BaseModel):
    lesson_id: str
    quiz_id: str
    questions: List[QuizQuestion]


class QuizSubmitIn(BaseModel):
    answers: List[int] = Field(..., description="0-based selected option index per question")


class QuizResultQuestion(BaseModel):
    q_key: str
    selected_index: int
    correct_index: int
    is_correct: bool
    explanation_key: str


class QuizResultOut(BaseModel):
    score: float
    correct_count: int
    total_questions: int
    results: List[QuizResultQuestion]
    streak: int
    newly_awarded_badges: List[str]


class CompleteOut(BaseModel):
    lesson_id: str
    lesson_completed: bool
    streak: int
    newly_awarded_badges: List[str]


class BadgeOut(BaseModel):
    id: str
    badge_key: str
    icon_ref: str
    criteria_json: Dict[str, Any]
    earned: bool
    earned_at: Optional[str]


class ProgressOut(BaseModel):
    total_lessons: int
    lessons_completed: int
    current_streak: int
    longest_streak: int
    badges_earned: List[Dict[str, Any]]
    badges_count: int


# ── Helper ─────────────────────────────────────────────────────────────────────

def _build_lesson_item(
    lesson: Lesson,
    progress_map: Dict[str, UserProgress],
    completed_ids: set,
) -> LessonListItem:
    prog = progress_map.get(str(lesson.id))
    is_completed = prog.lesson_completed if prog else False
    quiz_score = float(prog.quiz_score) if prog and prog.quiz_score is not None else None
    prereq_id = str(lesson.prerequisite_lesson_id) if lesson.prerequisite_lesson_id else None
    is_locked = bool(prereq_id and prereq_id not in completed_ids)
    return LessonListItem(
        id=str(lesson.id),
        locale_key=lesson.locale_key,
        sequence_order=lesson.sequence_order,
        category=lesson.category.value if hasattr(lesson.category, 'value') else lesson.category,
        estimated_minutes=lesson.estimated_minutes,
        card_count=lesson.card_count,
        prerequisite_lesson_id=prereq_id,
        is_completed=is_completed,
        quiz_score=quiz_score,
        is_locked=is_locked,
    )


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.get("/lessons", response_model=List[LessonListItem], summary="List all lessons with completion status")
def list_lessons(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[LessonListItem]:
    lessons = (
        db.query(Lesson)
        .filter(Lesson.is_active.is_(True))
        .order_by(Lesson.sequence_order)
        .all()
    )
    progress_rows = db.query(UserProgress).filter(UserProgress.user_id == current_user.id).all()
    progress_map = {str(p.lesson_id): p for p in progress_rows}
    completed_ids = {str(p.lesson_id) for p in progress_rows if p.lesson_completed}
    return [_build_lesson_item(lesson, progress_map, completed_ids) for lesson in lessons]


@router.get("/lessons/{lesson_id}", response_model=LessonDetail, summary="Get lesson detail")
def get_lesson_detail(
    lesson_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LessonDetail:
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id, Lesson.is_active.is_(True)).first()
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": True, "message": "Lesson not found.", "code": "LESSON_NOT_FOUND"},
        )
    progress_rows = db.query(UserProgress).filter(UserProgress.user_id == current_user.id).all()
    progress_map = {str(p.lesson_id): p for p in progress_rows}
    completed_ids = {str(p.lesson_id) for p in progress_rows if p.lesson_completed}
    item = _build_lesson_item(lesson, progress_map, completed_ids)
    return LessonDetail(**item.model_dump())


@router.post(
    "/lessons/{lesson_id}/complete",
    response_model=CompleteOut,
    status_code=status.HTTP_200_OK,
    summary="Mark a lesson as complete",
)
def complete_lesson(
    lesson_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CompleteOut:
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id, Lesson.is_active.is_(True)).first()
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": True, "message": "Lesson not found.", "code": "LESSON_NOT_FOUND"},
        )
    result = mark_lesson_complete(db, str(current_user.id), str(lesson_id))
    return CompleteOut(**result)


@router.get("/lessons/{lesson_id}/quiz", response_model=QuizOut, summary="Get quiz questions for a lesson")
def get_lesson_quiz(
    lesson_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> QuizOut:
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id, Lesson.is_active.is_(True)).first()
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": True, "message": "Lesson not found.", "code": "LESSON_NOT_FOUND"},
        )
    quiz = db.query(Quiz).filter(Quiz.lesson_id == lesson_id).first()
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": True, "message": "No quiz found for this lesson.", "code": "QUIZ_NOT_FOUND"},
        )
    # Never expose correct_index to client
    questions = [
        QuizQuestion(q_key=q["q_key"], options_count=q["options_count"], explanation_key=q["explanation_key"])
        for q in quiz.questions_json
    ]
    return QuizOut(lesson_id=str(lesson_id), quiz_id=str(quiz.id), questions=questions)


@router.post(
    "/lessons/{lesson_id}/quiz/submit",
    response_model=QuizResultOut,
    summary="Submit quiz answers and get per-question explanations",
)
def submit_lesson_quiz(
    lesson_id: UUID,
    body: QuizSubmitIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> QuizResultOut:
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id, Lesson.is_active.is_(True)).first()
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": True, "message": "Lesson not found.", "code": "LESSON_NOT_FOUND"},
        )
    quiz = db.query(Quiz).filter(Quiz.lesson_id == lesson_id).first()
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": True, "message": "No quiz found for this lesson.", "code": "QUIZ_NOT_FOUND"},
        )
    if len(body.answers) != len(quiz.questions_json):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": True,
                "message": f"Expected {len(quiz.questions_json)} answers, got {len(body.answers)}.",
                "code": "ANSWERS_COUNT_MISMATCH",
            },
        )
    result = submit_quiz(db, str(current_user.id), str(lesson_id), quiz, body.answers)
    return QuizResultOut(**result)


@router.get("/progress", response_model=ProgressOut, summary="Get overall user learning progress")
def get_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProgressOut:
    summary = get_user_progress_summary(db, str(current_user.id))
    return ProgressOut(**summary)


@router.get("/badges", response_model=List[BadgeOut], summary="Get all badges (earned + locked)")
def list_badges(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[BadgeOut]:
    all_badges = db.query(Badge).filter(Badge.is_active.is_(True)).all()
    user_badge_rows = db.query(UserBadge).filter(UserBadge.user_id == current_user.id).all()
    earned_map = {str(ub.badge_id): ub.earned_at for ub in user_badge_rows}

    result = []
    for badge in all_badges:
        bid = str(badge.id)
        earned = bid in earned_map
        result.append(BadgeOut(
            id=bid,
            badge_key=badge.badge_key,
            icon_ref=badge.icon_ref,
            criteria_json=badge.criteria_json,
            earned=earned,
            earned_at=earned_map[bid].isoformat() if earned else None,
        ))
    return result
