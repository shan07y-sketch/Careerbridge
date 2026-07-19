/**
 * Mobile Jobs Management (Phase 5 · Module 2).
 *
 * Full lifecycle over the EXISTING employer job API — no new backend:
 * create, edit, publish, pause, close, reopen, duplicate, archive, delete,
 * plus client-side search and status filters. Status transitions respect the
 * backend state machine (job-status.util.ts); illegal moves are simply not
 * offered. Real PostgreSQL data only; honest empty/loading/error states.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '../../../contexts/ToastContext';
import { EmployerJobService } from '../../../services';
import type { EmployerJob, JobCategory, JobPostingInput } from '../../../services';
import { Card, Chip, SkeletonList, EmptyState, ErrorState, Button, Sheet, PullToRefresh } from '../../components';

const JOB_TYPES = ['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT', 'TEMPORARY'] as const;
const WORK_MODES = ['ON_SITE', 'HYBRID', 'REMOTE'] as const;

const STATUS_FILTERS: { key: string; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'PUBLISHED', label: 'Live' },
  { key: 'DRAFT', label: 'Draft' },
  { key: 'PAUSED', label: 'Paused' },
  { key: 'CLOSED', label: 'Closed' },
  { key: 'ARCHIVED', label: 'Archived' },
];

const humanize = (s: string): string =>
  s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

const statusTone = (s: string): 'success' | 'warning' | 'error' | 'neutral' | 'info' =>
  s === 'PUBLISHED' ? 'success' :
  s === 'PAUSED' ? 'warning' :
  s === 'CLOSED' || s === 'ARCHIVED' ? 'error' :
  s === 'DRAFT' ? 'info' : 'neutral';

/* ── Form field primitives (token-styled, Capacitor-safe native inputs) ── */

const inputCls =
  'w-full h-11 px-3.5 rounded-xl bg-surface-container border border-on-surface/10 text-sm text-on-surface outline-none focus:border-primary';

const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({ label, required, children }) => (
  <label className="block">
    <span className="text-xs font-semibold text-on-surface-variant">
      {label}{required && <span className="text-error"> *</span>}
    </span>
    <div className="mt-1">{children}</div>
  </label>
);

interface FormState {
  title: string; categoryId: string; jobType: string; workMode: string;
  location: string; description: string; requirements: string; benefits: string;
  salaryMin: string; salaryMax: string; currency: string; deadline: string;
}

const emptyForm = (categories: JobCategory[]): FormState => ({
  title: '', categoryId: categories[0]?.id || '', jobType: 'FULL_TIME', workMode: 'ON_SITE',
  location: '', description: '', requirements: '', benefits: '',
  salaryMin: '', salaryMax: '', currency: 'USD', deadline: '',
});

const formFromJob = (j: EmployerJob): FormState => ({
  title: j.title, categoryId: j.categoryId, jobType: j.jobType, workMode: j.workMode,
  location: j.location, description: j.description, requirements: j.requirements,
  benefits: j.benefits || '',
  salaryMin: j.salaryMin != null ? String(j.salaryMin) : '',
  salaryMax: j.salaryMax != null ? String(j.salaryMax) : '',
  currency: j.currency || 'USD',
  deadline: j.deadline ? j.deadline.slice(0, 10) : '',
});

/** Client-side mirror of the backend createJobSchema so we fail fast with a clear message. */
const validate = (f: FormState): string | null => {
  if (f.title.trim().length < 2) return 'Job title is required.';
  if (!f.categoryId) return 'Please select a category.';
  if (f.location.trim().length < 1) return 'Location is required.';
  if (f.description.trim().length < 10) return 'Description must be at least 10 characters.';
  if (f.requirements.trim().length < 10) return 'Requirements must be at least 10 characters.';
  const min = f.salaryMin ? Number(f.salaryMin) : null;
  const max = f.salaryMax ? Number(f.salaryMax) : null;
  if (min != null && max != null && min > max) return 'Minimum salary cannot exceed maximum.';
  return null;
};

const toPayload = (f: FormState): JobPostingInput => ({
  title: f.title.trim(),
  description: f.description.trim(),
  requirements: f.requirements.trim(),
  benefits: f.benefits.trim() || undefined,
  location: f.location.trim(),
  jobType: f.jobType,
  workMode: f.workMode,
  categoryId: f.categoryId,
  salaryMin: f.salaryMin ? Number(f.salaryMin) : null,
  salaryMax: f.salaryMax ? Number(f.salaryMax) : null,
  currency: f.currency.trim() || undefined,
  // The job schema accepts an ISO datetime string or an omitted value, but NOT
  // null — send undefined (omit) when there's no deadline.
  deadline: f.deadline ? new Date(f.deadline).toISOString() : undefined,
});

/* ── Screen ──────────────────────────────────────────────────────────── */

