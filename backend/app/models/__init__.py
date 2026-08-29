# models package — import all model classes so Alembic autogenerate can see them
from app.models.base import Base  # noqa: F401
from app.models.user import User, UserProfile  # noqa: F401
from app.models.credit_profile import CreditProfile, CreditScoreHistory  # noqa: F401
from app.models.committee import (  # noqa: F401
    Committee,
    CommitteeMember,
    CommitteeCycle,
    Contribution,
)
from app.models.loan_program import MicrofinanceProgram, LoanType  # noqa: F401
