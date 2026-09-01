"""
subsidy_rule_engine.py — Deterministic Rule-Based Government Scheme Evaluator (Phase 7).

Design decisions per PRD.md & Rules.md:
- Pure rule-based engine (no black-box machine learning models).
- Evaluates scheme eligibility using structured criteria against user profile + survey answers.
- Provides transparent passed/failed criteria breakdowns and plain-language English & Urdu explanations.
"""

from typing import Any, Dict, List, Optional
from app.models.gov_scheme import GovScheme
from app.models.user import UserProfile


class EvaluationResult:
    def __init__(
        self,
        scheme: GovScheme,
        status: str,  # "eligible", "partially_eligible", "not_eligible"
        match_score_pct: int,
        passed_criteria: List[str],
        passed_criteria_ur: List[str],
        failed_criteria: List[str],
        failed_criteria_ur: List[str],
        reason_summary: str,
        reason_summary_ur: str,
    ):
        self.scheme_id = str(scheme.id)
        self.scheme_code = scheme.code
        self.title = scheme.title
        self.title_ur = scheme.title_ur
        self.provider = scheme.provider
        self.benefit_summary = scheme.benefit_summary
        self.benefit_summary_ur = scheme.benefit_summary_ur
        self.status = status
        self.match_score_pct = match_score_pct
        self.passed_criteria = passed_criteria
        self.passed_criteria_ur = passed_criteria_ur
        self.failed_criteria = failed_criteria
        self.failed_criteria_ur = failed_criteria_ur
        self.reason_summary = reason_summary
        self.reason_summary_ur = reason_summary_ur
        self.official_portal_url = scheme.official_portal_url
        self.sms_service_code = scheme.sms_service_code
        self.source_citation = scheme.source_citation
        self.application_steps = scheme.application_steps
        self.application_steps_ur = scheme.application_steps_ur

    def to_dict(self) -> Dict[str, Any]:
        return {
            "scheme_id": self.scheme_id,
            "scheme_code": self.scheme_code,
            "title": self.title,
            "title_ur": self.title_ur,
            "provider": self.provider,
            "benefit_summary": self.benefit_summary,
            "benefit_summary_ur": self.benefit_summary_ur,
            "status": self.status,
            "match_score_pct": self.match_score_pct,
            "passed_criteria": self.passed_criteria,
            "passed_criteria_ur": self.passed_criteria_ur,
            "failed_criteria": self.failed_criteria,
            "failed_criteria_ur": self.failed_criteria_ur,
            "reason_summary": self.reason_summary,
            "reason_summary_ur": self.reason_summary_ur,
            "official_portal_url": self.official_portal_url,
            "sms_service_code": self.sms_service_code,
            "source_citation": self.source_citation,
            "application_steps": self.application_steps,
            "application_steps_ur": self.application_steps_ur,
        }


