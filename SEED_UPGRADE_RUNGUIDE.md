# CareerBridge — Seed Pipeline Upgrade & Run Guide

Date: 2026-07-18

## Why this file
The cloud session that made these edits **cannot execute the stack** (npm + pip
registries are firewalled off there, and Prisma/Faker can't be installed). So the
seed changes below were authored against the live schema and syntax-checked, but
must be **run and verified on your Windows machine**, where Faker, `node_modules`,
and PostgreSQL all work. Everything is additive and low-risk (the ingest loop
skips missing data files and upserts by id; `validate_seed.ts` uses `min`
thresholds so extra data cannot fail existing checks).

## What changed (3 files)
- `backend/scripts/generate_seed_json.py`
- `backend/scripts/ingest_seed.ts`
- `backend/scripts/validate_seed.ts`

### Gaps these fill (all were previously unseeded despite the spec)
1. **Student verification spread** — every `StudentProfile` now gets a realistic
   `verificationStatus` (≈50% VERIFIED / 24% PENDING / 10% PLACEMENT_ELIGIBLE /
   8% PLACEMENT_COMPLETED / 8% REJECTED) instead of everyone defaulting to
   PENDING. Powers the University verification queue, the employer "verified
   badge", and admin verification analytics.
2. **Campus drives** — `PlacementDrive` rows (2–4 per university), referencing
   real seeded companies, with `scheduledAt`/`deadline`. New file
   `placement_drives.json`.
3. **Platform announcements** — 8 realistic `PlatformAnnouncement` rows (mixed
   severity, 5 active). New file `platform_announcements.json`.
4. **Audit logs** — `AuditLog` history derived from actual application,
   verification, and mock-interview events. New file `audit_logs.json`.
5. **Per-question interview trail** — `InterviewQuestion` rows (5 per mock
   interview: HR/Technical/Behavioural, transcript + per-answer AI scores) so the
   flagship Mock Interview persists a real Q&A history, not just a summary score.
   New file `interview_questions.json`.

## Run it (Windows, from `backend/`)
```powershell
# 0. one-time deps (if not already installed)
pip install -r requirements.txt          # Faker==40.31.0  (add --break-system-packages if needed)
npm install

# 1. make sure DATABASE_URL in backend/.env points at your Postgres and schema is applied
npx prisma migrate deploy                 # or: npx prisma db push
npx prisma generate

# 2. run the full pipeline (generate JSON -> reset -> ingest -> validate)
$env:ALLOW_SEED_RESET="true"              # required for reset_seed to truncate
npm run seed
```
`npm run seed` = `seed:generate` + `seed:reset` + `seed:ingest` + `validate`.
Expect the generator summary to now also print `Interview Questions`,
`Placement Drives`, `Platform Announcements`, and `Audit Logs` counts, and
`validate_seed.ts` to pass its new count checks (InterviewQuestion ≥4000,
PlacementDrive ≥50, PlatformAnnouncement ≥5, AuditLog ≥2000).

## Verify in the app
- University portal → Campus Drives / Verification queue: populated.
- Student → Mock Interview history + report: backed by real per-question rows.
- Admin → Announcements + audit/activity: populated.
- Employer → candidates show verified badges for VERIFIED students.

## Not done in the cloud session (needs your machine)
- Live `npm run seed` execution + row-count confirmation.
- `tsc` / `vite build` green check (registries blocked in cloud).
- End-to-end runtime workflow clicks (job→apply→status→verify→drive).
Tune volumes in `backend/careerbridge_seed_engine/config.py` (`CountsConfig`) —
counts are centralized there, never hardcoded in generators or the frontend.
