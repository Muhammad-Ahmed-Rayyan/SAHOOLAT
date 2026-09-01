"""
subsidy_bot.py — Gov Subsidy & Scheme Eligibility Bot endpoints (Phase 7).

Design decisions:
- GET /subsidy-bot/questions: Returns dynamic question flow, pre-filling/skipping already captured profile data.
- POST /subsidy-bot/evaluate: Accepts answers, calls subsidy_rule_engine, returns structured eligibility result with explainability.
- GET /subsidy-bot/schemes/{scheme_id}: Returns scheme detail, application steps, and cited source.
- Follows standard error shape: { "error": true, "message": "...", "code": "..." }.
- Protected via get_current_user dependency.
"""

from typing import Any, Dict, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.gov_scheme import GovScheme
from app.models.user import User, UserProfile
from app.services.subsidy_rule_engine import evaluate_scheme_eligibility

router = APIRouter(prefix="/subsidy-bot", tags=["Gov Subsidy Bot"])


class EvaluateRequest(BaseModel):
    answers: Dict[str, Any] = Field(default_factory=dict)


@router.get("/questions", summary="Get eligibility survey question flow")
def get_survey_questions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns survey questions for government scheme eligibility evaluation.
    Pre-fills/adapts questions based on user's onboarding profile.
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()

    questions = []

    # 1. Landholding question (if farmer or default)
    is_farmer = profile and profile.occupation_type and profile.occupation_type.value == "farmer"
    questions.append({
        "id": "land_acres",
        "text": "How many acres of agricultural land do you own or cultivate?",
        "text_ur": "آپ کتنے ایکڑ زرعی زمین کے مالک یا کاشتکار ہیں؟",
        "type": "numeric",
        "default": 2.5 if is_farmer else 0.0,
        "min": 0.0,
        "max": 50.0,
        "icon": "leaf",
        "hint": "Relevant for Punjab Kissan Card eligibility (1.0 - 12.5 acres)",
        "hint_ur": "کسان کارڈ کی اہلیت کے لیے ضروری (1.0 - 12.5 ایکڑ)",
    })

    # 2. Monthly household income
    questions.append({
        "id": "monthly_income_pkr",
        "text": "What is your approximate household monthly income (PKR)?",
        "text_ur": "آپ کے خاندان کی ماہانہ آمدنی (روپے) کتنی ہے؟",
        "type": "select",
        "options": [
            {"value": 15000, "label": "Under Rs. 20,000 / month", "label_ur": "20,000 روپے ماہانہ سے کم"},
            {"value": 25000, "label": "Rs. 20,000 – 30,000 / month", "label_ur": "20,000 تا 30,000 روپے ماہانہ"},
            {"value": 45000, "label": "Above Rs. 30,000 / month", "label_ur": "30,000 روپے ماہانہ سے زیادہ"},
        ],
        "default": 20000,
        "icon": "cash",
        "hint": "Used for BISP Kafaalat targeting threshold",
        "hint_ur": "بینظیر کفالت کی اہلیت کے لیے استعمال ہوتا ہے",
    })

    # 3. Government employment status
    questions.append({
        "id": "is_govt_employee",
        "text": "Is anyone in your household a current or retired government employee?",
        "text_ur": "کیا خاندان کا کوئی فرد سرکاری ملازم یا پینشنر ہے؟",
        "type": "boolean",
        "default": False,
        "icon": "briefcase",
        "hint": "Government employees are excluded from BISP cash transfers",
        "hint_ur": "سرکاری ملازمین BISP سے مستثنیٰ ہیں",
    })

    # 4. Income tax filer status
    questions.append({
        "id": "is_tax_filer",
        "text": "Are you or a family member an active FBR income tax filer?",
        "text_ur": "کیا آپ FBR میں ایکٹیو انکم ٹیکس فائلر ہیں؟",
        "type": "boolean",
        "default": False,
        "icon": "document-text",
        "hint": "Active tax filers are excluded from BISP grants",
        "hint_ur": "ٹیکس فائلرز BISP کیش گرانٹ سے مستثنیٰ ہیں",
    })

    # 5. Vehicle ownership
    questions.append({
        "id": "owns_vehicle",
        "text": "Does your household own a personal motor vehicle (car/jeep)?",
        "text_ur": "کیا آپ کے خاندان کی ملکیت میں ذاتی گاڑی ہے؟",
        "type": "boolean",
        "default": False,
        "icon": "car",
    })

    # 6. Loan default status
    questions.append({
        "id": "has_loan_default",
        "text": "Do you have any active loan defaults registered in eCIB?",
        "text_ur": "کیا آپ پر کسی بینک کا ڈیفالٹ ریکارڈ موجود ہے؟",
        "type": "boolean",
        "default": False,
        "icon": "alert-circle",
    })

    return {
        "user_profile": {
            "name": profile.name if profile else None,
            "location": profile.location if profile else "Punjab",
            "occupation": profile.occupation_type.value if profile and profile.occupation_type else "other",
        },
        "questions": questions,
    }


@router.post("/evaluate", summary="Evaluate government scheme eligibility")
def evaluate_eligibility(
    body: EvaluateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Evaluates active government schemes against user profile and survey answers.
    Returns plain-language explainable passed/failed reasoning per scheme.
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()

    schemes = db.query(GovScheme).filter(GovScheme.is_active.is_(True)).all()
    if not schemes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": True,
                "message": "No active government schemes available for evaluation.",
                "code": "SCHEMES_NOT_FOUND",
            },
        )

    results = []
    eligible_count = 0

    for scheme in schemes:
        res = evaluate_scheme_eligibility(scheme, profile, body.answers)
        if res.status == "eligible":
            eligible_count += 1
        results.append(res.to_dict())

    # Sort results: eligible first, then partially eligible, then not eligible
    status_order = {"eligible": 0, "partially_eligible": 1, "not_eligible": 2}
    results.sort(key=lambda r: status_order.get(r["status"], 3))

    return {
        "total_evaluated": len(results),
        "eligible_count": eligible_count,
        "results": results,
    }


@router.get("/schemes/{scheme_id}", summary="Get government scheme detail")
def get_scheme_detail(
    scheme_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieves full detail, criteria, application steps, and official citation for a scheme.
    """
    scheme = db.query(GovScheme).filter(GovScheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": True,
                "message": f"Government scheme with ID '{scheme_id}' not found.",
                "code": "SCHEME_NOT_FOUND",
            },
        )

    return {
        "id": str(scheme.id),
        "code": scheme.code,
        "title": scheme.title,
        "title_ur": scheme.title_ur,
        "description": scheme.description,
        "description_ur": scheme.description_ur,
        "category": scheme.category,
        "provider": scheme.provider,
        "benefit_summary": scheme.benefit_summary,
        "benefit_summary_ur": scheme.benefit_summary_ur,
        "criteria_json": scheme.criteria_json,
        "application_steps": scheme.application_steps,
        "application_steps_ur": scheme.application_steps_ur,
        "official_portal_url": scheme.official_portal_url,
        "sms_service_code": scheme.sms_service_code,
        "source_citation": scheme.source_citation,
        "is_active": scheme.is_active,
    }
