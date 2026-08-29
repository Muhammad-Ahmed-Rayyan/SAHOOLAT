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

### Database Migrations
Migrations are managed via Alembic using the direct unpooled connection string:

```powershell
cd backend
.venv\Scripts\alembic.exe upgrade head
```

---

## 2. Backend (FastAPI + Uvicorn)

```powershell
cd backend
.venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8000 --reload
```

- Swagger UI: http://localhost:8000/docs
- Health check: http://localhost:8000/health

---

## 3. Frontend (Expo / React Native)

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

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Database connection error | Neon CLI not authenticated or not linked | Run `npx neon@latest auth` and link to project `curly-violet-39400232` |
| Org access denied | User not added to Neon organization | Request org admin to add your email in Neon Console (Organization → Members) |
| Expo QR scan fails | Backend on `localhost`, phone can't reach it | Switch `EXPO_PUBLIC_API_URL` in `app/.env` to your LAN IP |
| Alembic error "relation already exists" | Migration already ran | Run `alembic current` to check; don't re-run if at `head` |
| JWT `INVALID_TOKEN` errors | Backend was restarted with a new secret | Keep `JWT_SECRET_KEY` in `backend/.env` stable |
