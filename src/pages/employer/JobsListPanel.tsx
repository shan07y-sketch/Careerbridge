import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { Toolbar, FilterChip } from '../../components/ui/Toolbar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { Modal } from '../../components/ui/Modal';
import { Dialog } from '../../components/ui/Dialog';
import { EmployerJobService } from '../../services';
import type { EmployerJob, JobStatus } from '../../services';
import { JobPostingForm } from './JobPostingForm';

const STATUS_LABELS: Record<JobStatus, string> = {
  DRAFT: 'Draft', PUBLISHED: 'Published', PAUSED: 'Paused', CLOSED: 'Closed', ARCHIVED: 'Archived',
};
type BadgeTone = React.ComponentProps<typeof Badge>['tone'];
const STATUS_TONE: Record<JobStatus, BadgeTone> = {
  DRAFT: 'neutral', PUBLISHED: 'success', PAUSED: 'warning', CLOSED: 'error', ARCHIVED: 'neutral',
};
const JobStatusBadge = ({ status }: { status: JobStatus }) => <Badge tone={STATUS_TONE[status]}>{STATUS_LABELS[status]}</Badge>;

type SortKey = 'createdAt' | 'title' | 'applicants';

export const JobsListPanel: React.FC = () => {
  const { showToast } = useToast();

  const [jobs, setJobs] = useState<EmployerJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobStatus | ''>('');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);

  const [bulkAction, setBulkAction] = useState<'archive' | 'close' | null>(null);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkInProgress, setBulkInProgress] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<EmployerJob | null>(null);

  const [previewJob, setPreviewJob] = useState<EmployerJob | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EmployerJob | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [rowActionId, setRowActionId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await EmployerJobService.getJobs();
      setJobs(data);
      setSelected(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load job postings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  const filteredJobs = useMemo(() => {
    let list = jobs;
    if (statusFilter) list = list.filter(j => j.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(j => j.title.toLowerCase().includes(q) || j.location.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'title') cmp = a.title.localeCompare(b.title);
      else if (sortKey === 'applicants') cmp = (a.applications?.length || 0) - (b.applications?.length || 0);
      else cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [jobs, statusFilter, search, sortKey, sortOrder]);

  const counts = useMemo(() => {
    const c = { total: jobs.length, PUBLISHED: 0, DRAFT: 0, CLOSED: 0, applicants: 0 } as any;
    jobs.forEach(j => { c[j.status] = (c[j.status] || 0) + 1; c.applicants += j.applications?.length || 0; });
    return c;
  }, [jobs]);

  const allSelected = filteredJobs.length > 0 && filteredJobs.every(j => selected.has(j.id));
  const toggleOne = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(prev => {
    const n = new Set(prev);
    if (allSelected) filteredJobs.forEach(j => n.delete(j.id)); else filteredJobs.forEach(j => n.add(j.id));
    return n;
  });

  const handleRowKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>, index: number, id: string) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); rowRefs.current[Math.min(index + 1, filteredJobs.length - 1)]?.focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); rowRefs.current[Math.max(index - 1, 0)]?.focus(); }
    else if (e.key === ' ') { e.preventDefault(); toggleOne(id); }
    else if (e.key === 'Enter') { e.preventDefault(); const job = filteredJobs.find(j => j.id === id); if (job) openEdit(job); }
  };

  const openCreate = () => { setEditingJob(null); setFormOpen(true); };
  const openEdit = (job: EmployerJob) => { setEditingJob(job); setFormOpen(true); setOpenMenuId(null); };

  const runRowAction = async (job: EmployerJob, action: 'duplicate' | 'archive' | 'close' | 'reopen' | 'publish') => {
    setRowActionId(job.id);
    setOpenMenuId(null);
    try {
      if (action === 'duplicate') { await EmployerJobService.duplicateJob(job.id); showToast(`"${job.title}" duplicated as a new draft.`, 'success'); }
      else if (action === 'archive') { await EmployerJobService.archiveJob(job.id); showToast(`"${job.title}" archived.`, 'success'); }
      else if (action === 'close') { await EmployerJobService.closeJob(job.id); showToast(`"${job.title}" closed.`, 'success'); }
      else if (action === 'reopen') { await EmployerJobService.reopenJob(job.id); showToast(`"${job.title}" reopened and published.`, 'success'); }
      else if (action === 'publish') { await EmployerJobService.updateJob(job.id, { status: 'PUBLISHED' } as any); showToast(`"${job.title}" published.`, 'success'); }
      await loadJobs();
    } catch (err) {
      showToast(err instanceof Error ? err.message : `Could not ${action} this job.`, 'error');
    } finally { setRowActionId(null); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteInProgress(true);
    try {
      const result: any = await EmployerJobService.deleteJob(deleteTarget.id);
      showToast(result?.message || 'Job removed.', result?.hardDeleted === false ? 'info' : 'success');
      await loadJobs();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not delete this job.', 'error');
    } finally { setDeleteInProgress(false); setDeleteTarget(null); }
  };

  const requestBulk = (action: 'archive' | 'close') => { setBulkAction(action); setBulkConfirmOpen(true); };
  const runBulk = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0 || !bulkAction) return;
    setBulkInProgress(true);
    try {
      const result = bulkAction === 'archive' ? await EmployerJobService.bulkArchive(ids) : await EmployerJobService.bulkClose(ids);
      showToast(`${result.updated.length} job(s) ${bulkAction === 'archive' ? 'archived' : 'closed'}.` + (result.skipped.length > 0 ? ` ${result.skipped.length} were skipped.` : ''), 'success');
      await loadJobs();
    } catch (err) {
      showToast(err instanceof Error ? err.message : `Failed to ${bulkAction} the selected jobs.`, 'error');
    } finally { setBulkInProgress(false); setBulkConfirmOpen(false); setBulkAction(null); }
  };

  const CHIP_STATUSES: (JobStatus | '')[] = ['', 'PUBLISHED', 'DRAFT', 'PAUSED', 'CLOSED', 'ARCHIVED'];

  return (
    <>
      <PageHeader
        title="Jobs"
        description="Create, publish and manage every role across your organization."
        actions={<Button variant="primary" onClick={openCreate} leftIcon={<span className="material-symbols-outlined text-[19px]">add</span>}>Post a job</Button>}
      />

      <div className="space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard label="Total jobs" value={counts.total} icon="work" hint="all statuses" />
          <StatCard label="Published" value={counts.PUBLISHED || 0} icon="public" hint="live now" onClick={() => setStatusFilter('PUBLISHED')} />
          <StatCard label="Drafts" value={counts.DRAFT || 0} icon="edit_note" hint="not yet live" onClick={() => setStatusFilter('DRAFT')} />
          <StatCard label="Applicants" value={counts.applicants} icon="assignment_ind" hint="across all jobs" />
        </div>

        <div>
          <Toolbar
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            searchPlaceholder="Search jobs by title or location…"
            filters={CHIP_STATUSES.map(s => (
              <FilterChip key={s || 'all'} active={statusFilter === s} onClick={() => setStatusFilter(s)}>{s === '' ? 'All' : STATUS_LABELS[s as JobStatus]}</FilterChip>
            ))}
            actions={
              <select value={`${sortKey}:${sortOrder}`} onChange={e => { const [sk, so] = e.target.value.split(':'); setSortKey(sk as SortKey); setSortOrder(so as any); }}
                aria-label="Sort jobs" className="h-10 px-3 rounded-xl border border-outline-variant/70 bg-surface-container-lowest text-label-md font-semibold text-on-surface focus:border-primary/40 focus:ring-0 outline-none cursor-pointer">
                <option value="createdAt:desc">Newest first</option>
                <option value="createdAt:asc">Oldest first</option>
                <option value="title:asc">Title A–Z</option>
                <option value="applicants:desc">Most applicants</option>
              </select>
            }
            selectedCount={selected.size}
            bulkActions={
              <>
                <Button variant="outline" size="sm" onClick={() => requestBulk('close')} isLoading={bulkInProgress && bulkAction === 'close'}>Close</Button>
                <Button variant="error" size="sm" onClick={() => requestBulk('archive')} isLoading={bulkInProgress && bulkAction === 'archive'}>Archive</Button>
                <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>Clear</Button>
              </>
            }
          />

          {loading ? (
            <div className="grid gap-4"><CardSkeleton /><CardSkeleton /></div>
          ) : error ? (
            <EmptyState icon="cloud_off" title="Couldn't load jobs" description={error} actionLabel="Retry" onAction={loadJobs} />
          ) : filteredJobs.length === 0 ? (
            <EmptyState icon="work_off"
              title={jobs.length === 0 ? 'No jobs yet' : 'No jobs match your filters'}
              description={jobs.length === 0 ? 'Post your first role to start receiving applications from matched candidates.' : 'Try a different status or clear your search.'}
              actionLabel={jobs.length === 0 ? 'Post a job' : 'Show all'}
              onAction={jobs.length === 0 ? openCreate : () => { setStatusFilter(''); setSearchInput(''); }} />
          ) : (
            <Card className="!p-0 overflow-visible">
              <table className="w-full text-body-md">
                <thead className="text-label-sm uppercase tracking-wide text-on-surface-variant border-b border-outline-variant/60">
                  <tr>
                    <th className="w-10 px-4 py-3"><input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all jobs" className="accent-primary" /></th>
                    <th className="text-left px-4 py-3 font-semibold">Job</th>
                    <th className="text-left px-4 py-3 font-semibold">Status</th>
                    <th className="text-left px-4 py-3 font-semibold">Applicants</th>
                    <th className="text-left px-4 py-3 font-semibold">Posted</th>
                    <th className="text-right px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map((job, index) => (
                    <tr key={job.id} ref={el => { rowRefs.current[index] = el; }} tabIndex={0} role="row" aria-selected={selected.has(job.id)}
                      onKeyDown={e => handleRowKeyDown(e, index, job.id)}
                      className={`border-t border-outline-variant/60 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/40 ${selected.has(job.id) ? 'bg-primary-container/40' : 'hover:bg-surface-container/50'}`}>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}><input type="checkbox" checked={selected.has(job.id)} onChange={() => toggleOne(job.id)} aria-label={`Select ${job.title}`} className="accent-primary" /></td>
                      <td className="px-4 py-3 cursor-pointer" onClick={() => openEdit(job)}>
                        <p className="font-semibold text-on-surface">{job.title}</p>
                        <p className="text-label-sm text-on-surface-variant">{job.location}</p>
                      </td>
                      <td className="px-4 py-3"><JobStatusBadge status={job.status} /></td>
                      <td className="px-4 py-3 font-semibold text-on-surface">{job.applications?.length ?? 0}</td>
                      <td className="px-4 py-3 text-on-surface-variant">{new Date(job.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right relative">
                        <div className="flex items-center justify-end gap-1">
                          <button type="button" onClick={() => setPreviewJob(job)} className="p-1.5 rounded-lg hover:bg-surface-container" aria-label={`Preview ${job.title}`} title="Preview"><span className="material-symbols-outlined text-on-surface-variant text-[20px]">visibility</span></button>
                          <button type="button" onClick={() => openEdit(job)} className="p-1.5 rounded-lg hover:bg-surface-container" aria-label={`Edit ${job.title}`} title="Edit"><span className="material-symbols-outlined text-on-surface-variant text-[20px]">edit</span></button>
                          <button type="button" onClick={() => setOpenMenuId(prev => (prev === job.id ? null : job.id))} className="p-1.5 rounded-lg hover:bg-surface-container" aria-haspopup="menu" aria-expanded={openMenuId === job.id} aria-label={`More actions for ${job.title}`} disabled={rowActionId === job.id}><span className="material-symbols-outlined text-on-surface-variant text-[20px]">more_vert</span></button>
                        </div>
                        {openMenuId === job.id && (
                          <div role="menu" className="absolute right-4 top-11 z-20 w-48 bg-surface-container-lowest border border-outline-variant/70 rounded-xl shadow-pop overflow-hidden text-left" onMouseLeave={() => setOpenMenuId(null)}>
                            <button role="menuitem" onClick={() => runRowAction(job, 'duplicate')} className="w-full text-left px-4 py-2.5 text-label-md hover:bg-surface-container">Duplicate</button>
                            {job.status === 'DRAFT' && <button role="menuitem" onClick={() => runRowAction(job, 'publish')} className="w-full text-left px-4 py-2.5 text-label-md hover:bg-surface-container">Publish</button>}
                            {(job.status === 'PUBLISHED' || job.status === 'PAUSED') && <button role="menuitem" onClick={() => runRowAction(job, 'close')} className="w-full text-left px-4 py-2.5 text-label-md hover:bg-surface-container">Close</button>}
                            {job.status === 'CLOSED' && <button role="menuitem" onClick={() => runRowAction(job, 'reopen')} className="w-full text-left px-4 py-2.5 text-label-md hover:bg-surface-container">Reopen</button>}
                            {job.status !== 'ARCHIVED' && <button role="menuitem" onClick={() => runRowAction(job, 'archive')} className="w-full text-left px-4 py-2.5 text-label-md hover:bg-surface-container">Archive</button>}
                            <button role="menuitem" onClick={() => { setDeleteTarget(job); setOpenMenuId(null); }} className="w-full text-left px-4 py-2.5 text-label-md text-error hover:bg-error-container/40">Delete</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      </div>

      <JobPostingForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSaved={loadJobs} job={editingJob as any} />

      <Modal isOpen={!!previewJob} onClose={() => setPreviewJob(null)} title="Job preview" size="lg">
        {previewJob && (
          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-title-lg font-semibold text-on-surface">{previewJob.title}</h3>
              <JobStatusBadge status={previewJob.status} />
            </div>
            <p className="text-label-md text-on-surface-variant">{previewJob.location} · {previewJob.jobType.replace('_', ' ')} · {previewJob.workMode.replace('_', ' ')}</p>
            {(previewJob.salaryMin || previewJob.salaryMax) && (
              <p className="text-body-md font-semibold text-on-surface">{previewJob.currency} {previewJob.salaryMin?.toLocaleString() ?? '—'} – {previewJob.salaryMax?.toLocaleString() ?? '—'}</p>
            )}
            <div><h4 className="text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant mb-1">Description</h4><p className="text-body-md text-on-surface-variant whitespace-pre-wrap">{previewJob.description}</p></div>
            <div><h4 className="text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant mb-1">Requirements</h4><p className="text-body-md text-on-surface-variant whitespace-pre-wrap">{previewJob.requirements}</p></div>
            {previewJob.benefits && <div><h4 className="text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant mb-1">Benefits</h4><p className="text-body-md text-on-surface-variant whitespace-pre-wrap">{previewJob.benefits}</p></div>}
            {previewJob.skillsRequired && previewJob.skillsRequired.length > 0 && (
              <div className="flex flex-wrap gap-2">{previewJob.skillsRequired.map((s, i) => <Badge key={i} tone="neutral">{s.skill?.name}</Badge>)}</div>
            )}
          </div>
        )}
      </Modal>

      <Dialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete this job?"
        description={deleteTarget ? `"${deleteTarget.title}" ${(deleteTarget.applications?.length ?? 0) > 0 ? `has ${deleteTarget.applications?.length} application(s) and cannot be permanently deleted — it will be archived instead.` : 'has no applications and will be permanently deleted. This cannot be undone.'}` : ''}
        confirmLabel={deleteTarget && (deleteTarget.applications?.length ?? 0) > 0 ? 'Archive instead' : 'Delete permanently'}
        confirmVariant="error" isLoading={deleteInProgress} onConfirm={confirmDelete} />

      <Dialog isOpen={bulkConfirmOpen} onClose={() => { setBulkConfirmOpen(false); setBulkAction(null); }}
        title={bulkAction === 'archive' ? 'Archive selected jobs?' : 'Close selected jobs?'}
        description={`This will ${bulkAction} ${selected.size} job posting(s). ${bulkAction === 'archive' ? 'Archived jobs stop accepting applications and are hidden from the public listing.' : 'Closed jobs stop accepting new applications but can be reopened later.'}`}
        confirmLabel={bulkAction === 'archive' ? 'Archive all' : 'Close all'} confirmVariant="error" isLoading={bulkInProgress} onConfirm={runBulk} />
    </>
  );
};

export default JobsListPanel;
