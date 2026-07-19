/**
 * Mobile Internship Management (Phase 6 · Module 4).
 *
 * Built entirely on GET /university/internships — the real internship records
 * for this university's students, derived from Applications to INTERNSHIP-type
 * jobs (there is no separate internship model in the schema; internships ARE
 * applications with jobType INTERNSHIP, exactly as the backend documents).
 *
 * Honesty notes (what the schema does and does NOT support):
 *  - Internship "programs" are grouped by company/role from real application data.
 *  - "Applications", "company allocation" and "status" are all real fields.
 *  - There is NO internship end-date, mentor field, or approval workflow in the
 *    schema, and university users do not own the employer-side Application status.
 *    So progress is reported as active (offer started) vs upcoming, completion is
 *    explicitly not tracked, and no mentor/approval mutations are faked. This is
 *    an observational + analytical surface for the placement cell, which is the
 *    correct domain boundary — employers own their own application lifecycle.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { UniversityService } from '../../../services';
import type { UniversityInternship } from '../../../services';
import {
  Card, Chip, Avatar, Segmented, SectionTitle, Sheet,
  SkeletonList, EmptyState, ErrorState, PullToRefresh,
} from '../../components';

type Tab = 'overview' | 'applications' | 'programs';
type Tone = 'success' | 'warning' | 'error' | 'neutral' | 'info';

const STATUS_META: Record<string, { label: string; tone: Tone }> = {
  APPLIED: { label: 'Applied', tone: 'info' },
  REVIEWING: { label: 'Reviewing', tone: 'warning' },
  SHORTLISTED: { label: 'Shortlisted', tone: 'info' },
  INTERVIEWING: { label: 'Interviewing', tone: 'warning' },
  OFFERED: { label: 'Offered', tone: 'success' },
  ACCEPTED: { label: 'Accepted', tone: 'success' },
  HIRED: { label: 'Hired', tone: 'success' },
  REJECTED: { label: 'Rejected', tone: 'error' },
  WITHDRAWN: { label: 'Withdrawn', tone: 'neutral' },
};
const meta = (s: string) => STATUS_META[s] ?? { label: s.replace(/_/g, ' ').toLowerCase(), tone: 'neutral' as Tone };

const internName = (i: UniversityInternship): string =>
  `${i.studentProfile.firstName ?? ''} ${i.studentProfile.lastName ?? ''}`.trim() || 'Student';

const money = (v: number | null | undefined): string =>
  v == null ? '—' : v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`;

/** Real placement phase from offer.startDate — the only lifecycle signal we have. */
const phaseOf = (i: UniversityInternship): 'active' | 'upcoming' | null => {
  if (i.offer?.status !== 'ACCEPTED' || !i.offer.startDate) return null;
  return new Date(i.offer.startDate) <= new Date() ? 'active' : 'upcoming';
};

/* ── Detail sheet ─────────────────────────────────────────────────────── */

const InternshipDetail: React.FC<{ i: UniversityInternship; onClose: () => void }> = ({ i, onClose }) => {
  const m = meta(i.status);
  const phase = phaseOf(i);
  return (
    <Sheet open onClose={onClose} title={internName(i)}>
      <div className="pb-6 space-y-4">
        <div className="flex items-center gap-3">
          <Avatar src={i.studentProfile.avatarUrl} name={internName(i)} size={46} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{i.studentProfile.department?.name || 'No department'}</p>
            <p className="text-xs text-on-surface-variant">Applied {new Date(i.createdAt).toLocaleDateString()}</p>
          </div>
          <Chip tone={m.tone}>{m.label}</Chip>
        </div>

        <div className="m-card p-3.5">
          <div className="flex items-center gap-3">
            <Avatar src={i.job.company.logoUrl} name={i.job.company.name} size={40} />
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">{i.job.title}</p>
              <p className="text-xs text-on-surface-variant truncate">{i.job.company.name} · {i.job.location}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="m-card p-3">
            <p className="text-[10px] text-on-surface-variant mb-1">Offer</p>
            {i.offer ? <Chip tone={i.offer.status === 'ACCEPTED' ? 'success' : 'info'}>{i.offer.status}</Chip> : <Chip tone="neutral">None</Chip>}
          </div>
          <div className="m-card p-3">
            <p className="text-[10px] text-on-surface-variant mb-1">Stipend</p>
            <p className="text-sm font-bold">{money(i.offer?.salary)}</p>
          </div>
        </div>

        {i.offer?.startDate && (
          <div className="m-card p-3.5 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">event_available</span>
            <span className="text-sm text-on-surface-variant">Starts {new Date(i.offer.startDate).toLocaleDateString()}</span>
            {phase && <Chip tone={phase === 'active' ? 'success' : 'info'}>{phase === 'active' ? 'In progress' : 'Upcoming'}</Chip>}
          </div>
        )}

        <p className="text-[10px] text-on-surface-variant px-1">
          Internship completion, mentor assignment and progress reviews aren't tracked in the schema — the employer owns the application lifecycle. This is the placement cell's read view.
        </p>
      </div>
    </Sheet>
  );
};

