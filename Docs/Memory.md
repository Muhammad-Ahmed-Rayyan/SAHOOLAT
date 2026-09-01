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

`Phase 9: Remittance Tracker & Savings Allocation — COMPLETE. Ready for Phase 10.`

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
- `backend/app/models/wallet.py` — `WalletAccount` and `Transaction` models with UUIDs
- `backend/app/db/migrations/versions/5a7766b962bd_005_wallet_schema.py` — Alembic migration 005 applied to Neon; creates `wallet_accounts` and `wallet_transactions` tables with `transaction_type_enum`
- `backend/app/services/wallet_engine.py` — `log_income()`, `get_savings_trend()`, `_update_score_signal()`
- `backend/app/api/v1/wallet.py` — 5 routes: `GET /wallet`, `PUT /wallet/auto-save`, `POST /wallet/income` (201), `GET /wallet/transactions`, `GET /wallet/trend`
- `backend/app/locales/en.json` & `ur.json` — `wallet` namespace added

**Frontend (React Native / Expo)**
- `app/src/services/walletService.ts` — Typed Axios client for all 5 wallet endpoints
- `app/src/screens/wallet/WalletScreen.tsx` — Savings balance display, auto-save toggle, 6-month trend graph, transaction list
- `app/src/screens/wallet/LogIncomeScreen.tsx` — Amount + note form with client & server validation
- `app/src/theme/icons.ts` — Added `income` and `savings` icons
- `app/src/navigation/AppNavigator.tsx` — Wired `Wallet` and `LogIncome` routes

---

### Phase 6: Parametric Crop Insurance (2026-09-01)

**Backend (FastAPI)**
- `backend/app/core/config.py` — Configured Pydantic `extra="ignore"`.
- `backend/app/models/insurance_policy.py` — `InsurancePolicy`, `WeatherReading`, and `PayoutEvent` models.
- `backend/app/db/migrations/versions/6a8899b703ef_006_insurance_schema.py` — Alembic migration 006 applied to Neon.
- `backend/app/services/weather_service.py` — Open-Meteo API fetcher with realistic fallback.
- `backend/app/services/insurance_trigger_engine.py` — Rule-based weather breach engine with audit logging.
- `backend/app/jobs/weather_check_job.py` — Daily APScheduler background job.
- `backend/app/api/v1/insurance.py` — FastApi endpoints for insurance policy management and test simulation.

**Frontend (React Native / Expo)**
- `app/src/services/insuranceService.ts` — Typed API client.
- `app/src/screens/insurance/InsuranceScreen.tsx`, `CreatePolicyScreen.tsx`, `PolicyDetailScreen.tsx` — Complete insurance screens.
- `app/src/theme/icons.ts` & `AppNavigator.tsx` — Icons and routes registered.

---

### Phase 7: Gov Subsidy & Scheme Eligibility Bot (2026-09-01)

**Backend (FastAPI)**
- Web research & verified cited criteria for Punjab Kissan Card (agripunjab.gov.pk / SMS 8070), BISP Benazir Kafaalat (bisp.gov.pk / SMS 8171), and PM Youth Loan (pmyp.gov.pk).
- `backend/app/models/gov_scheme.py` — `GovScheme` model with structured JSON criteria, bilingual fields, application steps, SMS codes, and source citations.
- `backend/app/db/migrations/versions/007_gov_scheme_schema.py` — Alembic migration 007 applied to Neon database; seeded Kissan Card, BISP, and PM Youth Loan.
- `backend/app/services/subsidy_rule_engine.py` — Deterministic, rule-based evaluation engine returning match scores, passed/failed criteria, and plain-language English & Urdu reasons.
- `backend/app/api/v1/subsidy_bot.py` — Endpoints: `GET /subsidy-bot/questions`, `POST /subsidy-bot/evaluate`, `GET /subsidy-bot/schemes/{scheme_id}`.

**Frontend (React Native / Expo)**
- `app/src/services/subsidyBotService.ts` — Typed Axios client for question fetch, eligibility evaluation, and scheme detail.
- `app/src/screens/subsidy-bot/SubsidyBotScreen.tsx` — Entry screen with intro banner card and active programs list.
- `app/src/screens/subsidy-bot/QuestionFlowScreen.tsx` — Progressive card question flow (1 question at a time), progress bar, boolean/choice/numeric inputs.
- `app/src/screens/subsidy-bot/EligibilityResultsScreen.tsx` — Transparent results screen using Design.md trio (`Colors.success`, `Colors.warning`, `Colors.error`), passed/failed breakdown, application steps, SMS codes, and official source citations.
- `app/src/theme/icons.ts` & `AppNavigator.tsx` — Added filled icons (`govBot`, `scheme`, `citation`, `step`) and wired `SubsidyBot`, `QuestionFlow`, `EligibilityResults` stack routes.
- `app/src/locales/en.json` & `ur.json` — Complete bilingual translations for `subsidy_bot` namespace.

