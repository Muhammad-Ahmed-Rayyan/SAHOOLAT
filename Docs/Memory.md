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

`Phase 5: Digital Wallet — COMPLETE. Awaiting go-ahead for Phase 6: Parametric Crop Insurance.`

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
- Stub files: models and routes and services + jobs

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
- `SETUP.md` — runbook with exact commands to start services

---

### Phase 2: Credit Scoring Engine (2026-08-29)

**Backend (FastAPI)**
- `backend/app/models/credit_profile.py` — `CreditProfile` and `CreditScoreHistory`
- `backend/app/db/migrations/versions/002_credit_scoring_schema.py` — Alembic migration for `credit_profiles`, `credit_score_history`, and `utility_type_enum`
- `backend/app/services/scoring_engine.py` — Explainable rule-based scoring engine (0–100 scale, transparent factor weights, farmer vs non-farmer weight redistribution, score bands)
- `backend/app/api/v1/credit_score.py` — 5 endpoints: `GET /credit/profile`, `PUT /credit/profile`, `POST /credit/calculate`, `GET /credit/score`, `GET /credit/score/history`

**Frontend (React Native / Expo)**
- `app/src/services/creditService.ts` — Axios client with TypeScript interfaces
- `app/src/screens/credit-score/CreditInputScreen.tsx` — Manual data entry form with occupation-aware fields
- `app/src/screens/credit-score/CreditScoreScreen.tsx` — Score display screen with 72px bold score number, factor breakdown, history graph
- `app/src/locales/en.json` & `app/src/locales/ur.json` — complete English and Urdu translations for `credit_input` and `credit_score` namespaces

---

### Phase 3: Digital Committee (ROSCA) (2026-08-29 & 2026-08-30)

**Backend (FastAPI)**
- `backend/app/models/committee.py` — `Committee`, `CommitteeMember`, `CommitteeCycle`, `Contribution` models
- `backend/app/db/migrations/versions/003_committee_schema.py` — Alembic migration for committee tables + enums
- `backend/app/services/committee_engine.py` — Payout ordering (fixed/lottery), contribution logging, scoring signal
- `backend/app/api/v1/committee.py` — REST endpoints for committee creation, joining, detail, and cycle contributions

**Frontend (React Native / Expo)**
- `app/src/services/committeeService.ts` — Typed Axios client for committee endpoints
- `app/src/screens/committee/CommitteeListScreen.tsx` — List of user's committees + create action + status badges
- `app/src/screens/committee/CreateCommitteeScreen.tsx` — Form for creating committees (frequency chips, payout methods, limits)
- `app/src/screens/committee/CommitteeDetailScreen.tsx` — Members list with payout positions, current cycle, transparent contribution log, contribute action
- `app/src/screens/committee/CommitteeScreen.tsx` — Module entry point redirecting to `CommitteeListScreen`
- `app/src/theme/icons.ts` — Centralized filled icon mapping via `@expo/vector-icons` (Ionicons), eliminating emojis
- `app/src/navigation/AppNavigator.tsx` — Wired `Committee`, `CommitteeDetail`, and `CreateCommittee`
- `app/src/locales/en.json` & `app/src/locales/ur.json` — Full bilingual translation coverage for `committee`

---

### Phase 4: Micro-Loan Eligibility Matcher (2026-08-30)

**Backend (FastAPI)**
- `backend/app/models/loan_program.py` — `MicrofinanceProgram` model with `LoanType` enum and eligibility fields
- `backend/app/db/migrations/versions/004_loan_program_schema.py` — Alembic migration creating `microfinance_programs` table and seeded with real, sourced data from Akhuwat, Kashf Foundation, and NRSP
- `backend/app/services/loan_matching_engine.py` — Deterministic, rule-based matching engine evaluating credit score, occupation, and location with explainable `why_matched` and `why_not_matched` reasoning
- `backend/app/api/v1/loan_matcher.py` — `GET /loans/matches` returning ranked eligible loan programs with application steps and document requirements

**Frontend (React Native / Expo)**
- `app/src/services/loanService.ts` — Typed Axios client for `getLoanMatches()`
- `app/src/screens/loan-matcher/LoanMatcherScreen.tsx` — Full match screen displaying ranked program cards, loan limits, interest status, reasons for match, required documents, step-by-step application guidance, and contact links
- `app/src/navigation/AppNavigator.tsx` — Wired `LoanMatcher` route
- `app/src/locales/en.json` & `app/src/locales/ur.json` — Full bilingual translation coverage for `loan_matcher`

---

### Phase 5: Digital Wallet (2026-08-30)

**Backend (FastAPI)**
- `backend/app/models/wallet.py` — `WalletAccount` (id, user_id FK unique, balance=savings only, auto_save_pct) and `Transaction` (id, wallet_id FK, type enum: income/auto_save/manual_save, amount, note, logged_at) models with UUIDs
- `backend/app/db/migrations/versions/5a7766b962bd_005_wallet_schema.py` — Alembic migration 005 applied to Neon; creates `wallet_accounts` and `wallet_transactions` tables with `transaction_type_enum`
- `backend/app/services/wallet_engine.py` — `log_income()` (creates income txn + auto_save txn if pct set, updates balance), `get_savings_trend()` (6-month aggregation), `_update_score_signal()` (writes avg_monthly_savings_pct to CreditProfile after every income log); `CreditProfile.avg_monthly_savings_pct` is now live data, not null
- `backend/app/api/v1/wallet.py` — 5 routes: `GET /wallet`, `PUT /wallet/auto-save`, `POST /wallet/income` (201), `GET /wallet/transactions` (paginated), `GET /wallet/trend`
- `backend/app/locales/en.json` & `ur.json` — `wallet` namespace added

