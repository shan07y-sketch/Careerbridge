/**
 * Mobile Interview Management (Phase 5 · Module 4).
 *
 * A premium interview workflow over the EXISTING employer interview API — no
 * new backend logic:
 *   - GET  /employer/interviews                     (EmployerOverviewService.getInterviews)
 *   - POST /employer/applications/:id/interviews    (schedule; moves candidate → INTERVIEWING, notifies)
 *   - PATCH /employer/interviews/:id                (reschedule / cancel / complete / no-show / feedback)
 * Candidate context (skills, résumé, AI fit, notes, timeline) is pulled from the
 * same HiringPipelineService the Applicant Tracking screen (Module 3) uses.
 *
 * Honesty notes (verified against the committed backend):
 *   - InterviewStatus enum = SCHEDULED | COMPLETED | CANCELLED | NO_SHOW |
 *     RESCHEDULED. There is NO "in progress" status, so the UI does not invent
 *     one — legal actions from a scheduled interview are Complete / Cancel /
 *     No-show / Reschedule, enforced client-side (the PATCH endpoint writes the
 *     status straight through with no server-side transition guard).
 *   - There is NO delete-interview route, so Delete is honestly disabled.
 *   - updateInterview accepts scheduledAt/duration/locationUrl/status/feedback
 *     only — the title cannot be changed after scheduling.
 *   - Interview "type" is the free-text title (no separate type column exists).
 *   - Feedback reuses the seeded feedback JSON schema (technical_score …,
 *     overall_recommendation, strengths, weaknesses, detailed_feedback) so it
 *     stays compatible with existing rows; a `decision` key is added on top.
 *   - Only scheduling notifies the candidate (backend); reschedule/cancel/
 *     complete do not — that is a backend limitation, not faked here.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '../../../contexts/ToastContext';
import { HiringPipelineService, EmployerOverviewService, CandidateManagementService } from '../../../services';
import type {
  EmployerInterview, PipelineApplication, PipelineApplicationDetail,
  PipelineNote, TimelineEntry,
} from '../../../services';
import type { CandidateEvaluation } from '../../../types';
import {
  Chip, SkeletonList, EmptyState, ErrorState, Button, Sheet,
  Avatar, ScoreRing, PullToRefresh,
} from '../../components';

/* ── Shared vocabulary ───────────────────────────────────────────────── */

const inputCls =
  'w-full h-11 px-3.5 rounded-xl bg-surface-container border border-on-surface/10 text-sm text-on-surface outline-none focus:border-primary';

const RECOMMENDATIONS = ['Pending', 'Strong Hire', 'Hire', 'Leaning Hire', 'Leaning No Hire', 'No Hire'];
const DECISIONS = ['', 'Advance', 'Hold', 'Reject'];
const RATING_DIMS: { key: string; label: string }[] = [
  { key: 'technical_score', label: 'Technical' },
  { key: 'communication_score', label: 'Communication' },
  { key: 'problem_solving', label: 'Problem solving' },
  { key: 'culture_fit', label: 'Culture fit' },
];

/** Feedback JSON stored in interview.feedback (compatible with seeded rows). */
interface Feedback {
  technical_score: number | null;
  communication_score: number | null;
  problem_solving: number | null;
  leadership: number | null;
  confidence: number | null;
  culture_fit: number | null;
  coding_score: number | null;
  system_design_score: number | null;
  overall_recommendation: string;
  strengths: string[];
  weaknesses: string[];
  detailed_feedback: string;
  decision?: string;
}

const EMPTY_FEEDBACK: Feedback = {
  technical_score: null, communication_score: null, problem_solving: null, leadership: null,
  confidence: null, culture_fit: null, coding_score: null, system_design_score: null,
  overall_recommendation: 'Pending', strengths: [], weaknesses: [], detailed_feedback: '', decision: '',
};

const parseFeedback = (raw: string | null): Feedback => {
  if (!raw) return { ...EMPTY_FEEDBACK };
  try {
    const p = JSON.parse(raw);
    return { ...EMPTY_FEEDBACK, ...p };
  } catch {
    // Non-JSON legacy note — preserve it as free text.
    return { ...EMPTY_FEEDBACK, detailed_feedback: raw };
  }
};

