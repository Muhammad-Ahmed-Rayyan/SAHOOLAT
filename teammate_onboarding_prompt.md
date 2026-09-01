# Teammate Onboarding Prompt — Pull Latest, Connect to Neon, Get Running

Context: this project (Sahoolat) has moved from local Postgres to a shared hosted Neon database, and Phases 3 and 4 have been added since you last worked on it (committee module, loan matcher, an icon system, and a language-persistence fix). This prompt gets your local setup fully in sync — code, database connection, and both backend/frontend running.

## 1. Pull latest changes

From the repo root:
```
git status
```
Report any uncommitted local changes before proceeding — do not discard anything without confirming with me first. If clean:
```
git pull origin main
```
Report what changed (file list or `git log --oneline -10` since your last known commit) so it's clear what's new.

## 2. Backend — install dependencies and switch to Neon

From `backend/`:
```
pip install -r requirements.txt
```
(picks up anything added since Phase 2)

Check if `backend/.env` exists. If it does, back it up first (copy to `backend/.env.bak`) since it likely has an old local Postgres `DATABASE_URL` that needs replacing — don't just overwrite silently. If it doesn't exist, create it from `backend/.env.example`.

Install Neon's agent tooling if not already present:
```
npx skills add neondatabase/agent-skills -s neon -s neon-postgres -y
```
Follow whatever setup it prompts for.

Authenticate with Neon (this requires me to open a browser — tell me exactly when to run `npx neon@latest auth` myself in the terminal, then wait for my confirmation before continuing):
```
npx neon@latest auth
```

Once I confirm authentication succeeded, link and pull the shared project's connection details (run from `backend/`):
```
npx neon@latest link --project-id curly-violet-39400232 --org-id org-lively-forest-89506850
npx neon@latest env pull
```

Verify `backend/.env` now has real `DATABASE_URL` and `DATABASE_URL_UNPOOLED` values pointing at a `neon.tech` host — show me the (redacted, no password shown) host portion to confirm, don't print the full connection string with credentials into chat.

Fill in the remaining non-secret variables in `backend/.env` by comparing against `backend/.env.example` — anything present in the example but missing from `.env` (e.g. `ALLOWED_ORIGINS_STR`, `OTP_EXPIRE_MINUTES`, `JWT_ALGORITHM`) should be added. Generate a fresh `JWT_SECRET_KEY` for local use:
```
python -c "import secrets; print(secrets.token_hex(32))"
```
and put that value in `.env` — do not reuse any placeholder or another teammate's key.

## 3. Verify the database connection

```
alembic upgrade head
```
Since the shared Neon database already has all migrations applied, this should report "already at head" with no changes made — that's the expected, correct outcome here, not a failure. If it tries to apply migrations, stop and tell me before proceeding, since that would mean something is out of sync.

Start the backend and confirm it boots cleanly:
```
uvicorn app.main:app --reload --host 0.0.0.0
```
Report the startup log output.

## 4. Frontend setup

From `app/`:
```
npm install
```
Check if `app/.env` exists — if not, create from `app/.env.example`.

Ask me for my machine's local LAN IP address before setting `EXPO_PUBLIC_API_URL` — do not guess or reuse an IP from a doc or another teammate's setup, since this is machine-specific. I'll get mine by running `ipconfig` and provide the IPv4 address if I want to test on a physical phone; if I'm using an emulator on this same machine, `localhost` is correct instead and no LAN IP is needed — ask me which one applies before editing the file.

Once set, start Metro:
```
npx expo start
```

## 5. Final check

Report back: confirmation that `git pull` succeeded, that the backend boots with a valid Neon connection, and that Metro starts cleanly. Do not consider this done until I've actually confirmed the app runs and connects on my device — a clean terminal alone isn't sufficient proof, since network/env issues often only show up when actually used.

Do not modify any code, only environment/dependency setup — if the app runs but shows a bug, report it and stop rather than attempting a fix, since any code changes should go through the same review process as everything else in this project.
