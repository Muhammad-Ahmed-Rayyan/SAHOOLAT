"""
security.py — JWT creation/verification + OTP lifecycle.

OTP strategy (dev mode):
  - OTPs are stored in-memory (keyed by phone number) with an expiry timestamp.
  - In DEBUG mode the raw OTP is included in the API response under `dev_otp`.
  - In production, wire `_send_otp_via_sms()` to a real SMS gateway (Twilio etc.)
    and remove the `dev_otp` field from all response models.
  - NOTE: In-memory OTP store is per-process and will reset on restart.
    Replace with Redis (or a DB-backed OTPRecord table) before production.
"""

import random
import string
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from app.core.config import get_settings

settings = get_settings()

# ── In-memory OTP store ────────────────────────────────────────────────────────
# Structure: { phone_number: {"otp": "123456", "expires_at": datetime} }
_otp_store: dict[str, dict] = {}


# ── OTP Utilities ──────────────────────────────────────────────────────────────

def generate_otp(length: int = 6) -> str:
    """Generate a numeric OTP of `length` digits."""
    return "".join(random.choices(string.digits, k=length))


def store_otp(phone_number: str, otp: str) -> None:
    """Persist OTP in memory with an expiry window."""
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.OTP_EXPIRE_MINUTES
    )
    _otp_store[phone_number] = {"otp": otp, "expires_at": expires_at}


def verify_otp(phone_number: str, otp: str) -> bool:
    """Return True if the supplied OTP matches and has not expired."""
    record = _otp_store.get(phone_number)
    if not record:
        return False
    if datetime.now(timezone.utc) > record["expires_at"]:
        _otp_store.pop(phone_number, None)  # clean up expired entry
        return False
    if record["otp"] != otp:
        return False
    # Consume the OTP — one-time use only
    _otp_store.pop(phone_number, None)
    return True


def _send_otp_via_sms(phone_number: str, otp: str) -> None:
    """
    TODO: Integrate real SMS gateway here (e.g. Twilio).
    For now this is a no-op — the OTP is returned in the API response
    when DEBUG=True (see auth.py send_otp endpoint).
    """
    # Example stub for Twilio:
    # from twilio.rest import Client
    # client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    # client.messages.create(
    #     body=f"Your Sahoolat OTP is: {otp}. Valid for {settings.OTP_EXPIRE_MINUTES} minutes.",
    #     from_=settings.TWILIO_FROM_NUMBER,
    #     to=phone_number,
    # )
    pass


def dispatch_otp(phone_number: str) -> tuple[str, Optional[str]]:
    """
    Generate, store, and send an OTP.
    Returns (otp, dev_otp_or_none) — dev_otp is only non-None in DEBUG mode.
    """
    otp = generate_otp()
    store_otp(phone_number, otp)
    _send_otp_via_sms(phone_number, otp)
    dev_otp = otp if settings.DEBUG else None
    return otp, dev_otp


# ── JWT Utilities ──────────────────────────────────────────────────────────────

def create_access_token(subject: str) -> str:
    """
    Create a signed JWT. `subject` is the user's UUID (as string).
    """
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {"sub": subject, "exp": expire, "iat": datetime.now(timezone.utc)}
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[str]:
    """
    Decode and validate a JWT. Returns the `sub` (user UUID string) or None on failure.
    """
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        return payload.get("sub")
    except JWTError:
        return None
