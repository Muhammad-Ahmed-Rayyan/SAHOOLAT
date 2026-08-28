# Memory.md — Project State Tracker

> **Update this file regularly** — at the end of every work session, and ideally after every completed task. This file is what lets any AI coding tool (or teammate) pick up work without re-discovering project state from scratch. An out-of-date Memory.md is worse than no Memory.md — it actively misleads the next session.

---

## How to Update This File

1. Move anything just finished from "Currently Working On" to "Completed."
2. Update "Currently Working On" with what's next / in progress.
3. Note any decisions made, blockers hit, or deviations from PRD.md/Architecture.md/Phases.md — and why.
4. Keep entries short and dated — this is a log, not a report.

---

## Current Phase

`Phase 2: Credit Scoring Engine — COMPLETE AND VERIFIED END-TO-END. Awaiting go-ahead for Phase 3: Digital Committee.`

---

## Completed

### Phase 1: Foundation + Auth (2026-08-26 & 2026-08-29)

**Backend (FastAPI)**
- `backend/requirements.txt` — all Phase 1 dependencies pinned
- `backend/.env.example` — all env vars documented
- `backend/.env` — generated with random JWT_SECRET_KEY (not committed to source)
- `backend/docker-compose.yml` — PostgreSQL 15 via Docker (optional; native Postgres also works)
- `backend/alembic.ini` — Alembic config, script_location = app/db/migrations
- `backend/app/main.py` — FastAPI app init, CORS, global exception handler, all routers registered
- `backend/app/core/config.py` — pydantic-settings Settings class (reads .env)
- `backend/app/core/security.py` — OTP lifecycle (generate/store/verify), JWT create/decode
- `backend/app/core/deps.py` — JWT bearer dependency for protected routes
- `backend/app/db/session.py` — SQLAlchemy engine + SessionLocal + get_db()
- `backend/app/models/base.py` — shared DeclarativeBase
- `backend/app/models/user.py` — User + UserProfile models (UUIDs, OccupationType enum, receives_remittances nullable bool)
- `backend/app/db/migrations/env.py` — Alembic env, reads DATABASE_URL from .env
- `backend/app/db/migrations/script.py.mako` — migration template
- `backend/app/db/migrations/versions/001_initial_schema.py` — users + user_profiles tables
- `backend/app/api/v1/auth.py` — POST /auth/send-otp, POST /auth/verify-otp, GET /auth/me
- `backend/app/api/v1/onboarding.py` — PUT /onboarding/profile
- `backend/app/locales/en.json` + `ur.json` — backend message strings
- Stub files: models (committee, loan_program, wallet, insurance_policy, gov_scheme, lesson, remittance) and routes (committee, loan_matcher, wallet, insurance, subsidy_bot, literacy, remittance) and services + jobs

**Frontend (React Native / Expo)**
- `app/package.json` — updated with all Phase 1 deps (navigation, i18next, zustand, axios, expo-font, google fonts, async-storage, secure-store)
- `app/App.tsx` — fonts loaded, i18n init, auth hydration, SplashScreen gate
- `app/src/theme/colors.ts` — all Design.md hex values as typed constants
- `app/src/theme/typography.ts` — all Design.md font scales, line heights, radii, min tap target, Typography preset object
- `app/src/locales/en.json` + `ur.json` — complete Phase 1 strings (all screens), real Urdu translations
- `app/src/locales/i18n.ts` — react-i18next config, Urdu-first default
- `app/src/store/authStore.ts` — Zustand store (token in SecureStore, language persisted, hydrate())
- `app/src/services/api.ts` — Axios instance (15s timeout, JWT interceptor, 401 auto-logout)
- `app/src/services/authService.ts` — sendOTP(), verifyOTP(), getMe(), completeProfile()
- `app/src/components/Button.tsx` — primary/secondary/ghost variants, 44px min tap target
- `app/src/components/TextInput.tsx` — label, hint, error, focus ring, 52px height
- `app/src/components/Card.tsx` — cream surface card with optional shadow
- `app/src/screens/auth/SplashScreen.tsx` — auth bootstrapping + routing logic
- `app/src/screens/auth/LanguageSelectScreen.tsx` — Urdu/English select with immediate i18n switch
- `app/src/screens/auth/PhoneInputScreen.tsx` — E.164 validation, calls sendOTP
- `app/src/screens/auth/OTPVerifyScreen.tsx` — 60s cooldown, dev OTP banner, auto-submit at 6 digits
- `app/src/screens/onboarding/OnboardingScreen.tsx` — name/location/occupation chips/remittances tristate
- `app/src/screens/dashboard/DashboardScreen.tsx` — 8 module tiles, sorted by occupation relevance
- `app/src/screens/dashboard/PlaceholderScreen.tsx` — shared "coming soon" for stub modules
- `app/src/navigation/AppNavigator.tsx` — typed RootStackParamList, all routes wired
- `app/.env` — EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1
- `SETUP.md` — runbook with exact commands to start/stop portable PostgreSQL, backend, and frontend

### Phase 2: Credit Scoring Engine (2026-08-29)

**Backend (FastAPI)**
- `backend/app/models/credit_profile.py` — `CreditProfile` (upserted inputs: land, crop, utility type/months, committee flag, repayment flag, savings pct) and `CreditScoreHistory` (immutable audit trail of calculated scores + JSON breakdown)
- `backend/app/db/migrations/versions/002_credit_scoring_schema.py` — Alembic migration for `credit_profiles`, `credit_score_history`, and `utility_type_enum`
- `backend/app/services/scoring_engine.py` — Explainable rule-based scoring engine (0–100 scale, transparent factor weights, farmer vs non-farmer weight redistribution, score bands: Excellent, Good, Fair, Low, Very Low)
- `backend/app/api/v1/credit_score.py` — 5 endpoints: `GET /credit/profile`, `PUT /credit/profile`, `POST /credit/calculate`, `GET /credit/score`, `GET /credit/score/history`