def evaluate_scheme_eligibility(
    scheme: GovScheme,
    profile: Optional[UserProfile],
    answers: Dict[str, Any],
) -> EvaluationResult:
    """
    Evaluates a single GovScheme against user profile and survey answers.
    """
    code = scheme.code
    passed_en: List[str] = []
    passed_ur: List[str] = []
    failed_en: List[str] = []
    failed_ur: List[str] = []

    # Extract combined parameters
    occupation = (profile.occupation_type.value if profile and profile.occupation_type else answers.get("occupation", "other"))
    location = (profile.location if profile and profile.location else answers.get("location", "Punjab"))
    
    monthly_income = float(answers.get("monthly_income_pkr", 20000))
    land_acres = float(answers.get("land_acres", 2.5 if occupation == "farmer" else 0.0))
    is_govt_employee = bool(answers.get("is_govt_employee", False))
    is_tax_filer = bool(answers.get("is_tax_filer", False))
    owns_vehicle = bool(answers.get("owns_vehicle", False))
    has_loan_default = bool(answers.get("has_loan_default", False))
    age = int(answers.get("age", 30))

    if code == "kissan_card":
        # 1. Occupation check
        if occupation == "farmer":
            passed_en.append("Registered as an active agricultural farmer.")
            passed_ur.append("زرعی کسان کے طور پر رجسٹرڈ ہیں۔")
        else:
            failed_en.append("Applicant occupation is not registered as a farmer.")
            failed_ur.append("درخواست دہندہ پیشے کے لحاظ سے کسان کے طور پر رجسٹرڈ نہیں ہے۔")

        # 2. Location check
        is_punjab = "punjab" in location.lower() or location.strip() in ["Multan", "Faisalabad", "Lahore", "Sahiwal", "Rahim Yar Khan", "Bahawalpur", "Sargodha", "Punjab"]
        if is_punjab:
            passed_en.append("Resident / land owner in Punjab province.")
            passed_ur.append("صوبہ پنجاب کے رہائشی / زمیندار ہیں۔")
        else:
            failed_en.append("Kissan Card is currently limited to Punjab province.")
            failed_ur.append("کسان کارڈ فی الحال صرف صوبہ پنجاب کے لیے ہے۔")

        # 3. Landholding check (1 to 12.5 acres)
        if 1.0 <= land_acres <= 12.5:
            passed_en.append(f"Land holding of {land_acres} acres meets the 1.0–12.5 acre PLRA limit.")
            passed_ur.append(f"{land_acres} ایکڑ زمین 1.0 سے 12.5 ایکڑ کی حد پر پورا اترتی ہے۔")
        elif land_acres > 12.5:
            failed_en.append(f"Land holding ({land_acres} acres) exceeds maximum limit of 12.5 acres.")
            failed_ur.append(f"زمین کی ملکیت ({land_acres} ایکڑ) 12.5 ایکڑ کی زیادہ سے زیادہ حد سے زیادہ ہے۔")
        else:
            failed_en.append(f"Land holding ({land_acres} acres) is below minimum requirement of 1.0 acre.")
            failed_ur.append(f"زمین کی ملکیت ({land_acres} ایکڑ) کم از کم 1.0 ایکڑ سے کم ہے۔")

        # 4. Bank default check
        if not has_loan_default:
            passed_en.append("No active eCIB bank loan defaults detected.")
            passed_ur.append("بینک ڈیفالٹ کا کوئی ریکارڈ موجود نہیں ہے۔")
        else:
            failed_en.append("Active bank loan default recorded in eCIB.")
            failed_ur.append("ای سی آئی بی میں بینک ڈیفالٹ کا ریکارڈ ملا ہے۔")

        total = 4
        score = int((len(passed_en) / total) * 100)
        if score == 100:
            status = "eligible"
            reason_en = "Fully eligible! Your profile meets all PLRA land size, location, and non-defaulter requirements for Punjab Kissan Card."
            reason_ur = "مکمل طور پر اہل! آپ کی معلومات کسان کارڈ کی تمام شرائط پر پورا اترتی ہیں۔"
        elif score >= 50:
            status = "partially_eligible"
            reason_en = "Partially eligible. You meet several criteria, but some land record or regional checks require PLRA verification."
            reason_ur = "جزوی طور پر اہل۔ کچھ شرائط پوری ہیں لیکن زمینی ریکارڈ کی تصدیق درکار ہے۔"
        else:
            status = "not_eligible"
            reason_en = "Not eligible. Punjab Kissan Card requires active farming status and land registration between 1 and 12.5 acres."
            reason_ur = "نااہل۔ کسان کارڈ کے لیے پنجاب میں 1 سے 12.5 ایکڑ زمین کی رجسٹریشن ضروری ہے۔"

    elif code == "bisp_kafaalat":
        # 1. Income check (<= 25,000 PKR)
        if monthly_income <= 25000:
            passed_en.append(f"Monthly household income (Rs. {int(monthly_income):,}) is within targeted assistance threshold (<= Rs. 25,000).")
            passed_ur.append(f"ماہانہ آمدنی ({int(monthly_income):,} روپے) حد کے اندر ہے۔")
        else:
            failed_en.append(f"Monthly household income (Rs. {int(monthly_income):,}) exceeds PMT poverty targeting threshold.")
            failed_ur.append(f"ماہانہ آمدنی ({int(monthly_income):,} روپے) مقررہ حد سے زیادہ ہے۔")

        # 2. Govt employee check
        if not is_govt_employee:
            passed_en.append("No household member is a government employee.")
            passed_ur.append("خاندان کا کوئی رکن سرکاری ملازم نہیں ہے۔")
        else:
            failed_en.append("Household with government employee is excluded from BISP Kafaalat.")
            failed_ur.append("سرکاری ملازمین کے خاندان BISP سے مستثنیٰ ہیں۔")

        # 3. Tax filer check
        if not is_tax_filer:
            passed_en.append("Applicant is an unregistered / non-filer for income tax.")
            passed_ur.append("درخواست دہندہ انکم ٹیکس فائلر نہیں ہے۔")
        else:
            failed_en.append("Active tax filers are excluded from BISP cash transfers.")
            failed_ur.append("ایکٹیو ٹیکس فائلرز BISP پروگرام کے لیے نااہل ہیں۔")

        # 4. Vehicle ownership check
        if not owns_vehicle:
            passed_en.append("No registered personal motor vehicle owned.")
            passed_ur.append("ذاتی گاڑی کی کوئی ملکیت درج نہیں ہے۔")
        else:
            failed_en.append("Owners of registered personal motor vehicles are excluded.")
            failed_ur.append("ذاتی گاڑی کے مالکان اس پروگرام کے لیے نااہل ہیں۔")

        total = 4
        score = int((len(passed_en) / total) * 100)
        if score == 100:
            status = "eligible"
            reason_en = "Fully eligible! Your household meets income, employment, and asset targeting rules for BISP Benazir Kafaalat."
            reason_ur = "مکمل طور پر اہل! آپ کا خاندان بینظیر کفالت پروگرام کی تمام شرائط پر پورا اترتا ہے۔"
        elif score >= 50:
            status = "partially_eligible"
            reason_en = "Partially eligible. You meet basic income criteria, but require NSER survey dynamic registration at your Tehsil office."
            reason_ur = "جزوی طور پر اہل۔ تحصیل NSER سنٹر سے سروے تصدیق درکار ہے۔"
        else:
            status = "not_eligible"
            reason_en = "Not eligible. BISP targets lower-income households and excludes government workers and tax filers."
            reason_ur = "نااہل۔ BISP پروگرام صرف کم آمدنی والے خاندانوں کے لیے ہے۔"

    else:  # pm_youth_loan
        # 1. Age check (18 - 45)
        if 18 <= age <= 45:
            passed_en.append(f"Age ({age} years) falls within the required 18–45 years eligibility range.")
            passed_ur.append(f"عمر ({age} سال) 18 سے 45 سال کی حد کے اندر ہے۔")
        else:
            failed_en.append(f"Age ({age} years) is outside the 18–45 years youth eligibility bracket.")
            failed_ur.append(f"عمر ({age} سال) 18 سے 45 سال کی حد سے باہر ہے۔")

        # 2. Bank default check
        if not has_loan_default:
            passed_en.append("Clean credit history without bank loan defaults.")
            passed_ur.append("کریڈٹ ہسٹری پر کوئی ڈیفالٹ نہیں ہے۔")
        else:
            failed_en.append("Active bank loan default recorded.")
            failed_ur.append("بینک ڈیفالٹ کا ریکارڈ موجود ہے۔")

        total = 2
        score = int((len(passed_en) / total) * 100)
        if score == 100:
            status = "eligible"
            reason_en = "Fully eligible! You qualify for Tier-1 interest-free financing up to Rs. 500,000 under PM's Youth Programme."
            reason_ur = "مکمل طور پر اہل! آپ 500,000 روپے تک بلا سود قرضہ حاصل کر سکتے ہیں۔"
        else:
            status = "not_eligible"
            reason_en = "Not eligible due to age restriction or active bank default."
            reason_ur = "عمر کی حد یا ڈیفالٹ کی وجہ سے نااہل۔"

    return EvaluationResult(
        scheme=scheme,
        status=status,
        match_score_pct=score,
        passed_criteria=passed_en,
        passed_criteria_ur=passed_ur,
        failed_criteria=failed_en,
        failed_criteria_ur=failed_ur,
        reason_summary=reason_en,
        reason_summary_ur=reason_ur,
    )
