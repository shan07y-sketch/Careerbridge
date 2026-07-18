# CareerBridge — Mobile Presentation Layer

CareerBridge runs as **one React + Vite + TypeScript app** that renders two
presentations from a single codebase:

- **Desktop website** — the existing sidebar/topbar experience, untouched.
- **Android app (Capacitor) / mobile web** — a touch-first presentation with
  bottom-tab navigation, sheets, and full-screen flows.

Both share the same backend, PostgreSQL database, Prisma models, JWT auth, API
layer, Gemini AI, and business logic. **No business logic is duplicated** — the
mobile layer is presentation only. Every mobile page imports the same services,
contexts, hooks, and types the desktop pages use.

---

## Folder structure

```
src/
  components/        Desktop components (Sidebar, Topbar, PageLayout, …)
  pages/             Desktop pages (student / employer / university / admin / legal)
  contexts/          SHARED — Auth, Theme, Toast, Socket, Notification, Message, OfflineQueue
  hooks/             SHARED — usePlatform (device detection), useApplicationQueue
  services/          SHARED — the single API/business-logic layer (services/index.ts)
  types/             SHARED — domain types
  utils/             SHARED — speech (TTS/STT), interviewObserver, exportUtils
  config/            SHARED — navigation.ts (one nav model for both presentations)

  mobile/            ── MOBILE PRESENTATION LAYER (this document) ──
    adaptive.tsx     adaptive(desktop, mobile) route helper
    mobile.css       Mobile-only CSS (imported by index.css)
    components/
      MobileShell.tsx   Standard page frame: header + scroll area + TabBar + FAB
      TabBar.tsx        Bottom navigation (reads NAV_CONFIG) + "More" sheet
      Sheet.tsx         Bottom sheet (menus, confirmations, pickers)
      OfflineBanner.tsx Connectivity banner (reads OfflineQueueContext)
      ui.tsx            Primitives: Card, Stat, Chip, Button, Segmented, ScoreRing,
                        Progress, Expandable, PullToRefresh, Skeleton, EmptyState,
                        ErrorState, Avatar, SectionTitle
      index.ts          Barrel export
    pages/
      student/       Dashboard, Jobs, JobDetails, SavedJobs, Applications, Profile,
                     Messages, Network, Notifications, Settings, CareerCoach,
                     MockInterview, MockInterviewReport
      employer/      EmployerPortal   (single shell, key-based views)
      university/    UniversityPortal (single shell, key-based views)
      admin/         AdminPortal      (single shell, key-based views)
```

**Rule of thumb:** anything under `mobile/` is JSX + CSS + device wiring. The
moment a component needs data, it calls a shared service — it never talks to the
API directly and never re-implements a calculation the desktop already does.

---

## Navigation flow

The **URL structure is identical** across presentations. Routes are declared
once in `src/App.tsx`; the presentation is chosen at render time, not by path.

- **Student** is route-based. Each `/student/*` route maps to an `adaptive()`
  component. On mobile the `TabBar` shows the first four `NAV_CONFIG.student`
  items as tabs; the rest (Career Coach, Resume, Mock Interviews, Network,
  Messages) live in the **More** sheet. Tapping a tab calls `navigate(item.to)`.
- **Employer / University / Admin** are single-page shells. The route
  (`/employer/dashboard`, `/university/dashboard`, `/admin/*`) renders one
  portal component that holds a `view` state string. The `TabBar` is given
  `role`, `activeKey={view}`, and `onNavigate={setView}`, so tapping a tab
  switches the internal view — exactly the model the desktop `PageLayout` uses
  for those portals.

Both presentations read the **same** `src/config/navigation.ts`, so the tab set
and the sidebar always agree.

---

## Component hierarchy (mobile)

```
App (Router + all Providers — shared)
└─ adaptive() picks Mobile* at render time
   └─ MobileShell                     header + main + TabBar + optional FAB
      ├─ OfflineBanner                (OfflineQueueContext)
      ├─ header  (title, back, actions)
      ├─ main    (page content: Cards, Stats, lists, PullToRefresh…)
      ├─ FAB     (optional)
      └─ TabBar                       (NAV_CONFIG + role)
         └─ Sheet ("More" overflow + Sign out)
```

Full-screen flows (the live Mock Interview stage, an open message thread) render
their own fixed overlay instead of `MobileShell` while active.

---

## How platform detection works

`src/hooks/usePlatform.ts` — **three signals, never `window.innerWidth` alone:**

1. `Capacitor.isNativePlatform()` → running inside the Android/iOS shell.
2. `navigator.maxTouchPoints` → touch-capable device.
3. `matchMedia` viewport tier (`compact < 768 ≤ medium < 1024 ≤ expanded`),
   tracked reactively via `useSyncExternalStore` so it only re-renders when a
   breakpoint boundary is crossed.

`useIsMobile()` returns `true` for Capacitor native, phones, and tablets in
portrait (`compact`/`medium`). Desktop (`expanded`, non-native) gets the desktop
UI. Because detection is native-first, the Android build **always** renders the
mobile presentation regardless of screen size.

