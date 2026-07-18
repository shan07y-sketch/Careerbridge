# PROMPT FOR CLAUDE (run on the Windows machine, inside C:\Website)

> Why this file exists: the Cowork cloud session verified/authored all code changes but
> **cannot execute the stack** — its device bridge is a networkless Linux VM, while the
> project's installed Prisma engines are Windows-native (`query_engine-windows.dll.node`)
> and PostgreSQL runs on Windows localhost. Execution must happen in a native Windows
> shell. Paste everything below this line into Claude Code (or a Cowork task running
> ON the computer) started in `C:\Website`.

---

The code changes are complete and committed to this working tree (see
`SEED_UPGRADE_RUNGUIDE.md` and `AI_LAYER_AUDIT_REPORT.md` for what changed).
The project is NOT complete until the entire application has been executed
successfully on this local Windows environment. Do NOT stop at code
modifications. Execute, verify, and fix until zero errors.

## Execute, in order (all from C:\Website unless noted)

1. Install any missing dependencies:
   - `cd backend && npm install`
   - `pip install -r requirements.txt` (Faker==40.31.0; add `--break-system-packages` if pip refuses)
   - `cd .. && npm install` (frontend)
2. Generate Prisma client: `cd backend && npx prisma generate`
3. Execute all migrations: `npx prisma migrate deploy` (dev fallback: `npx prisma migrate dev`)
   - DB: `DATABASE_URL` in `backend/.env` → `postgresql://postgres:postgres@localhost:5432/CareerBridge?schema=public`. Ensure the Windows PostgreSQL service is running and the `CareerBridge` database exists.
4. Run the complete seed pipeline: `$env:ALLOW_SEED_RESET="true"; npm run seed`
   (= seed:generate → seed:reset → seed:ingest → validate)
5. Verify every generated entity: the generator summary must include non-zero
   Interview Questions, Placement Drives, Platform Announcements, Audit Logs;
   `validate_seed.ts` must pass ALL count + FK checks, including the new ones
   (InterviewQuestion ≥4000, PlacementDrive ≥50, PlatformAnnouncement ≥5, AuditLog ≥2000).
6. Verify PostgreSQL contains the expected data (psql or Prisma Studio spot checks,
   including `SELECT "verificationStatus", COUNT(*) FROM "StudentProfile" GROUP BY 1;`
   — must show a spread, not 100% PENDING).
7. Run backend: `cd backend && npm run dev` → `GET http://localhost:5000/health` and
   `GET http://localhost:5000/api/v1/health` return healthy; `GET /api/v1/ai/health`
   reports provider mode + detected key type.
8. Run frontend: `npm run dev` (root) → login with seeded credentials from
   `backend/scripts/data/credentials.json` (password `seeded_user_password123`).
9–15. Fix every runtime error, TypeScript error, Prisma error, API error, React
   rendering issue, broken import, and failing build. Do not stop after finding an
   error — fix it and continue until all are resolved.
16–20. Verify every dashboard, report, AI module, portal (Student, Employer,
   University, Admin), and workflow.

## Completion gates — ALL must succeed
- `npm run dev` (backend + frontend)
- `npm run build` (backend `tsc` + frontend `tsc -b && vite build`)
- `npm run seed`
- `npx prisma migrate deploy`
- `npx prisma generate`

## End-to-end workflow to verify explicitly
Employer creates Job → Student sees Job → Student applies → Employer receives
application → Employer changes status → Student tracker updates → University
analytics update → Admin analytics update → Analytics update → AI
recommendations update.

Also verify: University verifies student → Employer sees verified badge;
University campus drive visible; Student completes Mock Interview → report
persists (MockInterview + InterviewQuestion + MockInterviewReport rows) →
Career Coach / dashboards update; AI fallbacks are labelled "Estimated" when
Gemini is unavailable (never presented as real Gemini output).

## Known context to save you time
- Seed volumes are centralized in `backend/careerbridge_seed_engine/config.py`
  (`CountsConfig`) — never hardcode counts or frontend values.
- `prisma db seed` is intentionally a failing stub; the real pipeline is `npm run seed`.
- Gemini key in `backend/.env` is a Vertex express key (`AQ.`-prefix); the client
  auto-routes it (see `AI_LAYER_AUDIT_REPORT.md`). If AI calls 403, check the
  server log for Google's exact reason.
- File-sync quirk seen previously: overwriting a longer file can leave trailing
  NUL bytes → `TS1127`. Fix: strip NULs and re-run tsc.
- `_to_delete/` at repo root holds session temp files — safe to delete.

## FINAL SUCCESS CHECKLIST — the binding acceptance contract
Only consider CareerBridge finished when ALL of these are true. Work through them
in order, check each one off explicitly in your completion report, and if any item
fails, fix it and re-run the affected gates before proceeding.

**Backend:** `npm run build` ✔ · `npm run dev` ✔ · no runtime exceptions ✔ · no
Prisma errors ✔ · no API failures ✔

**Frontend:** `npm run build` ✔ · pages load ✔ · no console errors ✔ · no network
failures ✔ · no React errors ✔

**Database:** migrations succeed ✔ · seed succeeds ✔ · data visible in dashboards ✔ ·
relationships intact (validate_seed FK checks green) ✔

**Workflows:** employer posts a job ✔ · student sees the job ✔ · student applies ✔ ·
employer receives application ✔ · employer updates status ✔ · student sees updated
status ✔ · university analytics update ✔ · admin analytics update ✔ · AI
recommendations update ✔

**AI (each returns real output, or clearly-labelled "Estimated" fallback — never an
error page):** Resume Analyzer ✔ · Career Coach ✔ · Mock Interview ✔ · Employer AI ✔ ·
University AI ✔ · Admin AI ✔

**Deployment:** backend starts with `NODE_ENV=production` ✔ · frontend production
build succeeds ✔ · Render deployment succeeds ✔ · `/health` check works ✔ ·
environment variables correct (incl. `VITE_API_URL` at frontend build time) ✔

Update `FINAL_DEPLOYMENT_REPORT.md` §4 and §7 with the actual results of each item.
Do not declare SUCCESS with any box unchecked.

## Final deliverable
After all verification passes, create/refresh `DEPLOYMENT.md` for Render — a
prepared draft already exists at `DEPLOYMENT_RENDER.md`; validate its commands
against what actually worked locally, correct anything that differs, then declare
SUCCESS only after the application launches correctly and is ready for deployment.