const JobsManager: React.FC = () => {
  const { showToast } = useToast();
  const [jobs, setJobs] = useState<EmployerJob[]>([]);
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EmployerJob | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm([]));
  const [saving, setSaving] = useState(false);

  const [actionsFor, setActionsFor] = useState<EmployerJob | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<EmployerJob | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const [j, c] = await Promise.allSettled([
      EmployerJobService.getJobs(),
      EmployerJobService.getJobCategories(),
    ]);
    if (j.status === 'fulfilled') setJobs(j.value);
    else setError(j.reason instanceof Error ? j.reason.message : 'Could not load jobs.');
    if (c.status === 'fulfilled') setCategories(c.value);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs.filter(j => {
      if (statusFilter !== 'ALL' && j.status !== statusFilter) return false;
      if (q && !`${j.title} ${j.location}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [jobs, query, statusFilter]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { ALL: jobs.length };
    for (const j of jobs) map[j.status] = (map[j.status] || 0) + 1;
    return map;
  }, [jobs]);

  const openCreate = () => { setEditing(null); setForm(emptyForm(categories)); setFormOpen(true); };
  const openEdit = (j: EmployerJob) => { setActionsFor(null); setEditing(j); setForm(formFromJob(j)); setFormOpen(true); };

  const runAction = async (label: string, fn: () => Promise<unknown>) => {
    setActionsFor(null);
    try { await fn(); showToast(label); await load(); }
    catch (err) { showToast(err instanceof Error ? err.message : 'Action failed', 'error'); }
  };

  const submit = async (publish: boolean) => {
    const msg = validate(form);
    if (msg) { showToast(msg, 'error'); return; }
    setSaving(true);
    try {
      const payload = toPayload(form);
      if (editing) {
        await EmployerJobService.updateJob(editing.id, payload);
        showToast('Job updated');
      } else {
        await EmployerJobService.createJob({ ...payload, status: publish ? 'PUBLISHED' : 'DRAFT' });
        showToast(publish ? 'Job published' : 'Draft saved');
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not save job', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SkeletonList count={5} />;
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
              placeholder="Search jobs by title or location"
              aria-label="Search jobs"
              className="w-full h-11 pl-10 pr-3 rounded-full bg-surface-container text-sm outline-none"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pt-2.5 pb-0.5 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
            {STATUS_FILTERS.map(f => (
              <Chip key={f.key} selected={statusFilter === f.key} onClick={() => setStatusFilter(f.key)}>
                {f.label}{counts[f.key] ? ` ${counts[f.key]}` : ''}
              </Chip>
            ))}
          </div>
        </div>

        <div className="px-4 pt-3 space-y-2.5">
          {filtered.length === 0 ? (
            jobs.length === 0
              ? <EmptyState icon="work_off" title="No jobs yet" hint="Create your first role with the + button." />
              : <EmptyState icon="filter_alt_off" title="No matching jobs" hint="Try a different search or filter." />
          ) : (
            filtered.map(j => {
              const count = j.applications?.length ?? 0;
              return (
                <Card key={j.id} onClick={() => setActionsFor(j)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold leading-snug truncate">{j.title}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5 truncate">
                        {humanize(j.jobType)} · {humanize(j.workMode)} · {j.location}
                      </p>
                    </div>
                    <Chip tone={statusTone(j.status)}>{humanize(j.status)}</Chip>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-on-surface-variant">
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">group</span>{count} applicant{count === 1 ? '' : 's'}
                    </span>
                    {j.deadline && (
                      <span className="inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px]">event</span>
                        {new Date(j.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                </Card>
              );
            })
          )}
          <div className="h-24" />
        </div>
      </PullToRefresh>

      {/* FAB */}
      <button
        onClick={openCreate}
        aria-label="Create job"
        className="m-press fixed right-5 z-40 w-14 h-14 rounded-2xl bg-primary text-on-primary shadow-lg flex items-center justify-center"
        style={{ bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}
      >
        <span className="material-symbols-outlined text-[26px]">add</span>
      </button>

      {/* Per-job actions */}
      <Sheet open={!!actionsFor} onClose={() => setActionsFor(null)} title={actionsFor?.title}>
        {actionsFor && (
          <div className="pb-4 space-y-1">
            <ActionRow icon="edit" label="Edit details" onClick={() => openEdit(actionsFor)} disabled={actionsFor.status === 'ARCHIVED'} />
            {(actionsFor.status === 'DRAFT' || actionsFor.status === 'PAUSED') && (
              <ActionRow icon="publish" label="Publish" onClick={() => runAction('Job published', () => EmployerJobService.updateJob(actionsFor.id, { status: 'PUBLISHED' }))} />
            )}
            {actionsFor.status === 'PUBLISHED' && (
              <ActionRow icon="pause_circle" label="Pause" onClick={() => runAction('Job paused', () => EmployerJobService.updateJob(actionsFor.id, { status: 'PAUSED' }))} />
            )}
            {actionsFor.status === 'CLOSED' && (
              <ActionRow icon="lock_open" label="Reopen" onClick={() => runAction('Job reopened', () => EmployerJobService.reopenJob(actionsFor.id))} />
            )}
            {(actionsFor.status === 'PUBLISHED' || actionsFor.status === 'PAUSED') && (
              <ActionRow icon="do_not_disturb_on" label="Close" onClick={() => runAction('Job closed', () => EmployerJobService.closeJob(actionsFor.id))} />
            )}
            <ActionRow icon="content_copy" label="Duplicate" onClick={() => runAction('Job duplicated', () => EmployerJobService.duplicateJob(actionsFor.id))} />
            {actionsFor.status !== 'ARCHIVED' && (
              <ActionRow icon="inventory_2" label="Archive" onClick={() => runAction('Job archived', () => EmployerJobService.archiveJob(actionsFor.id))} />
            )}
            <ActionRow icon="delete" label="Delete" tone="danger" onClick={() => { const j = actionsFor; setActionsFor(null); setConfirmDelete(j); }} />
          </div>
        )}
      </Sheet>

      {/* Delete confirmation */}
      <Sheet open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete this job?">
        {confirmDelete && (
          <div className="pb-5">
            <p className="text-sm text-on-surface-variant px-1">
              “{confirmDelete.title}” will be removed. Jobs with applicants are archived instead of hard-deleted to preserve history.
            </p>
            <div className="flex gap-2 mt-4">
              <Button full variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
              <Button full variant="danger" onClick={() => { const j = confirmDelete; setConfirmDelete(null); runAction('Job deleted', () => EmployerJobService.deleteJob(j.id)); }}>Delete</Button>
            </div>
          </div>
        )}
      </Sheet>

      {/* Create / Edit form */}
      <Sheet open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit job' : 'New job'}>
        <div className="pb-6 space-y-3.5">
          <Field label="Job title" required>
            <input className={inputCls} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Backend Engineer" />
          </Field>
          <Field label="Category" required>
            <select className={inputCls} value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
              {categories.length === 0 && <option value="">No categories</option>}
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Employment type">
              <select className={inputCls} value={form.jobType} onChange={e => setForm({ ...form, jobType: e.target.value })}>
                {JOB_TYPES.map(t => <option key={t} value={t}>{humanize(t)}</option>)}
              </select>
            </Field>
            <Field label="Work mode">
              <select className={inputCls} value={form.workMode} onChange={e => setForm({ ...form, workMode: e.target.value })}>
                {WORK_MODES.map(w => <option key={w} value={w}>{humanize(w)}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Location" required>
            <input className={inputCls} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Bengaluru, India or Remote" />
          </Field>
          <Field label="Description" required>
            <textarea className={`${inputCls} h-auto py-2.5 min-h-[88px]`} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What the role involves…" />
          </Field>
          <Field label="Requirements" required>
            <textarea className={`${inputCls} h-auto py-2.5 min-h-[88px]`} value={form.requirements} onChange={e => setForm({ ...form, requirements: e.target.value })} placeholder="Skills and experience needed…" />
          </Field>
          <Field label="Benefits">
            <textarea className={`${inputCls} h-auto py-2.5 min-h-[64px]`} value={form.benefits} onChange={e => setForm({ ...form, benefits: e.target.value })} placeholder="Optional" />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Salary min">
              <input type="number" inputMode="numeric" className={inputCls} value={form.salaryMin} onChange={e => setForm({ ...form, salaryMin: e.target.value })} placeholder="0" />
            </Field>
            <Field label="Salary max">
              <input type="number" inputMode="numeric" className={inputCls} value={form.salaryMax} onChange={e => setForm({ ...form, salaryMax: e.target.value })} placeholder="0" />
            </Field>
            <Field label="Currency">
              <input className={inputCls} value={form.currency} maxLength={3} onChange={e => setForm({ ...form, currency: e.target.value.toUpperCase() })} placeholder="USD" />
            </Field>
          </div>
          <Field label="Application deadline">
            <input type="date" className={inputCls} value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
          </Field>

          <div className="flex gap-2 pt-1">
            {editing ? (
              <Button full variant="primary" disabled={saving} onClick={() => submit(false)}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            ) : (
              <>
                <Button full variant="outline" disabled={saving} onClick={() => submit(false)}>Save draft</Button>
                <Button full variant="primary" disabled={saving} onClick={() => submit(true)}>
                  {saving ? 'Publishing…' : 'Publish'}
                </Button>
              </>
            )}
          </div>
        </div>
      </Sheet>
    </>
  );
};

const ActionRow: React.FC<{ icon: string; label: string; onClick: () => void; disabled?: boolean; tone?: 'default' | 'danger' }> = ({ icon, label, onClick, disabled, tone = 'default' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`m-press w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-sm font-semibold disabled:opacity-30 ${tone === 'danger' ? 'text-error' : 'text-on-surface'}`}
  >
    <span className="material-symbols-outlined text-[20px]">{icon}</span>
    {label}
  </button>
);

export default JobsManager;
