# PRD.md — Product Requirements Document
## Sahoolat — AI-Powered Financial Inclusion Platform for Pakistan

---

## 1. What to Build

A mobile-first (or mobile-first-web) platform that gives unbanked and underbanked Pakistanis — small farmers, daily wage workers, first-time banking users — access to:
- A credit score built from alternative data (not bank history)
- Micro-loan matching against real microfinance institutions
- A digitized rotating savings committee (BC system)
- A simple digital wallet
- Parametric crop insurance
- Government subsidy/scheme eligibility checking
- Gamified financial literacy
- Remittance tracking

One account, one profile, all modules connected — the core value proposition is that these are normally 8 separate problems with no single trusted entry point, and this app becomes that entry point.

**This is not:** a real bank, a licensed lender, or a real payments processor. It's a financial *access and awareness* layer that simulates money movement for demo purposes and connects real users to real institutions/schemes that already exist.

---

## 2. Targeted Users

| Persona | Description | Primary need |
|---|---|---|
| Rasheed (42, small farmer) | 3 acres, no bank account, borrows informally at high rates | Credit score + loan matching + crop insurance |
| Nasreen (35, daily wage laborer) | Paid cash daily, no savings mechanism | Digital wallet + committee |
| Bilal (27, shopkeeper) | First-time banking user, has smartphone | Financial literacy + savings |
| Amma (58, remittance recipient) | Receives money from overseas relative | Remittance tracking + savings suggestions |

Design and feature decisions should always be checked against these four personas — if a feature doesn't clearly serve at least one, question whether it belongs in scope.

---

## 3. Features (Full List)

### Must-have (Phase 1 build priority)
1. **User onboarding & profile** — phone-number based signup, basic profile (name, location, occupation type)
2. **Alternative Credit Scoring** — rule-based score from land size, crop yield, utility payment consistency, savings/committee participation, in-app repayment history. Score shown with plain-language factor breakdown, not just a number.
3. **Digital Committee (BC/ROSCA)** — create/join a group, track contributions per cycle, automatic payout-turn calculation, transparent contribution log.
4. **Micro-Loan Eligibility Matcher** — match user's credit score + profile against real MFI criteria (Akhuwat, Kashf, NRSP), show eligible programs + required documents. Recommender only — does not process actual loans.

### Should-have (Phase 2 build priority)
5. **Digital Wallet** — manual income logging, auto-save rule, savings growth visualization. Internal ledger only, no real payment rail integration.
6. **Parametric Crop Insurance** — policy tied to crop + district, monitored against real weather data, auto-triggers a (simulated) payout when threshold breached. No manual claims process.

### Nice-to-have (Phase 3 / roadmap)
7. **Gov Subsidy & Scheme Eligibility Bot** — rule-based eligibility checker for Kissan Card, BISP/Benazir Kafaalat, etc.
8. **Gamified Financial Literacy** — short Urdu lessons + quizzes + badges/streaks.
9. **Remittance Tracker** — log incoming remittances, show trends, suggest savings allocation.

---

## 4. Non-Functional Requirements

- **Language:** Urdu-first UI (English secondary). All user-facing strings must live in a localization file from day one.
- **Literacy:** Icon-driven navigation, minimal dense text, voice input as a stretch goal.
- **Connectivity:** Must tolerate slow/patchy 3G. Cache core data locally where feasible.
- **Trust/transparency:** Every automated decision (credit score, insurance trigger, loan match) must show *why*, not just the outcome.
- **Explainability over black-box:** Rule-based logic is preferred over ML for all MVP decision-making — explainability matters more than sophistication for this user base and this timeline.

---

## 5. Out of Scope (explicitly, for this version)

- Real payment processing / bank integration
- Real insurance underwriting or payouts
- Real loan disbursement
- Production-grade ML credit risk modeling
- Multi-language support beyond Urdu + English

---

## 6. Success Criteria (for demo/competition)

- A judge can follow one persona's full journey across at least 3 connected modules (e.g., Rasheed: onboarding → credit score → committee participation boosts score → loan match unlocks) without needing anything explained that isn't visible in the UI.
- The app clearly communicates what's real (methodology, real MFI/scheme data) versus simulated (payments, payouts) — this is a credibility requirement, not a nice-to-have.
