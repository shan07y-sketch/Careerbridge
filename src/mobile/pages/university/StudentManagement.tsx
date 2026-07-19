/**
 * Mobile Student Management (Phase 6 · Module 2).
 *
 * Full student administration over the EXISTING university API — no new backend
 * logic beyond the internships read endpoint:
 *   - GET   /university/students            (rich payload: academic, skills,
 *           resumes, certifications, projects, verificationStatus)
 *   - GET   /university/internships         (per-student internship status)
 *   - PATCH /university/students/:id/verify  (placement workflow transitions)
 *   - POST/GET /university/students/:id/ai-insight  (real Gemini placement insight)
 *
 * Every value is real PostgreSQL data. Bulk actions reuse the single verify
 * endpoint (sequential real PATCH calls) — there is no bulk endpoint, so none
 * is faked. Résumé preview isn't offered because the university portal has no
 * authenticated resume-preview endpoint (only fileName/parse status are shown).
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '../../../contexts/ToastContext';
import { UniversityService } from '../../../services';
import type { UniversityStudent, UniversityInternship, VerificationStatus } from '../../../services';
import type { StudentPlacementInsight } from '../../../types';
import {
  Chip, Avatar, Button, Sheet, SkeletonList, EmptyState, ErrorState,
  ScoreRing, PullToRefresh,
} from '../../components';

const inputCls =
  'w-full h-11 px-3.5 rounded-xl bg-surface-container border border-on-surface/10 text-sm text-on-surface outline-none focus:border-primary';

type Tone = 'success' | 'warning' | 'error' | 'neutral' | 'info';
const STATUS_META: Record<string, { label: string; tone: Tone }> = {
  PENDING: { label: 'Pending', tone: 'warning' },
  VERIFIED: { label: 'Verified', tone: 'info' },
  PLACEMENT_ELIGIBLE: { label: 'Eligible', tone: 'success' },
  PLACEMENT_COMPLETED: { label: 'Placed', tone: 'success' },
  REJECTED: { label: 'Rejected', tone: 'error' },
};

/** Legal placement-workflow transitions from each verification status. */
const NEXT_STATUS: Record<string, { status: VerificationStatus; label: string; variant: 'primary' | 'tonal' | 'outline' | 'danger' }[]> = {
  PENDING: [
    { status: 'VERIFIED', label: 'Verify', variant: 'primary' },
    { status: 'REJECTED', label: 'Reject', variant: 'danger' },
  ],
  VERIFIED: [
    { status: 'PLACEMENT_ELIGIBLE', label: 'Mark eligible', variant: 'primary' },
    { status: 'REJECTED', label: 'Reject', variant: 'danger' },
  ],
  PLACEMENT_ELIGIBLE: [
    { status: 'PLACEMENT_COMPLETED', label: 'Mark placed', variant: 'primary' },
    { status: 'REJECTED', label: 'Reject', variant: 'danger' },
  ],
  PLACEMENT_COMPLETED: [],
  REJECTED: [
    { status: 'PENDING', label: 'Reinstate', variant: 'outline' },
  ],
};

const FILTERS: { key: string; label: string; match: (s: string) => boolean }[] = [
  { key: 'ALL', label: 'All', match: () => true },
  { key: 'PENDING', label: 'Pending', match: s => s === 'PENDING' },
  { key: 'VERIFIED', label: 'Verified', match: s => s === 'VERIFIED' },
  { key: 'PLACEMENT_ELIGIBLE', label: 'Eligible', match: s => s === 'PLACEMENT_ELIGIBLE' },
  { key: 'PLACEMENT_COMPLETED', label: 'Placed', match: s => s === 'PLACEMENT_COMPLETED' },
  { key: 'REJECTED', label: 'Rejected', match: s => s === 'REJECTED' },
];

