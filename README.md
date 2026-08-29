# Sahoolat (سہولت) — AI-Powered Financial Inclusion Platform for Pakistan

> A mobile-first financial access and awareness platform that gives unbanked and underbanked Pakistanis — small farmers, daily wage workers, and first-time banking users — access to alternative credit scoring, digitized savings committees, microfinance loan matching, and micro-financial tools through a single, Urdu-first entry point.

---

## 📌 What This Is & What This Isn't

- **What This Is:** A financial access, awareness, and decision-support layer. It builds transparent credit scores from non-traditional data (land size, crop yield, utility bill consistency, committee reliability), digitizes informal savings committees (BC/ROSCA), and matches users against real criteria from Pakistani microfinance institutions and government programs.
- **What This Isn't:** **Not a real bank, licensed lender, or payment processor.** All money movements, wallet transactions, and payout triggers are simulated internally for demo and evaluation purposes to connect users to real, existing institutions and schemes.

---

## 🚦 Project Status

> **Current Phase:** Phase 3 — Digital Committee (ROSCA) (Backend & Database Complete; Frontend in progress)

- **Phase 1: Foundation + Phone/OTP Auth + Onboarding** — ✅ **Complete & Verified**
- **Phase 2: Alternative Credit Scoring Engine** — ✅ **Complete & Verified**
- **Phase 3: Digital Committee (ROSCA / BC System)** — 🟡 **Backend & DB Complete (API live, scoring signal integrated); Frontend in progress**
- **Phase 4: Micro-Loan Eligibility Matcher** — ⏳ *Planned*
- **Phase 5: Digital Wallet & Auto-Save Rules** — ⏳ *Planned*
- **Phase 6: Parametric Crop Insurance (Weather-Triggered)** — ⏳ *Planned*
- **Phase 7: Gov Subsidy & Scheme Bot (Kissan Card / BISP)** — ⏳ *Planned*
- **Phase 8: Gamified Financial Literacy (Urdu Modules & Quizzes)** — ⏳ *Planned*
- **Phase 9: Remittance Tracker & Savings Allocation** — ⏳ *Planned*
- **Phase 10: Final Polish & Comprehensive Review** — ⏳ *Planned*

---

## 🛠️ Tech Stack

| Layer | Choice | Why |
|---|---|---|
| **Frontend** | React Native (Expo) | Cross-platform, works on low-end Android devices, rapid iteration |
| **Backend** | FastAPI (Python) | High performance, typed schemas, auto-generated OpenAPI docs, native math/logic support |
| **Database** | PostgreSQL (Hosted on Neon) | Serverless Lakebase Postgres with instant branch-first workflow and zero local overhead |
| **Auth** | Phone Number + OTP, JWT Sessions | Identifies target users by phone number rather than email |
| **Weather API** | Open-Meteo API | Free, no API key required, reliable for parametric insurance triggers |
| **FX Rates** | exchangerate.host | Real-time exchange rates for remittance tracking |
| **State Management** | Zustand | Lightweight, minimal boilerplate state management |
| **Localization (i18n)** | react-i18next + JSON locales | Urdu-first design with full English support across app & API |

---

## ✨ Features

### Must-Have Features (Core Foundation & Financial Access)
- **User Onboarding & Profile** — ✅ *Built* (Phone OTP auth, occupation selection, Urdu/English preference)
- **Alternative Credit Scoring** — ✅ *Built* (Rule-based, 100% explainable 0–100 score, factor breakdown, score history)
- **Digital Committee (ROSCA / BC)** — 🟡 *In Progress* (Group lifecycle, dynamic payout order assignment, contribution tracking, live credit score signal integration)
- **Micro-Loan Eligibility Matcher** — ⏳ *Planned* (Rule-based matching against Akhuwat, Kashf, and NRSP criteria)

### Should-Have Features (Personal Finance & Risk Protection)
- **Digital Wallet** — ⏳ *Planned* (Manual income logging, auto-save toggle, savings visualization)
- **Parametric Crop Insurance** — ⏳ *Planned* (Open-Meteo weather monitoring with automatic payout triggers)

### Nice-to-Have Features (Literacy & Social Support)
- **Government Subsidy & Scheme Checker** — ⏳ *Planned* (Kissan Card, BISP / Benazir Kafaalat rule engines)
- **Gamified Financial Literacy** — ⏳ *Planned* (Bite-sized Urdu lessons, quizzes, badges, streak tracking)
- **Remittance Tracker** — ⏳ *Planned* (FX insights, remittance logging, savings allocation tips)

---

## ⚡ Quick Start

```powershell
# 1. Clone repository
git clone https://github.com/<your-org>/SAHOOLAT.git; cd SAHOOLAT

# 2. Setup backend & database
cd backend; python -m venv .venv; .venv\Scripts\activate; pip install -r requirements.txt
alembic upgrade head; uvicorn app.main:app --reload

# 3. Setup frontend (in a separate terminal)
cd ../app; npm install; npx expo start
```

👉 **For complete environment configuration, team Neon database onboarding, and troubleshooting, read the full [`SETUP.md`](file:///D:/Project/SAHOOLAT/SETUP.md) runbook.**

---

## 📁 Project Structure

- **`backend/`** — FastAPI REST API, SQLAlchemy models, Alembic migrations, rule engines, and localization files.
- **`app/`** — React Native (Expo) mobile frontend with Urdu-first themes, navigation, state stores, and screens.
- **`Docs/`** — Architecture, product specifications (PRD), design tokens, coding standards, and living project state tracker (`Memory.md`).

