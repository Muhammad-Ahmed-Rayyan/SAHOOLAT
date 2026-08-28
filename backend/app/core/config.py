from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from functools import lru_cache


class Settings(BaseSettings):
    # ── App ──────────────────────────────────────────────────────────────────
    APP_ENV: str = "development"
    DEBUG: bool = True

    # ALLOWED_ORIGINS is stored as a comma-separated string in .env
    # e.g. ALLOWED_ORIGINS=http://localhost:8081,http://localhost:3000
    # Pydantic-settings cannot parse this as list[str] directly, so we keep it
    # as str and split in a validator.
    ALLOWED_ORIGINS_STR: str = "http://localhost:8081,http://localhost:3000"
    ALLOWED_ORIGINS: list[str] = []

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_origins(cls, v: object) -> list[str]:
        if isinstance(v, list):
            return v
        return []  # will be overridden from ALLOWED_ORIGINS_STR in model_post_init

    def model_post_init(self, __context: object) -> None:
        # Split the raw string into a list after model initialisation
        object.__setattr__(
            self,
            "ALLOWED_ORIGINS",
            [o.strip() for o in self.ALLOWED_ORIGINS_STR.split(",") if o.strip()],
        )

    # ── Database ──────────────────────────────────────────────────────────────
    DATABASE_URL: str

    # ── JWT ───────────────────────────────────────────────────────────────────
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    # ── OTP ───────────────────────────────────────────────────────────────────
    OTP_EXPIRE_MINUTES: int = 10

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


@lru_cache
def get_settings() -> Settings:
    """Cached settings singleton — import and call this instead of re-reading env every time."""
    return Settings()
