"""
auth.py — Phone number + OTP authentication endpoints.

Endpoints:
  POST /auth/send-otp     — generate and dispatch an OTP for a phone number
  POST /auth/verify-otp   — verify OTP, return JWT + user info
  GET  /auth/me           — return current user's profile (requires JWT)

Error shape (all errors): { "error": true, "message": "...", "code": "..." }
  — per Rules.md error handling standard.
"""

import re
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.deps import get_current_user
from app.core.security import create_access_token, dispatch_otp, verify_otp
from app.db.session import get_db
from app.models.user import Language, OccupationType, User, UserProfile

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()

# ─── Pydantic schemas ─────────────────────────────────────────────────────────

_E164_PATTERN = re.compile(r"^\+[1-9]\d{6,14}$")


def _validate_phone(phone: str) -> str:
    phone = phone.strip()
    if not _E164_PATTERN.match(phone):
        raise ValueError(
            "Phone number must be in E.164 format (e.g. +923001234567)"
        )
    return phone


class SendOTPRequest(BaseModel):
    phone_number: str

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return _validate_phone(v)


class SendOTPResponse(BaseModel):
    message: str
    dev_otp: Optional[str] = None  # only populated when DEBUG=True


class VerifyOTPRequest(BaseModel):
    phone_number: str
    otp: str

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return _validate_phone(v)

    @field_validator("otp")
    @classmethod
    def validate_otp(cls, v: str) -> str:
        v = v.strip()
        if not v.isdigit() or len(v) != 6:
            raise ValueError("OTP must be exactly 6 digits")
        return v


class UserProfileOut(BaseModel):
    id: UUID
    user_id: UUID
    name: Optional[str]
    location: Optional[str]
    occupation_type: Optional[OccupationType]
    receives_remittances: Optional[bool]
    preferred_language: Language
    onboarding_completed: bool

    model_config = {"from_attributes": True}


class UserOut(BaseModel):
    id: UUID
    phone_number: str
    profile: Optional[UserProfileOut]

    model_config = {"from_attributes": True}


class VerifyOTPResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
    is_new_user: bool


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _get_or_create_user(db: Session, phone_number: str) -> tuple[User, bool]:
    """
    Look up an existing user by phone number.
    If not found, create a new User + empty UserProfile in a single transaction.
    Returns (user, is_new_user).
    """
    user = db.query(User).filter(User.phone_number == phone_number).first()
    if user:
        return user, False

    user = User(phone_number=phone_number)
    db.add(user)
    db.flush()  # get the UUID assigned before creating the profile FK

    profile = UserProfile(user_id=user.id)
    db.add(profile)
    db.commit()
    db.refresh(user)
    return user, True


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post(
    "/send-otp",
    response_model=SendOTPResponse,
    status_code=status.HTTP_200_OK,
    summary="Request a one-time password for a phone number",
)
def send_otp(payload: SendOTPRequest) -> SendOTPResponse:
    """
    Generate a 6-digit OTP, store it (in-memory, 10 min expiry), and dispatch it.
    In DEBUG mode the OTP is returned in the response body under `dev_otp`.
    In production `dev_otp` will be null — the OTP arrives via SMS only.
    """
    _, dev_otp = dispatch_otp(payload.phone_number)
    return SendOTPResponse(
        message="OTP sent successfully",
        dev_otp=dev_otp,
    )


@router.post(
    "/verify-otp",
    response_model=VerifyOTPResponse,
    status_code=status.HTTP_200_OK,
    summary="Verify OTP and receive a JWT access token",
)
def verify_otp_and_login(
    payload: VerifyOTPRequest,
    db: Session = Depends(get_db),
) -> VerifyOTPResponse:
    """
    Verify the OTP for a phone number.
    On success: look up or create the user, return a signed JWT.
    The frontend should inspect `is_new_user` + `user.profile.onboarding_completed`
    to decide whether to route to OnboardingScreen or DashboardScreen.
    """
    if not verify_otp(payload.phone_number, payload.otp):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": True,
                "message": "Invalid or expired OTP. Please request a new one.",
                "code": "OTP_INVALID",
            },
        )

    user, is_new_user = _get_or_create_user(db, payload.phone_number)
    token = create_access_token(subject=str(user.id))

    return VerifyOTPResponse(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(user),
        is_new_user=is_new_user,
    )


@router.get(
    "/me",
    response_model=UserOut,
    status_code=status.HTTP_200_OK,
    summary="Get the currently authenticated user's profile",
)
def get_me(current_user: User = Depends(get_current_user)) -> UserOut:
    return UserOut.model_validate(current_user)
