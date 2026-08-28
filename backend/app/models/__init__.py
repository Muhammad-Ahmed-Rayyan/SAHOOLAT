# models package — import all model classes so Alembic autogenerate can see them
from app.models.base import Base  # noqa: F401
from app.models.user import User, UserProfile  # noqa: F401
# Future phases will add their imports here as models are built
