"""
Alembic environment configuration.

Reads DATABASE_URL from .env (via pydantic-settings) so no credentials
are ever hardcoded in this file or in alembic.ini.

Model discovery: imports app.models (package __init__) which re-exports
all SQLAlchemy model classes, ensuring autogenerate sees them all.
"""

import sys
import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# ── Make `app` importable from within the backend/ directory ──────────────────
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.core.config import get_settings
from app.models.base import Base
import app.models  # noqa: F401 — triggers all model imports for autogenerate

settings = get_settings()

# Alembic Config object — access to alembic.ini values
config = context.config

# Override sqlalchemy.url with value from .env
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# Set up Python logging from alembic.ini [loggers] section
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode — generates SQL without a live connection."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode — requires a live DB connection."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