**Frontend (React Native / Expo)**
- `app/src/services/walletService.ts` — Typed Axios client for all 5 wallet endpoints
- `app/src/screens/wallet/WalletScreen.tsx` — Large Rs. savings balance display (Design.md display typography), auto-save toggle + percentage input (edit-in-place), "Log income" button, 6-month income/savings dot-graph trend (same pattern as CreditScoreScreen), recent transaction list
- `app/src/screens/wallet/LogIncomeScreen.tsx` — Amount + optional note form, client validation, server error display, alert with auto-save confirmation
- `app/src/theme/icons.ts` — Added `income` and `savings` icons for wallet screens
- `app/src/navigation/AppNavigator.tsx` — Wired `Wallet` (real screen) and `LogIncome` routes; added types
- `app/src/locales/en.json` & `app/src/locales/ur.json` — Full bilingual `wallet` namespace

---

## Currently Working On

*(awaiting Phase 6 go-ahead: Parametric Crop Insurance)*

---

## Decisions & Deviations Log

| Date | Decision / Deviation | Reason |
|---|---|---|
| 2026-08-26 | `occupation_type` kept as 4 values: farmer/daily_laborer/shopkeeper/other | Per user instruction — remittance_recipient is not an occupation |
| 2026-08-26 | `receives_remittances` added as nullable boolean on UserProfile | Soft signal for personalization. Defaults to null (unknown), not false. |
| 2026-08-26 | OTP stored in-memory (Python dict, not Redis/DB) | Dev-only simplicity; documented as production upgrade path in security.py |
| 2026-08-26 | `ALLOWED_ORIGINS` stored as `ALLOWED_ORIGINS_STR` in .env | Pydantic-settings string parsing fix in `model_post_init` |
| 2026-08-26 | Urdu fonts (NotoNastaliqUrdu, NotoSansArabic) fallback | Using system Urdu font until custom TTF files are bundled |
| 2026-08-29 | Non-farmer scoring weight redistribution | Farmers scored on land/crop; weights redistributed to utility/committee/repayment/savings for non-farmers |
| 2026-08-29 | `CreditScoreHistory` immutable snapshot pattern | Preserves historical credit scoring calculations for audit and timeline visualization |
| 2026-08-29 | Switched database to hosted Neon Lakebase Postgres | Replaced local portable Postgres with hosted Neon (`SAHOOLAT` in org `Muhammad Ahmed`) |
| 2026-08-30 | Adopted `@expo/vector-icons` Ionicons filled set | Replaced emoji placeholders across screens per Design.md filled/duotone icon requirement |
| 2026-08-30 | Rule-based loan matcher with explainability | Deterministic matching against real published MFI criteria (Akhuwat, Kashf, NRSP) returning clear `why_matched` reasons |
| 2026-08-30 | Wallet balance = savings only (not gross income) | `WalletAccount.balance` tracks auto_save + manual_save txn totals only. Income is logged as a separate `income` txn type. Matches Phases.md "savings balance" definition. Self-documented in wallet.py module docstring. |
| 2026-08-30 | Savings score signal updated on every `log_income()` call (not scheduled) | Consistent with committee_engine pattern; score responds to wallet activity immediately. Formula: (total savings / total income over last 90 days) × 100. Existing `savings` factor weight: 5pts farmer / 10pts non-farmer (already allocated in scoring_engine.py Phase 2 — not changed). |
| 2026-08-30 | Trend chart uses dot-graph pattern from CreditScoreScreen (no new charting lib) | Matches the Phase 5 prompt requirement "reuse that pattern/library rather than introducing a new charting dependency." |

---

## Known Blockers / Open Questions

- **Neon Org Access** — Teammates need to be invited to the Neon org (`org-lively-forest-89506850`) before their local Neon CLI/MCP setup can connect.
- **Urdu fonts (NotoNastaliqUrdu, NotoSansArabic)** need to be downloaded as .ttf files and added to `app/assets/fonts/`. Currently commented out in App.tsx. System Urdu font is used currently.

---

## Session Log

| Date | What was done | Next step |
|---|---|---|
| 2026-08-26 | Phase 1 written: full backend + frontend scaffolded. TypeScript exit 0. OTP in-memory logic verified. | Get Postgres running |
| 2026-08-29 | Phase 1 VERIFIED end-to-end with live PostgreSQL. All 8 API tests passed. Alembic migration 001 applied. | Start Phase 2: Credit Scoring Engine |
| 2026-08-29 | Phase 2 COMPLETE & VERIFIED: CreditProfile + CreditScoreHistory, scoring engine, 5 API endpoints, CreditInputScreen, CreditScoreScreen. | Switch to Neon & implement Phase 3 |
| 2026-08-29 | Switched to hosted Neon Lakebase Postgres. Applied migrations 001, 002, 003. Built Phase 3 committee backend. | Complete Phase 3 Frontend Screens |
| 2026-08-30 | Fixed language persistence bug. Centralized icon system. Completed Phase 3 frontend. Implemented Phase 4 Micro-Loan Matcher (migration 004, engine, API, frontend, bilingual). Fixed CreditScoreHistory query (join via CreditProfile). | Implement Phase 5: Digital Wallet |
| 2026-08-30 | Phase 5 COMPLETE: WalletAccount + Transaction models, migration 005 applied to Neon, wallet_engine.py (log_income, auto-save, score signal, trend), 5 API routes, walletService.ts, WalletScreen.tsx (balance display, auto-save, trend chart, transactions), LogIncomeScreen.tsx, EN+UR locale strings, icons updated, AppNavigator wired. TypeScript 0 errors, Python 0 errors. | Await Phase 6: Parametric Crop Insurance |
