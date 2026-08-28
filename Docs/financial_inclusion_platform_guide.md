# SAHOOLAT — AI-Powered Financial Inclusion Platform for Pakistan
### Complete Project Guide (Product + Technical Specification)

> This document is the single source of truth for this project. Anyone — a teammate or an AI coding assistant — should be able to read this file and know exactly what to build, why it exists, and how it should work, with no outside context needed.

---

## 1. Project Overview

**Working name:** Sahoolat ("facility/ease" in Urdu — change if you want a different name)

**One-line pitch:** A single mobile-first platform that gives Pakistan's unbanked population — small farmers, daily wage workers, informal savers — access to credit, insurance, savings, government subsidies, and financial literacy, using alternative data instead of the traditional bank credit history they don't have.

**Why this matters (Pakistan context):**
- An estimated 100+ million adults in Pakistan are unbanked or underbanked (SBP/World Bank Findex data — verify latest figures before your presentation).
- Small farmers and daily wagers have no formal credit history, so banks won't lend to them — they're forced into informal lending at exploitative interest rates.
- Crop insurance exists on paper but claims processes are slow, manual, and mistrusted, so uptake is near zero.
- Informal savings committees (*committees*/BC system) are widely trusted but entirely undigitized, unauditable, and vulnerable to fraud or default.
- Government schemes like the Kissan Card and BISP exist, but most eligible people don't know they qualify or how to apply.
- Financial literacy is low, especially among first-time smartphone/banking users, and materials are rarely in Urdu/regional languages.
- Remittances from overseas relatives are a major household income source but are poorly tracked and optimized by receiving families.

**Core design principles for this project:**
1. **Local-language first** — Urdu (and ideally Sindhi/Punjabi) UI, not just English with a translate button.
2. **Low-literacy friendly** — icons, voice, and simple flows over dense text and forms.
3. **Low-bandwidth friendly** — assume 3G/patchy connections, not fast urban wifi.
4. **Offline-tolerant where possible** — core data should cache locally and sync later.
5. **Trust-building UI** — this is money; the app must feel transparent (show *why* a score/decision was made, not just the number).

---

## 2. Target Users (Personas)

Use these personas to test every feature against — if a feature doesn't make sense for at least one of these, question why it's in the MVP.

1. **Rasheed, 42, small farmer (Sindh)** — owns 3 acres, no bank account, borrows from a local *arthi* (middleman) at high informal interest every season. Has a basic Android phone, semi-literate, comfortable with voice notes on WhatsApp.
2. **Nasreen, 35, daily wage agricultural laborer** — paid in cash daily, no savings mechanism beyond hiding cash at home, participates in an informal *committee* with 10 other women.
3. **Bilal, 27, small shopkeeper/first-time banking user** — has a smartphone and basic literacy, wants to build savings and eventually get a small business loan, doesn't understand formal banking products.
4. **Overseas-linked household (Amma, 58)** — receives remittances monthly from a son working abroad, doesn't track spending/saving of that money systematically.

---

## 3. Feature Modules — Full Detail

The platform has **8 modules**. Each is described below with: what it is, what it must do, and how to implement it. Treat each module as a semi-independent feature that shares one user account, one profile, and one data layer.

### Module 1 — Alternative Credit Scoring Engine

**What it is:** A credit score generated *without* traditional bank/credit-bureau history, using alternative data points that are actually available for this population.

