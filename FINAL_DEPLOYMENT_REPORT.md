# CareerBridge — FINAL DEPLOYMENT REPORT

Date: 2026-07-18
Auditor: Cowork cloud session (static/structural audit) — runtime gates delegated to the Windows environment (see "Test results" for exactly which is which).

> **Honesty note.** This session's sandbox cannot execute the stack (package
> registries firewalled; the repo's installed Prisma engines and native modules
> are Windows-only; Windows Postgres unreachable from the bridge VM). Everything
> listed under *Static audit — PASSED* was verified programmatically against the
> actual code. Everything under *Execution gates* must be run once on the Windows
> machine via `CLAUDE_LOCAL_RUN_PROMPT.md` before declaring the project complete.
> **The project is therefore NOT yet declared complete** — it is code-complete and
> statically verified, pending one local execution pass.

---

## 1. Completed features

**Portals (all on the shared "Ink & Evergreen" shell, real PostgreSQL data, honest empty/loading/error states — per HANDOFF_PHASE1):**
- Student: Dashboard, Jobs, Applications, SavedJobs, Notifications, Profile, Settings, AI Career Report, Network, Messages, Mock Interview (+Report), Job/Company/Event/Interview/Mentor detail pages, Search.
- Employer: Overview, Jobs (+posting form), Candidates queue, Hiring pipeline, Interviews, Recruiters, Analytics, Reports, Messaging, Company profile/verification, Notifications, Settings.
- University: Overview (+ecosystem), Student management + verification queue, Company discovery, Campus drives (+create/edit), Placement analytics, Reports center, Messaging, Notifications, Settings, Student progress profile.
- Admin: Overview, Users, Organizations, Verification, Analytics, Moderation, System health, Feature flags, Announcements, Support tickets, Sessions, Audit logs.

**AI layer** (adapter architecture: frontend → Express → module service → engine client → shared GeminiClient; per AI_LAYER_AUDIT_REPORT):
- Resume analysis, Career insights/readiness/skill gap/roadmap, job/company/mentor recommendations (deterministic ranking over real rows by design), candidate evaluation + comparison, placement risk prediction, department insights, drive recommendations, executive reports, admin fraud/insights/moderation/health/predictive.
- Graceful fallback on provider failure, labelled per-request (`Gemini (Production)` / `(Fallback)` / `(MockMode)`); "Estimated" labeling policy enforced; key auto-routing for `AIza` and `AQ.` key formats; no key in URLs.

**Mock Interview (flagship):** job-aware setup, voice/camera capture preserved, per-question trail persisted (`MockInterview` → `InterviewQuestion` → `MockInterviewReport`), report propagates to dashboards/Career Coach. Speech-to-text and camera analysis remain deterministic heuristics (documented limitation — no external speech/vision provider wired).

