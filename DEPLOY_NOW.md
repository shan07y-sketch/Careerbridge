# CareerBridge — Deploy to Production (Render)

This repo is deploy-ready. A [`render.yaml`](render.yaml) blueprint provisions all
three resources (PostgreSQL, backend, frontend) with env vars, migrations, and
health checks pre-wired. Follow the steps below in order.

> **What requires you:** creating/logging into a Render account, and (optionally)
> a Gemini API key. Everything else is automated by the blueprint. Steps that
> need you are marked **🔑 YOU**.

---

## Step 1 — Push is already done
`render.yaml`, production env templates, and the mobile layer are committed and
pushed to `origin/master` (github.com/shan07y-sketch/Careerbridge).

## Step 2 — 🔑 YOU: Create the Render Blueprint
1. Log in at <https://dashboard.render.com>.
2. **New → Blueprint**.
3. Connect the **Careerbridge** GitHub repo (authorize Render for the repo if asked).
4. Render reads `render.yaml` and shows three resources:
   `careerbridge-db`, `careerbridge-api`, `careerbridge-web`. Click **Apply**.

Render will now:
- create the Postgres 16 database,
- build the backend (`npm ci && prisma generate && build`),
- run migrations automatically (`prisma migrate deploy`, part of the build),
- start the API (`node dist/index.js`, health check `/health`),
- build & publish the frontend static site.

Generated JWT secrets and `DATABASE_URL` are wired in automatically.

## Step 3 — Confirm the service URLs
The blueprint assumes:
- backend  → `https://careerbridge-api.onrender.com`
- frontend → `https://careerbridge-web.onrender.com`

If Render appended a suffix (only happens if a name was globally taken), open each
service and update these three vars to the **real** URLs, then redeploy:
- `careerbridge-api` → `CORS_ORIGIN` (= frontend URL), `APP_BASE_URL` (= its own URL)
- `careerbridge-web` → `VITE_API_URL` (= backend URL) and rebuild
- rebuild the Android APK with the real backend URL (see Step 6)

## Step 4 — (optional) 🔑 YOU: enable real AI
Without a key, all AI features run in deterministic "Estimated" mode and the app
is fully usable. To enable real Gemini:
- `careerbridge-api` → **Environment** → set `GEMINI_API_KEY` → Save (redeploys).

## Step 5 — Seed the database (recommended, one-time)
A fresh database is empty (no jobs, no demo logins). The seed JSON is 256 MB —
too large for git — so seed the **remote** DB from your local machine, which
already has the generated JSON:

```bash
cd backend
# Put the Render EXTERNAL database URL in backend/.env as DATABASE_URL
#   (Render → careerbridge-db → "External Database URL")
npx prisma migrate deploy
ALLOW_SEED_RESET=true npm run seed:ingest   # ingest already-generated JSON
npm run validate
```
`npm run seed:ingest` does not need Python (the JSON already exists locally).
Only regenerate with `npm run seed:generate` if you want fresh data (needs
Python 3.10+). `ALLOW_SEED_RESET` guards the truncation step — use it only here,
never as a permanent env var.

Seeded demo logins are listed in your local run notes (all share one password).

## Step 6 — Android APK (already built against production URL)
`CareerBridge.apk` at the repo root is built to talk to
`https://careerbridge-api.onrender.com`. Once the backend is live at that URL,
install the APK and it works — no rebuild needed.

If your backend URL differs (Step 3), rebuild:
```bash
# repo root
echo "VITE_API_URL=https://YOUR-REAL-backend.onrender.com" > .env.production
npm run build
npx cap sync android
cd android && ./gradlew.bat assembleDebug -Dorg.gradle.java.home="C:/Program Files/Android/Android Studio/jbr"
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

## Step 7 — Verify (against the live backend)
```bash
curl https://careerbridge-api.onrender.com/health          # → 200
curl https://careerbridge-api.onrender.com/api/v1/ai/health # → provider mode
```
Then open the frontend URL and exercise: login, jobs, apply, mock interview +
report, messages, employer/university/admin portals. API docs live at
`https://careerbridge-api.onrender.com/api-docs`.

---

## Free-tier notes
- Free web services **sleep** after ~15 min idle (first request after is slow).
  Upgrade `careerbridge-api` to a paid instance for always-on.
- Free Postgres expires after 90 days — upgrade to `starter` for production.
- Set `plan:` in `render.yaml` to upgrade, or change it in the dashboard.