**What it must do:**
- Collect inputs: land size & ownership status, crop type(s) grown, historical yield (self-reported or estimated), utility bill payment consistency (electricity/mobile top-up regularity as a proxy), mobile money transaction patterns if any, participation history in a digital *committee* (Module 3), repayment history within this app.
- Output a **score (e.g., 300–850 scale, like FICO, so it's intuitive)** plus a **plain-language explanation**: "Your score is 620. This is based on: consistent utility payments (+), stable crop yield history (+), no prior loan history (neutral)."
- Score must update over time as more data accumulates (e.g., after each *committee* cycle or utility payment).
- Must be usable by Module 4 (micro-loan matching) as an eligibility input.

**How to implement it:**
- **MVP approach (hackathon-feasible):** Rule-based weighted scoring model, NOT a black-box ML model — this is more explainable and realistic to build/demo in a short timeframe. Example weights: land ownership (20%), yield consistency (25%), utility payment regularity (20%), savings/committee participation (20%), in-app repayment history (15%).
- **Stretch goal:** Train a simple logistic regression or gradient-boosted model (XGBoost/LightGBM) on a synthetic dataset you construct yourself (since real credit bureau alt-data for Pakistan isn't publicly available) — clearly label this as a proof-of-concept model in your presentation, not a production-ready one.
- Data model: a `CreditProfile` table linked to `User`, storing each input field, last-updated timestamp, and computed score history (so you can show a score trend graph — good demo material).
- Always show the **factor breakdown**, not just the number — this is a trust and explainability requirement, not optional polish.

---

### Module 2 — Parametric Crop Insurance

**What it is:** Insurance that pays out automatically when a measurable trigger condition is met (e.g., rainfall below X mm in a season, or flood detected in the district) — no manual claims adjuster needed.

**What it must do:**
- Let a farmer select a policy tied to their crop type + district (premium calculated from historical weather risk for that district).
- Continuously monitor a real weather/rainfall data feed for that district.
- Automatically trigger and log a payout event when the pre-agreed threshold is breached — no farmer-submitted claim required.
- Show policy status clearly: active, monitoring, triggered, paid.
- Notify the farmer (push notification/SMS) the moment a trigger condition is detected, before payout even completes — this builds trust fast.

**How to implement it:**
- Weather data: use the **Pakistan Meteorological Department (PMD)** public data if accessible, or a global API like **Open-Meteo** or **OpenWeatherMap** (free tier) filtered to Pakistani districts as a working substitute for the demo — be explicit in your docs about which data source you actually used.
- Trigger logic: a simple threshold rule (e.g., "if cumulative rainfall in the policy's monsoon window < 150mm, trigger drought payout") is enough for MVP — no need for complex actuarial modeling.
- Data model: `InsurancePolicy` (crop type, district, premium, threshold rule, coverage amount, status), `WeatherReading` (district, date, rainfall/temp), `PayoutEvent` (policy_id, trigger_date, amount, status).
- Payout itself can be simulated in the MVP (mark as "paid" in-app + log to Module 5's wallet) rather than integrating real payment rails — note this clearly as a simulated/demo limitation.
- Background job: a scheduled task (cron or simple interval check) that re-evaluates all active policies against latest weather data daily.

---

### Module 3 — Digital Committee (Rotating Savings / BC System)

**What it is:** A digitized version of the informal "committee" (ROSCA — Rotating Savings and Credit Association) system already trusted and widely used in Pakistani communities, where a group contributes a fixed amount each cycle and one member receives the full pool in rotation.

**What it must do:**
- Let a user create or join a committee group: set contribution amount, cycle frequency (weekly/monthly), number of members, and payout order (fixed order, random draw, or bidding).
- Track each member's contribution status per cycle (paid/unpaid) with reminders.
- Automatically calculate and reveal whose turn it is to receive the payout.
- Maintain a transparent, tamper-evident log of every contribution and payout (this replaces the trust that used to rely purely on the group organizer's honesty).
- Feed successful participation history into Module 1's credit score as a positive signal.

**How to implement it:**
- Data model: `Committee` (name, amount, frequency, member_count, payout_order_type), `CommitteeMember` (user_id, committee_id, position_in_rotation), `CommitteeCycle` (cycle_number, due_date, status), `Contribution` (cycle_id, member_id, amount, paid_status, timestamp).
- Payout order logic: for MVP, implement fixed-order and random-draw only (bidding system is a stretch goal — more complex).
- Reminders: simple in-app notification + optionally an SMS reminder simulation (real SMS gateway integration is a stretch goal, not required for demo).
- For an added trust layer beyond MVP: a hash-chained log of contributions (each record stores a hash of the previous record) gives you a lightweight, presentable "tamper-evident ledger" story without needing a real blockchain — good talking point for judges without the overhead of actual blockchain infrastructure.

---

### Module 4 — Micro-Loan Eligibility Matcher

**What it is:** A matcher that takes a user's profile + credit score and tells them which real microfinance institutions (Akhuwat, Kashf Foundation, NRSP, etc.) they're likely eligible for, and what the application process looks like.

**What it must do:**
- Take inputs: credit score (Module 1), loan purpose (agriculture/business/personal), requested amount, location.
- Match against a rules table of known microfinance program eligibility criteria (you'll need to research and hardcode real criteria for 3–5 real Pakistani MFIs for this to be credible).
- Return a ranked list: "You're likely eligible for Akhuwat's interest-free agriculture loan up to Rs. X — here's what documents you need and the nearest branch."
- Should NOT process the actual loan — this module is a matcher/recommender, not a lender. Be explicit about this scope boundary.

**How to implement it:**
- Data model: `MicrofinanceProgram` (institution_name, loan_type, min_score, max_amount, eligibility_criteria, required_documents, contact_info), simple rule-matching function against the user's `CreditProfile`.
- Research real criteria from Akhuwat, Kashf Foundation, and NRSP websites and cite sources in your appendix — this is what makes the module credible in a demo versus made-up numbers.
- Nearest branch: if time allows, integrate a static list of branch locations with basic distance calculation (even a hardcoded lookup table by city/district is fine for MVP — full geolocation is a stretch goal).

---

### Module 5 — Digital Wallet for Daily Wagers

**What it is:** A simple digital wallet so daily wage workers who are currently 100% cash-based can start building a transaction history and small savings habit.

**What it must do:**
- Let a user record daily earnings (manual entry is fine for MVP — real payment integration is out of scope).
- Let a user set a "save X% automatically" rule that moves a portion of logged income into a separate savings balance within the wallet.
- Show simple visualizations: daily/weekly/monthly earnings trend, savings growth.
- This transaction history feeds Module 1's credit score as a data signal (consistency of income/savings behavior).

**How to implement it:**
- Data model: `WalletAccount` (user_id, balance, savings_balance), `Transaction` (wallet_id, type: earning/save/withdraw, amount, timestamp).
- Keep this intentionally simple — it's a ledger and a habit-forming UI, not a payments processor. Do not attempt real money movement/integration with banks for this project; log everything as internal ledger entries.
- Good demo moment: show the savings balance growing automatically over a simulated month of entries.

---

### Module 6 — Government Subsidy & Scheme Eligibility Bot

**What it is:** A simple eligibility checker/chatbot that tells users which government schemes (Kissan Card, BISP, Benazir Kafaalat, etc.) they likely qualify for, since most eligible people simply don't know these exist.

**What it must do:**
- Ask a short series of questions (land ownership, income level, family size, province, farmer/non-farmer) via a simple conversational or form-based flow.
- Return a list of schemes they likely qualify for, with a plain-language explanation of the scheme and how to apply.
- Should work in Urdu, and ideally support a voice-input option for low-literacy users (stretch goal).

**How to implement it:**
- This does NOT need a real LLM/AI chatbot for MVP — a decision-tree / rule-based flow (a sequence of if/else questions) is faster to build, fully explainable, and just as effective for a defined question set. If you want to use an LLM (e.g., calling the Anthropic API) to make the conversation feel more natural, that's a good stretch-goal enhancement layered on top of the rule engine — but the actual eligibility logic should stay rule-based, not left to a model to "guess."
- Data model: `GovScheme` (name, eligibility_criteria as structured rules, description, application_process, official_link).
- Research real, current criteria for at least Kissan Card and BISP/Benazir Kafaalat and cite official sources — accuracy matters more than coverage here.

---

### Module 7 — Gamified Financial Literacy

**What it is:** A simple, game-like learning module (quizzes, short lessons, streaks/badges) that teaches first-time banking users core concepts: what a bank account is, what interest means, how to budget, what a scam looks like.

**What it must do:**
- Present short lessons (1–2 minutes each) in Urdu, ideally with audio narration for low-literacy users.
- Follow each lesson with a short quiz (this app already has a quiz-card capability you can reuse as a UI pattern — multiple choice, immediate feedback with explanation).
- Track progress and award simple badges/streaks to encourage return usage.
- Cover practical, locally relevant scenarios (e.g., "a stranger calls offering a loan with no paperwork — is this safe?") rather than generic textbook finance content.

**How to implement it:**
- Data model: `Lesson` (title, content, order), `Quiz` (lesson_id, questions), `UserProgress` (user_id, lesson_id, completed_status, quiz_score), `Badge` (user_id, badge_type, earned_date).
- Content creation is the real work here — write 8–10 short, locally relevant lessons yourselves; don't just port generic "financial literacy 101" content, since local relevance is your competitive edge in judging.

---

### Module 8 — Remittance Tracker & Optimizer

**What it is:** A tool for households receiving overseas remittances to track incoming amounts, see spending/saving patterns, and get simple suggestions (e.g., "you've received Rs. 40,000 this month, historically you save none of it — consider allocating 10% to your committee").

**What it must do:**
- Let a user log incoming remittances (amount, date, sender, method).
- Show trends over time (monthly totals, sender frequency).
- Cross-reference with Module 5 (wallet) and Module 3 (committee) to suggest a savings allocation.
- Optional: currency context (show what the received PKR amount corresponds to, e.g. exchange-rate trend, sourced from a public FX API) so the household understands value shifts over time.

**How to implement it:**
- Data model: `RemittanceRecord` (user_id, amount_pkr, date, sender_name, method: bank/exchange/hawala-informal).
- Suggestions engine: keep this rule-based for MVP too (e.g., "if savings rate < 10% of remittance income, suggest committee enrollment") — no ML needed.
- FX rate data: any free public exchange rate API (e.g., exchangerate.host) is sufficient for context display.

---

## 4. Recommended Tech Stack

Pick based on your team's actual skills — this is a recommendation, not a mandate.

| Layer | Recommendation | Notes |
|---|---|---|
| Frontend (mobile) | React Native or Flutter | Cross-platform, works on low-end Android which is what your real users have |
| Frontend (if web/demo only) | React + Tailwind | Faster to build for a hackathon demo if a native app isn't required |
| Backend | Node.js (Express) or Python (FastAPI) | FastAPI is a strong choice if your scoring/matching logic is more comfortable in Python |
| Database | PostgreSQL | Relational data (users, policies, committees, transactions) fits relational modeling well |
| Auth | Simple JWT-based auth, phone-number based (not email) since that matches how your target users actually identify themselves | |
| Weather data | Open-Meteo API (free, no key needed) or PMD if accessible | |
| FX data | exchangerate.host or similar free API | |
| Hosting (demo) | Vercel/Render/Railway for backend, or fully local for a hackathon demo | |
| Language support | Store all user-facing strings in a localization file (Urdu + English at minimum) from day one — retrofitting i18n later is painful | |

---

## 5. System Architecture (High Level)

```
[Mobile/Web App - React Native/Flutter/React]
              |
      [Backend API - FastAPI/Express]
              |
   -----------------------------
   |         |         |       |
[PostgreSQL] [Weather  [FX Rate [Scheduled Jobs
  Database]   API]      API]    - insurance trigger checks
                                 - committee cycle reminders
                                 - credit score recalculation]
```

- One unified `User` table with a `UserProfile` that all 8 modules read from and write to — avoid building 8 disconnected mini-apps; the whole value proposition is that it's ONE identity across all financial services.
- Shared notification service (in-app + optionally SMS-simulated) used by Modules 2, 3, and 6.

---

## 6. MVP Scope for a Time-Boxed Competition

You will not fully build all 8 modules to production quality in a hackathon timeframe. Prioritize like this:

**Must-have (core demo, build these fully):**
1. Alternative Credit Scoring Engine (Module 1) — this is your headline differentiator
2. Digital Committee (Module 3) — visually intuitive, culturally resonant, easy to demo
3. Micro-Loan Eligibility Matcher (Module 4) — ties directly back to Module 1, shows end-to-end value

**Should-have (build simplified versions):**
4. Digital Wallet (Module 5)
5. Parametric Insurance (Module 2) — even a simulated trigger demo is compelling

**Nice-to-have (only if time allows, or describe as "roadmap" in your pitch):**
6. Gov Subsidy Bot (Module 6)
7. Financial Literacy (Module 7)
8. Remittance Tracker (Module 8)

For the modules you don't fully build, still include them in your pitch deck/README as "Phase 2 roadmap" with a short description — judges reward vision as long as you're honest about what's built versus planned.

---

## 7. Data Sources to Cite (Research Before Building)

- State Bank of Pakistan (SBP) — financial inclusion statistics
- World Bank Global Findex Database — unbanked population data
- Pakistan Bureau of Statistics — agriculture/income data
- Akhuwat, Kashf Foundation, NRSP official websites — real microfinance eligibility criteria
- Pakistan Meteorological Department / Open-Meteo — weather data for insurance triggers
- BISP / Kissan Card official eligibility criteria

Do not fabricate statistics for your presentation — pull real, cited figures for the problem statement slide, since this is usually where teams lose credibility with judges.

---

## 8. Risks & Honest Limitations (state these upfront, don't hide them)

- No real payment rail integration — all money movement is simulated/logged, not real transactions.
- Credit scoring model is a rule-based proof-of-concept, not a validated financial risk model.
- Weather-triggered insurance payouts are simulated, not connected to a real insurer.
- Alternative data inputs (yield, income) are largely self-reported in the MVP, which is a real-world fraud/accuracy risk worth acknowledging in your pitch — and a good place to mention future work (e.g., satellite-verified yield data).

---

## 9. Suggested Team Task Split

- **Backend/data modeling:** Modules 1, 2, 4 (scoring, insurance logic, matching rules)
- **Frontend/UI:** Committee module (3) and Wallet (5) — most visual, most demo-friendly
- **Content/research:** Real MFI criteria, gov scheme criteria, financial literacy lesson content, Urdu translations
- **Integration/APIs:** Weather API, FX API, notification system
- **Pitch/demo prep:** Problem statement slide with real cited stats, live demo script, Phase 2 roadmap slide

---

## 10. Demo Script Suggestion

For judges, walk through **one persona's full journey**, not each module in isolation:

> "Rasheed is a small farmer. He signs up, and Module 1 builds his credit score from his land size and mobile top-up history. He joins a digital committee with his neighbors (Module 3) — his participation boosts his score. Module 4 shows him he now qualifies for an Akhuwat loan he didn't know about. Meanwhile, Module 2 shows insurance monitoring his crop's rainfall data automatically — if a drought hits, he gets paid without filing a claim."

This narrative-driven demo is far more memorable to judges than clicking through 8 disconnected screens.
