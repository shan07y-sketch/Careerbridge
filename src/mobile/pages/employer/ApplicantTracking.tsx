/**
 * Mobile Applicant Tracking (Phase 5 · Module 3).
 *
 * Pipeline board (Applied → Shortlisted → Interview → Offer → Rejected) over
 * the EXISTING hiring-pipeline API — no new backend. Per candidate: résumé
 * viewer, real Gemini evaluation (fit/match score, summary, strengths,
 * concerns, skill match/gap), and stage actions (shortlist / reject). Real
 * PostgreSQL + AI data only; honest empty/loading/error states.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '../../../contexts/ToastContext';
import { HiringPipelineService } from '../../../services';
import type { PipelineApplication, PipelineApplicationDetail } from '../../../services';
import type { CandidateEvaluation } from '../../../types';
import { Card, Chip, SkeletonList, EmptyState, ErrorState, Button, Sheet, Avatar, ScoreRing, PullToRefresh } from '../../components';

/** Pipeline columns. Each maps one or more raw Application statuses. */
const STAGES: { key: string; label: string; statuses: string[] | null }[] = [
  { key: 'ALL', label: 'All', statuses: null },
  { key: 'APPLIED', label: 'Applied', statuses: ['APPLIED', 'REVIEWING', 'SCREENING'] },
  { key: 'SHORTLISTED', label: 'Shortlisted', statuses: ['SHORTLISTED'] },
  { key: 'INTERVIEWING', label: 'Interview', statuses: ['INTERVIEWING'] },
  { key: 'OFFERED', label: 'Offer', statuses: ['OFFERED'] },
  { key: 'REJECTED', label: 'Rejected', statuses: ['REJECTED', 'WITHDRAWN'] },
];

const statusTone = (s: string): 'success' | 'warning' | 'error' | 'neutral' | 'info' =>
  s === 'SHORTLISTED' || s === 'OFFERED' ? 'success' :
  s === 'REJECTED' || s === 'WITHDRAWN' ? 'error' :
  s === 'INTERVIEWING' ? 'info' : 'neutral';

const humanize = (s: string): string => s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

/* ── Candidate detail sheet ──────────────────────────────────────────── */

