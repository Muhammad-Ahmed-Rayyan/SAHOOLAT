# Rules.md — Standards, Libraries, and Boundaries for AI-Assisted Development

This file exists so any AI coding tool (or teammate) working on this project makes consistent decisions without re-litigating them every session.

---

## 1. What to Use

**Backend**
- FastAPI for all API routes (see Architecture.md for structure)
- SQLAlchemy as the ORM, Alembic for migrations
- Pydantic models for all request/response validation — never pass raw dicts across layers
- `python-jose` or `pyjwt` for JWT auth
- APScheduler (or FastAPI's built-in background tasks for simple cases) for scheduled jobs
- `httpx` for external API calls (weather, FX) — async-friendly

**Frontend**
- React Native with Expo (managed workflow, unless a specific native module forces a bare workflow)
- React Navigation for routing
- Zustand for state management (avoid Redux boilerplate unless the team already knows it well)
- react-i18next for localization
- Axios or native `fetch` (pick one, stay consistent) for API calls
- A single shared `/theme` module (colors, typography) referenced everywhere — see Design.md

**General**
- Environment variables via `.env` files, never hardcoded secrets/keys, ever — including demo/API keys
- Database access for the team goes through the shared Neon org (each member authenticates individually via Neon CLI/MCP) rather than a distributed raw connection string.
- Git: one feature branch per module, descriptive commit messages, no direct commits to `main`

---

## 2. What to Avoid

- **No black-box ML for MVP scoring/matching/eligibility logic.** Rule-based, explainable logic only — see PRD.md non-functional requirements. If ML is added later as a stretch goal, it must be clearly labeled as experimental/proof-of-concept in the UI and docs, and must never fully replace the explainable rule layer.
- **No real payment/money-movement integration.** All wallet, insurance payout, and loan flows are simulated/logged internally. Do not attempt to integrate real banking or payment gateway APIs for this version.
- **No fabricated data presented as real.** Microfinance eligibility criteria, government scheme criteria, and any statistics shown in-app must be sourced from real, cited sources (see PRD.md/original guide for source list). If a placeholder/synthetic value is used during development, mark it clearly (e.g., a `TODO: replace with real criteria` comment) — never ship a demo where synthetic data is presented as fact without disclosure.
- **No English-only screens.** Every user-facing string goes through the locale files — do not hardcode UI text directly in components.
- **No dense text walls.** This app is for low-literacy users — avoid multi-paragraph explanations in the UI; keep to short lines, icons, and progressive disclosure ("tap to learn more" rather than showing everything at once).
- **No premature complexity.** Don't build the bidding-based committee payout system, real geolocation branch-finder, or SMS gateway integration unless the core MVP (Phase 1–2 in Phases.md) is fully working first. Stretch goals only after core flow is demo-ready.
- **No mixing business logic into route handlers.** All scoring, matching, and trigger logic lives in `/services`, not inline in `/api` route files — keeps logic testable and reusable.

---

## 3. Error Handling Standards

- All API endpoints return a consistent error shape: `{ "error": true, "message": "...", "code": "..." }` — never let raw stack traces reach the client.
- Every external API call (weather, FX) must have a timeout and a graceful fallback (e.g., show cached/last-known value with a "data may be outdated" indicator) rather than crashing the screen.
- Form inputs (especially phone number, amounts, land size) must be validated both client-side (immediate feedback) and server-side (source of truth) — never trust client-side validation alone.
- Any scheduled job failure (e.g., weather check job) must log the failure but must not silently fail without any record — add basic logging from day one, not as an afterthought.

---

## 4. Boundaries for AI Coding Tools

- Always check PRD.md for scope before adding a feature not listed there. If something seems useful but isn't in PRD.md, flag it as a suggestion rather than building it unprompted.
- Always check Phases.md before starting work — build in phase order, don't jump ahead to Phase 4 features while Phase 1 is incomplete.
- Always update Memory.md at the end of a work session (see Memory.md) — this is not optional bookkeeping, it's what makes the next session (human or AI) productive instead of re-discovering state from scratch.
- When a design decision isn't covered in Design.md, ask rather than inventing a new color/font/pattern — consistency matters more than any single component looking slightly better in isolation.
- Never remove or bypass the explainability requirement (showing "why" behind a score/decision) to simplify implementation — this is a core product requirement, not a nice-to-have UI detail.
