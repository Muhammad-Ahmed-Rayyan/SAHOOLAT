"""
Base declarative class shared by all models.
Import this in every model file: from app.models.base import Base
"""
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