const ApplicantDetail: React.FC<{ app: PipelineApplication; onClose: () => void; onChanged: () => void }> = ({ app, onClose, onChanged }) => {
  const { showToast } = useToast();
  const [detail, setDetail] = useState<PipelineApplicationDetail | null>(null);
  const [evaluation, setEvaluation] = useState<CandidateEvaluation | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoadingDetail(true); setDetail(null); setEvaluation(null);
    Promise.allSettled([
      HiringPipelineService.getDetail(app.id),
      HiringPipelineService.getLatestEvaluation(app.id),
    ]).then(([d, e]) => {
      if (!alive) return;
      if (d.status === 'fulfilled') setDetail(d.value);
      if (e.status === 'fulfilled') setEvaluation(e.value);
      setLoadingDetail(false);
    });
    return () => { alive = false; };
  }, [app.id]);

  const s = app.studentProfile;
  const name = `${s.firstName} ${s.lastName}`.trim();
  const resumeId = s.resumes?.[0]?.id;
  const skills = detail?.studentProfile.skills || [];

  const act = async (fn: () => Promise<unknown>, msg: string) => {
    setBusy(true);
    try { await fn(); showToast(msg); onChanged(); onClose(); }
    catch (err) { showToast(err instanceof Error ? err.message : 'Action failed', 'error'); }
    finally { setBusy(false); }
  };

  const runEvaluation = async () => {
    setEvaluating(true);
    try { setEvaluation(await HiringPipelineService.evaluateCandidate(app.id)); }
    catch (err) { showToast(err instanceof Error ? err.message : 'Evaluation failed', 'error'); }
    finally { setEvaluating(false); }
  };

  const viewResume = async () => {
    if (!resumeId) return;
    try { await HiringPipelineService.previewResume(resumeId); }
    catch (err) { showToast(err instanceof Error ? err.message : 'Could not open résumé', 'error'); }
  };

  const canShortlist = ['APPLIED', 'REVIEWING', 'SCREENING'].includes(app.status);
  const canReject = !['REJECTED', 'WITHDRAWN'].includes(app.status);

  return (
    <Sheet open onClose={onClose} title={name}>
      <div className="pb-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Avatar src={s.avatarUrl} name={name} size={48} />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-on-surface-variant truncate">{s.user.email}</p>
            <p className="text-sm font-semibold truncate">{app.job.title}</p>
          </div>
          <Chip tone={statusTone(app.status)}>{humanize(app.status)}</Chip>
        </div>

        {/* Résumé */}
        <Button full variant="outline" icon="description" disabled={!resumeId} onClick={viewResume}>
          {resumeId ? 'View résumé' : 'No résumé uploaded'}
        </Button>

        {/* Skills */}
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

        {/* AI evaluation */}
        <div className="rounded-2xl bg-surface-container/60 border border-on-surface/5 p-3.5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-primary">auto_awesome</span>
              AI candidate fit
            </p>
            {evaluation && <ScoreRing score={Math.round(evaluation.fitScore)} size={44} />}
          </div>

          {evaluation ? (
            <div className="mt-2.5 space-y-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">{evaluation.recommendation}</p>
              <p className="text-sm text-on-surface-variant leading-relaxed">{evaluation.summary}</p>
              {evaluation.strengths.length > 0 && (
                <EvalList icon="add_circle" tone="text-success" title="Strengths" items={evaluation.strengths} />
              )}
              {evaluation.concerns.length > 0 && (
                <EvalList icon="error" tone="text-warning" title="Concerns" items={evaluation.concerns} />
              )}
              {(evaluation.skillsMatch.length > 0 || evaluation.skillsGap.length > 0) && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {evaluation.skillsMatch.map((sk, i) => (
                    <span key={`m${i}`} className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-success-container text-on-success-container">✓ {sk}</span>
                  ))}
                  {evaluation.skillsGap.map((sk, i) => (
                    <span key={`g${i}`} className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-error-container text-on-error-container">✕ {sk}</span>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-on-surface-variant">{evaluation.modelVersion}</p>
            </div>
          ) : (
            <div className="mt-2.5">
              <p className="text-xs text-on-surface-variant mb-2">
                Grade this candidate against the role using their résumé, skills and interview signals.
              </p>
              <Button full variant="tonal" icon="auto_awesome" disabled={evaluating} onClick={runEvaluation}>
                {evaluating ? 'Analyzing…' : 'Run AI evaluation'}
              </Button>
            </div>
          )}
        </div>

        {/* Stage actions */}
        {(canShortlist || canReject) && (
          <div className="flex gap-2">
            {canShortlist && (
              <Button full variant="primary" disabled={busy} onClick={() => act(() => HiringPipelineService.shortlist(app.id), 'Candidate shortlisted')}>Shortlist</Button>
            )}
            {canReject && (
              <Button full variant="outline" disabled={busy} onClick={() => act(() => HiringPipelineService.reject(app.id), 'Candidate rejected')}>Reject</Button>
            )}
          </div>
        )}

        {loadingDetail && <p className="text-center text-xs text-on-surface-variant">Loading candidate details…</p>}
      </div>
    </Sheet>
  );
};

const EvalList: React.FC<{ icon: string; tone: string; title: string; items: string[] }> = ({ icon, tone, title, items }) => (
  <div>
    <p className="text-[11px] font-bold text-on-surface-variant">{title}</p>
    <ul className="mt-1 space-y-1">
      {items.map((it, i) => (
        <li key={i} className="flex items-start gap-1.5 text-sm text-on-surface-variant">
          <span className={`material-symbols-outlined text-[16px] mt-0.5 ${tone}`}>{icon}</span>
          <span className="leading-snug">{it}</span>
        </li>
      ))}
    </ul>
  </div>
);

/* ── Screen ──────────────────────────────────────────────────────────── */

const ApplicantTracking: React.FC = () => {
  const [apps, setApps] = useState<PipelineApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState('ALL');
  const [selected, setSelected] = useState<PipelineApplication | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await HiringPipelineService.getQueue({ limit: 100, sortBy: 'createdAt', sortOrder: 'desc' });
      setApps(res.applications);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load applicants.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { ALL: apps.length };
    for (const st of STAGES) {
      if (!st.statuses) continue;
      map[st.key] = apps.filter(a => st.statuses!.includes(a.status)).length;
    }
    return map;
  }, [apps]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const st = STAGES.find(x => x.key === stage);
    return apps.filter(a => {
      if (st?.statuses && !st.statuses.includes(a.status)) return false;
      if (q) {
        const hay = `${a.studentProfile.firstName} ${a.studentProfile.lastName} ${a.job.title}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [apps, query, stage]);

  if (loading) return <SkeletonList count={6} />;
  if (error) return <ErrorState message={error} onRetry={() => { setLoading(true); load(); }} />;

  return (
    <>
      <PullToRefresh onRefresh={load}>
        {/* Refine bar */}
        <div className="sticky top-14 z-20 bg-surface/90 backdrop-blur-md px-4 pt-3 pb-2 -mt-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">search</span>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name or role"
              aria-label="Search applicants"
              className="w-full h-11 pl-10 pr-3 rounded-full bg-surface-container text-sm outline-none"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pt-2.5 pb-0.5 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
            {STAGES.map(st => (
              <Chip key={st.key} selected={stage === st.key} onClick={() => setStage(st.key)}>
                {st.label}{counts[st.key] ? ` ${counts[st.key]}` : ''}
              </Chip>
            ))}
          </div>
        </div>

        <div className="px-4 pt-3 space-y-2.5">
          {filtered.length === 0 ? (
            apps.length === 0
              ? <EmptyState icon="group" title="No applications yet" hint="Candidates who apply to your jobs appear here." />
              : <EmptyState icon="filter_alt_off" title="No candidates in this stage" hint="Try another stage or search." />
          ) : (
            filtered.map(app => {
              const st = app.studentProfile;
              const name = `${st.firstName} ${st.lastName}`.trim();
              return (
                <Card key={app.id} onClick={() => setSelected(app)}>
                  <div className="flex items-center gap-3">
                    <Avatar src={st.avatarUrl} name={name} size={40} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{name}</p>
                      <p className="text-xs text-on-surface-variant truncate">{app.job.title}</p>
                    </div>
                    <Chip tone={statusTone(app.status)}>{humanize(app.status)}</Chip>
                  </div>
                </Card>
              );
            })
          )}
          <div className="h-4" />
        </div>
      </PullToRefresh>

      {selected && (
        <ApplicantDetail app={selected} onClose={() => setSelected(null)} onChanged={load} />
      )}
    </>
  );
};

export default ApplicantTracking;
