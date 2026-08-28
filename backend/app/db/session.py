from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
from app.core.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.DATABASE_URL,
    # pool_pre_ping ensures stale connections are discarded before use
    pool_pre_ping=True,
    # Conservative pool size appropriate for a single-instance demo/competition deployment
    pool_size=5,
    max_overflow=10,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a DB session and ensures it is closed after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
