# CareerBridge — Phase 1 Redesign Handoff

> Paste the **"PROMPT FOR NEXT SESSION"** block (bottom of this file) to the next Claude.
> This document lives at `C:\Website\HANDOFF_PHASE1.md`. All code described here is
> already committed to `C:\Website` and verified (tsc + vite build pass on the local machine).

---

## Progress log

**Stage 3 — Student sub-pages (in progress).** Migrated onto the shared shell + IA primitives,
all fabricated/hardcoded data removed, honest empty + error + loading states, tokens only,
`tsc -p tsconfig.app.json --noEmit` and `vite build` both green:
- ✅ `Jobs.tsx` — PageHeader + real KPI StatCards + Toolbar/FilterChips + sort + JobCard list + pagination. Removed fake "92 jobs match", hardcoded compare/recently-viewed/interview/mentorship sidebar.
- ✅ `Applications.tsx` — KPIs, status FilterChips w/ counts, status-derived ProgressBar + real `timeline`, real pending-offers/upcoming-interviews side panel, withdraw/accept/decline dialogs kept. Removed fake £salary/London/recruiter-notes/prep%/AI-suggestions.
- ✅ `SavedJobs.tsx` — KPIs + category chips + JobCard reuse. Removed fake "recently added", saved-date, deadlines, recommended-jobs carousel, stats meters.
- ✅ `Notifications.tsx` — KPIs + type FilterChips w/ counts + grouped list, star/archive local. Removed fake AI-wins, upcoming-interviews, pending-tasks, event card, fabricated deltas.

**Note on the file-sync bug:** writing a shorter file over a longer one leaves trailing NUL bytes
(`tsc` reports `TS1127: Invalid character`). Fix: `tr -d '\000' < f > f.c && mv f.c f` after each write, then re-run tsc.

**Stage 3 — Student portal is now COMPLETE.** Every student page migrated to the shared shell + IA
primitives, all fabricated/hardcoded data removed, real services only, honest empty/loading/error states,
tokens only. `tsc` + full `vite build` green. Additional pages done this pass:
- ✅ `Profile.tsx` → profile *dashboard* (identity banner + completion ring, KPIs, About/Skills/Documents with real ResumeService version history + share/download/delete, completion checklist, verifications, doc uploads).
- ✅ `Settings.tsx` → sectioned tabs (Account / Career preferences / Security / Notifications / Connections / Appearance), wired to real `updateUser` + `AuthService.changePassword`; industries editor; data export.
- ✅ `AICareerReport.tsx` → generate/refresh flow, readiness ring, skill-gap Badges, roadmap timeline, projects/courses, interview-topic practice CTA. Real `CareerService`.
- ✅ `Network.tsx` → real KPIs, tab FilterChips, real connection requests (accept/decline), mentors, recruiters, events, top companies. Removed fake Sarah Chen/Julian Voss cards, "Network Score 84", fake communities.
- ✅ `Messages.tsx` → clean two-pane chat on real `useMessages` (threads/messages/send), search + role filters, mobile back nav. Removed fake right-panel stats, AI writer, fake assets/meetings.
- ✅ `MockInterview.tsx` → shell + primitives on setup; **all live camera/recording/AI logic preserved untouched**.
- ✅ `MockInterviewReport.tsx` → PageHeader + honest loading/empty; real scorecard, radar, transcript preserved.
- ✅ `JobDetails.tsx` → header actions, sectioned role content, real company/recruiter cards, real "more roles". Removed fake growth-path text, hardcoded recruiter email, "people also applied".
- ✅ Secondary workflows: `CompanyProfile`, `EventDetails` (now real `EventService.getEventById`), `InterviewDetails`, `MentorProfile`, `SearchResults` — all on primitives, real data, honest states.

**Student portal is the reference implementation.** Reuse its exact patterns for Employer/University/
Recruiter/Admin: PageHeader → KPI StatCards → AttentionCard (one focal) → Toolbar+FilterChips over
data lists → Section hierarchy → Card/Badge/EmptyState/Skeleton. Detail pages: PageHeader with breadcrumbs
+ primary actions, 2/3 + 1/3 grid, real-data cards, honest empty/error/loading everywhere. No fabricated
numbers, no hardcoded people/logos, tokens only.

