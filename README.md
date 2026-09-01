# Sahoolat (سہولت) — AI-Powered Financial Inclusion Platform for Pakistan

> A mobile-first financial access and awareness platform that gives unbanked and underbanked Pakistanis — small farmers, daily wage workers, and first-time banking users — access to alternative credit scoring, digitized savings committees, microfinance loan matching, and micro-financial tools through a single, Urdu-first entry point.

---

## 📌 What This Is & What This Isn't

- **What This Is:** A financial access, awareness, and decision-support layer. It builds transparent credit scores from non-traditional data (land size, crop yield, utility bill consistency, committee reliability), digitizes informal savings committees (BC/ROSCA), and matches users against real criteria from Pakistani microfinance institutions and government programs.
- **What This Isn't:** **Not a real bank, licensed lender, or payment processor.** All money movements, wallet transactions, and payout triggers are simulated internally for demo and evaluation purposes to connect users to real, existing institutions and schemes.

---

## 🚦 Project Status

- **Phase 1: Foundation + Phone/OTP Auth + Onboarding** — ✅ Complete & Verified
- **Phase 2: Alternative Credit Scoring Engine** — ✅ Complete & Verified
- **Phase 3: Digital Committee (ROSCA / BC System)** — ✅ Complete & Verified
- **Phase 4: Micro-Loan Eligibility Matcher** — ✅ Complete & Verified
- **Phase 5: Digital Wallet & Auto-Save Rules** — ✅ Complete & Verified
- **Phase 6: Parametric Crop Insurance (Weather-Triggered)** — ✅ Complete & Verified
- **Phase 7: Gov Subsidy & Scheme Bot (Kissan Card / BISP)** — ✅ Complete & Verified
- **Phase 8: Gamified Financial Literacy (Urdu Modules & Quizzes)** — ✅ Complete & Verified
- **Phase 9: Remittance Tracker & Savings Allocation** — ✅ Complete & Verified
- **Phase 10: Final Polish & Comprehensive Review** — ⏳ Planned

---

## 🛠️ Tech Stack

| Layer | Choice | Why |
|---|---|---|
| **Frontend** | React Native (Expo) | Cross-platform, works on low-end Android devices, rapid iteration |
| **Backend** | FastAPI (Python) | High performance, typed schemas, auto-generated OpenAPI docs |
| **Database** | PostgreSQL (hosted on Neon) | Serverless Postgres, branch-based workflow, no local DB setup needed for the team |
| **Auth** | Phone Number + OTP, JWT Sessions | Identifies target users by phone number rather than email |
| **Icon System** | `@expo/vector-icons` (Ionicons filled set) | Consistent filled icons matching Design.md without external native dependencies |
| **Weather API** | Open-Meteo API | Free, no API key required, powers the crop insurance trigger job |
| **FX Rates** | exchangerate.host | Real-time exchange rates for remittance tracking |
| **State Management** | Zustand + SecureStore | Lightweight state management with secure credential storage |
| **Localization (i18n)** | react-i18next + JSON locales | Urdu-first design with full English support across app & API |

---

## ✨ Features

### Must-Have Features (Core Foundation & Financial Access)
- **User Onboarding & Profile** — ✅ Built (Phone OTP auth, occupation selection, Urdu/English preference)
- **Alternative Credit Scoring** — ✅ Built (Rule-based, explainable 0–100 score, factor breakdown, score history)
- **Digital Committee (ROSCA / BC)** — ✅ Built (Group lifecycle, payout order assignment, contribution tracking, transparent audit log, live credit score signal integration)
- **Micro-Loan Eligibility Matcher** — ✅ Built (Deterministic rule-based matching against Akhuwat, Kashf Foundation, and NRSP criteria with explainable reasoning & step-by-step application guidance)

### Should-Have Features (Personal Finance & Risk Protection)
- **Digital Wallet** — ✅ Built (Manual income logging, percentage-based auto-save, savings balance tracking, 6-month income/savings trend chart, credit score savings signal integration)
- **Parametric Crop Insurance** — ✅ Built (Policy creation tied to crop + district, daily weather-check job against Open-Meteo, automatic simulated payout on threshold breach, visible trigger log)

### Nice-to-Have Features (Literacy & Social Support)
- **Government Subsidy & Scheme Checker** — ✅ Built (Rule-based eligibility for Kissan Card and BISP/Benazir Kafaalat)
- **Gamified Financial Literacy** — ✅ Built (Urdu-first lessons, quizzes, badges/streak tracking)
- **Remittance Tracker** — ✅ Built (Remittance logging, trend view, FX context via exchangerate.host, cross-referenced savings suggestions)

---

## ⚡ Quick Start

**Windows cmd:**

```cmd
git clone https://github.com/Muhammad-Ahmed-Rayyan/SAHOOLAT.git

cd SAHOOLAT\backend

python -m venv .venv
.venv\Scripts\activate

pip install -r requirements.txt

alembic upgrade head

uvicorn app.main:app --reload --host 0.0.0.0
```
Frontend (:: in a second terminal):
```cmd
cd SAHOOLAT\app

npm install

npx expo start
```

**macOS/Linux:**
```bash
git clone https://github.com/Muhammad-Ahmed-Rayyan/SAHOOLAT.git

cd SAHOOLAT/backend && python3 -m venv .venv && source .venv/bin/activate

pip install -r requirements.txt

alembic upgrade head

uvicorn app.main:app --reload --host 0.0.0.0

# in a second terminal
cd SAHOOLAT/app && npm install && npx expo start
```

Database is hosted on Neon — no local Postgres install needed, just team access (see SETUP.md). Testing on a physical phone via Expo Go requires setting `EXPO_PUBLIC_API_URL` in `app/.env` to your machine's LAN IP, not `localhost`.

👉 **For full environment configuration, Neon team access, and troubleshooting, see [`SETUP.md`](./SETUP.md).**

---

## 📁 Project Structure

- **`backend/`** — FastAPI REST API, SQLAlchemy models, Alembic migrations, rule engines, scheduled jobs (weather checks), and localization files.
- **`app/`** — React Native (Expo) mobile frontend with Urdu-first theming, navigation, state stores, and screens.
- **`Docs/`** — Architecture, product requirements (PRD), design tokens, coding standards, and the living project state tracker (`Memory.md`).

---

## 📄 License

MIT — see [`LICENSE`](./LICENSE).