---

### Phase 8: Gamified Financial Literacy (2026-09-01)

**Backend (FastAPI)**
- `backend/app/models/lesson.py` — `Lesson`, `Quiz`, `UserProgress`, `Badge`, `UserBadge` models with sequence order, category enum, criteria JSON, and relationship mappings.
- `backend/app/db/migrations/versions/008_literacy_schema.py` — Alembic migration 008 applied to Neon database; seeded 10 lessons, 10 quizzes, and 7 badges.
- `backend/app/services/literacy_engine.py` — Deterministic streak calculation engine using UTC `YYYY-MM-DD` strings, quiz scoring, and idempotent badge awarding logic.
- `backend/app/api/v1/literacy.py` — 7 endpoints: `GET /literacy/lessons`, `GET /literacy/lessons/{id}`, `POST /literacy/lessons/{id}/complete`, `GET /literacy/lessons/{id}/quiz`, `POST /literacy/lessons/{id}/quiz/submit`, `GET /literacy/progress`, `GET /literacy/badges`. All gated by `get_current_user()` and standard error response schema.

**Frontend (React Native / Expo)**
- `app/src/services/literacyService.ts` — Typed Axios client for all 7 literacy endpoints.
- `app/src/screens/literacy/LiteracyScreen.tsx` — Progress summary banner (lessons completed, streak pill in `Colors.warning`, badge count), horizontal category filters, sequence-ordered lesson list.
- `app/src/screens/literacy/LessonScreen.tsx` — Card-chunked interactive reader with card step indicator, progress bar, and completion action.
- `app/src/screens/literacy/QuizScreen.tsx` — Progressive 1-question-at-a-time quiz flow with choice selection.
- `app/src/screens/literacy/QuizResultScreen.tsx` — Detailed score breakdown, newly unlocked badges banner, per-question correctness indicator, and explanation cards.
- `app/src/screens/literacy/BadgesScreen.tsx` — Visual grid showcase of unlocked vs locked badges.
- `app/src/theme/icons.ts` & `AppNavigator.tsx` — Added Ionicons filled set icons (`streakFire`, `trophy`, `badgeFirstStep`, etc.) and wired stack routes.
- `app/src/locales/en.json` & `ur.json` — Urdu-first complete bilingual translations for all 10 lessons, cards, quiz questions, choices, explanations, and badges.

---

### Phase 9: Remittance Tracker & Savings Allocation (2026-09-01)

**Backend (FastAPI)**
- `backend/app/models/remittance.py` — `RemittanceRecord` model tracking origin currency, amount received, snapshot rate, converted PKR, sender relationship, and source country.
- `backend/app/db/migrations/versions/009_remittance_schema.py` — Alembic migration 009 applied to Neon database.
- `backend/app/services/fx_service.py` — Async `httpx` FX client fetching live exchange rates for USD, AED, SAR, GBP against PKR with in-memory caching and fallback rate indicator (`is_fallback: True`, "data may be outdated").
- `backend/app/services/remittance_savings_engine.py` — Rule-based savings allocation engine cross-referencing user's real Wallet auto-save rate (`auto_save_pct`) and active Committee monthly commitments to calculate explainable savings recommendations in English & Urdu.
- `backend/app/api/v1/remittance.py` — 6 endpoints: `GET /remittance/records`, `POST /remittance/records`, `GET /remittance/records/{id}`, `GET /remittance/trends`, `GET /remittance/savings-suggestion`, `GET /remittance/fx-rates`. All gated by `get_current_user()` and standard error response format.

**Frontend (React Native / Expo)**
- `app/src/services/remittanceService.ts` — Typed Axios client for all 6 remittance endpoints.
- `app/src/screens/remittance/RemittanceScreen.tsx` — Hub displaying total received PKR, FX rate ticker with fallback indicator banner, `SavingsSuggestionCard`, and remittance list.
- `app/src/screens/remittance/LogRemittanceScreen.tsx` — Entry form with currency chips (USD, AED, SAR, GBP), relationship chips, and live PKR conversion preview.
- `app/src/screens/remittance/RemittanceTrendsScreen.tsx` — Monthly trend chart reusing dot-graph/bar pattern with total & monthly average stats.
- `app/src/screens/remittance/SavingsSuggestionCard.tsx` — Surfaced card component highlighting recommended savings allocation and plain-language reasoning.
- `app/src/theme/icons.ts` & `AppNavigator.tsx` — Added filled icons (`send`, `currency`, `globe`, `trendingUp`) and registered `Remittance`, `LogRemittance`, `RemittanceTrends` routes.
- `app/src/locales/en.json` & `ur.json` — Complete bilingual translations for `remittance` namespace.