**Seed ecosystem (this session's additions included):** 1,200 students, 80 companies, 150 recruiters, ~35 universities + departments, 400 jobs, 2,500 applications, 450 interviews, 200 offers, 550 conversations (~5,500 messages), 2,200 notifications, per-student AI artifacts, **plus new:** verification-status spread, 2–4 campus drives per university, 8 platform announcements, ~5,000+ audit-log events, 5-question interview trail per mock interview. All volumes centralized in `careerbridge_seed_engine/config.py`; zero frontend hardcoding.

## 2. Static audit — PASSED (verified programmatically this session)

| Check | Result |
|---|---|
| Frontend relative imports (all .ts/.tsx) | **0 broken** |
| Backend relative imports | **0 broken** |
| Lazy/dynamic route imports | **0 broken** |
| Route modules mounted in `api.routes.ts` | **20/20 mounted** |
| Frontend API calls ↔ backend endpoints (188 endpoints) | **100% matched** after fix (below) |
| Auth middleware on route modules | all protected except public `/health` (by design) |
| RBAC (`authorize`) on privileged modules | admin, ai, employer, university, ecosystem ✔ |
| Prisma schema (51 models, 16 enums) relation/reference integrity | **0 errors** |
| Uploads | secure owner-only download route (no public static dir) ✔ |
| Legacy "safe to delete" files | `UniversityHelpCenter` is actually still used (kept); no dangling refs |

### Issues found and FIXED this pass
1. **`src/services/index.ts`** — hardcoded `http://localhost:5000/api/v1` (would break any deployment). Now env-driven: `VITE_API_URL` origin + `/api/v1`, localhost fallback for dev.
2. **`src/contexts/SocketContext.tsx`** — WebSocket hardcoded to `localhost:5000`. Now uses shared `API_ORIGIN`.
3. **Dead broken API call** — `CareerService.getInterviewReportById` called nonexistent `GET /career/mock-interviews/:id`; zero callers → removed.

## 3. Database statistics (expected after `npm run seed`; enforced by `validate_seed.ts` minimums)
Users ≥1,400 · StudentProfile ≥1,000 · Company ≥60 · University ≥30 · Department ≥60 · Recruiter ≥100 · Job ≥300 · Skill ≥60 · StudentSkill ≥6,000 · JobSkill ≥1,500 · Education ≥1,000 · Experience ≥600 · Project ≥2,000 · Certification ≥800 · Resume ≥1,000 · Application ≥2,000 · Interview ≥350 · Conversation ≥400 · Message ≥1,500 · Notification ≥1,800 · CareerInsight ≥1,000 · ResumeAnalysis ≥1,000 · MockInterview ≥1,000 · MockInterviewReport ≥1,000 · **InterviewQuestion ≥4,000 · PlacementDrive ≥50 · PlatformAnnouncement ≥5 · AuditLog ≥2,000** — plus FK-integrity checks (no orphans).

## 4. Test results — EXECUTED ON WINDOWS 2026-07-18 ✅

**All execution gates ran on the local Windows machine (PostgreSQL 16, Node 24.16, Python 3.12) and passed:**

- ✅ `cd backend && npm install` · `pip install -r backend/requirements.txt` · root `npm install`
- ✅ `npx prisma generate` (after killing stale dev servers that locked the Windows query engine DLL)
- ✅ `npx prisma migrate deploy` — 22 migrations applied cleanly
- ✅ `$env:ALLOW_SEED_RESET="true"; npm run seed` — generate → reset → ingest → **validate 54/54 checks green** (fixes: `seed:generate` used `python3` which doesn't exist on Windows → now `python`; User-count minimum recalibrated 1400→1390 to match config: 1200 students + 150 recruiters + 46 university admins = 1396)
- ✅ `npm run build` backend (`tsc`) and frontend (`tsc -b && vite build`) — 0 errors
- ✅ `npm run dev` both servers; `/health`, `/api/v1/health`, `/api/v1/ai/health` all healthy
- ✅ Production mode: `NODE_ENV=production node dist/index.js` boots and serves `/health` (with strong JWT secrets; it correctly *refuses* to boot with the dev placeholders)

**Fixes required during the run (all applied and committed to the working tree):**
1. **Seeded logins were impossible** — the Python generator writes a non-bcrypt placeholder hash and the auth bypass only accepted `Password123!`, not the published `seeded_user_password123`. `ingest_seed.ts` now bcrypt-hashes the seeded password when the source hash isn't bcrypt; existing DB rows were rehashed (1,396 users). All roles now log in with `seeded_user_password123`.
2. **No platform ADMIN user is seeded** — created `admin@careerbridge.com` / `seeded_user_password123` directly (the seed engine only creates STUDENT/EMPLOYER/UNIVERSITY). Follow-up: add an admin user to the generator.
3. **Gemini 403** — the Vertex-express (`AQ.`) key's Google project has the aiplatform API disabled, and `gemini-2.5-flash` is retired for new users on the Developer API. Added `GEMINI_ENDPOINT=auto|developer|vertex` env override (default `auto` keeps key-prefix routing) and switched `.env` to `GEMINI_ENDPOINT=developer` + `GEMINI_MODEL=gemini-flash-latest`. Real Gemini output confirmed for all six AI surfaces.
4. **AdminService double-unwrapped API responses** (`fetchJson` already returns `payload.data`) — Admin portal showed "Couldn't load platform stats" despite 200s. Fixed across all 37 AdminService methods.
5. **MessageContext called student-scoped `/messages` for every role** — console errors on employer/university/admin portals. Now student-only.
6. **Job cards rendered blank `Posted:`/`star /5`/`AI MATCH: %`** — raw Prisma jobs were passed where the UI Job shape was expected. Added `mapApiJob` in `JobService` (companyName/logo from relation, relative `postedTime`, formatted `salaryRange`, enum labels) and JobCard now hides rating/match when absent. Student dashboard merges real `/ecosystem/student/recommendations` scores into card `matchRate`.

**E2E workflow — executed and verified against PostgreSQL:**
employer creates job (DRAFT→PUBLISHED) → student search finds it → student applies → employer sees application → employer shortlists → student tracker shows SHORTLISTED → dashboard "Recent activity" reflects both events → university dashboard shows the job under employer activity → admin stats reflect counts → recommendations rank the new job with a real score.
Also verified: university verifies student (PENDING→VERIFIED; employer application detail exposes `verificationStatus: VERIFIED`) · campus drives visible on university dashboard · full mock interview (6 audio answers → `MockInterview` + 6 `InterviewQuestion` + `MockInterviewReport` rows persisted, scored) · Career Coach insight generated via Gemini · employer `ai-evaluate` and admin `platform-insights` return real Gemini output · deterministic fallback is explicitly labelled when the provider is unreachable.

**Portal walkthrough in browser (Vite dev):** Student, Employer, University and Admin dashboards all render live seeded data with no console errors after the fixes above.

## 5. Deployment commands & Render configuration
See **`DEPLOYMENT_RENDER.md`** (full guide). Summary:
- Backend Web Service (root `backend/`): build `npm ci && npx prisma generate && npm run build`; pre-deploy `npx prisma migrate deploy`; start `node dist/index.js`; health check **`/health`**.
- Frontend Static Site (repo root): build `npm ci && npm run build`; publish `dist`; SPA rewrite `/* → /index.html`; **set `VITE_API_URL` to the backend origin** (new requirement from today's fix).
- One-time seed via Render Shell (or commit generated JSON and run ingest only).

## 6. Environment variables
Backend (zod-validated; boot fails if missing/invalid): `NODE_ENV`, `PORT`, `DATABASE_URL` (+`?schema=public`), `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (strong values enforced outside development), `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY`, `CORS_ORIGIN` (exact frontend origin), `APP_BASE_URL`, `AI_PROVIDER`, `GEMINI_API_KEY` (optional → "Estimated" mode when unset), `GEMINI_MODEL`.
Frontend: `VITE_API_URL` (backend origin, no `/api/v1` suffix, no trailing slash).

## 7. Production checklist
- [x] Windows execution pass green (all §4 gates) — **done 2026-07-18**
- [x] `GET /health`, `/api/v1/health`, `/api/v1/ai/health` healthy locally, including a production-mode (`NODE_ENV=production node dist/index.js`) boot — repeat on Render after deploy
- [ ] Rotate/disable seeded credentials (`seeded_user_password123`, `credentials.json`, `admin@careerbridge.com`) — **blocking for real users**
- [ ] Strong unique JWT secrets set on Render (verified locally: app refuses the dev placeholders in production and boots with `openssl rand -base64 48` values)
- [ ] `CORS_ORIGIN` = deployed frontend origin exactly
- [ ] `VITE_API_URL` set at frontend build time
- [ ] Persistent storage decision for `backend/uploads` (Render Disk or S3) — filesystem is ephemeral
- [ ] Prisma client generated on Linux during Render build (never commit the Windows client)
- [x] Production AI mode decided: real Gemini via `GEMINI_ENDPOINT=developer` + `GEMINI_MODEL=gemini-flash-latest` (this key's Vertex project has aiplatform disabled; `gemini-2.5-flash` is retired for new users) — set the same three vars on Render
- [x] `_to_delete/` removed; no `dist_check*/` or `stitch_*` folders remain
- [ ] Render deployment itself (cannot be executed from this machine — follow `DEPLOYMENT.md`)

## 8. Remaining known issues (honest)
1. ~~Execution gates unrun~~ — **resolved 2026-07-18**: all gates executed and green on Windows (§4).
2. Interview speech-to-text / camera analysis are deterministic heuristics, clearly documented; a real transcription/vision provider is a future integration.
3. ~~Live Gemini round-trip unverified~~ — **resolved 2026-07-18**: real Gemini responses confirmed for all six AI surfaces using `GEMINI_ENDPOINT=developer` + `gemini-flash-latest` (see §4 fix 3).
4. `HANDOFF_PHASE1.md` stale note: `UniversityHelpCenter` is listed "safe to delete" but is referenced by the University shell's `help` tab — do not delete.
5. Seeded passwords are uniform by design for demo; must be rotated for launch (checklist).
