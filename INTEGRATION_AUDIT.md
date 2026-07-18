# CareerBridge — Full Application Integration Audit

**Date:** 2026-07-17
**Scope:** Verify every visible value is PostgreSQL-backed; every service calls a real endpoint; every endpoint returns only database data; remove remaining fabricated values; replace unsupported widgets with honest empty states.

**Build status at time of audit:**

- Frontend `tsc -b`: **pass**
- Frontend `vite build`: **pass** (206 modules; the only failure seen locally is an `EPERM unlink` on the pre-existing `dist/` mount, not a code error — a clean build to a fresh out-dir succeeds)
- Backend `tsc` build: **pass**
- Lint (`oxlint`, 310 files): **pass** — 0 errors, 57 pre-existing warnings

---

## 1. What was already clean (foundation work confirmed)

- **Service layer (`src/services/index.ts`)** — every service was previously refactored to remove mock/offline fallbacks. On failure it surfaces the real error rather than returning fabricated data (verified via in-file documentation and call sites). `src/mock/` is empty.
- **Admin module** — all admin views (`AdminUsersView`, `AdminCompaniesView`, `AdminUniversitiesView`, `AdminSupportTicketsView`, `AdminSessionsView`) fetch from `AdminService` with real pagination/search against the backend. Inline arrays there are role/status **config options**, not fabricated entities.
- **Admin "Coming Soon" surfaces** — already implemented as honest empty states (`AdminComingSoonView` → `AdminEmptyState`), not populated-looking mock screens.
- **Employer operational panels** — `DashboardOverviewPanel`, `JobsListPanel`, `HiringPipelinePanel`, `AnalyticsPanel`, `InterviewsPanel`, `RecruitersPanel`, `MessagingPanel`, `CompanyProfilePanel`, `ReportsPanel` are all backend-wired with no hardcoded entity data.
- **University module** — no hardcoded entity arrays detected.

The core operational surface of all four portals is PostgreSQL-backed.

---

## 2. Fabrications removed in this pass

### `src/pages/student/MentorProfile.tsx`
Removed a fabricated 1:1 booking flow: hardcoded availability slots (`mockSlots`) and a fake "Session successfully booked" confirmation with no backend. There is **no mentor-availability data model**, so per the directive it was replaced with an **honest empty state** that routes the student to real (backend-backed) Messaging to coordinate a session. Removed now-unused `selectedSlot` state, `handleBook`, and `useToast` import.

### `src/pages/student/Profile.tsx`
Removed fabricated identity data that rendered when real user fields were absent:
- Fake name fallbacks (`'Alex Rivera'`) in the avatar alt text, headline, PDF export, and share-link ref → replaced with neutral, honest fallbacks.
- Fake `careerGoal`, `university`, `gradYear`, `workMode` fallbacks (`'MIT'`, `2026`, `'Hybrid'`, etc.) → now show "Add your …" prompts when real data is missing.
- A **fully hardcoded "About Me" paragraph** (the `Student` type has no `bio` field) → replaced with a summary composed from the real `degree`/`university`/`careerGoal` fields, falling back to an honest empty state.
- A hardcoded **"92% Complete"** profile-completion badge → replaced with a value **computed from the user's real populated fields** (name, email, university, degree, grad year, career goal, work mode, photo, skills, active resume).

Both files verified: no NUL corruption, `tsc` clean.

> Note: `MentorProfile.tsx` and `Profile.tsx` were stored in a mixed encoding that the editor corrupted on write; both were restored from the git blob and edited as clean UTF-8. Worth confirming the repo's `.gitattributes`/editor encoding settings so this doesn't recur.

---

## 3. Remaining fabrication — recommended remediation (next phase)

These are secondary/admin-console and marketing pages. Each needs either a **new backend module** or an **honest empty state**. They are called out rather than silently rewritten because Settings in particular requires new schema + migrations that should not be rushed in an unattended pass.

| Page | Fabricated content | Backend today | Recommendation |
|---|---|---|---|
| `employer/Settings.tsx` | Team members, departments, activity/audit log, API keys (client-generated `live_pk_…`), backup bundles — all hardcoded with fake names (Alex Sterling, Sarah Jenkins) | none | **Build backend**: org/team, department, audit-log, API-key, and backup endpoints. Until then, gate each tab behind an honest empty state. Highest-effort item. |
| `employer/HelpCenter.tsx` | Support tickets + assignees hardcoded; ticket IDs via `Math.random` | A support-ticket model exists on the **admin** side | **Build backend**: expose employer-scoped support-ticket endpoints and wire to them (reuse the existing model). |
| `employer/Notifications.tsx` / `employer/Dashboard.tsx` | Hardcoded avatar URLs and a toast referencing a named person | notifications are otherwise wired | Replace hardcoded avatars/names with real notification payload data or initials-based avatars. |
| `student/EventDetails.tsx` | Hardcoded speakers + external avatar URLs | events partially wired | Add `speakers` to the event model or show an honest empty state. |
| `student/Network.tsx`, `student/SavedJobs.tsx` | A few hardcoded external avatar URLs / suggested-connection names | network/jobs wired | Serve avatars/suggestions from the API or use initials-based placeholders. |
| `student/Settings.tsx`, `student/Onboarding.tsx` | Cosmetic hardcoded avatar / confetti randomness | n/a | Confetti `Math.random` is legitimate (animation). Replace the single hardcoded avatar with real user photo/initials. |
| `student/Landing.tsx` | Testimonials, logos, avatars (7 external URLs) | n/a (marketing) | Acceptable as marketing content, but recommend moving to a CMS/config so it isn't mistaken for user data. |

**Legitimate `Math.random` uses (not fabrication):** confetti animation (`Onboarding`), toast IDs (`ToastContext`), and client-side generated IDs for UI artifacts. The API-key/backup-ID generators in `employer/Settings.tsx` are the exception — those imply a real capability that doesn't exist and should move server-side.

---

## 4. Features intentionally showing empty states (no underlying data yet)

- **Mentor 1:1 scheduling** — no mentor-availability/booking model. Now routes to real Messaging.
- **Admin advanced capabilities** — surfaced via `AdminComingSoonView` where the backend module isn't built yet.
- **Student profile "About Me" / bio** — no `bio` field on the `Student` model; shows an honest prompt until the field (and its edit path) is added.

---

## 5. Suggested next phases (in priority order)

1. **Employer Settings backend** — org/team/department/audit-log/API-key/backup modules + migrations; then rewire `Settings.tsx` tab-by-tab.
2. **Employer support tickets** — expose employer-scoped endpoints over the existing ticket model; rewire `HelpCenter.tsx`.
3. **Avatar strategy** — a single initials/`profilePicture`-based avatar component to eliminate every remaining hardcoded external avatar URL across Student/Employer pages.
4. **Add `bio` (and event `speakers`)** to the schema to convert those honest empty states into real data.
5. Re-run full `tsc` (FE+BE), `vite build`, and lint after each phase.
