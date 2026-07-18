# CareerBridge AI Layer — Audit & Stabilization Report

Date: 2026-07-17

## Root cause of "Gemini unavailable" / "Access forbidden"

Your `GEMINI_API_KEY` in `backend/.env` begins with `AQ.` — that is a **Vertex AI express-mode key**. The backend was sending it to the **Gemini Developer API** endpoint (`generativelanguage.googleapis.com`), which only accepts `AIza...` keys. Google rejects the mismatched key with 403, which the client surfaced as "Model unavailable or access is forbidden" → "Gemini unavailable" in the UI.

**Fix (`backend/src/modules/ai/gemini-client.ts`):** the client now detects the key format and routes automatically:

- `AQ....` → `https://aiplatform.googleapis.com/v1/publishers/google/models/{model}:generateContent` (Vertex express)
- `AIza...` → `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent` (Developer API)

The key is now sent via the `x-goog-api-key` header instead of the URL query string, so it can never leak into URLs or request logs. 403 responses now log the full Google error body server-side (never to the client) with the detected key type, and 401/400 invalid-key bodies are matched more robustly.

Model updated/confirmed as `gemini-2.5-flash` (current, non-deprecated). No SDK is used — plain REST v1/v1beta, which is the currently supported surface.

Note: this sandbox has no route to googleapis.com, so the live call could not be exercised from here. If you still get 403 after this fix, the remaining possibility is that the key itself was revoked or its GCP project lacks access to `gemini-2.5-flash` — the backend log will now show Google's exact reason.

## Architecture discovered

All AI flows share one adapter layer:

frontend (`src/services/index.ts`) → Express routes → module service (real PostgreSQL data via Prisma) → engine client → shared `GeminiClient` → parsed JSON → persisted (AuditLog / insight tables) → frontend.

AI never fabricates entities: every prompt is built from rows already fetched from PostgreSQL (student profiles, jobs, applications, analytics aggregates), and the deterministic ranking layer (`recommendations/ranking.service.ts`) only orders/scores real rows. Prompts send minimal context (first name, skills, summaries — no emails/passwords).

## Feature inventory & status

### Student portal
| Feature | Endpoint | Status before | Now |
|---|---|---|---|
| Resume review + score + suggestions | `POST /resume/upload` → AIOrchestrator `resume-analysis-v1` | Wired; Gemini 403 → analysis silently skipped | Real Gemini; deterministic fallback if provider down |
| Career insights / readiness / skill gap / roadmap / courses | `POST /career/insight`, `GET /career/insights` | Wired; Gemini 403 → request failed | Fixed |
| Job/company/mentor recommendations + explanations | `GET /ecosystem/student/recommendations` | Working (deterministic ranking over PostgreSQL rows, by design) | Unchanged — verified correct |
| Resume match score | Part of career insight + ranking reasons | Working | Unchanged |

### Employer portal
| Feature | Endpoint | Status | Now |
|---|---|---|---|
| Candidate evaluation / screening / skill analysis | `POST /employer/applications/:id/ai-evaluate` (+ GET latest) | Wired; failed on Gemini error | Fixed with fallback |
| Candidate ranking / comparison / best candidate | `POST /employer/applications/ai-compare` | Same | Fixed |

### University portal
| Feature | Endpoint | Status | Now |
|---|---|---|---|
| Student placement risk prediction | `POST/GET /university/students/:id/ai-insight` | Wired; failed on Gemini error | Fixed |
| Department insight / hiring trends | `POST /university/analytics/ai-insight` | Same | Fixed |
| Campus drive recommendations | `POST /university/drives/ai-recommendations` | Same | Fixed |
| Executive placement report | `POST /university/reports/ai-report` | Same | Fixed |

### Interview module
| Feature | Status | Now |
|---|---|---|
| AI question plan | Curated question bank (deterministic, by design) | Unchanged |
| Per-answer evaluation, feedback, strengths/weaknesses | Gemini-backed; threw on failure | Fixed with fallback |
| Final report, summary, scores, improvement plan, suggested courses/questions | Gemini-backed; threw on failure | Fixed |
| Transcription / vision metrics | Deterministic heuristic (documented limitation — no speech/vision provider wired) | Unchanged, documented |

### Admin / platform-wide
Fraud detection, platform insights, moderation, system health, executive report, predictive analytics (`/admin/ai/*`) — all wired to Gemini through `AdminAIEngineClient`; all previously threw on Gemini failure; all now fall back gracefully. AI health endpoint `GET /ai/health` now reports the real provider mode, model, and detected key type.

## What was broken and fixed

1. **Wrong endpoint for the key type** (root cause above) — fixed with auto-routing.
2. **Docstring/behavior mismatch — no graceful fallback.** Every engine client documented "falls back to mock on failure" but actually re-threw, so any Gemini outage crashed the feature with a 5xx. All six clients (career, employer, university, admin, interview ×2 paths) and `GeminiProvider` now log the complete error server-side and return the deterministic, real-data-based fallback. No stack traces ever reach the client (error middleware + AppError codes).
3. **API key in URL query string** — moved to header (security).
4. **Unbounded in-memory AI cache** — now 1-hour TTL + 500-entry FIFO cap (prevents stale results and unbounded memory growth; still deduplicates identical requests via SHA-256 input hashing).
5. **Misleading fallback summary text** ("Configure GEMINI_API_KEY…" even when it was configured) — reworded.
6. **`.env.example`** — documented both key formats and updated default model from deprecated `gemini-1.5-flash` to `gemini-2.5-flash`.

## Verified behaviors

- TypeScript check of all modified files: clean.
- Retry/backoff: 3 attempts with exponential backoff on 429/5xx/network/timeout; 60s request timeout; non-transient errors (invalid key, forbidden) fail fast to the fallback.
- JSON parsing: markdown-fence stripping + brace-extraction recovery + one schema-clarification retry, then typed error → fallback.
- Frontend: AICareerReport, MockInterview(+Report), PlacementAnalytics, CampusDrives, ReportsCenter, StudentProfile, HiringPipelinePanel, CandidatesQueuePanel, AdminPortal AI views all have loading, error, and empty states and call the endpoints above.
- No TODO/placeholder/simulated-AI code paths remain in the AI layer (the landing-page "Simulated AI Coach" is a marketing animation, not a feature).

## Remaining limitations (honest)

- Live Gemini round-trip could not be tested from this environment (no outbound access to googleapis.com) — restart the backend and hit `GET /ai/health`, then any AI action; the server log now pinpoints any residual key/project issue.
- Interview speech-to-text and camera analysis remain deterministic heuristics — a transcription/vision provider is a separate integration, documented in `interview-engine.client.ts`.
- Employer/university/admin AI results are labelled per-request in AuditLog with provider `Gemini (Production)`, `Gemini (Fallback)`, or `Gemini (MockMode)` so you can always tell which path served a result.

## Files changed

- `backend/src/modules/ai/gemini-client.ts`
- `backend/src/modules/ai/providers/gemini.provider.ts`
- `backend/src/modules/ai/ai.controller.ts`
- `backend/src/modules/ai/cache/ai-cache.service.ts`
- `backend/src/modules/career/career-engine.client.ts`
- `backend/src/modules/employer/employer-ai-engine.client.ts`
- `backend/src/modules/university/university-ai-engine.client.ts`
- `backend/src/modules/admin/admin-ai-engine.client.ts`
- `backend/src/modules/interview/interview-engine.client.ts`
- `backend/.env.example`
