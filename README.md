<div align="center">

# 🤝 Sahoolat (سہولت)

*AI-Powered Financial Inclusion Platform for Pakistan*

![Last Commit](https://img.shields.io/github/last-commit/Muhammad-Ahmed-Rayyan/SAHOOLAT)
![languages](https://img.shields.io/github/languages/count/Muhammad-Ahmed-Rayyan/SAHOOLAT)

<br>

Built with the tools and technologies:  
![React Native](https://img.shields.io/badge/React%20Native-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)

</div>

---

## 🧠 Project Summary

**Sahoolat** gives unbanked and underbanked Pakistanis — small farmers, daily wage workers, first-time banking users, and remittance recipients — a single, Urdu-first entry point to financial tools that are normally scattered across eight separate, hard-to-access problems: credit assessment, group savings, microloan discovery, personal savings, crop insurance, government benefits, financial literacy, and remittance tracking.

Sahoolat is a financial *access and awareness* layer, not a bank. It builds a transparent, fully explainable credit score from alternative data — land size, crop yield, utility payment consistency, savings committee participation, wallet activity — for people who have no formal credit history. It digitizes informal savings committees (BC/ROSCA), matches users against real criteria from actual Pakistani microfinance institutions and government schemes, and monitors real weather data to automatically trigger simulated crop insurance payouts.

**What it isn't:** a licensed lender, a bank, or a payment processor. Every wallet transaction, committee contribution, and insurance payout in the app is simulated for demonstration — the credit methodology, loan/scheme eligibility criteria, and weather data behind those simulations are real and sourced from the actual institutions and APIs they reference.

---

## 👥 Who It's For

| Persona | Situation | What Sahoolat Gives Them |
|---|---|---|
| Rasheed, 42 — small farmer | 3 acres, no bank account, borrows informally at high rates | Credit score, loan matching, crop insurance |
| Nasreen, 35 — daily wage laborer | Paid cash daily, no savings mechanism | Digital wallet, savings committee |
| Bilal, 27 — shopkeeper | First-time banking user, has a smartphone | Financial literacy, savings tools |
| Amma, 58 — remittance recipient | Receives money from an overseas relative | Remittance tracking, savings suggestions |

---

## 🚀 Features

- 📊 **Alternative Credit Scoring**
  Rule-based, fully explainable 0–100 score with a factor-by-factor breakdown and score history graph, built from land/crop data, utility payment consistency, committee participation, and savings behavior.

- 🏦 **Micro-Loan Eligibility Matcher**
  Ranked matches against real, sourced criteria from Akhuwat, Kashf Foundation, and NRSP, with required documents and application steps.

- 👛 **Digital Committee (ROSCA/BC)**
  Create or join a rotating savings group, transparent contribution log visible to every member, automatic payout-order assignment (fixed or random draw, permanently recorded).

- 💰 **Digital Wallet**
  Manual income logging, percentage-based auto-save, multi-month earnings/savings trend.

- 🌾 **Parametric Crop Insurance**
  Policy tied to crop and district, monitored daily against live weather data (Open-Meteo), automatic simulated payout on threshold breach.

- 🏛️ **Government Subsidy Checker**
  Rule-based eligibility for Kissan Card and BISP/Benazir Kafaalat.

- 🎮 **Gamified Financial Literacy**
  Urdu-first lessons, quizzes, badges, and streaks.

- 💸 **Remittance Tracker**
  Logging, trend visualization, live FX context, cross-referenced savings suggestions.

- 🔁 **Cross-Cutting Credit Feedback**
  Every module feeds real activity back into the credit score — the score is not static, it reflects actual committee reliability and savings behavior as they happen.

- 🔍 **Full Explainability**
  Every automated decision (score, match, trigger, eligibility result) shows its reasoning — nothing is a black box.

- 🌐 **Full Urdu & English Support**
  Every screen, no exceptions.

---

## 🗃️ Project Structure

```bash
backend/    # FastAPI REST API — models, migrations, rule engines, scheduled jobs, locale files
app/        # React Native (Expo) mobile frontend — screens, navigation, state, theme, locale files
Docs/       # Architecture, product requirements, design system, coding standards, and project history
```

---

## 🔧 Setup & Installation

> Make sure Python 3.8+ and Node.js are installed.

### Backend

```bash
# Clone the repo
git clone https://github.com/Muhammad-Ahmed-Rayyan/SAHOOLAT.git
cd SAHOOLAT\backend

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Run the API
uvicorn app.main:app --reload --host 0.0.0.0
```

### Frontend

```bash
cd SAHOOLAT\app
npm install
npx expo start
```

> The database is hosted on Neon — no local Postgres install needed, only shared team access. To test on a physical device via Expo Go, set `EXPO_PUBLIC_API_URL` in `app/.env` to your machine's LAN IP (not `localhost`), and run the backend with `--host 0.0.0.0` as shown above.

Full environment configuration, team database access, and troubleshooting: see [`SETUP.md`](./SETUP.md).

---

## 🔑 API Configuration

Sahoolat relies on the following external data sources — no API key is required for either:

```.env
WEATHER_API="Open-Meteo (free, no key required) — powers the crop insurance trigger job"
FX_API="exchangerate.host — live exchange rates for remittance context"
```

---

## 🧩 Design Principles

- **Explainable over sophisticated** — every scoring, matching, and eligibility decision is rule-based, not machine learning, so its reasoning can always be shown to the user
- **Urdu-first, not Urdu-only** — every screen fully supports both languages, with no hardcoded strings
- **Built for low literacy and patchy connectivity** — icon-driven navigation, minimal dense text, and graceful fallback on every external API call

---

<div align="center">

⭐ Found this project useful? Drop a star on GitHub!

</div>