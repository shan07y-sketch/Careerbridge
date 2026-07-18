# CareerBridge — Render Deployment Guide

> Draft prepared from the actual codebase (routes, env validation, scripts).
> Validate each command during local verification (see `CLAUDE_LOCAL_RUN_PROMPT.md`),
> then treat this as the canonical `DEPLOYMENT.md`.

## Architecture on Render
Three Render resources:

1. **PostgreSQL** (Render managed Postgres 16)
2. **Web Service — backend** (Node, `backend/` as root directory)
3. **Static Site — frontend** (Vite build at repo root)

---

## 1. PostgreSQL
- Create a Render PostgreSQL instance (choose the same region as the backend).
- Copy the **Internal Database URL** for the backend env var.
- Append `?schema=public` to the URL when setting `DATABASE_URL`.

## 2. Backend Web Service
- **Root Directory:** `backend`
- **Runtime:** Node 22
- **Build Command:**
  ```bash
  npm ci && npx prisma generate && npm run build
  ```
- **Pre-Deploy Command** (runs migrations before each deploy goes live):
  ```bash
  npx prisma migrate deploy
  ```
- **Start Command:**
  ```bash
  node dist/index.js
  ```
- **Health Check Path:** `/health`
  (also available: `/api/v1/health`, AI status at `/api/v1/ai/health`, API docs at `/api-docs`)

### Required environment variables (validated by zod in `src/config/env.ts` — boot fails if missing/invalid)
| Variable | Value / note |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `10000` (Render's default; the app reads `PORT`) |
| `DATABASE_URL` | Render Internal Database URL + `?schema=public` |
| `JWT_ACCESS_SECRET` | long random string (min 8 chars enforced; use 32+). **In non-development the app refuses to boot with weak/default secrets.** |
| `JWT_REFRESH_SECRET` | different long random string |
| `JWT_ACCESS_EXPIRY` | `15m` (default) |
| `JWT_REFRESH_EXPIRY` | `7d` (default) |
| `CORS_ORIGIN` | your frontend URL, e.g. `https://careerbridge-frontend.onrender.com` |
| `AI_PROVIDER` | `gemini` |
| `GEMINI_API_KEY` | optional — unset ⇒ every AI module runs in deterministic mode labelled "Estimated"; set ⇒ real Gemini. Supports `AIza...` (Developer API) and `AQ....` (Vertex express) keys — the client auto-routes by key format. |
| `GEMINI_MODEL` | `gemini-2.5-flash` (default) |

### One-time seed (after first successful deploy)
Run in the Render **Shell** tab of the backend service (needs Python 3.10+ — if the
Node image lacks it, run the generator locally, commit `backend/scripts/data/*.json`,
and run only reset+ingest+validate on Render):
```bash
pip install -r requirements.txt || pip install Faker==40.31.0
npm run seed:generate
ALLOW_SEED_RESET=true npm run seed:reset
npm run seed:ingest
npm run validate
```
`ALLOW_SEED_RESET` guards the truncation step — never set it as a permanent env var
in production; use it only for this one-time run.

## 3. Frontend Static Site
- **Root Directory:** repo root
- **Build Command:** `npm ci && npm run build` (= `tsc -b && vite build`)
- **Publish Directory:** `dist`
- **Rewrite rule** (SPA routing): `/*` → `/index.html` (Rewrite).
- Point the frontend's API base URL env (e.g. `VITE_API_URL`) at
  `https://<backend>.onrender.com/api/v1` — confirm the exact variable name in
  `src/services` during local verification, and set it in the Static Site's
  environment before building.

## 4. Post-deploy verification checklist
1. `GET https://<backend>.onrender.com/health` → 200.
2. `GET .../api/v1/ai/health` → reports provider mode (`Gemini (Production)` or MockMode/Fallback).
3. Log in with a seeded account from `backend/scripts/data/credentials.json`
   (password `seeded_user_password123`) — then **rotate/disable seeded credentials for a real launch**.
4. Each portal (Student / Employer / University / Admin) loads with populated
   dashboards, campus drives, verification queue, announcements, audit history.
5. End-to-end: employer posts job → student applies → status change propagates →
   analytics + AI recommendations refresh.

## 5. Troubleshooting
- **Boot fails immediately** → check logs for the zod env validation error; a missing
  `DATABASE_URL`/JWT secret is the most common cause. Weak JWT secrets are rejected in production.
- **`P1001: can't reach database`** → use the *Internal* DB URL (same region), not the external one.
- **Migrations fail on deploy** → run `npx prisma migrate deploy` in the service Shell to see the
  full error; never use `migrate dev` in production.
- **Prisma engine mismatch** (`query_engine` not found) → the build must run `npx prisma generate`
  on Render (Linux) — never commit a locally generated Windows client.
- **CORS errors in browser** → `CORS_ORIGIN` must exactly match the frontend origin (scheme + host, no trailing slash).
- **AI returns "Estimated" labels** → `GEMINI_API_KEY` unset/invalid; check `/api/v1/ai/health`
  and server logs, which include Google's exact 4xx reason and detected key type.
- **403 from Gemini with an `AQ.` key** → key revoked or its GCP project lacks access to
  `gemini-2.5-flash`; the backend log shows Google's error body.
- **Cold starts / sleeping** (free tier) → first request after idle is slow; upgrade the
  backend instance or add an external uptime ping to `/health`.
- **Uploads disappear after redeploy** → Render's filesystem is ephemeral; attach a Render Disk
  for `backend/uploads` or move to S3-compatible storage before real launch.
