/**
 * Mobile Placement Management (Phase 6 · Module 3).
 *
 * A single placement-operations hub built ENTIRELY on the existing university
 * API — no new backend logic:
 *   - GET/POST/PUT/DELETE /university/drives   (real campus-drive CRUD)
 *   - GET  /university/students                (placement pipeline by verificationStatus)
 *   - PATCH /university/students/:id/verify    (placement workflow transitions)
 *   - GET  /university/analytics               (offer packages, hiring trend)
 *   - GET  /university/companies               (offers realised per company)
 *   - POST /university/drives/ai-recommendations (real Gemini drive targeting)
 *   - POST /university/reports/ai-report       (real Gemini placement report)
 *
 * Honesty notes:
 *  - The PlacementDrive model has no company link or per-drive shortlist in the
 *    schema, so a drive is title/description/location/schedule/deadline only.
 *    The "Pipeline" tab is therefore the university-wide placement funnel keyed
 *    on the real VerificationStatus states (PENDING → VERIFIED → ELIGIBLE →
 *    PLACED), which IS how placement readiness is tracked here.
 *  - "Offers" aggregates ACCEPTED-offer packages (from analytics) and realised
 *    hires per company (from the companies endpoint). There is no per-student
 *    full-time offer list endpoint, so no offer rows are fabricated.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '../../../contexts/ToastContext';
import { UniversityService } from '../../../services';
import type {
  PlacementDrive, PlacementDriveInput, UniversityStudent,
  UniversityAnalytics, PartnerCompany, VerificationStatus,
} from '../../../services';
import type { DriveRecommendationResult, PlacementReport } from '../../../types';
import { exportToCSV } from '../../../utils/exportUtils';
import {
  Card, Chip, Avatar, Button, Sheet, Segmented, SectionTitle, Progress,
  SkeletonList, EmptyState, ErrorState, PullToRefresh,
} from '../../components';

const inputCls =
  'w-full h-11 px-3.5 rounded-xl bg-surface-container border border-on-surface/10 text-sm text-on-surface outline-none focus:border-primary';

type Tab = 'drives' | 'pipeline' | 'offers' | 'report';
type Tone = 'success' | 'warning' | 'error' | 'neutral' | 'info';

const money = (v: number | null | undefined): string =>
  v == null ? '—' : v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`;

const fullName = (s: UniversityStudent): string =>
  `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim() || s.user.email;

const dayDiff = (iso: string): number =>
  Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);

/* ── Drive editor sheet ───────────────────────────────────────────────── */

const emptyForm: PlacementDriveInput = { title: '', description: '', location: '', scheduledAt: '', deadline: '' };

const DriveEditor: React.FC<{
  drive: PlacementDrive | null;
  onClose: () => void;
  onSaved: () => void;
}> = ({ drive, onClose, onSaved }) => {
  const { showToast } = useToast();
  const toLocal = (iso?: string) => (iso ? new Date(iso).toISOString().slice(0, 16) : '');
  const [form, setForm] = useState<PlacementDriveInput>(
    drive
      ? { title: drive.title, description: drive.description, location: drive.location, scheduledAt: toLocal(drive.scheduledAt), deadline: toLocal(drive.deadline) }
      : emptyForm,
  );
  const [busy, setBusy] = useState(false);
  const set = (k: keyof PlacementDriveInput, v: string) => setForm(f => ({ ...f, [k]: v }));
  const valid = form.title.trim() && form.location.trim() && form.scheduledAt && form.deadline;

  const save = async () => {
    if (!valid) return;
    setBusy(true);
    // deadline/scheduledAt are datetime-local strings → send ISO the zod schema accepts.
    const payload: PlacementDriveInput = {
      title: form.title.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      scheduledAt: new Date(form.scheduledAt).toISOString(),
      deadline: new Date(form.deadline).toISOString(),
    };
    try {
      if (drive) await UniversityService.updateDrive(drive.id, payload);
      else await UniversityService.createDrive(payload);
      showToast(drive ? 'Drive updated' : 'Drive created');
      onSaved();
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not save drive', 'error');
    } finally { setBusy(false); }
  };

  return (
    <Sheet open onClose={onClose} title={drive ? 'Edit drive' : 'New campus drive'}>
      <div className="space-y-3 pb-4">
        <input className={inputCls} placeholder="Drive title" aria-label="Title" value={form.title} onChange={e => set('title', e.target.value)} />
        <textarea className={`${inputCls} h-24 py-2.5 resize-none`} placeholder="Description" aria-label="Description" value={form.description} onChange={e => set('description', e.target.value)} />
        <input className={inputCls} placeholder="Location / venue" aria-label="Location" value={form.location} onChange={e => set('location', e.target.value)} />
        <div>
          <label className="text-[11px] text-on-surface-variant px-1">Scheduled</label>
          <input type="datetime-local" className={inputCls} aria-label="Scheduled at" value={form.scheduledAt} onChange={e => set('scheduledAt', e.target.value)} />
        </div>
        <div>
          <label className="text-[11px] text-on-surface-variant px-1">Application deadline</label>
          <input type="datetime-local" className={inputCls} aria-label="Deadline" value={form.deadline} onChange={e => set('deadline', e.target.value)} />
        </div>
        <Button full disabled={busy || !valid} onClick={save}>{busy ? 'Saving…' : drive ? 'Save changes' : 'Create drive'}</Button>
      </div>
    </Sheet>
  );
};