/* ── Overview tab ─────────────────────────────────────────────────────── */

const OverviewTab: React.FC<{ items: UniversityInternship[] }> = ({ items }) => {
  const accepted = items.filter(i => i.offer?.status === 'ACCEPTED');
  const active = accepted.filter(i => phaseOf(i) === 'active');
  const upcoming = accepted.filter(i => phaseOf(i) === 'upcoming');
  const companies = new Set(items.map(i => i.job.company.id));
  const students = new Set(accepted.map(i => i.studentProfile.id));

  const byStatus = useMemo(() => {
    const c: Record<string, number> = {};
    for (const i of items) c[i.status] = (c[i.status] ?? 0) + 1;
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  }, [items]);

  const allocation = accepted
    .filter(i => phaseOf(i))
    .sort((a, b) => internName(a).localeCompare(internName(b)));

  const stats = [
    { icon: 'work_history', label: 'Applications', value: items.length, tone: 'text-primary' },
    { icon: 'task_alt', label: 'Accepted', value: accepted.length, tone: 'text-success' },
    { icon: 'play_circle', label: 'In progress', value: active.length, tone: 'text-info' },
    { icon: 'event_upcoming', label: 'Upcoming', value: upcoming.length, tone: 'text-warning' },
    { icon: 'apartment', label: 'Companies', value: companies.size, tone: 'text-primary' },
    { icon: 'groups', label: 'Interns', value: students.size, tone: 'text-success' },
  ];

  return (
    <div className="px-4 pt-3">
      <div className="grid grid-cols-3 gap-2.5">
        {stats.map((s, i) => (
          <div key={i} className="m-card p-3">
            <span className={`material-symbols-outlined text-[19px] ${s.tone}`}>{s.icon}</span>
            <p className="text-xl font-extrabold mt-1 leading-none">{s.value}</p>
            <p className="text-[10px] text-on-surface-variant mt-1 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      <SectionTitle>Status breakdown</SectionTitle>
      {byStatus.length === 0 ? (
        <Card><p className="text-sm text-on-surface-variant">No internship applications yet.</p></Card>
      ) : (
        <Card>
          <div className="space-y-2">
            {byStatus.map(([status, n]) => {
              const m = meta(status);
              const max = Math.max(...byStatus.map(x => x[1]), 1);
              return (
                <div key={status} className="flex items-center gap-2">
                  <Chip tone={m.tone}>{m.label}</Chip>
                  <div className="flex-1 h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                    <div className={`h-full rounded-full ${m.tone === 'success' ? 'bg-success' : m.tone === 'warning' ? 'bg-warning' : m.tone === 'error' ? 'bg-error' : 'bg-primary'}`} style={{ width: `${(n / max) * 100}%` }} />
                  </div>
                  <span className="text-sm font-bold w-6 text-right">{n}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <SectionTitle>Company allocation</SectionTitle>
      {allocation.length === 0 ? (
        <Card><p className="text-sm text-on-surface-variant">No students are currently allocated to an internship.</p></Card>
      ) : (
        <div className="space-y-2.5">
          {allocation.map(i => {
            const phase = phaseOf(i)!;
            return (
              <div key={i.id} className="m-card p-3.5 flex items-center gap-3">
                <Avatar src={i.studentProfile.avatarUrl} name={internName(i)} size={36} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{internName(i)}</p>
                  <p className="text-xs text-on-surface-variant truncate">{i.job.company.name} · {i.job.title}</p>
                </div>
                <Chip tone={phase === 'active' ? 'success' : 'info'}>{phase === 'active' ? 'Active' : 'Upcoming'}</Chip>
              </div>
            );
          })}
        </div>
      )}
      <div className="h-4" />
    </div>
  );
};

/* ── Applications tab ─────────────────────────────────────────────────── */

const FILTERS = ['ALL', 'APPLIED', 'INTERVIEWING', 'ACCEPTED', 'REJECTED'];

const ApplicationsTab: React.FC<{ items: UniversityInternship[]; onOpen: (i: UniversityInternship) => void }> = ({ items, onOpen }) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('ALL');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(i => {
      if (filter === 'ALL') { /* keep */ }
      else if (filter === 'INTERVIEWING') { if (!/INTERVIEW|SHORTLIST|REVIEW/.test(i.status)) return false; }
      else if (filter === 'ACCEPTED') { if (i.status !== 'ACCEPTED' && i.status !== 'HIRED' && i.offer?.status !== 'ACCEPTED') return false; }
      else if (i.status !== filter) return false;
      if (q && !`${internName(i)} ${i.job.title} ${i.job.company.name}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, query, filter]);

  return (
    <div className="px-4 pt-3">
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">search</span>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search student, role or company" aria-label="Search internships" className="w-full h-11 pl-10 pr-3 rounded-full bg-surface-container text-sm outline-none" />
      </div>
      <div className="flex gap-2 overflow-x-auto pt-2.5 pb-0.5 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
        {FILTERS.map(f => (
          <Chip key={f} selected={filter === f} onClick={() => setFilter(f)}>{f === 'ALL' ? 'All' : meta(f).label}</Chip>
        ))}
      </div>

      <div className="pt-3 space-y-2.5">
        {filtered.length === 0 ? (
          <EmptyState icon="work_off" title="No internships match" hint="Try another filter or search." />
        ) : filtered.slice(0, 200).map(i => {
          const m = meta(i.status);
          return (
            <button key={i.id} onClick={() => onOpen(i)} className="w-full text-left m-press m-card p-3.5">
              <div className="flex items-center gap-3">
                <Avatar src={i.studentProfile.avatarUrl} name={internName(i)} size={38} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{internName(i)}</p>
                  <p className="text-xs text-on-surface-variant truncate">{i.job.title} · {i.job.company.name}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Chip tone={m.tone}>{m.label}</Chip>
                  {i.offer?.status === 'ACCEPTED' && phaseOf(i) === 'active' && <span className="material-symbols-outlined text-[15px] text-success" title="In progress">play_circle</span>}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <div className="h-4" />
    </div>
  );
};

/* ── Programs tab (grouped by company) ────────────────────────────────── */

const ProgramsTab: React.FC<{ items: UniversityInternship[]; onOpen: (i: UniversityInternship) => void }> = ({ items, onOpen }) => {
  const groups = useMemo(() => {
    const m = new Map<string, { company: UniversityInternship['job']['company']; rows: UniversityInternship[] }>();
    for (const i of items) {
      const g = m.get(i.job.company.id) ?? { company: i.job.company, rows: [] };
      g.rows.push(i);
      m.set(i.job.company.id, g);
    }
    return [...m.values()].sort((a, b) => b.rows.length - a.rows.length);
  }, [items]);

  if (groups.length === 0) return <EmptyState icon="apartment" title="No internship programs" hint="Programs appear as students apply to internship roles." />;

  return (
    <div className="px-4 pt-3 space-y-2.5">
      {groups.map(g => {
        const accepted = g.rows.filter(r => r.offer?.status === 'ACCEPTED').length;
        const roles = new Set(g.rows.map(r => r.job.title));
        return (
          <div key={g.company.id} className="m-card p-3.5">
            <div className="flex items-center gap-3">
              <Avatar src={g.company.logoUrl} name={g.company.name} size={40} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{g.company.name}</p>
                <p className="text-xs text-on-surface-variant">{roles.size} role{roles.size === 1 ? '' : 's'} · {g.rows.length} applicant{g.rows.length === 1 ? '' : 's'}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-extrabold text-success leading-none">{accepted}</p>
                <p className="text-[10px] text-on-surface-variant">placed</p>
              </div>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {g.rows.slice(0, 8).map(r => (
                <button key={r.id} onClick={() => onOpen(r)} className="m-press">
                  <Avatar src={r.studentProfile.avatarUrl} name={internName(r)} size={28} />
                </button>
              ))}
              {g.rows.length > 8 && <span className="text-[11px] text-on-surface-variant self-center">+{g.rows.length - 8}</span>}
            </div>
          </div>
        );
      })}
      <div className="h-4" />
    </div>
  );
};

/* ── Screen ───────────────────────────────────────────────────────────── */

const InternshipManagement: React.FC = () => {
  const [tab, setTab] = useState<Tab>('overview');
  const [items, setItems] = useState<UniversityInternship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<UniversityInternship | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { setItems(await UniversityService.getInternships()); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not load internships.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  if (loading) return <SkeletonList count={6} />;
  if (error) return <ErrorState message={error} onRetry={() => { setLoading(true); load(); }} />;

  return (
    <>
      <PullToRefresh onRefresh={load}>
        <div className="px-4 pt-4">
          <Segmented<Tab>
            value={tab}
            onChange={setTab}
            options={[
              { value: 'overview', label: 'Overview' },
              { value: 'applications', label: 'Applications' },
              { value: 'programs', label: 'Programs' },
            ]}
          />
        </div>
        {tab === 'overview' && <OverviewTab items={items} />}
        {tab === 'applications' && <ApplicationsTab items={items} onOpen={setSelected} />}
        {tab === 'programs' && <ProgramsTab items={items} onOpen={setSelected} />}
      </PullToRefresh>
      {selected && <InternshipDetail i={selected} onClose={() => setSelected(null)} />}
    </>
  );
};

export default InternshipManagement;
