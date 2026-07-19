# CareerBridge — Deploy to Production (Railway)

Railway is the **only** production environment. All Render config has been removed.
This repo ships config-as-code:

| File | Service |
|------|---------|
| [`backend/railway.json`](backend/railway.json) | Backend (Node/Express/Prisma) — root dir `backend` |
| [`railway.json`](railway.json) | Frontend (Vite SPA, served by `serve`) — root dir `/` |

> **What requires you (Railway account actions):** create the project, add
> PostgreSQL, set variables, generate domains. Steps marked **🔑 YOU**.
> Everything else (build/start commands, migrations, CORS, health checks) is
> already wired by the config files.

There is **no application code coupled to any host** — the app reads `PORT`,
`DATABASE_URL`, `CORS_ORIGIN`, `APP_BASE_URL`, and `VITE_API_URL` from the
environment. Migration is pure configuration.

---

## Step 1 — 🔑 YOU: Create the Railway project + Postgres
1. Log in at <https://railway.app> → **New Project**.
2. **Add PostgreSQL:** in the project, **New → Database → Add PostgreSQL**.
   Railway creates a `Postgres` service exposing `DATABASE_URL`, `PGHOST`, etc.

## Step 2 — 🔑 YOU: Add the Backend service
1. **New → GitHub Repo →** select `shan07y-sketch/Careerbridge`.
2. Open the new service → **Settings**:
   - **Root Directory:** `backend`
   - **Config-as-code path:** `railway.json` (resolves to `backend/railway.json`)
   - Build/start commands come from that file — leave them blank in the UI.
3. **Settings → Networking → Public Networking → Generate Domain.**
   Note this URL — it is your **backend URL**
   (e.g. `https://careerbridge-api-production.up.railway.app`).

### Backend variables (Settings → Variables)
| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (reference — Railway resolves it) |
| `JWT_ACCESS_SECRET` | output of `openssl rand -base64 48` (≥32 chars) |
| `JWT_REFRESH_SECRET` | a **different** `openssl rand -base64 48` |
| `JWT_ACCESS_EXPIRY` | `15m` |
| `JWT_REFRESH_EXPIRY` | `7d` |
| `CORS_ORIGIN` | the **frontend** URL from Step 3 (set after you have it) |
| `APP_BASE_URL` | this backend's own URL (from Step 2.3) |
| `AI_PROVIDER` | `gemini` |
| `GEMINI_MODEL` | `gemini-flash-latest` |
| `GEMINI_ENDPOINT` | `auto` |
| `GEMINI_API_KEY` | *(optional)* your key to enable real Gemini |

> **Do NOT set `PORT`.** Railway injects it; the app binds `process.env.PORT`.

## Step 3 — 🔑 YOU: Add the Frontend service
1. **New → GitHub Repo →** same repo again (a second service).
2. **Settings:**
   - **Root Directory:** `/` (repo root)
   - **Config-as-code path:** `railway.json` (repo-root file)
3. **Networking → Generate Domain.** This is your **frontend URL**.
4. **Variables:**
   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | the **backend** URL from Step 2.3 (build-time; no trailing slash, no `/api/v1`) |

5. Go back to the **backend** service and set `CORS_ORIGIN` to this frontend URL.
   Redeploy the backend so it picks up the value.

## Step 4 — Database migration (automatic)
The backend `startCommand` runs `npx prisma migrate deploy` on every boot, so all
23 migrations apply automatically the first time the backend starts. No manual
step. Verify in the backend **Deploy Logs**: you should see the migrations apply,
then `Server listening on port <PORT> in production mode.`

## Step 5 — (optional) Seed demo data
A fresh DB is empty (registration still works — it creates users). To load the
full demo dataset (jobs, companies, demo logins), seed the **Railway** DB from
your machine (the 256 MB seed JSON is local, not in git):

```bash
cd backend
# Copy the Railway Postgres "Connect" → connection URL into backend/.env as DATABASE_URL
npx prisma migrate deploy
ALLOW_SEED_RESET=true npm run seed:ingest   # uses already-generated local JSON
npm run validate
```

## Step 6 — 🔑 YOU: Rebuild the Android APK against the Railway backend
The APK bakes `VITE_API_URL` at build time, so it must be rebuilt once you know
the backend URL:

```bash
# repo root
echo "VITE_API_URL=https://YOUR-RAILWAY-BACKEND.up.railway.app" > .env.production
npm run build
npx cap sync android
cd android && ./gradlew.bat assembleDebug -Dorg.gradle.java.home="C:/Program Files/Android/Android Studio/jbr"
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```
(JDK 21 is required — Android Studio bundles it at the path above.)

## Step 7 — Verify (against the live Railway backend)
```bash
curl https://YOUR-RAILWAY-BACKEND.up.railway.app/health           # → 200 JSON
curl https://YOUR-RAILWAY-BACKEND.up.railway.app/api/v1/ai/health  # → provider mode
```
Then open the frontend URL and exercise: register, login, jobs, apply, mock
interview + report, messages, and the employer/university/admin portals.
Swagger API docs: `https://YOUR-RAILWAY-BACKEND.up.railway.app/api-docs`.

---

## Notes / risks
- **Static frontend on Railway** is served by [`serve`](https://www.npmjs.com/package/serve)
  (`serve -s dist` → SPA fallback to `index.html`). It's a dependency, installed
  during the frontend build.
- **Cross-site cookies:** the refresh-token cookie is `sameSite:none; secure` in
  production, and CORS reflects the frontend origin with credentials — required
  because frontend and backend are different Railway domains.
- **Free/limited plans sleep or cap usage.** For always-on production, use a paid
  Railway plan; the config is identical.
- **Custom domains:** add them under each service's Networking tab, then update
  `CORS_ORIGIN` / `APP_BASE_URL` / `VITE_API_URL` and rebuild the frontend + APK.
