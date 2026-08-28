"""
JWT bearer dependency — extracts and validates the Authorization header.
Used as a FastAPI dependency in protected routes:  current_user: User = Depends(get_current_user)
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={"error": True, "message": "Could not validate credentials", "code": "INVALID_TOKEN"},
        headers={"WWW-Authenticate": "Bearer"},
    )
    user_id = decode_access_token(credentials.credentials)
    if user_id is None:
        raise credentials_exception
    try:
        uid = UUID(user_id)
    except ValueError:
        raise credentials_exception
    user = db.query(User).filter(User.id == uid, User.is_active == True).first()
    if user is None:
        raise credentials_exception
    return user