---

## Performance optimizations

- **Route-level code splitting via `adaptive()`** (`src/mobile/adaptive.tsx`).
  It wraps `React.lazy` for both variants but only the chosen one's factory
  runs, so:
  - Desktop users **never download** mobile chunks.
  - Mobile users **never download** desktop chunks.
  Confirmed by the build output — desktop and mobile `Dashboard` ship as
  separate chunks (`Dashboard-*.js`).
- **Suspense** boundary in `App.tsx` shows `PageLoader` during chunk fetch.
- **Skeletons** (`SkeletonList`) render while data loads — no layout shift.
- **`useSyncExternalStore`** for viewport tier avoids re-renders on every resize
  pixel; it fires only on breakpoint changes.
- **`Promise.allSettled`** on dashboards so one slow/failing call never blocks
  the rest of the screen.
- Lists cap rendered rows where the dataset can be large (e.g. admin users,
  university students) to keep scrolling smooth.

---

## Shared logic (never duplicated)

| Concern            | Single source                                        |
|--------------------|------------------------------------------------------|
| Auth               | `contexts/AuthContext.tsx` + `AuthService`           |
| API calls          | `services/index.ts` (`fetchJson`, all `*Service`s)   |
| Gemini AI / interview engine | backend + `MockInterviewAIService`, `CareerService` |
| Validation / mapping | `services/index.ts` mappers (`mapApiJob`, …)       |
| Notifications      | `NotificationService` + `NotificationContext`        |
| Messaging          | `MessageService`, `EmployerMessageService`           |
| Offline queue      | `contexts/OfflineQueueContext.tsx`                   |
| Voice (TTS/STT)    | `utils/speech.ts`                                    |
| Navigation model   | `config/navigation.ts`                               |

Mock interview reports are **read from PostgreSQL and never regenerated** on the
mobile viewer (`MockInterviewReport` calls `getSessionDetail` and renders the
stored `reports[0]`). The PDF, dashboard, employer, and university surfaces all
read the same stored record — data stays identical everywhere.

---

## How to add a new mobile page

1. Build the page under `src/mobile/pages/<role>/YourPage.tsx`.
2. Wrap it in `MobileShell` and compose UI from `mobile/components`
   (`Card`, `Button`, `SkeletonList`, `EmptyState`, `ErrorState`, …).
3. Get data **only** from a shared service/hook/context — never `fetch`
   directly, never re-implement desktop logic.
4. Handle the three states explicitly: **loading** (`SkeletonList`),
   **error** (`ErrorState` with `onRetry`), **empty** (`EmptyState`).
5. Wire it into the route in `src/App.tsx`:
   ```tsx
   const YourPage = adaptive(
     () => import('./pages/<role>/YourPage'),        // desktop
     () => import('./mobile/pages/<role>/YourPage'), // mobile
   );
   ```
   For portal (key-based) shells, add a `case` in the portal's `render()`
   switch and a `NAV_CONFIG` entry instead.
6. Run `npx tsc -b` and `npm run build`.

---

## Capacitor notes

- Config: `capacitor.config.ts` (`appId: com.careerbridge.app`, `webDir: dist`,
  `androidScheme: https` so camera/mic/clipboard stay in a secure context).
- Native plugins already wired: App (back button / lifecycle in `App.tsx`),
  StatusBar, SplashScreen, Network (offline queue), Share (job & report
  sharing), Camera, Filesystem, Preferences, PushNotifications, Speech
  Recognition, Text-to-Speech.
- Native APIs are used through capability checks with web fallbacks:
  - **Share** — `Share.canShare()` → `navigator.share` → clipboard copy.
  - **Voice** — `utils/speech.ts` uses Web Speech; on device swap in the
    `@capacitor-community` speech/TTS plugins behind the same interface.
- Build scripts (`package.json`):
  - `npm run cap:sync` — build web + `cap sync android`
  - `npm run android:apk` — debug APK (`assembleDebug`)
  - `npm run android:apk:release` — release APK (`assembleRelease`)
  - `npm run android:aab` — Play Store bundle (`bundleRelease`)
- Safe-area insets: `.m-safe-top` / `.m-safe-bottom` (used by `MobileShell`,
  `TabBar`, `Sheet`) respect notches and the gesture bar.

---

## Future expansion guide

- **iOS**: add `@capacitor/ios`, run `npx cap add ios`. The presentation layer
  is platform-neutral; only native plugin configuration differs.
- **Swipe gestures / richer PTR**: extend `PullToRefresh` or add a gesture
  component under `mobile/components` — keep it presentation-only.
- **Offline caching of reads**: layer a cache over `services/index.ts`
  `fetchJson` (e.g. Capacitor Preferences) so it benefits both presentations at
  once. Interview progress is already durable — every answer is saved
  server-side per question.
- **Push deep-links**: route notification taps through the existing router paths
  (URLs are shared), so no mobile-specific routing table is needed.