const fullName = (s: UniversityStudent): string => `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim() || s.user.email;
const riskTone = (level: string): Tone => (/high/i.test(level) ? 'error' : /medium/i.test(level) ? 'warning' : 'success');

/* ── Student detail sheet ─────────────────────────────────────────────── */

const StudentDetail: React.FC<{
  student: UniversityStudent;
  internship?: UniversityInternship;
  onClose: () => void;
  onChanged: () => void;
}> = ({ student: s, internship, onClose, onChanged }) => {
  const { showToast } = useToast();
  const [insight, setInsight] = useState<StudentPlacementInsight | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(true);
  const [assessing, setAssessing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>(s.verificationStatus);

  useEffect(() => {
    let alive = true;
    setLoadingInsight(true);
    UniversityService.getLatestStudentInsight(s.id)
      .then(v => { if (alive) { setInsight(v); setLoadingInsight(false); } })
      .catch(() => { if (alive) setLoadingInsight(false); });
    return () => { alive = false; };
  }, [s.id]);

  const setVerification = async (next: VerificationStatus) => {
    setBusy(true);
    try {
      await UniversityService.verifyStudent(s.id, next);
      setStatus(next);
      showToast(`Marked ${STATUS_META[next]?.label ?? next}`);
      onChanged();
    } catch (err) { showToast(err instanceof Error ? err.message : 'Action failed', 'error'); }
    finally { setBusy(false); }
  };

  const runAssessment = async () => {
    setAssessing(true);
    try { setInsight(await UniversityService.assessStudentPlacement(s.id)); showToast('Placement insight generated'); }
    catch (err) { showToast(err instanceof Error ? err.message : 'Assessment failed', 'error'); }
    finally { setAssessing(false); }
  };

  const name = fullName(s);
  const meta = STATUS_META[status] ?? { label: status, tone: 'neutral' as Tone };
  const skills: { skill: { name: string } }[] = s.skills || [];
  const certs: { name?: string; title?: string }[] = s.certifications || [];
  const resume = s.resumes?.[0];
  const transitions = NEXT_STATUS[status] ?? [];

  return (
    <Sheet open onClose={onClose} title={name}>
      <div className="pb-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Avatar src={s.avatarUrl} name={name} size={48} />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-on-surface-variant truncate">{s.user.email}</p>
            <p className="text-sm font-semibold truncate">{s.department?.name || 'No department'}</p>
          </div>
          <Chip tone={meta.tone}>{meta.label}</Chip>
        </div>

        {/* Academic details */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="m-card p-3 text-center">
            <p className="text-lg font-extrabold text-on-surface leading-none">{s.currentGpa != null ? s.currentGpa : '—'}</p>
            <p className="text-[10px] text-on-surface-variant mt-1">GPA</p>
          </div>
          <div className="m-card p-3 text-center">
            <p className="text-lg font-extrabold text-on-surface leading-none">{s.graduationYear ?? '—'}</p>
            <p className="text-[10px] text-on-surface-variant mt-1">Grad year</p>
          </div>
          <div className="m-card p-3 text-center">
            <p className="text-lg font-extrabold text-on-surface leading-none">{skills.length}</p>
            <p className="text-[10px] text-on-surface-variant mt-1">Skills</p>
          </div>
        </div>
        {s.preferredRole && <p className="text-xs text-on-surface-variant">Preferred role: <span className="font-semibold text-on-surface">{s.preferredRole}</span></p>}
        {s.bio && <p className="text-sm text-on-surface-variant leading-relaxed">{s.bio}</p>}

        {/* Placement + internship status */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="m-card p-3">
            <p className="text-[10px] text-on-surface-variant mb-1">Placement</p>
            <Chip tone={meta.tone}>{meta.label}</Chip>
          </div>
          <div className="m-card p-3">
            <p className="text-[10px] text-on-surface-variant mb-1">Internship</p>
            {internship ? (
              <Chip tone={internship.offer?.status === 'ACCEPTED' ? 'success' : 'info'}>
                {internship.offer?.status === 'ACCEPTED' ? `At ${internship.job.company.name}` : 'Applied'}
              </Chip>
            ) : <Chip tone="neutral">None</Chip>}
          </div>
        </div>

        {/* Workflow actions */}
        {transitions.length > 0 && (
          <div className="flex gap-2">
            {transitions.map(t => (
              <Button key={t.status} full variant={t.variant} disabled={busy} onClick={() => setVerification(t.status)}>{t.label}</Button>
            ))}
          </div>
        )}

        {/* Resume */}
        <div className="m-card p-3.5">
          <p className="text-xs font-bold text-on-surface-variant mb-1.5">Résumé</p>
          {resume ? (
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">description</span>
              <span className="text-sm text-on-surface truncate flex-1">{resume.fileName}</span>
              <Chip tone={resume.status === 'PARSED' ? 'success' : resume.status === 'FAILED' ? 'error' : 'warning'}>{resume.status?.toLowerCase?.() || 'uploaded'}</Chip>
            </div>
          ) : <p className="text-sm text-on-surface-variant">No résumé uploaded.</p>}
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div>
            <p className="text-xs font-bold text-on-surface-variant mb-1.5">Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {skills.slice(0, 16).map((sk, i) => (
                <span key={i} className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant">{sk.skill?.name}</span>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {certs.length > 0 && (
          <div>
            <p className="text-xs font-bold text-on-surface-variant mb-1.5">Certifications</p>
            <div className="space-y-1.5">
              {certs.map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="material-symbols-outlined text-[16px] text-success">workspace_premium</span>
                  <span className="text-on-surface-variant">{c.name || c.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI placement insight */}
        <div className="rounded-2xl bg-surface-container/60 border border-on-surface/5 p-3.5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-primary">auto_awesome</span> AI placement insight
            </p>
            {insight && <ScoreRing score={Math.round(insight.placementProbability)} size={44} />}
          </div>
          {loadingInsight ? (
            <p className="text-xs text-on-surface-variant mt-2">Loading…</p>
          ) : insight ? (
            <div className="mt-2.5 space-y-2">
              <Chip tone={riskTone(insight.riskLevel)}>{insight.riskLevel} risk</Chip>
              <p className="text-sm text-on-surface-variant leading-relaxed">{insight.summary}</p>
              {insight.strengths.length > 0 && (
                <p className="text-xs text-on-surface-variant"><span className="font-bold text-success">Strengths: </span>{insight.strengths.join(' · ')}</p>
              )}
              {insight.riskFactors.length > 0 && (
                <p className="text-xs text-on-surface-variant"><span className="font-bold text-warning">Risks: </span>{insight.riskFactors.join(' · ')}</p>
              )}
              {insight.suggestedActions.length > 0 && (
                <p className="text-xs text-on-surface-variant"><span className="font-bold text-primary">Actions: </span>{insight.suggestedActions.join(' · ')}</p>
              )}
              <p className="text-[10px] text-on-surface-variant">{insight.modelVersion}</p>
              <Button full variant="outline" disabled={assessing} onClick={runAssessment}>{assessing ? 'Re-assessing…' : 'Re-assess'}</Button>
            </div>
          ) : (
            <div className="mt-2.5">
              <p className="text-xs text-on-surface-variant mb-2">Predict this student's placement readiness from their résumé, skills and interview history.</p>
              <Button full variant="tonal" icon="auto_awesome" disabled={assessing} onClick={runAssessment}>{assessing ? 'Analyzing…' : 'Run AI assessment'}</Button>
            </div>
          )}
        </div>
      </div>
    </Sheet>
  );
};

/* ── Screen ───────────────────────────────────────────────────────────── */

const StudentManagement: React.FC = () => {
  const { showToast } = useToast();
  const [students, setStudents] = useState<UniversityStudent[]>([]);
  const [internships, setInternships] = useState<UniversityInternship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [dept, setDept] = useState('ALL');
  const [sort, setSort] = useState<'NAME' | 'GPA' | 'GRAD'>('NAME');
  const [selected, setSelected] = useState<UniversityStudent | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const [st, iv] = await Promise.allSettled([UniversityService.getStudents(), UniversityService.getInternships()]);
    if (st.status === 'fulfilled') setStudents(st.value); else setError(st.reason instanceof Error ? st.reason.message : 'Could not load students.');
    if (iv.status === 'fulfilled') setInternships(iv.value);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  // Map studentId → their (most recent) internship row for status display.
  const internByStudent = useMemo(() => {
    const m = new Map<string, UniversityInternship>();
    for (const i of internships) {
      const cur = m.get(i.studentProfile.id);
      // prefer an accepted offer, else keep the newest (list is desc by createdAt)
      if (!cur || (i.offer?.status === 'ACCEPTED' && cur.offer?.status !== 'ACCEPTED')) m.set(i.studentProfile.id, i);
    }
    return m;
  }, [internships]);

  const departments = useMemo(() => {
    const m = new Map<string, string>();
    students.forEach(s => { if (s.department) m.set(s.department.id, s.department.name); });
    return [...m.entries()];
  }, [students]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: students.length };
    FILTERS.forEach(f => { if (f.key !== 'ALL') c[f.key] = students.filter(s => f.match(s.verificationStatus)).length; });
    return c;
  }, [students]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const f = FILTERS.find(x => x.key === filter)!;
    const list = students.filter(s => {
      if (!f.match(s.verificationStatus)) return false;
      if (dept !== 'ALL' && s.department?.id !== dept) return false;
      if (q && !`${fullName(s)} ${s.user.email} ${s.department?.name ?? ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
    return [...list].sort((a, b) => {
      if (sort === 'GPA') return (b.currentGpa ?? 0) - (a.currentGpa ?? 0);
      if (sort === 'GRAD') return (b.graduationYear ?? 0) - (a.graduationYear ?? 0);
      return fullName(a).localeCompare(fullName(b));
    });
  }, [students, query, filter, dept, sort]);

  const toggleCheck = (id: string) => setChecked(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const bulkVerify = async (status: VerificationStatus) => {
    if (checked.size === 0) return;
    setBulkBusy(true);
    let ok = 0, fail = 0;
    for (const id of checked) {
      try { await UniversityService.verifyStudent(id, status); ok++; } catch { fail++; }
    }
    showToast(`Updated ${ok} student${ok === 1 ? '' : 's'}${fail ? `, ${fail} failed` : ''}`, fail ? 'error' : 'success');
    setChecked(new Set()); setBulkMode(false); setBulkBusy(false);
    await load();
  };

  if (loading) return <SkeletonList count={6} itemClass="h-16" />;
  if (error) return <ErrorState message={error} onRetry={() => { setLoading(true); load(); }} />;

  return (
    <>
      <PullToRefresh onRefresh={load}>
        {/* Summary band */}
        <div className="px-4 pt-4">
          <div className="grid grid-cols-4 gap-2">
            {[
              { v: counts.ALL, l: 'Total' },
              { v: counts.PLACEMENT_COMPLETED ?? 0, l: 'Placed' },
              { v: counts.PLACEMENT_ELIGIBLE ?? 0, l: 'Eligible' },
              { v: counts.PENDING ?? 0, l: 'Pending' },
            ].map((x, i) => (
              <div key={i} className="m-card p-2.5 text-center">
                <p className="text-lg font-extrabold text-on-surface leading-none">{x.v}</p>
                <p className="text-[10px] text-on-surface-variant mt-1">{x.l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Refine bar */}
        <div className="px-4 pt-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">search</span>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name, email or department" aria-label="Search students" className="w-full h-11 pl-10 pr-3 rounded-full bg-surface-container text-sm outline-none" />
          </div>
          <div className="flex gap-2 overflow-x-auto pt-2.5 pb-0.5 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
            {FILTERS.map(f => (
              <Chip key={f.key} selected={filter === f.key} onClick={() => setFilter(f.key)}>{f.label}{counts[f.key] ? ` ${counts[f.key]}` : ''}</Chip>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2.5">
            <select aria-label="Filter by department" className={inputCls} value={dept} onChange={e => setDept(e.target.value)}>
              <option value="ALL">All departments</option>
              {departments.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
            <select aria-label="Sort" className={inputCls} value={sort} onChange={e => setSort(e.target.value as 'NAME' | 'GPA' | 'GRAD')}>
              <option value="NAME">Sort: Name</option>
              <option value="GPA">Sort: GPA</option>
              <option value="GRAD">Sort: Grad year</option>
            </select>
          </div>
          <div className="flex items-center justify-between pt-2.5">
            <button onClick={() => { setBulkMode(m => !m); setChecked(new Set()); }} className="text-xs font-semibold text-primary flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">{bulkMode ? 'close' : 'checklist'}</span>
              {bulkMode ? 'Cancel selection' : 'Select students'}
            </button>
            <span className="text-[11px] text-on-surface-variant">{filtered.length} shown</span>
          </div>
        </div>

        {/* List */}
        <div className="px-4 pt-3 space-y-2.5">
          {filtered.length === 0 ? (
            <EmptyState icon="school" title="No students match" hint="Try another filter or search." />
          ) : filtered.slice(0, 200).map(s => {
            const meta = STATUS_META[s.verificationStatus] ?? { label: s.verificationStatus, tone: 'neutral' as Tone };
            const intern = internByStudent.get(s.id);
            const isChecked = checked.has(s.id);
            return (
              <div key={s.id} className={`m-card p-3.5 ${bulkMode && isChecked ? 'ring-2 ring-primary' : ''}`}>
                <div className="flex items-center gap-3">
                  {bulkMode && (
                    <button onClick={() => toggleCheck(s.id)} aria-label="Select" className="shrink-0">
                      <span className={`material-symbols-outlined text-[22px] ${isChecked ? 'text-primary' : 'text-on-surface-variant'}`}>{isChecked ? 'check_box' : 'check_box_outline_blank'}</span>
                    </button>
                  )}
                  <button onClick={() => bulkMode ? toggleCheck(s.id) : setSelected(s)} className="flex items-center gap-3 flex-1 min-w-0 text-left m-press">
                    <Avatar src={s.avatarUrl} name={fullName(s)} size={40} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{fullName(s)}</p>
                      <p className="text-xs text-on-surface-variant truncate">
                        {s.department?.name || s.user.email}{s.currentGpa != null ? ` · GPA ${s.currentGpa}` : ''}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Chip tone={meta.tone}>{meta.label}</Chip>
                      {intern?.offer?.status === 'ACCEPTED' && <span className="material-symbols-outlined text-[16px] text-success" title="Has internship">work_history</span>}
                    </div>
                  </button>
                </div>
              </div>
            );
          })}
          <div className="h-24" />
        </div>
      </PullToRefresh>

      {/* Bulk action bar */}
      {bulkMode && checked.size > 0 && (
        <div className="fixed inset-x-0 bottom-[76px] z-30 px-4">
          <div className="m-card p-3 flex items-center gap-2 shadow-lg">
            <span className="text-xs font-bold text-on-surface shrink-0">{checked.size} selected</span>
            <div className="flex gap-1.5 flex-1 justify-end">
              <button disabled={bulkBusy} onClick={() => bulkVerify('VERIFIED')} className="m-press h-9 px-3 rounded-full bg-primary-container text-on-primary-container text-xs font-semibold disabled:opacity-40">Verify</button>
              <button disabled={bulkBusy} onClick={() => bulkVerify('PLACEMENT_ELIGIBLE')} className="m-press h-9 px-3 rounded-full bg-success-container text-on-success-container text-xs font-semibold disabled:opacity-40">Eligible</button>
              <button disabled={bulkBusy} onClick={() => bulkVerify('REJECTED')} className="m-press h-9 px-3 rounded-full bg-error-container text-on-error-container text-xs font-semibold disabled:opacity-40">Reject</button>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <StudentDetail student={selected} internship={internByStudent.get(selected.id)} onClose={() => setSelected(null)} onChanged={load} />
      )}
    </>
  );
};

export default StudentManagement;
