"""
main.py — FastAPI application entry point for Sahoolat backend.

Startup order:
  1. Load settings from .env
  2. Register routers (all modules, even stubs, so the URL namespace is stable)
  3. CORS middleware — allow the Expo dev server and any configured origins
  4. Global exception handler — ensures Rules.md error shape even for unhandled 500s

Run locally:
  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

Alembic migrations (run before first start):
  cd backend
  alembic upgrade head
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.api.v1 import auth, onboarding
# Stub routers — imported now so the URL namespace is established; logic added per phase
from app.api.v1 import (
    credit_score,
    committee,
    loan_matcher,
    wallet,
    insurance,
    subsidy_bot,
    literacy,
    remittance,
)

settings = get_settings()

app = FastAPI(
    title="Sahoolat API",
    description="AI-powered financial inclusion platform for Pakistan",
    version="0.1.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
API_PREFIX = "/api/v1"

app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(onboarding.router, prefix=API_PREFIX)
# Stub routers — no endpoints yet, just placeholders so the prefix is reserved
app.include_router(credit_score.router, prefix=API_PREFIX)
app.include_router(committee.router, prefix=API_PREFIX)
app.include_router(loan_matcher.router, prefix=API_PREFIX)
app.include_router(wallet.router, prefix=API_PREFIX)
app.include_router(insurance.router, prefix=API_PREFIX)
app.include_router(subsidy_bot.router, prefix=API_PREFIX)
app.include_router(literacy.router, prefix=API_PREFIX)
app.include_router(remittance.router, prefix=API_PREFIX)


# ── Global exception handler ──────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Catch-all handler so no raw Python tracebacks ever reach the client.
    Per Rules.md: all errors must return { "error": true, "message": "...", "code": "..." }.
    """
    return JSONResponse(
        status_code=500,
        content={
            "error": True,
            "message": "An unexpected server error occurred. Please try again.",
            "code": "INTERNAL_SERVER_ERROR",
        },
    )


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["health"])
async def health_check() -> dict:
    return {"status": "ok", "app": "sahoolat-api", "version": "0.1.0"}
