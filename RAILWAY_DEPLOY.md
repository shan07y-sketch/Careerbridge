# CareerBridge — Deploy to Production (Railway)

Railway is the **only** production environment. All Render config has been removed.
The repo is deploy-ready and **Docker-based** — Railway builds each service from a
committed `Dockerfile`, so `node` and the Prisma CLI are guaranteed present in the
runtime image.

| File | Service | Runtime |
|------|---------|---------|
| [`Dockerfile`](Dockerfile) + [`railway.json`](railway.json) | Frontend (Vite SPA) — root dir `/` | `node:22-alpine` → `node server.js` |
| [`backend/Dockerfile`](backend/Dockerfile) + [`backend/railway.json`](backend/railway.json) | Backend (Express + Prisma) — root dir `backend` | `node:22-alpine` → `prisma migrate deploy && node dist/index.js` |
| — | Database — Railway PostgreSQL | managed |

There is **no application code coupled to any host** — the app reads `PORT`,
`DATABASE_URL`, `CORS_ORIGIN`, `APP_BASE_URL`, and `VITE_API_URL` from the
environment. Everything below is dashboard-only; no code or config edits remain.

---

## Complete environment variable reference

### Backend service
| Variable | Required | Belongs to | Description | Example / value |
|----------|----------|-----------|-------------|-----------------|
| `NODE_ENV` | ✅ set | Backend | Runtime mode; enables production security checks | `production` |
| `DATABASE_URL` | ✅ set | Backend ⇄ DB | Postgres connection. Use a Railway **reference** to the Postgres service | `${{Postgres.DATABASE_URL}}` |
| `JWT_ACCESS_SECRET` | ✅ set | Backend | Access-token signing secret. Must be ≥32 chars & not a placeholder or the app refuses to boot | (generated — see checklist) |
| `JWT_REFRESH_SECRET` | ✅ set | Backend | Refresh-token signing secret. Must differ from access secret | (generated — see checklist) |
| `CORS_ORIGIN` | ✅ set | Backend | Allowed frontend origin(s), comma-separated. Capacitor origins are always allowed automatically | `https://<frontend>.up.railway.app` |
| `APP_BASE_URL` | ✅ set | Backend | This API's own public origin, for absolute resume/share links | `https://<backend>.up.railway.app` |
| `JWT_ACCESS_EXPIRY` | ⬜ default `15m` | Backend | Access-token TTL | `15m` |
| `JWT_REFRESH_EXPIRY` | ⬜ default `7d` | Backend | Refresh-token TTL | `7d` |
| `AI_PROVIDER` | ⬜ default `gemini` | Backend | AI provider selector | `gemini` |
| `GEMINI_MODEL` | ⬜ default `gemini-flash-latest` | Backend | Gemini model id | `gemini-flash-latest` |
| `GEMINI_ENDPOINT` | ⬜ default `auto` | Backend | Gemini endpoint routing (`auto`/`developer`/`vertex`) | `auto` |
| `GEMINI_API_KEY` | ⬜ optional | Backend | Real Gemini key. **Unset → all AI runs in deterministic mock mode** (fully usable) | `AIza…` |
| `PORT` | ⛔ do **not** set | Backend | Injected by Railway; app binds `process.env.PORT` | (automatic) |
| `REDIS_URL` | ⬜ optional | Backend | Redis cache. **Leave unset → in-memory fallback** (no Redis needed) | `${{Redis.REDIS_URL}}` |
| `CLOUDINARY_URL` | ⬜ optional | Backend | Reserved; no cloud storage provider is wired up, so leave unset | — |

### Frontend service
| Variable | Required | Belongs to | Description | Example / value |
|----------|----------|-----------|-------------|-----------------|
| `VITE_API_URL` | ✅ set | Frontend | Backend **public origin** baked in at build time. No trailing slash, no `/api/v1` (the app appends it). Also used for Socket.IO | `https://<backend>.up.railway.app` |

### Database service (Railway PostgreSQL)
Railway provisions and manages these automatically — **nothing to set**:
`DATABASE_URL`, `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`. The backend
consumes them via the `${{Postgres.DATABASE_URL}}` reference above. Prisma opens a
standard pooled connection (long-running container — no external pooler required).

