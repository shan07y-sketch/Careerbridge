# CareerBridge — Render Deployment Guide

> Canonical deployment guide. Commands below were validated against a full local
> Windows execution pass on 2026-07-18 (see `FINAL_DEPLOYMENT_REPORT.md` §4):
> migrations, seed pipeline, both production builds, production-mode boot, all
> four portals and the E2E hiring workflow, and live Gemini calls.

## Architecture on Render
Three Render resources:

1. **PostgreSQL** (Render managed Postgres 16)
2. **Web Service — backend** (Node, `backend/` as root directory)
3. **Static Site — frontend** (Vite build at repo root)

---

## 1. PostgreSQL
- Create a Render PostgreSQL instance (same region as the backend).
- Copy the **Internal Database URL** for the backend env var.
- Append `?schema=public` when setting `DATABASE_URL`.

## 2. Backend Web Service
- **Root Directory:** `backend`
- **Runtime:** Node 22+ (verified locally on Node 24)
- **Build Command:**
  ```bash
  npm ci && npx prisma generate && npm run build
  ```
- **Pre-Deploy Command** (migrations before each deploy goes live):
  ```bash
  npx prisma migrate deploy
  ```
  (Verified locally: applies all 22 migrations cleanly. Never use `migrate dev` in production.)
- **Start Command:**
  ```bash
  node dist/index.js
  ```
  (Verified locally with `NODE_ENV=production` — boots and serves `/health`; the app
  **refuses to boot** with weak/placeholder JWT secrets in production, by design.)
- **Health Check Path:** `/health`
  (also available: `/api/v1/health`, AI status at `/api/v1/ai/health`, API docs at `/api-docs`)

### Required environment variables (zod-validated in `src/config/env.ts` — boot fails if missing/invalid)
| Variable | Value / note |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `10000` (Render's default; the app reads `PORT`) |
| `DATABASE_URL` | Render Internal Database URL + `?schema=public` |
| `JWT_ACCESS_SECRET` | `openssl rand -base64 48` — weak/default secrets are rejected outside development |
| `JWT_REFRESH_SECRET` | different long random string |
| `JWT_ACCESS_EXPIRY` | `15m` (default) |
| `JWT_REFRESH_EXPIRY` | `7d` (default) |
| `CORS_ORIGIN` | exact frontend origin, e.g. `https://careerbridge-frontend.onrender.com` (no trailing slash) |
| `AI_PROVIDER` | `gemini` |
| `GEMINI_API_KEY` | optional — unset ⇒ every AI module runs in deterministic mode labelled "Estimated"; set ⇒ real Gemini |
| `GEMINI_MODEL` | `gemini-flash-latest` (default). **Do not use `gemini-2.5-flash`** — retired for new users on the Developer API (404). |
| `GEMINI_ENDPOINT` | `auto` (default) routes by key prefix (`AIza…` → Developer API, `AQ.…` → Vertex express). **Set `developer` for the current key** — its Google project has the aiplatform API disabled, so Vertex routing 403s while the Developer API works. |

### One-time seed (after first successful deploy)
Run in the Render **Shell** tab of the backend service. Note: the `seed:generate`
npm script invokes `python` (Windows-compatible); on Render's Linux image call
`python3` directly, or generate locally and commit `backend/scripts/data/*.json`,
then run only reset+ingest+validate on Render:
```bash
pip install -r requirements.txt || pip install Faker==40.31.0
python3 scripts/generate_seed_json.py     # or: npm run seed:generate (if `python` exists)
ALLOW_SEED_RESET=true npm run seed:reset
npm run seed:ingest
npm run validate                          # expect 54/54 checks green
```
`ALLOW_SEED_RESET` guards the truncation step — never set it as a permanent env
var in production; use it only for this one-time run.

Seeded users all authenticate with `seeded_user_password123` (bcrypt-hashed at
ingest). There is no seeded platform ADMIN — create one (see
`FINAL_DEPLOYMENT_REPORT.md` §4 fix 2) and **rotate all seeded credentials
before real users arrive**.

## 3. Frontend Static Site
- **Root Directory:** repo root
- **Build Command:** `npm ci && npm run build` (= `tsc -b && vite build`; verified locally, 0 errors)
- **Publish Directory:** `dist`
- **Rewrite rule** (SPA routing): `/*` → `/index.html` (Rewrite).
- **Environment:** set `VITE_API_URL` to the **backend origin only** — e.g.
  `https://careerbridge-backend.onrender.com` — **without** `/api/v1` and without a
  trailing slash. The client appends `/api/v1` itself
  (`src/services/index.ts`: `API_BASE_URL = \`${VITE_API_URL}/api/v1\``).
  Must be set **at build time** (Vite inlines it).

## 4. Post-deploy verification checklist
1. `GET https://<backend>.onrender.com/health` → 200 with `"database":"connected"`.
2. `GET .../api/v1/ai/health` → reports provider mode; with the Gemini key configured expect
   `"activeProvider":"Gemini (Production)"`, `"model":"gemini-flash-latest"`.
3. Log in with a seeded account from `backend/scripts/data/credentials.json`
   (password `seeded_user_password123`) — then **rotate/disable seeded credentials**.
4. Each portal (Student / Employer / University / Admin) loads with populated
   dashboards, campus drives, verification queue, announcements, audit history.
5. End-to-end (all verified locally): employer posts job (publish it — new jobs start as
   DRAFT) → student sees + applies → employer shortlists → student tracker updates →
   university/admin analytics reflect it → AI recommendations rank the new job.
6. AI spot checks: student Career Coach insight, mock interview report persistence,
   employer candidate evaluation, admin platform insights — real output, or
   clearly-labelled deterministic fallback, never an error page.

## 5. Troubleshooting
- **Boot fails immediately** → check logs for the zod env validation error; missing
  `DATABASE_URL`/JWT secret is the most common cause. Weak JWT secrets are rejected in production.
- **`P1001: can't reach database`** → use the *Internal* DB URL (same region), not the external one.
- **Migrations fail on deploy** → run `npx prisma migrate deploy` in the service Shell for the
  full error; never `migrate dev` in production.
- **Prisma engine mismatch** (`query_engine` not found) → the build must run `npx prisma generate`
  on Render (Linux) — never commit a locally generated Windows client.
- **CORS errors in browser** → `CORS_ORIGIN` must exactly match the frontend origin.
- **AI returns "Estimated" labels** → `GEMINI_API_KEY` unset/invalid; check `/api/v1/ai/health`
  and server logs (they include Google's exact 4xx reason and detected key type).
- **403 from Gemini with an `AQ.` key** → usually the key's GCP project has the aiplatform API
  disabled. Set `GEMINI_ENDPOINT=developer` (verified working for this key). The backend log
  shows Google's error body.
- **404 "model no longer available"** → the configured model is retired for new users; use
  `gemini-flash-latest` (or another model listed by the key's `/v1beta/models` endpoint).
- **Cold starts / sleeping** (free tier) → first request after idle is slow; upgrade the
  backend instance or add an external uptime ping to `/health`.
- **Uploads disappear after redeploy** → Render's filesystem is ephemeral; attach a Render Disk
  for `backend/uploads` or move to S3-compatible storage before real launch.