**Frontend (React Native / Expo)**
- `app/src/services/creditService.ts` — Axios client with TypeScript interfaces for credit profile, score calculation, latest score, and score history
- `app/src/screens/credit-score/CreditInputScreen.tsx` — Manual data entry form with occupation-aware fields (farm details for farmers), utility selector chips, paid/total months inputs, committee & repayment toggles, client + server validation
- `app/src/screens/credit-score/CreditScoreScreen.tsx` — Score display screen with 72px bold score number, color-coded band badge, factor breakdown progress bars with points earned/max, history dot-graph timeline, pull-to-refresh, data update toggle
- `app/src/locales/en.json` & `app/src/locales/ur.json` — complete English and Urdu translations for `credit_input` and `credit_score` namespaces
- `app/src/navigation/AppNavigator.tsx` — wired `CreditScore` route to `CreditScoreScreen`

---

## Currently Working On

*(nothing — awaiting Phase 3 go-ahead)*

---

## Decisions & Deviations Log

| Date | Decision / Deviation | Reason |
|---|---|---|
| 2026-08-26 | `occupation_type` kept as 4 values: farmer/daily_laborer/shopkeeper/other | Per user instruction — remittance_recipient is not an occupation |
| 2026-08-26 | `receives_remittances` added as nullable boolean on UserProfile | Agent's own proposal (not a user instruction) — user approved it as trivial to add; useful for Phase 9 dashboard logic. Defaults to null (unknown), not false. |
| 2026-08-26 | OTP stored in-memory (Python dict, not Redis/DB) | Dev-only simplicity; documented as production upgrade path in security.py |
| 2026-08-26 | `ALLOWED_ORIGINS` stored as `ALLOWED_ORIGINS_STR` in .env | pydantic-settings cannot parse a comma-separated string into `list[str]` directly without JSON array syntax — split in `model_post_init` instead |
| 2026-08-26 | Urdu fonts (NotoNastaliqUrdu, NotoSansArabic) not bundled yet | expo-font needs local asset files; commented out in App.tsx with a clear TODO. Latin fonts (Poppins, Nunito Sans) load via @expo-google-fonts normally. Urdu rendering falls back to system font until assets are added. |
| 2026-08-26 | PlaceholderScreen used for all 8 stub module routes | Avoids 8 near-identical files; each stub just re-exports PlaceholderScreen. Replaced in-place as each phase is completed (CreditScore replaced in Phase 2). |
| 2026-08-29 | Portable PostgreSQL 16 installed in `D:\Projects\SAHOOLAT\pgsql` | Native Windows service was unavailable; portable binary with `pg_ctl` used instead. Fully documented in `SETUP.md`. |
| 2026-08-29 | Non-farmer scoring weight redistribution | Farmers are scored on land (20) and crop (15); for non-farmers (shopkeeper, daily laborer, other), land/crop weights are dynamically shifted to utility (35), committee (30), repayment (25), and savings (10) so they can still reach a 100 score. |
| 2026-08-29 | `CreditScoreHistory` immutable snapshot pattern | Score calculations append to history with factor breakdown serialized as JSON rather than updating in-place, allowing graph visualization of score improvements over time. |

---

## Known Blockers / Open Questions

- **PostgreSQL startup required each session** — PostgreSQL is portable (not a Windows service). Run before starting the backend:
  ```powershell
  D:\Projects\SAHOOLAT\pgsql\bin\pg_ctl.exe -D D:\Projects\SAHOOLAT\pgdata -l D:\Projects\SAHOOLAT\pgdata\pg.log start
  ```
  To stop: replace `start` with `stop`. Documented in `SETUP.md`.
- **Urdu fonts (NotoNastaliqUrdu, NotoSansArabic)** need to be downloaded as .ttf files and added to `app/assets/fonts/`. Currently commented out in App.tsx. Phase 1 & 2 render in system Urdu font on device — acceptable now, needed before Phase 10 polish.
- **Frontend Expo Go** not yet tested on a physical device/simulator — TypeScript compiles clean (exit 0) and API is live; device test pending.

---

## Session Log

| Date | What was done | Next step |
|---|---|---|
| 2026-08-26 | Phase 1 written: full backend + frontend scaffolded. TypeScript exit 0. OTP in-memory logic verified. DB-dependent endpoints not yet tested (no Postgres). | Get Postgres running |
| 2026-08-29 | Phase 1 VERIFIED end-to-end with live PostgreSQL 16 (portable install at `D:\Projects\SAHOOLAT\pgsql`). All 8 API tests passed with real DB I/O: send-otp ✅ verify-otp ✅ /auth/me ✅ PUT /onboarding/profile ✅ /auth/me with saved profile ✅ wrong OTP → OTP_INVALID ✅ bad JWT → INVALID_TOKEN ✅ DB row confirmed via psql SELECT. `alembic upgrade head` applied migration 001 cleanly. `SETUP.md` created. | Start Phase 2: Credit Scoring Engine |
| 2026-08-29 | Phase 2 COMPLETE & VERIFIED: `CreditProfile` + `CreditScoreHistory` models + Alembic migration 002 applied; explainable scoring engine in `services/scoring_engine.py` (farmer & non-farmer dynamic weights); 5 credit API routes in `api/v1/credit_score.py`; frontend `creditService.ts`, `CreditInputScreen.tsx`, `CreditScoreScreen.tsx` with factor progress bars and score history graph; EN & UR locale files updated; TypeScript exit 0; 10/10 automated live API tests passed with real PostgreSQL I/O. | Start Phase 3: Digital Committee (await explicit go-ahead) |