**Next:** ~~Stage 4 (Employer portal)~~ DONE — see below. Then University, then Admin.

---

## Stage 4 — Employer portal (COMPLETE)

**Shared shell upgraded to drive internal-view portals.** `PageLayout` + `Topbar` now accept
`role` / `activeKey` / `onNavigate` / `badges` and internal-nav callbacks (`onNotifications` /
`onSettings` / `onProfile`) + `roleLabel`. So employer/university/admin single-page tab shells render
the *exact* same Ink & Evergreen sidebar/topbar/spacing as the Student portal. `src/pages/employer/Dashboard.tsx`
is now a thin shell: `<PageLayout role="employer" activeKey={tab} onNavigate={setTab} …>{panel}</PageLayout>`
plus the JobPostingForm modal. All the old bespoke chrome (EmployerLayout/EmployerSidebar/EmployerHeader)
and the inline fabricated analytics/reports blocks were removed.

Every panel rebuilt to the Student-portal IA (PageHeader → KPI StatCards → Toolbar/FilterChips → Section →
Card/Badge/EmptyState/Skeleton), real services only, honest empty/loading/error, tokens only:
- ✅ `DashboardOverviewPanel` — real dashboard stats, AttentionCard, KPIs, recent jobs, upcoming interviews, talent-pool preview, quick actions.
- ✅ `JobsListPanel` — KPIs, status FilterChips, sort, bulk close/archive via Toolbar, row menus, preview/delete dialogs — all real lifecycle endpoints preserved.
- ✅ `JobPostingForm` (Create Job) — grouped sections (Basics → Description → Compensation → Publishing), token inputs, autosave + validation preserved.
- ✅ `CandidatesQueuePanel` / `HiringPipelinePanel` — PageHeader added; all real bulk-triage / tags / saved-filters / detail / interview / offer logic preserved.
- ✅ `InterviewsPanel`, `RecruitersPanel`, `AnalyticsPanel`, `ReportsPanel`, `MessagingPanel`, `CompanyProfilePanel` (also covers Organization Verification) — fully rebuilt to IA, real data.
- ✅ `Notifications` — replaced fabricated "Sarah Jenkins" feed with the real shared notification context.
- ✅ `Settings` — replaced the 1849-line fabricated "Global Tech Solutions Inc." monster with an honest Account + Security (real `AuthService.changePassword`) screen; company/team live in their own panels.

Nav key ↔ panel mapping lives in `Dashboard.tsx` `renderPanel()`. `HelpCenter.tsx` is now unreferenced (safe to delete).

**Next:** ~~University portal~~ DONE — see below. Then Admin.

---

## Stage 5 — University portal (COMPLETE)

`src/pages/university/Dashboard.tsx` is now a thin shell using the shared `PageLayout role="university"`
(same as employer): `activeKey`/`onNavigate`/`badges` (pendingVerifications) + internal-nav callbacks +
`onSearch` (routes to Students). Nav keys → components in `renderPanel()`; student drill-in and drive
create/edit are shell-owned (`onEditDrive` / `post_drive` tab). Old bespoke chrome removed; `UniversityHelpCenter`
now unreferenced (safe to delete).

