# SETUP.md — Dev Environment Runbook

Start services in this order every session. All services must be configured before the app works end-to-end.

---

## 1. Database (Hosted on Neon Lakebase Postgres)

The project database is hosted on **Neon** (serverless PostgreSQL):
- **Project:** `SAHOOLAT` (`curly-violet-39400232`)
- **Organization:** `Muhammad Ahmed` (`org-lively-forest-89506850`)

### Connecting via Neon CLI / Agent Skills
Teammates connect using the official Neon CLI / MCP agent tooling rather than manually sharing raw connection strings:

```powershell
# 1. Install Neon agent skills (once per workspace)
npx skills add neondatabase/agent-skills -s neon -s neon-postgres -y

# 2. Authenticate to your Neon account
npx neon@latest auth

# 3. Link workspace to the shared SAHOOLAT project
npx neon@latest link --project-id curly-violet-39400232 --org-id org-lively-forest-89506850
```

> **Note:** Each teammate must be invited to the Neon organization (`org-lively-forest-89506850`) in the Neon Console (**Organization → Members**) by an org admin before their CLI/MCP setup can connect.

### Database Migrations & Seed Data
Migrations and initial data seeds (such as Micro-Loan programs in migration 004, Government Schemes in migration 007, and Financial Literacy lessons/quizzes/badges in migration 008) are managed via Alembic using the direct unpooled connection string:

```powershell
cd backend
.venv\Scripts\alembic.exe upgrade head
```

> **Note on Seed Data:** All structured government scheme criteria (Phase 7) and bilingual literacy curriculum content (Phase 8) are embedded directly within their respective Alembic migrations (`007_gov_scheme_schema.py` and `008_literacy_schema.py`). Running `alembic upgrade head` automatically populates the database on fresh environments with no separate seed script required.

---

## 2. Backend (FastAPI + Uvicorn)

### Environment Configuration
Copy `backend/.env.example` to `backend/.env` and ensure:
- `JWT_SECRET_KEY` is set to a secure 32-byte hex string.
- `ENABLE_DEMO_SIMULATION=true` (enables the weather simulation endpoint `POST /insurance/simulate-weather` for local policy testing).
- `ALLOWED_ORIGINS_STR=http://localhost:8081,http://localhost:3000`

### Starting the Server
```powershell
cd backend
.venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8000 --reload
```

- Swagger UI: http://localhost:8000/docs
- Health check: http://localhost:8000/health

---

## 3. Scheduled Jobs & Background Tasks

### Daily Weather-Check Job (Parametric Crop Insurance — Phase 6)
An `AsyncIOScheduler` instance (APScheduler) starts automatically with the FastAPI application lifecycle (`@app.on_event("startup")` in `app/main.py`), running a daily automated evaluation of all active policies against live weather readings.

To verify the weather trigger engine and policy payout flow locally without waiting 24 hours:

1. **Via Python CLI (Direct Execution):**
   ```powershell
   cd backend
   .venv\Scripts\python.exe -c "from app.jobs.weather_check_job import run_weather_check_job_sync; print(f'Payouts triggered: {run_weather_check_job_sync()}')"
   ```
2. **Via REST API (Manual Trigger):**
   - Send `POST /api/v1/insurance/check-triggers` (requires authenticated JWT header) to immediately fetch live Open-Meteo weather readings for all active policy districts and trigger payouts for any breached thresholds.
3. **Via Weather Simulation Endpoint (Testing Breach Scenarios):**
   - When `ENABLE_DEMO_SIMULATION=true`, send `POST /api/v1/insurance/simulate-weather` with a custom reading to simulate extreme heat, heavy rainfall, or drought:
     ```json
     {
       "district": "Multan",
       "temp_max": 46.5,
       "temp_min": 28.0,
       "precipitation_mm": 115.0,
       "humidity_pct": 60.0
     }
     ```

---

## 4. External APIs & Offline Tolerances

Sahoolat is designed to work seamlessly in local development without requiring paid third-party API subscriptions:

- **Open-Meteo Weather API:** Used in Phase 6 for live district weather. Free, no API key required. If external network is down or requests time out (5.0s limit), `weather_service.py` automatically falls back to realistic static readings (`is_fallback: true`) to prevent crashes.
- **FX Rate APIs (open.er-api.com & exchangerate-api.com):** Used in Phase 9 for live remittance exchange rates (USD, AED, SAR, GBP to PKR). Free, no API key required. If unreachable, `fx_service.py` falls back to cached snapshot rates and flags `is_fallback: true` in API responses and frontend banners.

---

## 5. Frontend (Expo / React Native)

```powershell
cd app
npm start
```

- Scan the QR with **Expo Go** on your phone.
- Or press `a` for Android emulator / `i` for iOS simulator.

### Testing on a physical device:
- `EXPO_PUBLIC_API_URL` in `app/.env` must point to the host machine's **LAN IP** (not `localhost`), e.g.:
  `EXPO_PUBLIC_API_URL=http://192.168.X.X:8000/api/v1`
- The backend must run with `--host 0.0.0.0` (as shown above) to accept connections from other devices on the local network.

---

## 6. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Database connection error | Neon CLI not authenticated or not linked | Run `npx neon@latest auth` and link to project `curly-violet-39400232` |
| Org access denied | User not added to Neon organization | Request org admin to add your email in Neon Console (Organization → Members) |
| Expo QR scan fails | Backend on `localhost`, phone can't reach it | Switch `EXPO_PUBLIC_API_URL` in `app/.env` to your LAN IP |
| Alembic error "relation already exists" | Migration already ran | Run `alembic current` to check; don't re-run if at `head` |
| JWT `INVALID_TOKEN` errors | Backend was restarted with a new secret | Keep `JWT_SECRET_KEY` in `backend/.env` stable |
| Weather simulation 403 Forbidden | `ENABLE_DEMO_SIMULATION` is disabled | Set `ENABLE_DEMO_SIMULATION=true` in `backend/.env` and restart backend |
| FX rates show "data may be outdated" | External rate API unreachable | Normal behavior — system is operating on built-in offline fallback cache |