---

## Currently Working On

*(Completed Phase 9: Remittance Tracker & Savings Allocation. Ready for Phase 10.)*

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
| 2026-08-30 | Adopted `@expo/vector-icons` Ionicons filled set | Replaced Lucide icons with `@expo/vector-icons` (Ionicons filled set) because Expo natively bundles `@expo/vector-icons`, ensuring zero external font bundle issues across iOS/Android. |
| 2026-08-30 | Rule-based loan matcher with explainability | Deterministic matching against real published MFI criteria (Akhuwat, Kashf, NRSP) returning clear `why_matched` reasons |
| 2026-08-30 | Wallet balance = savings only (not gross income) | `WalletAccount.balance` tracks auto_save + manual_save txn totals only. Income is logged as a separate `income` txn type. Matches Phases.md "savings balance" definition. Self-documented in wallet.py module docstring. |
| 2026-08-30 | Savings score signal updated on every `log_income()` call (not scheduled) | Consistent with committee_engine pattern; score responds to wallet activity immediately. Formula: (total savings / total income over last 90 days) × 100. Existing `savings` factor weight: 5pts farmer / 10pts non-farmer (already allocated in scoring_engine.py Phase 2 — not changed). |
| 2026-08-30 | Trend chart uses dot-graph pattern from CreditScoreScreen (no new charting lib) | Matches the Phase 5 prompt requirement "reuse that pattern/library rather than introducing a new charting dependency." |
| 2026-09-01 | Configured Pydantic `extra="ignore"` | Allows `.env` extra keys (from Neon environment sync) to be safely ignored without breaking `Settings` validation. |
| 2026-09-01 | Open-Meteo Weather API integration with realistic fallback | Evaluates live weather data for Pakistan districts (Multan, Faisalabad, etc.) while guaranteeing system reliability if external API is unreachable. |
| 2026-09-01 | Added PM Youth Business & Agri Loan as 3rd seeded scheme | Added PM's Youth Loan beyond the required Kissan Card & BISP scope to provide comprehensive coverage for young entrepreneurs and farmers. |
| 2026-09-01 | Rule-based subsidy eligibility engine with source citations | Evaluates Kissan Card, BISP, and PM Youth Loans deterministically, citing agripunjab.gov.pk, bisp.gov.pk, and pmyp.gov.pk. |
| 2026-09-01 | Remittance FX API with fallback & rule-based savings suggestion | Fetches live USD/AED/SAR/GBP to PKR rates with in-memory fallback cache and calculates explainable savings allocations by cross-referencing Wallet `auto_save_pct` and active Committee dues. |


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
| 2026-09-01 | Pydantic startup crash resolved with `extra="ignore"`. Phase 6 Parametric Crop Insurance fully implemented: SQLAlchemy models (`InsurancePolicy`, `WeatherReading`, `PayoutEvent`), Alembic migration `006_insurance_schema` applied to Neon, Open-Meteo `weather_service.py` with fallback, `insurance_trigger_engine.py`, daily APScheduler `weather_check_job.py`, FastApi routes (`/insurance/*`), React Native UI screens (`InsuranceScreen`, `CreatePolicyScreen`, `PolicyDetailScreen`), typed `insuranceService.ts`, full EN+UR bilingual localization, navigation wired. Python imports OK, TypeScript 0 errors. | Ready for Phase 7 |
| 2026-09-01 | Phase 7 COMPLETE: Web-researched cited criteria for Kissan Card, BISP Kafaalat, and PM Youth Loan. Created `GovScheme` model, Alembic migration `007_gov_scheme_schema` applied to Neon DB. Created `subsidy_rule_engine.py` (rule-based evaluation), FastAPI router `/api/v1/subsidy-bot/*`, typed `subsidyBotService.ts`, RN screens `SubsidyBotScreen.tsx`, `QuestionFlowScreen.tsx`, `EligibilityResultsScreen.tsx`. Design trio colors applied (`Colors.success`, `Colors.warning`, `Colors.error`), EN+UR locale strings updated, filled icons added, AppNavigator wired. TypeScript 0 errors, Python end-to-end tests passed. | Await Phase 8 |