---

## 🔑 Manual Railway dashboard checklist (only you can do these)

Current state: **frontend, Postgres, and backend services already exist**; the backend
is not yet configured. Do these in order. Generating both domains *first* means you set
every cross-URL once and redeploy once.

### Step 1 — Backend: set the root directory
Backend service → **Settings → Source** → **Root Directory** = `backend`.
(Confirm **Builder** shows **Dockerfile** — it auto-detects `backend/Dockerfile`.)

### Step 2 — Backend: generate its public domain
Backend → **Settings → Networking → Public Networking → Generate Domain**.
Copy it — this is your **BACKEND URL** (e.g. `https://careerbridge-backend-production.up.railway.app`).

### Step 3 — Frontend: confirm root dir + generate domain
Frontend service → **Settings → Source → Root Directory** = `/` (repo root).
Then **Networking → Generate Domain** (if it doesn't have one). Copy the **FRONTEND URL**.

### Step 4 — Backend: paste variables
Backend → **Variables** → **Raw Editor**, paste (substitute the two URLs from Steps 2–3):
```
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_ACCESS_SECRET=EWQWAYYcL7FBdVthRrVKxK5EPrfdqhEXLn2ufYZk0lEgM+gNo3OVggbkkLSr0M6u
JWT_REFRESH_SECRET=z90SqQ7bZ77Uzak01OEw5TRy6PQGWjSp0lOkhB7abvtsLYDWQBuX9iXT6negqaMc
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
CORS_ORIGIN=<FRONTEND URL from Step 3>
APP_BASE_URL=<BACKEND URL from Step 2>
AI_PROVIDER=gemini
GEMINI_MODEL=gemini-flash-latest
GEMINI_ENDPOINT=auto
```
> The two secrets above are freshly generated and safe to use as-is; regenerate with
> `openssl rand -base64 48` if you prefer. Add `GEMINI_API_KEY=…` for real AI (optional).

### Step 5 — Frontend: set the API URL
Frontend → **Variables** → add:
```
VITE_API_URL=<BACKEND URL from Step 2>
```

### Step 6 — Deploy both
Backend → **Deploy** (redeploy). Watch **Deploy Logs** for:
`prisma migrate deploy` applying migrations → `Server listening on port <PORT> in production mode.`
Then Frontend → **Deploy**. Watch for: `CareerBridge frontend on http://0.0.0.0:<PORT>`.

### Step 7 — (Recommended) Persist uploads with a Volume
Uploaded resumes/interview media are written to the container disk (`/app/uploads`),
which Railway **wipes on every redeploy**. To keep them:
Backend → **Settings → Volumes → New Volume**, mount path **`/app/uploads`**. Redeploy.
(Skip only if you don't need uploads to survive redeploys.)

### Step 8 — Verify
```
curl https://<BACKEND URL>/health            # → 200, {"database":"connected"}
curl https://<BACKEND URL>/api/v1/ai/health  # → provider mode
```
Open the frontend URL → register, login, jobs, apply, mock interview, resume upload.
Swagger: `https://<BACKEND URL>/api-docs`.

---

## After the URLs exist — two follow-ups (I can do these for you)
- **Seed demo data (optional):** a fresh DB is empty; registration still works. To load
  the full dataset, seed the Railway DB from local (the 256 MB seed JSON isn't in git):
  set `backend/.env` `DATABASE_URL` to the Railway Postgres **public** connection string,
  then `cd backend && npx prisma migrate deploy && ALLOW_SEED_RESET=true npm run seed:ingest && npm run validate`.
- **Android APK:** rebuild once the backend URL is known — the URL is baked in at build
  time. Tell me the backend URL and I'll rebuild `CareerBridge.apk`.

## Notes / risks
- **Free/trial plans sleep or cap usage** (this suspended the earlier Render deploy). For
  always-on production use a paid Railway plan — the config is identical.
- **Cross-site cookies:** the refresh cookie is `sameSite:none; secure` in production and
  CORS reflects the frontend origin with credentials — required across the two domains.
- **Uploads persistence:** see Step 7. Without a Volume, uploads are ephemeral.
