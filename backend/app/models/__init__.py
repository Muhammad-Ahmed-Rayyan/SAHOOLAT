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
from app.models.wallet import WalletAccount, Transaction, TransactionType  # noqa: F401
from app.models.insurance_policy import (  # noqa: F401
    InsurancePolicy,
    WeatherReading,
    PayoutEvent,
    PolicyStatus,
    ThresholdType,
    PayoutStatus,
)
from app.models.gov_scheme import GovScheme  # noqa: F401
from app.models.lesson import (  # noqa: F401
    Lesson,
    Quiz,
    UserProgress,
    Badge,
    UserBadge,
    LessonCategory,
    BadgeCriteriaType,
)
from app.models.remittance import RemittanceRecord  # noqa: F401