/** A feedback object counts as "real" content if any rating or note is set. */
const hasFeedback = (f: Feedback): boolean =>
  f.detailed_feedback.trim().length > 0 ||
  (f.overall_recommendation && f.overall_recommendation !== 'Pending') ||
  !!f.decision ||
  RATING_DIMS.some(d => (f as any)[d.key] != null) ||
  f.strengths.length > 0 || f.weaknesses.length > 0;

/* ── Status metadata + time buckets ──────────────────────────────────── */

type Tone = 'success' | 'warning' | 'error' | 'neutral' | 'info';
const statusMeta = (s: string): { label: string; tone: Tone } => {
  switch (s) {
    case 'SCHEDULED': return { label: 'Scheduled', tone: 'info' };
    case 'RESCHEDULED': return { label: 'Rescheduled', tone: 'info' };
    case 'COMPLETED': return { label: 'Completed', tone: 'success' };
    case 'CANCELLED': return { label: 'Cancelled', tone: 'error' };
    case 'NO_SHOW': return { label: 'No-show', tone: 'warning' };
    default: return { label: s, tone: 'neutral' };
  }
};

const isActive = (iv: EmployerInterview): boolean => iv.status === 'SCHEDULED' || iv.status === 'RESCHEDULED';
const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
const endOfToday = () => { const d = new Date(); d.setHours(23, 59, 59, 999); return d.getTime(); };
const isUpcoming = (iv: EmployerInterview) => isActive(iv) && new Date(iv.scheduledAt).getTime() >= Date.now();
const isToday = (iv: EmployerInterview) => {
  const t = new Date(iv.scheduledAt).getTime();
  return t >= startOfToday() && t <= endOfToday();
};

const fmtWhen = (iso: string): string =>
  new Date(iso).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

const candidateName = (iv: EmployerInterview): string =>
  `${iv.application.studentProfile.firstName} ${iv.application.studentProfile.lastName}`.trim();
const interviewerName = (iv: EmployerInterview): string =>
  iv.scheduledByRecruiter ? (iv.scheduledByRecruiter.title || iv.scheduledByRecruiter.user.email) : 'Unassigned';

/** ISO → value for <input type="datetime-local"> in the viewer's local tz. */
const toLocalInput = (iso: string): string => {
  const d = new Date(iso);
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
};

/* ── Schedule / reschedule form ──────────────────────────────────────── */

