"""
scoring_engine.py — Rule-based credit scoring engine (Phase 2).

DESIGN PRINCIPLE (Rules.md):
  No black-box ML. Every point in the score must trace back to a named factor
  with a documented weight and threshold. The factor_breakdown dict returned by
  calculate_score() is rendered directly in the UI so users can see exactly
  what drove their number.

SCORE RANGE: 0–100 (integer). Displayed as-is in the frontend.

FACTOR WEIGHTS (sum to 100 when all factors are fully satisfied):
  ┌─────────────────────────────────────┬────────┬──────────────────────────────────────────┐
  │ Factor                              │ Weight │ Logic                                    │
  ├─────────────────────────────────────┼────────┼──────────────────────────────────────────┤
  │ Land size (farmers only)            │   20   │ Scaled 0–20 by acreage (cap: 10 acres)   │
  │ Crop yield (farmers only)           │   15   │ Scaled 0–15 by maunds (cap: 50)          │
  │ Utility payment consistency         │   25   │ Linear: paid_months/total_months × 25    │
  │ Committee/savings participation     │   20   │ Binary: 20 if True, 0 if False           │
  │ Prior loan repayment                │   15   │ Binary: 15 if True, 0 if False           │
  │ Savings behaviour (from wallet)     │    5   │ Scaled 0–5 by avg_monthly_savings_pct    │
  └─────────────────────────────────────┴────────┴──────────────────────────────────────────┘

  For non-farmers: land and crop factors are excluded and the weights are redistributed:
  utility=35, committee=30, repayment=25, savings=10  (still sum to 100)

SCORE BANDS (used for plain-language label and colour coding in the UI):
  80–100: Excellent  (primary green)
  60–79:  Good       (sage green)
  40–59:  Fair       (mustard)
  20–39:  Low        (terracotta)
   0–19:  Very Low   (muted rust red)
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Optional

from app.models.credit_profile import CreditProfile


# ── Score band constants ─────────────────────────────────────────────────────

BAND_EXCELLENT = "excellent"
BAND_GOOD = "good"
BAND_FAIR = "fair"
BAND_LOW = "low"
BAND_VERY_LOW = "very_low"


def score_to_band(score: int) -> str:
    if score >= 80:
        return BAND_EXCELLENT
    if score >= 60:
        return BAND_GOOD
    if score >= 40:
        return BAND_FAIR
    if score >= 20:
        return BAND_LOW
    return BAND_VERY_LOW


# ── Factor weight tables ──────────────────────────────────────────────────────

# Weights used when the user is a farmer (has land/crop data)
_FARMER_WEIGHTS = {
    "land": 20,
    "crop": 15,
    "utility": 25,
    "committee": 20,
    "repayment": 15,
    "savings": 5,
}

# Weights redistributed for non-farmers (land/crop factors excluded)
_NON_FARMER_WEIGHTS = {
    "land": 0,
    "crop": 0,
    "utility": 35,
    "committee": 30,
    "repayment": 25,
    "savings": 10,
}

# Caps for continuous factors
_LAND_CAP_ACRES: float = 10.0
_CROP_CAP_MAUNDS: float = 50.0
_SAVINGS_CAP_PCT: float = 30.0   # 30% savings rate = full 5 pts (or 10 pts for non-farmer)


@dataclass
class ScoreResult:
    """
    Returned by calculate_score(). Contains everything needed to:
    - Store in CreditScoreHistory.score + factor_breakdown_json
    - Render the score screen (number, band, factors)
    """
    score: int
    band: str
    # factor_points: raw points earned per factor (for the bar chart / breakdown list)
    factor_points: dict[str, float] = field(default_factory=dict)
    # factor_max: maximum possible points per factor (for the UI to show "X of Y")
    factor_max: dict[str, float] = field(default_factory=dict)
    # is_farmer: used by the frontend to decide whether to show land/crop fields
    is_farmer: bool = False

    def to_json(self) -> str:
        """Serialise factor_points to string for DB storage."""
        return json.dumps(self.factor_points)

    @staticmethod
    def from_json(score: int, factor_json: str, is_farmer: bool = False) -> "ScoreResult":
        """Reconstruct from stored score + factor_breakdown_json."""
        factor_points = json.loads(factor_json) if factor_json else {}
        weights = _FARMER_WEIGHTS if is_farmer else _NON_FARMER_WEIGHTS
        return ScoreResult(
            score=score,
            band=score_to_band(score),
            factor_points=factor_points,
            factor_max=dict(weights),
            is_farmer=is_farmer,
        )


# ── Core scoring function ─────────────────────────────────────────────────────

def calculate_score(profile: CreditProfile, occupation_type: Optional[str] = None) -> ScoreResult:
    """
    Calculate a credit score from a CreditProfile.

    All arithmetic is transparent and deterministic:
    - No randomness, no model coefficients, no external API calls.
    - Caller can reproduce any score manually given the same inputs.

    Args:
        profile:         The CreditProfile ORM object.
        occupation_type: From UserProfile.occupation_type. Used to decide whether
                         to apply farmer weights. Pass as string value (e.g. 'farmer').

    Returns:
        ScoreResult with score (0–100), band, and per-factor breakdown.
    """
    is_farmer = occupation_type == "farmer"
    weights = _FARMER_WEIGHTS if is_farmer else _NON_FARMER_WEIGHTS

    factor_points: dict[str, float] = {}

    # ── Land size factor (farmers only) ──────────────────────────────────────
    if is_farmer and weights["land"] > 0:
        land = float(profile.land_size_acres or 0)
        land = min(land, _LAND_CAP_ACRES)
        factor_points["land"] = round((land / _LAND_CAP_ACRES) * weights["land"], 2)
    else:
        factor_points["land"] = 0.0

    # ── Crop yield factor (farmers only) ─────────────────────────────────────
    if is_farmer and weights["crop"] > 0:
        crop = float(profile.crop_yield_maunds or 0)
        crop = min(crop, _CROP_CAP_MAUNDS)
        factor_points["crop"] = round((crop / _CROP_CAP_MAUNDS) * weights["crop"], 2)
    else:
        factor_points["crop"] = 0.0

    # ── Utility payment consistency ───────────────────────────────────────────
    total_months = max(int(profile.utility_total_months or 1), 1)  # guard zero-div
    paid_months = max(int(profile.utility_paid_months or 0), 0)
    paid_months = min(paid_months, total_months)

    if profile.utility_type and profile.utility_type.value == "none":
        # No utility bill — award half credit (unverifiable, give benefit of doubt)
        util_ratio = 0.5
    else:
        util_ratio = paid_months / total_months

    factor_points["utility"] = round(util_ratio * weights["utility"], 2)

    # ── Committee / savings participation ─────────────────────────────────────
    factor_points["committee"] = float(weights["committee"]) if profile.has_committee_participation else 0.0

    # ── Prior loan repayment ──────────────────────────────────────────────────
    factor_points["repayment"] = float(weights["repayment"]) if profile.has_prior_loan_repayment else 0.0

    # ── Savings behaviour (wallet data — may be null in Phase 2) ─────────────
    if profile.avg_monthly_savings_pct is not None:
        savings_pct = min(float(profile.avg_monthly_savings_pct), _SAVINGS_CAP_PCT)
        factor_points["savings"] = round((savings_pct / _SAVINGS_CAP_PCT) * weights["savings"], 2)
    else:
        factor_points["savings"] = 0.0

    raw_score = sum(factor_points.values())
    score = max(0, min(100, round(raw_score)))

    return ScoreResult(
        score=score,
        band=score_to_band(score),
        factor_points=factor_points,
        factor_max=dict(weights),
        is_farmer=is_farmer,
    )


# ── Human-readable factor labels (used by the API, rendered in the frontend) ──

FACTOR_LABELS_EN = {
    "land":       "Land size",
    "crop":       "Crop yield",
    "utility":    "Utility bill payments",
    "committee":  "Committee / savings group",
    "repayment":  "Prior loan repayment",
    "savings":    "Regular savings habit",
}

FACTOR_LABELS_UR = {
    "land":       "زمین کا رقبہ",
    "crop":       "فصل کی پیداوار",
    "utility":    "یوٹیلیٹی بل ادائیگی",
    "committee":  "کمیٹی / بچت گروپ",
    "repayment":  "پچھلے قرض کی واپسی",
    "savings":    "باقاعدہ بچت کی عادت",
}

SCORE_BAND_LABELS_EN = {
    BAND_EXCELLENT: "Excellent",
    BAND_GOOD:      "Good",
    BAND_FAIR:      "Fair",
    BAND_LOW:       "Low",
    BAND_VERY_LOW:  "Very Low",
}

SCORE_BAND_LABELS_UR = {
    BAND_EXCELLENT: "بہترین",
    BAND_GOOD:      "اچھا",
    BAND_FAIR:      "ٹھیک ٹھاک",
    BAND_LOW:       "کم",
    BAND_VERY_LOW:  "بہت کم",
}
