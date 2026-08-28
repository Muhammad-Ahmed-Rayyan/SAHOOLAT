# Architecture.md — App Flow, Architecture, Structure & Stack

---

## 1. High-Level App Flow

```
Splash → Language Select (Urdu/English) → Login/Signup (phone number + OTP)
   → Onboarding (basic profile: name, location, occupation type)
   → Dashboard (home)
        ├── Credit Score screen (score + factor breakdown + history graph)
        ├── Committee (list my committees → committee detail → contribute/view cycle)
        ├── Loan Matcher (eligibility results → program detail → "how to apply")
        ├── Wallet (balance, log income, savings toggle, history)
        ├── Insurance (my policies → policy detail → status/trigger log)
        ├── Subsidy Bot (question flow → results)
        ├── Literacy (lesson list → lesson → quiz → badges)
        └── Remittance (log entry → trends → suggestions)
   → Profile/Settings (language, notifications, logout)
```

Every module screen is reachable from the Dashboard. The Dashboard itself should surface the most relevant 3-4 modules per user based on their profile (e.g., a farmer sees Credit Score + Insurance + Loan Matcher prioritized; a daily wager sees Wallet + Committee prioritized).

---

## 2. System Architecture

```
┌─────────────────────────────┐
│   Client (React Native /    │
│   Flutter / React Web)      │
└──────────────┬──────────────┘
               │ REST/HTTPS
┌──────────────▼──────────────┐
│   Backend API                │
│   (FastAPI or Express)       │
│   - Auth service              │
│   - Module route handlers     │
│   - Scoring/matching engine   │
│   - Scheduled jobs            │
└───┬───────┬───────┬──────────┘
    │       │       │
┌───▼───┐ ┌─▼────┐ ┌▼─────────┐
│Postgres│ │Weather│ │FX Rate   │
│  DB    │ │  API  │ │  API     │
└────────┘ └───────┘ └──────────┘
```

**Scheduled/background jobs needed:**
- Daily: re-check active insurance policies against latest weather data
- Per cycle: committee due-date reminders, payout-turn calculation
- On data change: recalculate credit score

---

## 3. Folder & File Structure

### Backend (example: FastAPI)
```
/backend
  /app
    /api
      /v1
        auth.py
        credit_score.py
        committee.py
        loan_matcher.py
        wallet.py
        insurance.py
        subsidy_bot.py
        literacy.py
        remittance.py
    /core
      config.py
      security.py
    /models              # SQLAlchemy models, one file per domain
      user.py
      credit_profile.py
      committee.py
      loan_program.py
      wallet.py
      insurance_policy.py
      gov_scheme.py
      lesson.py
      remittance.py
    /services            # business logic, separated from routes
      scoring_engine.py
      loan_matching_engine.py
      insurance_trigger_engine.py
      subsidy_rule_engine.py
    /jobs                 # scheduled background tasks
      weather_check_job.py
      committee_reminder_job.py
    /db
      session.py
      migrations/
    /locales              # i18n strings
      en.json
      ur.json
    main.py
  requirements.txt
  .env.example
```

### Frontend (example: React Native)
```
/app
  /src
    /screens
      /auth
      /dashboard
      /credit-score
      /committee
      /loan-matcher
      /wallet
      /insurance
      /subsidy-bot
      /literacy
      /remittance
    /components           # shared, reusable UI components only
    /navigation
    /services              # API client calls, one file per module
    /store                 # state management (Redux/Zustand/Context)
    /locales
      en.json
      ur.json
    /theme
      colors.ts
      typography.ts
    App.tsx
  package.json
```

**Rule:** one module = one folder on both frontend and backend, named consistently across both. This keeps the codebase navigable as more people (or an AI tool) work on it in parallel.

---

## 4. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React Native (Expo) | Cross-platform, works on low-end Android, fast to iterate |
| Backend | FastAPI (Python) | Fast to build, good fit if scoring/matching logic is Python-based, auto-generates API docs |
| Database | PostgreSQL | Relational data fits this domain (users, policies, committees, transactions) |
| Auth | Phone number + OTP, JWT sessions | Matches how target users actually identify themselves — not email-based |
| Weather data | Open-Meteo API | Free, no key required, sufficient for insurance trigger demo |
| FX data | exchangerate.host (or similar free API) | For remittance context display |
| State management | Zustand or React Context | Lightweight, sufficient for this app's complexity |
| Hosting (demo) | Render/Railway (backend), Expo Go or EAS build (frontend) | Fast to deploy for a competition timeline |
| i18n | react-i18next (frontend), JSON locale files (backend messages) | Urdu-first requirement from PRD |

This stack is a recommendation based on team accessibility and competition timeline — swap any layer if your team already has stronger skills elsewhere (e.g., Node/Express instead of FastAPI is equally valid).
