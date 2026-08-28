"""
onboarding.py — User profile completion endpoints (Phase 1).

Endpoints:
  PUT /onboarding/profile  — save onboarding form data, mark onboarding complete
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import Language, OccupationType, User, UserProfile

router = APIRouter(prefix="/onboarding", tags=["onboarding"])


# ─── Pydantic schemas ─────────────────────────────────────────────────────────

class CompleteProfileRequest(BaseModel):
    name: str
    location: str
    occupation_type: OccupationType
    preferred_language: Language
    # Optional — only set if user explicitly answers the question in the onboarding form.
    # None (not sent) = unknown; True/False = explicitly answered.
    receives_remittances: Optional[bool] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Name must be at least 2 characters")
        return v

    @field_validator("location")
    @classmethod
    def location_not_empty(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Location must be at least 2 characters")
        return v


class ProfileResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: Optional[str]
    location: Optional[str]
    occupation_type: Optional[OccupationType]
    receives_remittances: Optional[bool]
    preferred_language: Language
    onboarding_completed: bool

    model_config = {"from_attributes": True}


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.put(
    "/profile",
    response_model=ProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Complete the user's onboarding profile",
)
def complete_profile(
    payload: CompleteProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProfileResponse:
    """
    Save the onboarding form data and set onboarding_completed = True.
    Safe to call again later (e.g. from Profile/Settings) to update fields.
    """
    profile: Optional[UserProfile] = current_user.profile

    if profile is None:
        # Should not happen — profile is created with the user — but guard anyway.
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": True,
                "message": "User profile record missing. Please contact support.",
                "code": "PROFILE_NOT_FOUND",
            },
        )

    profile.name = payload.name.strip()
    profile.location = payload.location.strip()
    profile.occupation_type = payload.occupation_type
    profile.preferred_language = payload.preferred_language
    profile.receives_remittances = payload.receives_remittances
    profile.onboarding_completed = True

    db.commit()
    db.refresh(profile)
    return ProfileResponse.model_validate(profile)