const ScheduleSheet: React.FC<{
  interview?: EmployerInterview;        // present ⇒ reschedule/edit an existing interview
  onClose: () => void;
  onSaved: () => void;
}> = ({ interview, onClose, onSaved }) => {
  const { showToast } = useToast();
  const editing = !!interview;

  // Candidate picker (schedule mode only)
  const [candidates, setCandidates] = useState<PipelineApplication[]>([]);
  const [loadingCands, setLoadingCands] = useState(!editing);
  const [candQuery, setCandQuery] = useState('');
  const [appId, setAppId] = useState<string | null>(interview?.application.id ?? null);

  const [title, setTitle] = useState(interview?.title ?? '');
  const [when, setWhen] = useState(interview ? toLocalInput(interview.scheduledAt) : '');
  const [duration, setDuration] = useState(interview?.duration ?? 45);
  const [locationUrl, setLocationUrl] = useState(interview?.locationUrl ?? '');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (editing) return;
    let alive = true;
    HiringPipelineService.getQueue({ limit: 100, sortBy: 'createdAt', sortOrder: 'desc' })
      .then(r => { if (alive) { setCandidates(r.applications); setLoadingCands(false); } })
      .catch(() => { if (alive) setLoadingCands(false); });
    return () => { alive = false; };
  }, [editing]);

  const filteredCands = useMemo(() => {
    const q = candQuery.trim().toLowerCase();
    return candidates.filter(a => {
      if (['REJECTED', 'WITHDRAWN'].includes(a.status)) return false;
      if (!q) return true;
      return `${a.studentProfile.firstName} ${a.studentProfile.lastName} ${a.job.title}`.toLowerCase().includes(q);
    });
  }, [candidates, candQuery]);

  const selectedCand = candidates.find(c => c.id === appId);

  const save = async () => {
    if (!appId) { showToast('Pick a candidate first', 'error'); return; }
    const ts = new Date(when).getTime();
    if (!when || isNaN(ts)) { showToast('Choose a date and time', 'error'); return; }
    if (!editing && ts < Date.now()) { showToast('Interview must be in the future', 'error'); return; }
    if (duration < 5) { showToast('Duration must be at least 5 minutes', 'error'); return; }
    setBusy(true);
    try {
      if (editing) {
        // Reschedule/edit — title is immutable on the backend, so it is not sent.
        await HiringPipelineService.updateInterview(interview!.id, {
          scheduledAt: new Date(when).toISOString(),
          duration,
          locationUrl: locationUrl.trim() || undefined,
        });
        showToast('Interview updated');
      } else {
        if (!title.trim()) { showToast('Add an interview title', 'error'); setBusy(false); return; }
        await HiringPipelineService.scheduleInterview(appId, {
          title: title.trim(),
          scheduledAt: new Date(when).toISOString(),
          duration,
          locationUrl: locationUrl.trim() || undefined,
        });
        showToast('Interview scheduled — candidate notified');
      }
      onSaved();
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not save interview', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open onClose={onClose} title={editing ? 'Reschedule interview' : 'Schedule interview'}>
      <div className="pb-6 space-y-3.5">
        {/* Candidate */}
        {editing ? (
          <div className="flex items-center gap-3 rounded-xl bg-surface-container/60 p-3">
            <Avatar src={interview!.application.studentProfile.avatarUrl} name={candidateName(interview!)} size={40} />
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">{candidateName(interview!)}</p>
              <p className="text-xs text-on-surface-variant truncate">{interview!.application.job.title}</p>
            </div>
          </div>
        ) : selectedCand ? (
          <div className="flex items-center gap-3 rounded-xl bg-surface-container/60 p-3">
            <Avatar src={selectedCand.studentProfile.avatarUrl} name={`${selectedCand.studentProfile.firstName} ${selectedCand.studentProfile.lastName}`} size={40} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{selectedCand.studentProfile.firstName} {selectedCand.studentProfile.lastName}</p>
              <p className="text-xs text-on-surface-variant truncate">{selectedCand.job.title}</p>
            </div>
            <button onClick={() => setAppId(null)} className="text-xs font-semibold text-primary shrink-0">Change</button>
          </div>
        ) : (
          <div>
            <span className="text-xs font-semibold text-on-surface-variant">Candidate <span className="text-error">*</span></span>
            <input className={`${inputCls} mt-1`} value={candQuery} onChange={e => setCandQuery(e.target.value)} placeholder="Search candidates…" />
            <div className="mt-2 max-h-52 overflow-y-auto space-y-1.5">
              {loadingCands ? (
                <p className="text-xs text-on-surface-variant px-1 py-2">Loading candidates…</p>
              ) : filteredCands.length === 0 ? (
                <p className="text-xs text-on-surface-variant px-1 py-2">No matching candidates.</p>
              ) : filteredCands.slice(0, 25).map(a => (
                <button
                  key={a.id}
                  onClick={() => setAppId(a.id)}
                  className="m-press w-full flex items-center gap-2.5 rounded-xl bg-surface-container/50 p-2.5 text-left"
                >
                  <Avatar src={a.studentProfile.avatarUrl} name={`${a.studentProfile.firstName} ${a.studentProfile.lastName}`} size={32} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{a.studentProfile.firstName} {a.studentProfile.lastName}</p>
                    <p className="text-[11px] text-on-surface-variant truncate">{a.job.title}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Title (schedule only — immutable on backend) */}
        {!editing && (
          <label className="block">
            <span className="text-xs font-semibold text-on-surface-variant">Interview title / type <span className="text-error">*</span></span>
            <input className={`${inputCls} mt-1`} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Technical Round" />
          </label>
        )}
        {editing && (
          <div className="rounded-xl bg-surface-container/40 px-3 py-2">
            <p className="text-[11px] text-on-surface-variant">Title (fixed): <span className="font-semibold text-on-surface">{interview!.title}</span></p>
          </div>
        )}

        {/* When */}
        <label className="block">
          <span className="text-xs font-semibold text-on-surface-variant">Date &amp; time <span className="text-error">*</span></span>
          <input type="datetime-local" className={`${inputCls} mt-1`} value={when} onChange={e => setWhen(e.target.value)} />
        </label>

        {/* Duration + link */}
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-semibold text-on-surface-variant">Duration (min)</span>
            <select className={`${inputCls} mt-1`} value={duration} onChange={e => setDuration(Number(e.target.value))}>
              {[15, 30, 45, 60, 90].map(d => <option key={d} value={d}>{d} min</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-on-surface-variant">Meeting link</span>
            <input className={`${inputCls} mt-1`} value={locationUrl} onChange={e => setLocationUrl(e.target.value)} placeholder="https://…" />
          </label>
        </div>

        <Button full variant="primary" disabled={busy} onClick={save}>
          {busy ? 'Saving…' : editing ? 'Save changes' : 'Schedule interview'}
        </Button>
      </div>
    </Sheet>
  );
};

/* ── Feedback editor ─────────────────────────────────────────────────── */

const FeedbackEditor: React.FC<{
  initial: Feedback;
  onSave: (f: Feedback) => Promise<void>;
}> = ({ initial, onSave }) => {
  const [fb, setFb] = useState<Feedback>(initial);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setFb(initial); }, [initial]);

  const setRating = (key: string, val: number | null) => setFb(prev => ({ ...prev, [key]: val }));

  const save = async () => {
    setBusy(true);
    try { await onSave(fb); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-3">
      {/* Ratings */}
      <div className="space-y-2.5">
        {RATING_DIMS.map(d => {
          const v = (fb as any)[d.key] as number | null;
          return (
            <div key={d.key}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-on-surface">{d.label}</span>
                <span className="text-on-surface-variant tabular-nums">{v == null ? '—' : `${v}/100`}</span>
              </div>
              <input
                type="range" min={0} max={100} step={5}
                value={v ?? 0}
                onChange={e => setRating(d.key, Number(e.target.value))}
                className="w-full accent-primary"
                aria-label={d.label}
              />
            </div>
          );
        })}
      </div>

      {/* Recommendation + decision */}
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-semibold text-on-surface-variant">Recommendation</span>
          <select className={`${inputCls} mt-1`} value={fb.overall_recommendation} onChange={e => setFb({ ...fb, overall_recommendation: e.target.value })}>
            {RECOMMENDATIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-on-surface-variant">Decision</span>
          <select className={`${inputCls} mt-1`} value={fb.decision || ''} onChange={e => setFb({ ...fb, decision: e.target.value })}>
            {DECISIONS.map(d => <option key={d} value={d}>{d || '—'}</option>)}
          </select>
        </label>
      </div>

      {/* Notes */}
      <label className="block">
        <span className="text-xs font-semibold text-on-surface-variant">Interviewer notes</span>
        <textarea
          className={`${inputCls} mt-1 h-auto py-2.5 min-h-[80px]`}
          value={fb.detailed_feedback}
          onChange={e => setFb({ ...fb, detailed_feedback: e.target.value })}
          placeholder="How did the interview go?"
        />
      </label>

      <Button full variant="tonal" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save feedback'}</Button>
    </div>
  );
};

/* ── Interview detail ────────────────────────────────────────────────── */

const timelineIcon = (t: TimelineEntry['type']): string =>
  t.startsWith('INTERVIEW') ? 'event' :
  t.startsWith('OFFER') ? 'local_offer' :
  t === 'NOTE_ADDED' ? 'sticky_note_2' : 'timeline';

const InterviewDetail: React.FC<{
  interview: EmployerInterview;
  onClose: () => void;
  onChanged: () => void;
}> = ({ interview, onClose, onChanged }) => {
  const { showToast } = useToast();
  const appId = interview.application.id;

  const [detail, setDetail] = useState<PipelineApplicationDetail | null>(null);
  const [evaluation, setEvaluation] = useState<CandidateEvaluation | null>(null);
  const [notes, setNotes] = useState<PipelineNote[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  const status = interview.status;
  const feedback = useMemo(() => parseFeedback(interview.feedback), [interview.feedback]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.allSettled([
      HiringPipelineService.getDetail(appId),
      HiringPipelineService.getLatestEvaluation(appId),
      HiringPipelineService.getNotes(appId),
      CandidateManagementService.getTimeline(appId),
    ]).then(([d, e, n, t]) => {
      if (!alive) return;
      if (d.status === 'fulfilled') setDetail(d.value);
      if (e.status === 'fulfilled') setEvaluation(e.value);
      if (n.status === 'fulfilled') setNotes(n.value);
      if (t.status === 'fulfilled') setTimeline(t.value);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [appId]);

  const s = interview.application.studentProfile;
  const name = candidateName(interview);
  const resumeId = detail?.studentProfile.resumes?.[0]?.id;
  const skills = detail?.studentProfile.skills || [];

  const patch = async (data: Record<string, unknown>, msg: string) => {
    setBusy(true);
    try { await HiringPipelineService.updateInterview(interview.id, data); showToast(msg); onChanged(); onClose(); }
    catch (err) { showToast(err instanceof Error ? err.message : 'Action failed', 'error'); }
    finally { setBusy(false); }
  };

  const saveFeedback = async (f: Feedback) => {
    try {
      await HiringPipelineService.updateInterview(interview.id, { feedback: JSON.stringify(f) });
      showToast('Feedback saved');
      onChanged();
      setShowFeedback(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not save feedback', 'error');
    }
  };

  const viewResume = async () => {
    if (!resumeId) return;
    try { await HiringPipelineService.previewResume(resumeId); }
    catch (err) { showToast(err instanceof Error ? err.message : 'Could not open résumé', 'error'); }
  };

  const addNote = async () => {
    if (!noteDraft.trim()) return;
    try {
      const n = await HiringPipelineService.addNote(appId, noteDraft.trim());
      setNotes(prev => [...prev, n]);
      setNoteDraft('');
    } catch (err) { showToast(err instanceof Error ? err.message : 'Could not add note', 'error'); }
  };

  const meta = statusMeta(status);

  return (
    <Sheet open onClose={onClose} title={interview.title}>
      <div className="pb-6 space-y-4">
        {/* Candidate profile */}
        <div className="flex items-center gap-3">
          <Avatar src={s.avatarUrl} name={name} size={48} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{name}</p>
            <p className="text-xs text-on-surface-variant truncate">{s.user.email}</p>
            <p className="text-xs text-on-surface-variant truncate">{interview.application.job.title}</p>
          </div>
          <Chip tone={meta.tone}>{meta.label}</Chip>
        </div>

        {/* Interview meta */}
        <div className="rounded-2xl bg-surface-container/60 border border-on-surface/5 p-3.5 space-y-1.5 text-sm">
          <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[17px] text-primary">schedule</span><span>{fmtWhen(interview.scheduledAt)} · {interview.duration}m</span></div>
          <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[17px] text-primary">person</span><span className="text-on-surface-variant">Interviewer: {interviewerName(interview)}</span></div>
          {interview.locationUrl && (
            <a href={interview.locationUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary font-semibold">
              <span className="material-symbols-outlined text-[17px]">videocam</span>Join meeting
            </a>
          )}
        </div>

        {/* Status actions (legal transitions only) */}
        {isActive(interview) && (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="primary" disabled={busy} onClick={() => patch({ status: 'COMPLETED' }, 'Marked completed')}>Complete</Button>
            <Button variant="outline" disabled={busy} onClick={() => patch({ status: 'NO_SHOW' }, 'Marked no-show')}>No-show</Button>
            <Button variant="outline" disabled={busy} onClick={() => patch({ status: 'CANCELLED' }, 'Interview cancelled')}>Cancel</Button>
            <Button variant="danger" disabled>Delete</Button>
          </div>
        )}
        {isActive(interview) && (
          <p className="-mt-2 text-[10px] text-on-surface-variant">Deleting interviews isn't supported by the backend — cancel instead.</p>
        )}

        {/* Feedback */}
        <div className="rounded-2xl bg-surface-container/60 border border-on-surface/5 p-3.5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-primary">rate_review</span> Feedback
            </p>
            <button onClick={() => setShowFeedback(v => !v)} className="text-xs font-semibold text-primary">
              {showFeedback ? 'Close' : hasFeedback(feedback) ? 'Edit' : 'Add'}
            </button>
          </div>

          {showFeedback ? (
            <div className="mt-3"><FeedbackEditor initial={feedback} onSave={saveFeedback} /></div>
          ) : hasFeedback(feedback) ? (
            <div className="mt-2.5 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {feedback.overall_recommendation && feedback.overall_recommendation !== 'Pending' && (
                  <Chip tone={/no hire/i.test(feedback.overall_recommendation) ? 'error' : 'success'}>{feedback.overall_recommendation}</Chip>
                )}
                {feedback.decision && <Chip tone="info">{feedback.decision}</Chip>}
              </div>
              <div className="flex flex-wrap gap-2">
                {RATING_DIMS.map(d => {
                  const v = (feedback as any)[d.key] as number | null;
                  return v == null ? null : (
                    <span key={d.key} className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">{d.label} {v}</span>
                  );
                })}
              </div>
              {feedback.detailed_feedback && <p className="text-sm text-on-surface-variant leading-relaxed">{feedback.detailed_feedback}</p>}
              {feedback.strengths.length > 0 && (
                <p className="text-xs text-on-surface-variant"><span className="font-bold text-success">Strengths: </span>{feedback.strengths.join(' · ')}</p>
              )}
              {feedback.weaknesses.length > 0 && (
                <p className="text-xs text-on-surface-variant"><span className="font-bold text-warning">Concerns: </span>{feedback.weaknesses.join(' · ')}</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-on-surface-variant mt-2">No feedback yet. Add ratings, a recommendation and notes.</p>
          )}
        </div>

        {/* Résumé + AI fit + skills */}
        <Button full variant="outline" icon="description" disabled={!resumeId} onClick={viewResume}>
          {resumeId ? 'View résumé' : loading ? 'Loading résumé…' : 'No résumé uploaded'}
        </Button>

        {evaluation && (
          <div className="rounded-2xl bg-surface-container/60 border border-on-surface/5 p-3.5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-primary">auto_awesome</span> AI candidate fit
              </p>
              <ScoreRing score={Math.round(evaluation.fitScore)} size={44} />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-primary mt-2">{evaluation.recommendation}</p>
            <p className="text-sm text-on-surface-variant leading-relaxed mt-1">{evaluation.summary}</p>
          </div>
        )}

        {skills.length > 0 && (
          <div>
            <p className="text-xs font-bold text-on-surface-variant mb-1.5">Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {skills.slice(0, 12).map((sk, i) => (
                <span key={i} className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant">{sk.skill.name}</span>
              ))}
            </div>
          </div>
        )}

        {/* Notes thread */}
        <div>
          <p className="text-xs font-bold text-on-surface-variant mb-1.5">Recruiter notes</p>
          {notes.length > 0 && (
            <div className="space-y-2 mb-2">
              {notes.map(n => (
                <div key={n.id} className="rounded-xl bg-surface-container/50 p-2.5">
                  <p className="text-sm text-on-surface leading-snug">{n.content}</p>
                  <p className="text-[10px] text-on-surface-variant mt-1">{n.authorRecruiter.user.email} · {new Date(n.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input value={noteDraft} onChange={e => setNoteDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && addNote()} placeholder="Add an internal note…" className={inputCls} />
            <button onClick={addNote} disabled={!noteDraft.trim()} aria-label="Add note" className="m-press w-11 h-11 shrink-0 rounded-xl bg-primary text-on-primary flex items-center justify-center disabled:opacity-40">
              <span className="material-symbols-outlined text-[20px]">add</span>
            </button>
          </div>
        </div>

        {/* Timeline */}
        {timeline.length > 0 && (
          <div>
            <p className="text-xs font-bold text-on-surface-variant mb-1.5">Timeline</p>
            <div className="space-y-2.5">
              {timeline.map((t, i) => (
                <div key={i} className="flex gap-2.5">
                  <span className="material-symbols-outlined text-[17px] text-primary mt-0.5">{timelineIcon(t.type)}</span>
                  <div className="min-w-0">
                    <p className="text-sm text-on-surface leading-snug">{t.summary}</p>
                    <p className="text-[10px] text-on-surface-variant">{t.actorLabel} · {new Date(t.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && <p className="text-center text-xs text-on-surface-variant">Loading candidate details…</p>}
      </div>
    </Sheet>
  );
};

/* ── Main screen ─────────────────────────────────────────────────────── */

type FilterKey = 'ALL' | 'UPCOMING' | 'TODAY' | 'COMPLETED' | 'CANCELLED';
type SortKey = 'DATE' | 'CANDIDATE' | 'JOB';

const InterviewManager: React.FC = () => {
  const [interviews, setInterviews] = useState<EmployerInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('ALL');
  const [jobFilter, setJobFilter] = useState('ALL');
  const [interviewerFilter, setInterviewerFilter] = useState('ALL');
  const [sort, setSort] = useState<SortKey>('DATE');
  const [selected, setSelected] = useState<EmployerInterview | null>(null);
  const [scheduling, setScheduling] = useState(false);
  const [rescheduling, setRescheduling] = useState<EmployerInterview | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { setInterviews(await EmployerOverviewService.getInterviews()); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not load interviews.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => ({
    total: interviews.length,
    upcoming: interviews.filter(isUpcoming).length,
    today: interviews.filter(iv => isToday(iv) && isActive(iv)).length,
    completed: interviews.filter(iv => iv.status === 'COMPLETED').length,
    cancelled: interviews.filter(iv => iv.status === 'CANCELLED').length,
    noShow: interviews.filter(iv => iv.status === 'NO_SHOW').length,
  }), [interviews]);

  const jobs = useMemo(() => {
    const m = new Map<string, string>();
    interviews.forEach(iv => m.set(iv.application.job.id, iv.application.job.title));
    return [...m.entries()];
  }, [interviews]);

  const interviewers = useMemo(() => {
    const m = new Map<string, string>();
    interviews.forEach(iv => { if (iv.scheduledByRecruiter) m.set(iv.scheduledByRecruiter.id, interviewerName(iv)); });
    return [...m.entries()];
  }, [interviews]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = interviews.filter(iv => {
      if (filter === 'UPCOMING' && !isUpcoming(iv)) return false;
      if (filter === 'TODAY' && !(isToday(iv) && isActive(iv))) return false;
      if (filter === 'COMPLETED' && iv.status !== 'COMPLETED') return false;
      if (filter === 'CANCELLED' && !(iv.status === 'CANCELLED' || iv.status === 'NO_SHOW')) return false;
      if (jobFilter !== 'ALL' && iv.application.job.id !== jobFilter) return false;
      if (interviewerFilter !== 'ALL' && iv.scheduledByRecruiter?.id !== interviewerFilter) return false;
      if (q) {
        const hay = `${candidateName(iv)} ${iv.application.job.title} ${interviewerName(iv)} ${iv.title}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === 'CANDIDATE') return candidateName(a).localeCompare(candidateName(b));
      if (sort === 'JOB') return a.application.job.title.localeCompare(b.application.job.title);
      return new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime();
    });
    return list;
  }, [interviews, query, filter, jobFilter, interviewerFilter, sort]);

  const FILTERS: { key: FilterKey; label: string; count: number }[] = [
    { key: 'ALL', label: 'All', count: stats.total },
    { key: 'UPCOMING', label: 'Upcoming', count: stats.upcoming },
    { key: 'TODAY', label: 'Today', count: stats.today },
    { key: 'COMPLETED', label: 'Completed', count: stats.completed },
    { key: 'CANCELLED', label: 'Cancelled', count: stats.cancelled + stats.noShow },
  ];

  if (loading) return <SkeletonList count={6} />;
  if (error) return <ErrorState message={error} onRetry={() => { setLoading(true); load(); }} />;

  return (
    <>
      <PullToRefresh onRefresh={load}>
        <div className="px-4 pt-4">
          {/* Aurora hero — interview dashboard */}
          <section className="m-hero rounded-[28px] px-5 py-5 m-rise m-rise-1">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] text-white/70 leading-none">Interview management</p>
                <p className="text-lg font-extrabold leading-tight mt-1">{stats.upcoming} upcoming</p>
              </div>
              <span className="material-symbols-outlined text-[26px] text-white/90">event_available</span>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {[
                { v: stats.today, l: 'Today' },
                { v: stats.upcoming, l: 'Upcoming' },
                { v: stats.completed, l: 'Completed' },
                { v: stats.cancelled + stats.noShow, l: 'Cancelled' },
              ].map((x, i) => (
                <div key={i} className="rounded-2xl m-glass py-2.5 text-center">
                  <p className="text-xl font-extrabold leading-none">{x.v}</p>
                  <p className="text-[10px] text-white/70 mt-1">{x.l}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Refine bar */}
        <div className="px-4 pt-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">search</span>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search candidate, job or interviewer"
              aria-label="Search interviews"
              className="w-full h-11 pl-10 pr-3 rounded-full bg-surface-container text-sm outline-none"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pt-2.5 pb-0.5 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
            {FILTERS.map(f => (
              <Chip key={f.key} selected={filter === f.key} onClick={() => setFilter(f.key)}>
                {f.label}{f.count ? ` ${f.count}` : ''}
              </Chip>
            ))}
          </div>
          {/* Secondary filters + sort */}
          <div className="grid grid-cols-3 gap-2 pt-2.5">
            <select aria-label="Filter by job" className={inputCls} value={jobFilter} onChange={e => setJobFilter(e.target.value)}>
              <option value="ALL">All jobs</option>
              {jobs.map(([id, title]) => <option key={id} value={id}>{title}</option>)}
            </select>
            <select aria-label="Filter by interviewer" className={inputCls} value={interviewerFilter} onChange={e => setInterviewerFilter(e.target.value)}>
              <option value="ALL">All interviewers</option>
              {interviewers.map(([id, nm]) => <option key={id} value={id}>{nm}</option>)}
            </select>
            <select aria-label="Sort" className={inputCls} value={sort} onChange={e => setSort(e.target.value as SortKey)}>
              <option value="DATE">Sort: Date</option>
              <option value="CANDIDATE">Sort: Candidate</option>
              <option value="JOB">Sort: Job</option>
            </select>
          </div>
        </div>

        {/* List */}
        <div className="px-4 pt-3 space-y-2.5">
          {filtered.length === 0 ? (
            interviews.length === 0
              ? <EmptyState icon="event_busy" title="No interviews yet" hint="Schedule an interview to get started." action={<Button variant="primary" icon="add" onClick={() => setScheduling(true)}>Schedule interview</Button>} />
              : <EmptyState icon="filter_alt_off" title="No interviews match" hint="Try another filter or search." />
          ) : (
            filtered.map(iv => {
              const meta = statusMeta(iv.status);
              const fb = parseFeedback(iv.feedback);
              return (
                <div key={iv.id} className="m-card p-4">
                  {/* Main tappable area — a single button so the action buttons
                      below are siblings, never nested inside another button. */}
                  <button onClick={() => setSelected(iv)} className="m-press w-full text-left">
                    <div className="flex items-center gap-3">
                      <Avatar src={iv.application.studentProfile.avatarUrl} name={candidateName(iv)} size={40} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{candidateName(iv)}</p>
                        <p className="text-xs text-on-surface-variant truncate">{iv.title} · {iv.application.job.title}</p>
                      </div>
                      <Chip tone={meta.tone}>{meta.label}</Chip>
                    </div>
                    <div className="flex items-center justify-between mt-2.5 text-[11px] text-on-surface-variant">
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">schedule</span>{fmtWhen(iv.scheduledAt)} · {iv.duration}m</span>
                      <span className="flex items-center gap-2">
                        {hasFeedback(fb) && <span className="material-symbols-outlined text-[14px] text-primary" title="Has feedback">rate_review</span>}
                        {iv.locationUrl && <span className="material-symbols-outlined text-[14px] text-primary" title="Has meeting link">videocam</span>}
                      </span>
                    </div>
                  </button>
                  {isActive(iv) && (
                    <div className="flex gap-2 mt-2.5">
                      <button onClick={() => setRescheduling(iv)} className="m-press flex-1 h-9 rounded-full bg-surface-container text-xs font-semibold text-on-surface">Reschedule</button>
                      <button onClick={() => setSelected(iv)} className="m-press flex-1 h-9 rounded-full bg-primary-container text-xs font-semibold text-on-primary-container">Manage</button>
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div className="h-20" />
        </div>
      </PullToRefresh>

      {/* Schedule FAB */}
      <button
        onClick={() => setScheduling(true)}
        aria-label="Schedule interview"
        className="m-press fixed right-4 bottom-24 z-30 h-14 w-14 rounded-2xl bg-primary text-on-primary shadow-lg flex items-center justify-center"
      >
        <span className="material-symbols-outlined text-[26px]">add</span>
      </button>

      {selected && <InterviewDetail interview={selected} onClose={() => setSelected(null)} onChanged={load} />}
      {scheduling && <ScheduleSheet onClose={() => setScheduling(false)} onSaved={load} />}
      {rescheduling && <ScheduleSheet interview={rescheduling} onClose={() => setRescheduling(null)} onSaved={load} />}
    </>
  );
};

export default InterviewManager;