Every component in `src/components/university/` rebuilt to the shared IA, real `UniversityService` data only,
honest empty/loading/error, tokens only:
- ✅ `UniversityOverviewPanel` — KPIs, pending-verification AttentionCard, upcoming drives, **ecosystem** sections (employer activity, registered employers, hiring demand, active recruiters, open internships) from `UniversityEcosystemService`.
- ✅ `StudentManagement` — KPIs, status FilterChips, dept filter, bulk verify, inline status change. New `verificationOnly` mode powers the **Verification** nav key (defaults to Pending). Empty state explains institutional-email auto-linking.
- ✅ `CompaniesManagement` — **Company Discovery**: "Partners" (application-derived) + "Discover" (all platform employers via ecosystem overview).
- ✅ `CampusDrives` — KPIs, AI drive recommendations, status FilterChips, Dialog delete; create/edit routed through the shell.
- ✅ `PostCampusDrive` — sectioned form + live preview, real create/update.
- ✅ `PlacementAnalytics` — KPIs, hiring-trend bars, department ProgressBars, AI department insight.
- ✅ `ReportsCenter` — KPIs, department table, CSV export, AI executive report.
- ✅ `MessagingCenter` — real broadcast tool (recipients + compose + sent list).
- ✅ `NotificationsCenter` — KPIs, filter chips, mark-read/delete on real notifications.
- ✅ `UniversitySettings` — university profile + placement-cell contact (real get/updateSettings).
- ✅ `StudentProfile` — **Student Progress**: identity, KPIs, skills/projects/certifications, AI placement prediction (ProgressRing), documents.

Ecosystem behavior delivered: overview + Companies pull cross-platform employer/recruiter/job data; student
verification empty-state documents institutional-email auto-linking; campus drives connect eligible students +
employers. All placement stats/analytics/reports come from real PostgreSQL via `UniversityService`.

**Next:** ~~Admin console~~ DONE — see below. **All four portals are now migrated.**

---

## Stage 6 — Admin console (COMPLETE)

`src/pages/admin/AdminPortal.tsx` is now a thin shell on the shared `PageLayout role="admin"`, keyed off the
shared admin nav (overview, users, organizations, verification, analytics, moderation, health, flags,
announcements). Old bespoke chrome (AdminLayout/AdminSidebar/AdminTopNav/CommandPalette/GlobalSearch) is
dropped; the `pendingVerifications` badge is wired from `getStats`. New IA views in `src/pages/admin/views/`,
all real `AdminService` data, honest empty/loading/error, tokens only:
- ✅ `AdminOverviewView` — platform KPIs, pending-verification AttentionCard, users-by-role, quick actions (`getStats`).
- ✅ `AdminUsersView` — paginated `getUsers`, role FilterChips, debounced search, verify/suspend/activate.
- ✅ `AdminOrganizationsView` — companies + universities tabs with verify + activate/deactivate.
- ✅ `AdminVerificationView` — unverified companies + universities queue with one-click verify.
- ✅ `AdminAnalyticsView` — platform growth KPIs + role-distribution bars (`getStats`).
- ✅ `AdminModerationView` — support tickets with status FilterChips + lifecycle actions (`getSupportTickets`/`updateSupportTicket`).
- ✅ `AdminSystemHealthView` — DB/runtime/AI monitoring (`getMonitoring`) + active sessions with revoke.
- ✅ `AdminFeatureFlagsView` — real toggle list (`getFeatureFlags`/`updateFeatureFlag`).
- ✅ `AdminAnnouncementsView` — create / activate / delete real announcements.

Old admin views (CommandCenterOverview, AdminCompaniesView, AdminUniversitiesView, AdminAuditLogsView,
AdminSessionsView, AdminSupportTicketsView, AdminComingSoonView) and `components/admin/*` are now unreferenced
(safe to delete). The `AdminLogin` route is unchanged.

---

## ✅ Phase 1 portal redesign COMPLETE — Student, Employer, University, Admin

All four portals now share one shell (`PageLayout` + `Sidebar` + `Topbar`), one design system ("Ink &
Evergreen"), one set of IA primitives, and one interaction language. Every screen is backed by real
PostgreSQL data via its service layer or shows an honest empty/loading/error state — no fabricated metrics,
people, companies, or notifications anywhere. `tsc -p tsconfig.app.json --noEmit` and `vite build` both green.
Unreferenced legacy files safe to delete: `pages/employer/HelpCenter.tsx`, `components/university/UniversityHelpCenter.tsx`,
old admin views + `components/admin/*`, `components/employer/*` chrome not used by the rebuilt panels.

---

## Project

**CareerBridge** — enterprise 