/* ── Drives tab ───────────────────────────────────────────────────────── */

const DrivesTab: React.FC<{
  drives: PlacementDrive[];
  onChanged: () => void;
}> = ({ drives, onChanged }) => {
  const { showToast } = useToast();
  const [editing, setEditing] = useState<PlacementDrive | null>(null);
  const [creating, setCreating] = useState(false);
  const [recs, setRecs] = useState<DriveRecommendationResult | null>(null);
  const [recBusy, setRecBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState<PlacementDrive | null>(null);

  const now = Date.now();
  const upcoming = drives.filter(d => new Date(d.scheduledAt).getTime() >= now).sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt));
  const past = drives.filter(d => new Date(d.scheduledAt).getTime() < now).sort((a, b) => +new Date(b.scheduledAt) - +new Date(a.scheduledAt));

  const runRecs = async () => {
    setRecBusy(true);
    try { setRecs(await UniversityService.recommendCampusDrives()); }
    catch (err) { showToast(err instanceof Error ? err.message : 'Could not generate recommendations', 'error'); }
    finally { setRecBusy(false); }
  };

  const del = async (d: PlacementDrive) => {
    try { await UniversityService.deleteDrive(d.id); showToast('Drive deleted'); setConfirmDel(null); onChanged(); }
    catch (err) { showToast(err instanceof Error ? err.message : 'Could not delete', 'error'); }
  };

  const DriveCard: React.FC<{ d: PlacementDrive; upcoming: boolean }> = ({ d, upcoming }) => {
    const days = dayDiff(d.scheduledAt);
    const deadlineDays = dayDiff(d.deadline);
    return (
      <div className="m-card p-3.5">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{d.title}</p>
            {d.description && <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">{d.description}</p>}
          </div>
          {upcoming && (
            <Chip tone={days <= 3 ? 'warning' : 'info'}>{days <= 0 ? 'Today' : `in ${days}d`}</Chip>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-on-surface-variant">
          <span className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-[15px]">event</span>{new Date(d.scheduledAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          <span className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-[15px]">location_on</span>{d.location}</span>
          {upcoming && (
            <span className={`inline-flex items-center gap-1 ${deadlineDays <= 0 ? 'text-error' : deadlineDays <= 3 ? 'text-warning' : ''}`}>
              <span className="material-symbols-outlined text-[15px]">timer</span>
              {deadlineDays <= 0 ? 'Deadline passed' : `Apply in ${deadlineDays}d`}
            </span>
          )}
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={() => setEditing(d)} className="m-press flex-1 h-9 rounded-full bg-surface-container text-xs font-semibold inline-flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[16px]">edit</span> Edit
          </button>
          <button onClick={() => setConfirmDel(d)} className="m-press flex-1 h-9 rounded-full bg-error-container text-on-error-container text-xs font-semibold inline-flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[16px]">delete</span> Delete
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="px-4 pt-3 space-y-2.5">
      <Button full icon="add" onClick={() => setCreating(true)}>New campus drive</Button>

      {/* AI drive targeting */}
      <div className="rounded-2xl bg-surface-container/60 border border-on-surface/5 p-3.5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-primary">auto_awesome</span> AI drive targeting
          </p>
          <button onClick={runRecs} disabled={recBusy} className="text-xs font-semibold text-primary disabled:opacity-40">{recBusy ? 'Analyzing…' : recs ? 'Refresh' : 'Suggest'}</button>
        </div>
        {recs ? (
          <div className="mt-2.5 space-y-2">
            <p className="text-xs text-on-surface-variant leading-relaxed">{recs.summary}</p>
            {recs.recommendedDrives.map((r, i) => (
              <div key={i} className="flex items-start gap-2 rounded-xl bg-surface-container p-2.5">
                <Chip tone={/high/i.test(r.priority) ? 'error' : /med/i.test(r.priority) ? 'warning' : 'info'}>{r.priority}</Chip>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{r.targetRole}</p>
                  <p className="text-[11px] text-on-surface-variant">{r.reason}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-on-surface-variant mt-1.5">Suggest high-value drive targets from your students' real skill & placement data.</p>
        )}
      </div>

      {drives.length === 0 ? (
        <EmptyState icon="campaign" title="No campus drives yet" hint="Create your first drive to start scheduling placements." />
      ) : (
        <>
          {upcoming.length > 0 && <><SectionTitle>Upcoming · {upcoming.length}</SectionTitle>{upcoming.map(d => <div key={d.id} className="mb-2.5"><DriveCard d={d} upcoming /></div>)}</>}
          {past.length > 0 && <><SectionTitle>Past · {past.length}</SectionTitle>{past.map(d => <div key={d.id} className="mb-2.5"><DriveCard d={d} upcoming={false} /></div>)}</>}
        </>
      )}
      <div className="h-4" />

      {creating && <DriveEditor drive={null} onClose={() => setCreating(false)} onSaved={onChanged} />}
      {editing && <DriveEditor drive={editing} onClose={() => setEditing(null)} onSaved={onChanged} />}
      {confirmDel && (
        <Sheet open onClose={() => setConfirmDel(null)} title="Delete drive?">
          <div className="pb-4 space-y-3">
            <p className="text-sm text-on-surface-variant">"{confirmDel.title}" will be removed. This can't be undone.</p>
            <div className="flex gap-2">
              <Button full variant="outline" onClick={() => setConfirmDel(null)}>Cancel</Button>
              <Button full variant="danger" onClick={() => del(confirmDel)}>Delete</Button>
            </div>
          </div>
        </Sheet>
      )}
    </div>
  );
};

/* ── Pipeline tab (placement workflow) ────────────────────────────────── */

const STAGES: { key: string; label: string; tone: Tone }[] = [
  { key: 'PENDING', label: 'Pending', tone: 'warning' },
  { key: 'VERIFIED', label: 'Verified', tone: 'info' },
  { key: 'PLACEMENT_ELIGIBLE', label: 'Eligible', tone: 'success' },
  { key: 'PLACEMENT_COMPLETED', label: 'Placed', tone: 'success' },
];

const PipelineTab: React.FC<{
  students: UniversityStudent[];
  onChanged: () => void;
}> = ({ students, onChanged }) => {
  const { showToast } = useToast();
  const [stage, setStage] = useState('PLACEMENT_ELIGIBLE');
  const [busyId, setBusyId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const s of students) c[s.verificationStatus] = (c[s.verificationStatus] ?? 0) + 1;
    return c;
  }, [students]);

  const rows = useMemo(
    () => students.filter(s => s.verificationStatus === stage).sort((a, b) => fullName(a).localeCompare(fullName(b))),
    [students, stage],
  );

  const advance = async (s: UniversityStudent, next: VerificationStatus, label: string) => {
    setBusyId(s.id);
    try { await UniversityService.verifyStudent(s.id, next); showToast(`${fullName(s)} → ${label}`); onChanged(); }
    catch (err) { showToast(err instanceof Error ? err.message : 'Action failed', 'error'); }
    finally { setBusyId(null); }
  };

  const total = students.length || 1;

  return (
    <div className="px-4 pt-3">
      {/* Funnel */}
      <div className="m-card p-3.5">
        <p className="text-xs font-bold text-on-surface-variant mb-2.5">Placement funnel</p>
        <div className="space-y-2">
          {STAGES.map(st => {
            const n = counts[st.key] ?? 0;
            return (
              <button key={st.key} onClick={() => setStage(st.key)} className="w-full text-left m-press">
                <div className="flex items-center gap-2 text-xs mb-1">
                  <span className={`font-semibold ${stage === st.key ? 'text-primary' : 'text-on-surface'}`}>{st.label}</span>
                  <span className="ml-auto font-bold">{n}</span>
                </div>
                <Progress value={(n / total) * 100} tone={st.tone === 'error' ? 'error' : st.tone === 'warning' ? 'warning' : st.tone === 'success' ? 'success' : 'primary'} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pt-3 pb-0.5 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
        {STAGES.map(st => (
          <Chip key={st.key} selected={stage === st.key} onClick={() => setStage(st.key)}>{st.label} {counts[st.key] ?? 0}</Chip>
        ))}
      </div>

      <div className="pt-3 space-y-2.5">
        {rows.length === 0 ? (
          <EmptyState icon="groups" title="No students at this stage" />
        ) : rows.slice(0, 150).map(s => (
          <div key={s.id} className="m-card p-3.5">
            <div className="flex items-center gap-3">
              <Avatar src={s.avatarUrl} name={fullName(s)} size={38} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{fullName(s)}</p>
                <p className="text-xs text-on-surface-variant truncate">{s.department?.name || s.user.email}{s.currentGpa != null ? ` · GPA ${s.currentGpa}` : ''}</p>
              </div>
            </div>
            {stage === 'VERIFIED' && (
              <Button full variant="tonal" disabled={busyId === s.id} onClick={() => advance(s, 'PLACEMENT_ELIGIBLE', 'Eligible')}>Mark eligible</Button>
            )}
            {stage === 'PLACEMENT_ELIGIBLE' && (
              <Button full disabled={busyId === s.id} onClick={() => advance(s, 'PLACEMENT_COMPLETED', 'Placed')}>Mark placed</Button>
            )}
            {stage === 'PENDING' && (
              <Button full variant="outline" disabled={busyId === s.id} onClick={() => advance(s, 'VERIFIED', 'Verified')}>Verify</Button>
            )}
          </div>
        ))}
      </div>
      <div className="h-4" />
    </div>
  );
};

/* ── Offers tab (offer tracking) ──────────────────────────────────────── */

const OffersTab: React.FC<{
  analytics: UniversityAnalytics | null;
  companies: PartnerCompany[];
}> = ({ analytics, companies }) => {
  const hiring = [...companies].filter(c => c.hired > 0).sort((a, b) => b.hired - a.hired);
  const totalHires = companies.reduce((s, c) => s + c.hired, 0);

  return (
    <div className="px-4 pt-3">
      <div className="grid grid-cols-2 gap-2.5">
        <div className="m-card p-3.5">
          <span className="material-symbols-outlined text-[20px] text-success">payments</span>
          <p className="text-xl font-extrabold mt-1 leading-none">{money(analytics?.averageSalary)}</p>
          <p className="text-[11px] text-on-surface-variant mt-1">Average package</p>
        </div>
        <div className="m-card p-3.5">
          <span className="material-symbols-outlined text-[20px] text-primary">trending_up</span>
          <p className="text-xl font-extrabold mt-1 leading-none">{money(analytics?.highestPackage)}</p>
          <p className="text-[11px] text-on-surface-variant mt-1">Highest package</p>
        </div>
        <div className="m-card p-3.5">
          <span className="material-symbols-outlined text-[20px] text-info">handshake</span>
          <p className="text-xl font-extrabold mt-1 leading-none">{totalHires}</p>
          <p className="text-[11px] text-on-surface-variant mt-1">Offers accepted</p>
        </div>
        <div className="m-card p-3.5">
          <span className="material-symbols-outlined text-[20px] text-warning">workspace_premium</span>
          <p className="text-xl font-extrabold mt-1 leading-none">{analytics ? `${analytics.placementPercentage}%` : '—'}</p>
          <p className="text-[11px] text-on-surface-variant mt-1">Placement rate</p>
        </div>
      </div>

      <SectionTitle>Offers realised by company</SectionTitle>
      {hiring.length === 0 ? (
        <EmptyState icon="handshake" title="No accepted offers yet" hint="Accepted offers from your students' applications appear here." />
      ) : (
        <div className="space-y-2.5">
          {hiring.map(c => (
            <div key={c.id} className="m-card p-3.5 flex items-center gap-3">
              <Avatar src={c.logoUrl} name={c.name} size={38} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{c.name}</p>
                <p className="text-xs text-on-surface-variant truncate">{c.industry} · {c.applications} application{c.applications === 1 ? '' : 's'}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-extrabold text-success leading-none">{c.hired}</p>
                <p className="text-[10px] text-on-surface-variant">hired</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-[10px] text-on-surface-variant mt-3 px-1">
        Package figures are aggregated from ACCEPTED offers of your students (any job type). The schema has no per-student full-time offer ledger, so no individual offer rows are shown.
      </p>
      <div className="h-4" />
    </div>
  );
};

/* ── Report tab ───────────────────────────────────────────────────────── */

const ReportTab: React.FC<{
  analytics: UniversityAnalytics | null;
  drivesCount: number;
  pendingCount: number;
}> = ({ analytics, drivesCount, pendingCount }) => {
  const { showToast } = useToast();
  const [report, setReport] = useState<PlacementReport | null>(null);
  const [busy, setBusy] = useState(false);

  const generate = async () => {
    setBusy(true);
    try { setReport(await UniversityService.generatePlacementReport()); showToast('Report generated'); }
    catch (err) { showToast(err instanceof Error ? err.message : 'Could not generate report', 'error'); }
    finally { setBusy(false); }
  };

  const exportCsv = () => {
    if (!analytics) return;
    exportToCSV(
      [
        { Metric: 'Total students', Value: analytics.totalStudents },
        { Metric: 'Students placed', Value: analytics.studentsPlaced },
        { Metric: 'Placement rate', Value: `${analytics.placementPercentage}%` },
        { Metric: 'Pending verifications', Value: pendingCount },
        { Metric: 'Active drives', Value: drivesCount },
        { Metric: 'Average package', Value: analytics.averageSalary ?? '—' },
        { Metric: 'Highest package', Value: analytics.highestPackage ?? '—' },
      ],
      `placement_report_${new Date().toISOString().split('T')[0]}.csv`,
    );
    showToast('Placement report exported');
  };

  return (
    <div className="px-4 pt-3 space-y-2.5">
      <div className="flex gap-2">
        <Button full icon="auto_awesome" disabled={busy} onClick={generate}>{busy ? 'Generating…' : 'AI report'}</Button>
        <Button full variant="outline" icon="download" disabled={!analytics} onClick={exportCsv}>Export CSV</Button>
      </div>

      {report ? (
        <>
          <Card>
            <p className="text-xs font-bold text-on-surface-variant mb-1.5">Executive summary</p>
            <p className="text-sm text-on-surface leading-relaxed">{report.executiveSummary}</p>
          </Card>
          {report.keyFindings.length > 0 && (
            <Card>
              <p className="text-xs font-bold text-on-surface-variant mb-1.5">Key findings</p>
              <ul className="space-y-1.5">
                {report.keyFindings.map((f, i) => (
                  <li key={i} className="flex gap-2 text-sm text-on-surface-variant"><span className="material-symbols-outlined text-[16px] text-primary mt-0.5">insights</span>{f}</li>
                ))}
              </ul>
            </Card>
          )}
          {report.recommendations.length > 0 && (
            <Card>
              <p className="text-xs font-bold text-on-surface-variant mb-1.5">Recommendations</p>
              <ul className="space-y-1.5">
                {report.recommendations.map((r, i) => (
                  <li key={i} className="flex gap-2 text-sm text-on-surface-variant"><span className="material-symbols-outlined text-[16px] text-success mt-0.5">check_circle</span>{r}</li>
                ))}
              </ul>
            </Card>
          )}
        </>
      ) : (
        <EmptyState icon="summarize" title="Generate a placement report" hint="A real AI executive summary from your live placement data, or export the raw figures as CSV." />
      )}
      <div className="h-4" />
    </div>
  );
};

/* ── Screen ───────────────────────────────────────────────────────────── */

const PlacementManagement: React.FC = () => {
  const [tab, setTab] = useState<Tab>('drives');
  const [drives, setDrives] = useState<PlacementDrive[]>([]);
  const [students, setStudents] = useState<UniversityStudent[]>([]);
  const [analytics, setAnalytics] = useState<UniversityAnalytics | null>(null);
  const [companies, setCompanies] = useState<PartnerCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const [d, s, a, c] = await Promise.allSettled([
      UniversityService.getDrives(),
      UniversityService.getStudents(),
      UniversityService.getAnalytics(),
      UniversityService.getCompanies(),
    ]);
    if (d.status === 'fulfilled') setDrives(d.value); else setError(d.reason instanceof Error ? d.reason.message : 'Could not load placement data.');
    if (s.status === 'fulfilled') setStudents(s.value);
    if (a.status === 'fulfilled') setAnalytics(a.value);
    if (c.status === 'fulfilled') setCompanies(c.value);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const pendingCount = useMemo(() => students.filter(s => s.verificationStatus === 'PENDING').length, [students]);

  if (loading) return <SkeletonList count={6} />;
  if (error) return <ErrorState message={error} onRetry={() => { setLoading(true); load(); }} />;

  return (
    <PullToRefresh onRefresh={load}>
      <div className="px-4 pt-4">
        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'drives', label: 'Drives' },
            { value: 'pipeline', label: 'Pipeline' },
            { value: 'offers', label: 'Offers' },
            { value: 'report', label: 'Report' },
          ]}
        />
      </div>
      {tab === 'drives' && <DrivesTab drives={drives} onChanged={load} />}
      {tab === 'pipeline' && <PipelineTab students={students} onChanged={load} />}
      {tab === 'offers' && <OffersTab analytics={analytics} companies={companies} />}
      {tab === 'report' && <ReportTab analytics={analytics} drivesCount={drives.length} pendingCount={pendingCount} />}
    </PullToRefresh>
  );
};

export default PlacementManagement;
