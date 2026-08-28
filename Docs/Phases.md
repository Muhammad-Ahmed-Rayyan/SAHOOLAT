# Phases.md — Build Plan

Build strictly in this order. Do not start a phase until the previous one is functionally complete and demoable on its own.

---

### Phase 1: Foundation + Auth
- Project scaffolding (backend + frontend structure per Architecture.md)
- Database setup + core `User` and `UserProfile` models
- Phone number + OTP signup/login flow
- Language selection (Urdu/English) + locale file wiring
- Basic onboarding form (name, location, occupation type)
- Empty Dashboard shell (navigation to all module screens, even if screens are placeholders)

**Done when:** a user can sign up, log in, select a language, complete onboarding, and land on a navigable (even if mostly empty) dashboard.

---

### Phase 2: Credit Scoring Engine
- `CreditProfile` model (land size, crop yield, utility payment consistency, savings/committee flag, repayment history)
- Manual data entry screens for credit inputs (since no real bank-linked data source exists)
- Rule-based scoring engine (`/services/scoring_engine.py`)
- Score display screen: score number + plain-language factor breakdown + score history graph

**Done when:** a user can enter their data and see a generated score with a clear explanation of what drove it.

---

### Phase 3: Digital Committee
- `Committee`, `CommitteeMember`, `CommitteeCycle`, `Contribution` models
- Create/join committee flow
- Contribution tracking per cycle + payout-turn calculation (fixed order + random draw)
- Committee detail screen with transparent contribution log
- Hook committee participation into the credit scoring engine as a positive signal

**Done when:** two or more test users can form a committee, log contributions across cycles, and see the payout rotation calculated correctly, with the credit score reflecting participation.

---

### Phase 4: Micro-Loan Eligibility Matcher
- `MicrofinanceProgram` model, seeded with real researched criteria (Akhuwat, Kashf, NRSP — at least 3 programs)
- Matching logic against credit score + profile (`/services/loan_matching_engine.py`)
- Results screen: ranked eligible programs + required documents + how to apply

**Done when:** a user with a generated credit score sees a realistic, sourced set of loan matches.

---

### Phase 5: Digital Wallet
- `WalletAccount`, `Transaction` models
- Manual income logging screen
- Auto-save rule (percentage-based) + savings balance tracking
- Earnings/savings trend visualization
- Hook wallet activity into credit scoring engine as a signal

**Done when:** a user can log income over several simulated entries and watch their savings balance and score respond.

---

### Phase 6: Parametric Crop Insurance
- `InsurancePolicy`, `WeatherReading`, `PayoutEvent` models
- Policy creation flow (crop type + district + threshold rule)
- Weather API integration + daily scheduled trigger-check job
- Policy status screen (active/monitoring/triggered/paid) + notification on trigger

**Done when:** a policy can be created, the background job correctly evaluates it against real weather data, and a trigger event is visibly logged and reflected in the UI.

---

### Phase 7 (stretch): Gov Subsidy Bot
- `GovScheme` model seeded with real criteria (Kissan Card, BISP at minimum)
- Rule-based question flow → eligibility results screen

---

### Phase 8 (stretch): Gamified Financial Literacy
- `Lesson`, `Quiz`, `UserProgress`, `Badge` models
- 8-10 authored lessons (Urdu-first) + quiz flow + badge/streak tracking

---

### Phase 9 (stretch): Remittance Tracker
- `RemittanceRecord` model
- Log entry flow + trend visualization
- Rule-based savings suggestion, cross-referencing Wallet + Committee data
- FX API integration for context display

---

### Phase 10: Polish + Demo Prep
- Full Urdu localization pass (no hardcoded English strings remaining)
- Error handling audit against Rules.md standards
- Persona-driven demo script walkthrough (see PRD.md success criteria)
- README + pitch deck with cited statistics and clearly labeled "what's real vs. simulated" section

---

**Reminder:** update Memory.md at the end of every phase (and ideally every session) — see Memory.md.
