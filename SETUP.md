# SETUP.md — Dev Environment Runbook

Start services in this order every session. All three must be running before the app works end-to-end.

---

## 1. PostgreSQL (portable — not a Windows service)

PostgreSQL was installed as a portable binary under `D:\Projects\SAHOOLAT\pgsql\`.
It is **not** registered as a Windows service, so it must be started manually each session.

```powershell
# Start (run from any directory)
D:\Projects\SAHOOLAT\pgsql\bin\pg_ctl.exe `
  -D D:\Projects\SAHOOLAT\pgdata `
  -l D:\Projects\SAHOOLAT\pgdata\pg.log `
  start

# Verify it's accepting connections
D:\Projects\SAHOOLAT\pgsql\bin\pg_isready.exe -h localhost -p 5432
# Expected output: localhost:5432 - accepting connections

# Stop (clean shutdown before sleep/hibernate)
D:\Projects\SAHOOLAT\pgsql\bin\pg_ctl.exe `
  -D D:\Projects\SAHOOLAT\pgdata `
  stop
```

**Connection details** (used in `backend/.env`):
- Host: `localhost`
- Port: `5432`
- Database: `sahoolat_db`
- User: `sahoolat_user`
- Password: `sahoolat_pass`
- Superuser: `postgres` (no password — trust auth on localhost)

**First time only** — migrations must be run once after first DB start:
```powershell
cd D:\Projects\SAHOOLAT\backend
.venv\Scripts\alembic.exe upgrade head
```

---

## 2. Backend (FastAPI + Uvicorn)

```powershell
cd D:\Projects\SAHOOLAT\backend
.venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8000 --reload
```

- Swagger UI: http://localhost:8000/docs
- Health check: http://localhost:8000/health

---

## 3. Frontend (Expo / React Native)

```powershell
cd D:\Projects\SAHOOLAT\app
npm start
```

- Scan the QR with **Expo Go** on your phone.
- Or press `a` for Android emulator / `i` for iOS simulator.
- On a physical device, the backend URL must be your machine's **LAN IP** (not `localhost`):
  - Edit `app/.env`: `EXPO_PUBLIC_API_URL=http://192.168.X.X:8000/api/v1`

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `verify-otp` returns 500 | PostgreSQL not running | Run the `pg_ctl start` command above |
| `pg_isready` says "no response" | Port 5432 blocked or `pgdata` path wrong | Check the `-D` path; run `pg_ctl status -D D:\...\pgdata` |
| Expo QR scan fails | Backend on `localhost`, phone can't reach it | Switch `EXPO_PUBLIC_API_URL` to your LAN IP |
| Alembic error "relation already exists" | Migration already ran | Run `alembic current` to check; don't re-run if at `head` |
| JWT `INVALID_TOKEN` errors | Backend was restarted with a new `.env`-generated secret | The secret is stable (hardcoded in `.env`) — only happens if `.env` was regenerated |
