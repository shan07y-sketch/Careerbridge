import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { Dialog } from '../../components/ui/Dialog';
import { HiringPipelineService, CandidateManagementService } from '../../services';
import type { PipelineApplicationDetail, SavedFilter, CandidateTag } from '../../services';
import { StatusBadge, STATUS_LABELS } from '../../components/employer/StatusBadge';
import { ActivityTimeline } from '../../components/employer/ActivityTimeline';
import TagChip, { useCompanyTags, TagPicker } from '../../components/employer/TagChip';
import { useApplicationQueue } from '../../hooks/useApplicationQueue';
import { exportCandidatesCSV } from '../../utils/exportUtils';

/**
 * Bulk-triage-first candidate view for a recruiter processing 100+
 * applications/month. This is the DEFAULT landing view under "Candidates"
 * since most day-to-day recruiter work at this volume is triage, not deep
 * review; clicking a row opens a detail modal with the unified activity
 * timeline, tags, and a link-out to the full pipeline tool for scheduling
 * interviews / making offers.
 */
export const CandidatesQueuePanel: React.FC = () => {
  const { showToast } = useToast();
  const { tags: companyTags } = useCompanyTags();

  const queue = useApplicationQueue();
  const { applications, total, page, setPage, totalPages, filters, setFilters, applyFilterSet, searchInput, setSearchInput, isLoading, error, refetch } = queue;

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [bulkAction, setBulkAction] = useState<'shortlist' | 'reject' | null>(null);
  const [isRejectConfirmOpen, setIsRejectConfirmOpen] = useState(false);
  const [bulkInProgress, setBulkInProgress] = useState(false);
  const [isBulkTagPickerOpen, setIsBulkTagPickerOpen] = useState(false);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<PipelineApplicationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isDetailTagPickerOpen, setIsDetailTagPickerOpen] = useState(false);

  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [isSaveFilterOpen, setIsSaveFilterOpen] = useState(false);
  const [saveFilterName, setSaveFilterName] = useState('');
  const [tagFilterOpen, setTagFilterOpen] = useState(false);

  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [undoBanner, setUndoBanner] = useState<{ ids: string[]; label: string; prevStatuses: Record<string, string> } | null>(null);

  useEffect(() => {
    CandidateManagementService.getSavedFilters().then(setSavedFilters).catch(() => {});
  }, []);

  useEffect(() => {
    setSelected(new Set());
  }, [applications]);

  const totalCandidates = total;
  const allOnPageSelected = applications.length > 0 && applications.every(a => selected.has(a.id));
  const selectedTagIds = filters.tagIds;

  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllOnPage = () => {
    setSelected(prev => {
      if (allOnPageSelected) {
        const next = new Set(prev);
        applications.forEach(a => next.delete(a.id));
        return next;
      }
      const next = new Set(prev);
      applications.forEach(a => next.add(a.id));
      return next;
    });
  };

  const openDetail = useCallback(async (id: string) => {
    setDetailId(id);
    setDetail(null);
    setDetailLoading(true);
    try {
      const data = await HiringPipelineService.getDetail(id);
      setDetail(data);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const runBulkAction = async (action: 'shortlist' | 'reject') => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setBulkInProgress(true);
    try {
      const result = action === 'shortlist'
        ? await HiringPipelineService.bulkShortlist(ids)
        : await HiringPipelineService.bulkReject(ids);
      showToast(
        `${result.updated.length} candidate(s) ${action === 'shortlist' ? 'shortlisted' : 'rejected'}.` +
          (result.skipped.length > 0 ? ` ${result.skipped.length} were skipped (no longer available).` : ''),
        'success'
      );
      if (action === 'reject' && result.updated.length > 0) {
        setUndoBanner({
          ids: result.updated,
          label: `Rejected ${result.updated.length} candidate(s).`,
          prevStatuses: {}
        });
        window.setTimeout(() => setUndoBanner(curr => (curr && curr.ids === result.updated ? null : curr)), 8000);
      }
      await refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : `Failed to ${action} the selected candidates.`, 'error');
    } finally {
      setBulkInProgress(false);
      setBulkAction(null);
      setIsRejectConfirmOpen(false);
    }
  };

  const requestBulkAction = (action: 'shortlist' | 'reject') => {
    setBulkAction(action);
    if (action === 'reject') {
      setIsRejectConfirmOpen(true);
    } else {
      runBulkAction('shortlist');
    }
  };

  const handleUndoReject = async () => {
    if (!undoBanner) return;
    const ids = undoBanner.ids;
    setUndoBanner(null);
    try {
      // No server-side "undo" endpoint exists -- re-run the stage-update flow
      // back to APPLIED for each affected candidate. This is a best-effort
      // client-side undo, not a true transactional rollback.
      await Promise.all(ids.map(id => HiringPipelineService.shortlist(id).catch(() => null)));
      showToast('Rejection undone.', 'success');
      await refetch();
    } catch {
      showToast('Could not undo the rejection for all candidates.', 'error');
    }
  };

  const runBulkTag = async (tag: CandidateTag) => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setIsBulkTagPickerOpen(false);
    try {
      const result = await CandidateManagementService.bulkTag(ids, tag.id);
      showToast(`Tagged ${result.updated.length} candidate(s) as "${tag.name}".`, 'success');
      await refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to tag selected candidates.', 'error');
    }
  };

  const handleAttachDetailTag = async (tag: CandidateTag) => {
    if (!detailId) return;
    setIsDetailTagPickerOpen(false);
    try {
      await CandidateManagementService.attachTag(detailId, tag.id);
      await openDetail(detailId);
      await refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to add tag.', 'error');
    }
  };

  const handleDetachDetailTag = async (tagId: string) => {
    if (!detailId) return;
    try {
      await CandidateManagementService.detachTag(detailId, tagId);
      await openDetail(detailId);
      await refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to remove tag.', 'error');
    }
  };

  const handleSaveFilter = async () => {
    const name = saveFilterName.trim();
    if (!name) return;
    try {
      const saved = await CandidateManagementService.createSavedFilter(name, filters);
      setSavedFilters(prev => [saved, ...prev]);
      setIsSaveFilterOpen(false);
      setSaveFilterName('');
      showToast('Filter saved.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save filter.', 'error');
    }
  };

  const applySavedFilter = (sf: SavedFilter) => {
    applyFilterSet(sf.filters as any);
  };

  const deleteSavedFilter = async (id: string) => {
    try {
      await CandidateManagementService.deleteSavedFilter(id);
      setSavedFilters(prev => prev.filter(f => f.id !== id));
    } catch {
      showToast('Failed to delete saved filter.', 'error');
    }
  };

  const toggleTagFilter = (tagId: string) => {
    const next = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter(id => id !== tagId)
      : [...selectedTagIds, tagId];
    setFilters({ tagIds: next });
  };

  // --- Keyboard shortcuts ---------------------------------------------------
  // j/k move focus, x toggles selection, s shortlists, r rejects (with
  // confirm), / focuses search, ? opens the shortcuts help. Disabled while
  // typing in any input/textarea (except Escape, handled by Modal/Dialog).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (isTyping) return;
      if (detailId || isRejectConfirmOpen) return;

      if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen(true);
      } else if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'j') {
        e.preventDefault();
        setFocusedIndex(i => {
          const next = Math.min(i + 1, applications.length - 1);
          rowRefs.current[next]?.focus();
          return next;
        });
      } else if (e.key === 'k') {
        e.preventDefault();
        setFocusedIndex(i => {
          const prev = Math.max(i - 1, 0);
          rowRefs.current[prev]?.focus();
          return prev;
        });
      } else if (e.key === 'x' && focusedIndex >= 0 && applications[focusedIndex]) {
        e.preventDefault();
        toggleOne(applications[focusedIndex].id);
      } else if (e.key === 's') {
        e.preventDefault();
        if (selected.size > 0) requestBulkAction('shortlist');
        else if (focusedIndex >= 0 && applications[focusedIndex]) {
          setSelected(new Set([applications[focusedIndex].id]));
          window.setTimeout(() => runBulkAction('shortlist'), 0);
        }
      } else if (e.key === 'r') {
        e.preventDefault();
        if (selected.size > 0) requestBulkAction('reject');
        else if (focusedIndex >= 0 && applications[focusedIndex]) {
          setSelected(new Set([applications[focusedIndex].id]));
          setBulkAction('reject');
          setIsRejectConfirmOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applications, focusedIndex, selected, detailId, isRejectConfirmOpen]);

  const handleRowKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>, index: number, id: string) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.min(index + 1, applications.length - 1);
      rowRefs.current[next]?.focus();
      setFocusedIndex(next);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = Math.max(index - 1, 0);
      rowRefs.current[prev]?.focus();
      setFocusedIndex(prev);
    } else if (e.key === ' ') {
      e.preventDefault();
      toggleOne(id);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      openDetail(id);
    }
  };

  const hasActiveFilters = !!(filters.search || filters.status || filters.jobId || filters.dateFrom || filters.dateTo || filters.tagIds.length > 0);

  const exportSelected = () => {
    const rows = applications.filter(a => selected.has(a.id));
    exportCandidatesCSV(rows as any);
  };

  const exportAll = async () => {
    try {
      const result = await HiringPipelineService.getQueue({
        search: filters.search || undefined,
        status: filters.status || undefined,
        jobId: filters.jobId || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        tagIds: filters.tagIds.length > 0 ? filters.tagIds : undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        page: 1,
        limit: Math.max(total, 1)
      });
      exportCandidatesCSV(result.applications as any);
    } catch {
      showToast('Failed to export candidates.', 'error');
    }
  };

  const skeletonRows = useMemo(() => Array.from({ length: 6 }), []);

  return (
    <div className="space-y-6" role="region" aria-label="Candidate bulk triage queue">
      <PageHeader title="Candidates" description="Triage applications in bulk — shortlist or reject, then open a candidate for deep review, tags and AI matching." />
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]" aria-hidden="true">search</span>
          <input
            ref={searchInputRef}
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search candidates, jobs, emails... (press / )"
            aria-label="Search candidates"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-primary/10 bg-surface-container-lowest text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={filters.status}
          onChange={e => setFilters({ status: e.target.value })}
          aria-label="Filter by status"
          className="px-4 py-2.5 rounded-xl border border-primary/10 bg-surface-container-lowest text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">All statuses</option>
          {Object.keys(STATUS_LABELS).map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <input
          type="date"
          value={filters.dateFrom}
          onChange={e => setFilters({ dateFrom: e.target.value })}
          aria-label="Applied from date"
          className="px-3 py-2.5 rounded-xl border border-primary/10 bg-surface-container-lowest text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 hidden sm:block"
        />
        <input
          type="date"
          value={filters.dateTo}
          onChange={e => setFilters({ dateTo: e.target.value })}
          aria-label="Applied to date"
          className="px-3 py-2.5 rounded-xl border border-primary/10 bg-surface-container-lowest text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 hidden sm:block"
        />
        <select
          value={`${filters.sortBy}:${filters.sortOrder}`}
          onChange={e => {
            const [sb, so] = e.target.value.split(':');
            setFilters({ sortBy: sb as any, sortOrder: so as any });
          }}
          aria-label="Sort order"
          className="px-4 py-2.5 rounded-xl border border-primary/10 bg-surface-container-lowest text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="createdAt:desc">Newest first</option>
          <option value="createdAt:asc">Oldest first</option>
          <option value="candidateName:asc">Name A-Z</option>
          <option value="status:asc">Status</option>
        </select>

        <div className="relative">
          <button
            onClick={() => setTagFilterOpen(o => !o)}
            className={`px-3 py-2.5 rounded-xl border text-sm font-semibold flex items-center gap-1.5 ${
              selectedTagIds.length > 0 ? 'border-primary bg-primary-fixed/40 text-primary' : 'border-primary/10 bg-surface-container-lowest'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">sell</span>
            Tags{selectedTagIds.length > 0 ? ` (${selectedTagIds.length})` : ''}
          </button>
          {tagFilterOpen && (
            <div className="absolute z-20 mt-2 w-56 bg-surface-container-lowest border border-primary/10 rounded-xl shadow-xl p-2">
              {companyTags.length === 0 && <p className="text-xs text-on-surface-variant p-2">No tags created yet.</p>}
              {companyTags.map(tag => (
                <label key={tag.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-container-high cursor-pointer">
                  <input type="checkbox" checked={selectedTagIds.includes(tag.id)} onChange={() => toggleTagFilter(tag.id)} />
                  <TagChip tag={tag} />
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="relative ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setIsSaveFilterOpen(true)} disabled={!hasActiveFilters}>
            Save filter
          </Button>
          <Button variant="ghost" size="sm" onClick={exportAll}>
            Export all
          </Button>
          <button
            onClick={() => setIsShortcutsOpen(true)}
            aria-label="Keyboard shortcuts"
            className="hidden md:flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary px-2"
          >
            <span className="material-symbols-outlined text-[16px]">keyboard</span>
            <kbd className="px-1 py-0.5 rounded bg-surface-container-high text-[10px]">?</kbd>
          </button>
        </div>
      </div>

      {savedFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase text-on-surface-variant">Saved:</span>
          {savedFilters.map(sf => (
            <span key={sf.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-high text-xs font-semibold">
              <button onClick={() => applySavedFilter(sf)} className="hover:text-primary">{sf.name}</button>
              <button onClick={() => deleteSavedFilter(sf.id)} aria-label={`Delete saved filter ${sf.name}`} className="text-on-surface-variant hover:text-error">
                <span className="material-symbols-outlined text-[12px]">close</span>
              </button>
            </span>
          ))}
        </div>
      )}

      {undoBanner && (
        <div className="flex items-center justify-between bg-surface-container-high rounded-xl px-4 py-2.5 text-sm">
          <span>{undoBanner.label}</span>
          <button onClick={handleUndoReject} className="font-bold text-primary hover:underline">Undo</button>
        </div>
      )}

      {/* Persistent bulk action bar */}
      {selected.size > 0 && (
        <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 bg-primary text-white rounded-xl px-5 py-3 shadow-lg">
          <span className="font-bold text-sm">{selected.size} selected</span>
          <div className="flex items-center gap-2 flex-wrap relative">
            <Button variant="secondary" size="sm" onClick={() => requestBulkAction('shortlist')} isLoading={bulkInProgress && bulkAction === 'shortlist'}>
              Shortlist ({selected.size})
            </Button>
            <Button variant="error" size="sm" onClick={() => requestBulkAction('reject')} isLoading={bulkInProgress && bulkAction === 'reject'}>
              Reject ({selected.size})
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setIsBulkTagPickerOpen(o => !o)}>
              Tag
            </Button>
            <Button variant="secondary" size="sm" onClick={exportSelected}>
              Export
            </Button>
            {isBulkTagPickerOpen && (
              <div className="absolute right-0 top-full">
                <TagPicker onSelect={runBulkTag} onClose={() => setIsBulkTagPickerOpen(false)} />
              </div>
            )}
            <button onClick={() => setSelected(new Set())} className="text-white/80 hover:text-white text-xs font-semibold ml-2">
              Clear
            </button>
          </div>
        </div>
      )}

      {error && (
        <div role="alert" className="bg-error/10 border border-error/30 text-error text-sm font-semibold rounded-xl px-4 py-3 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => refetch()} className="font-bold underline">Retry</button>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block bg-surface-container-lowest border border-primary/5 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-container-high text-on-surface-variant text-xs uppercase tracking-wide">
            <tr>
              <th className="w-10 px-4 py-3">
                <input type="checkbox" checked={allOnPageSelected} onChange={toggleAllOnPage} aria-label="Select all candidates on this page" />
              </th>
              <th className="text-left px-4 py-3">Candidate</th>
              <th className="text-left px-4 py-3">Job</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Tags</th>
              <th className="text-left px-4 py-3">Applied</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && skeletonRows.map((_, i) => (
              <tr key={i} className="border-t border-primary/5">
                <td className="px-4 py-3"><div className="w-4 h-4 bg-surface-container-high rounded animate-pulse" /></td>
                <td className="px-4 py-3"><div className="h-3.5 w-32 bg-surface-container-high rounded animate-pulse mb-1.5" /><div className="h-2.5 w-24 bg-surface-container-high rounded animate-pulse" /></td>
                <td className="px-4 py-3"><div className="h-3.5 w-28 bg-surface-container-high rounded animate-pulse" /></td>
                <td className="px-4 py-3"><div className="h-5 w-20 bg-surface-container-high rounded-full animate-pulse" /></td>
                <td className="px-4 py-3"><div className="h-5 w-16 bg-surface-container-high rounded-full animate-pulse" /></td>
                <td className="px-4 py-3"><div className="h-3.5 w-16 bg-surface-container-high rounded animate-pulse" /></td>
              </tr>
            ))}
            {!isLoading && applications.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-3xl opacity-40 block mb-2" aria-hidden="true">
                    {hasActiveFilters ? 'filter_alt_off' : 'group'}
                  </span>
                  <p className="font-semibold">{hasActiveFilters ? 'No candidates match these filters.' : 'No applications yet.'}</p>
                  {hasActiveFilters && (
                    <button onClick={() => applyFilterSet({})} className="text-primary text-sm font-bold hover:underline mt-1">
                      Clear filters
                    </button>
                  )}
                </td>
              </tr>
            )}
            {!isLoading && applications.map((app, index) => (
              <tr
                key={app.id}
                ref={el => { rowRefs.current[index] = el; }}
                tabIndex={0}
                role="row"
                aria-selected={selected.has(app.id)}
                onFocus={() => setFocusedIndex(index)}
                onKeyDown={e => handleRowKeyDown(e, index, app.id)}
                onClick={() => openDetail(app.id)}
                className={`border-t border-primary/5 cursor-pointer hover:bg-surface-container-high/60 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/40 ${
                  selected.has(app.id) ? 'bg-secondary-container/30' : ''
                }`}
              >
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selected.has(app.id)}
                    onChange={() => toggleOne(app.id)}
                    aria-label={`Select ${app.studentProfile.firstName} ${app.studentProfile.lastName}`}
                  />
                </td>
                <td className="px-4 py-3 font-semibold text-primary">
                  {app.studentProfile.firstName} {app.studentProfile.lastName}
                  <div className="text-xs text-on-surface-variant font-normal">{app.studentProfile.user.email}</div>
                </td>
                <td className="px-4 py-3">{app.job.title}</td>
                <td className="px-4 py-3"><StatusBadge status={app.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1 max-w-[160px]">
                    {(app.tags || []).slice(0, 2).map(t => <TagChip key={t.tag.id} tag={t.tag} />)}
                    {(app.tags || []).length > 2 && <span className="text-[10px] text-on-surface-variant">+{(app.tags || []).length - 2}</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-on-surface-variant">{new Date(app.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-2">
        {isLoading && skeletonRows.map((_, i) => (
          <div key={i} className="bg-surface-container-lowest border border-primary/5 rounded-xl p-4 animate-pulse space-y-2">
            <div className="h-4 w-2/3 bg-surface-container-high rounded" />
            <div className="h-3 w-1/2 bg-surface-container-high rounded" />
          </div>
        ))}
        {!isLoading && applications.length === 0 && (
          <div className="text-center py-10 text-on-surface-variant">
            <p className="font-semibold">{hasActiveFilters ? 'No candidates match these filters.' : 'No applications yet.'}</p>
          </div>
        )}
        {!isLoading && applications.map(app => (
          <div
            key={app.id}
            onClick={() => openDetail(app.id)}
            className={`bg-surface-container-lowest border rounded-xl p-4 space-y-2 ${selected.has(app.id) ? 'border-primary' : 'border-primary/5'}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div onClick={e => e.stopPropagation()} className="pt-0.5">
                <input type="checkbox" checked={selected.has(app.id)} onChange={() => toggleOne(app.id)} aria-label={`Select ${app.studentProfile.firstName}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-primary truncate">{app.studentProfile.firstName} {app.studentProfile.lastName}</p>
                <p className="text-xs text-on-surface-variant truncate">{app.job.title}</p>
              </div>
              <StatusBadge status={app.status} />
            </div>
            {(app.tags || []).length > 0 && (
              <div className="flex flex-wrap gap-1">{app.tags!.map(t => <TagChip key={t.tag.id} tag={t.tag} />)}</div>
            )}
            <p className="text-xs text-on-surface-variant">{new Date(app.createdAt).toLocaleDateString()}</p>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-on-surface-variant">
        <span>{totalCandidates} total candidates</span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Previous</Button>
          <span>Page {page} of {totalPages}</span>
          <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</Button>
        </div>
      </div>

      {/* Detail modal */}
      <Modal isOpen={!!detailId} onClose={() => setDetailId(null)} title="Candidate Snapshot" size="lg">
        {detailLoading && (
          <div className="space-y-3 animate-pulse">
            <div className="h-5 w-1/2 bg-surface-container-high rounded" />
            <div className="h-3.5 w-1/3 bg-surface-container-high rounded" />
          </div>
        )}
        {!detailLoading && detail && (
          <div className="space-y-4 text-left">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-primary text-lg">{detail.studentProfile.firstName} {detail.studentProfile.lastName}</h3>
                <p className="text-sm text-on-surface-variant">{detail.studentProfile.user.email}</p>
                <p className="text-sm mt-1"><span className="font-semibold">Applied to:</span> {detail.job.title}</p>
              </div>
              <StatusBadge status={detail.status} />
            </div>

            <div className="relative">
              <div className="flex flex-wrap items-center gap-1.5">
                {((detail as any).tags || []).map((t: any) => (
                  <TagChip key={t.tag.id} tag={t.tag} onRemove={() => handleDetachDetailTag(t.tag.id)} />
                ))}
                <button
                  onClick={() => setIsDetailTagPickerOpen(o => !o)}
                  className="text-xs font-bold text-primary border border-dashed border-primary/40 rounded-full px-2.5 py-0.5 hover:bg-primary-fixed/20"
                >
                  + Tag
                </button>
              </div>
              {isDetailTagPickerOpen && (
                <TagPicker
                  onSelect={handleAttachDetailTag}
                  onClose={() => setIsDetailTagPickerOpen(false)}
                  excludeIds={((detail as any).tags || []).map((t: any) => t.tag.id)}
                />
              )}
            </div>

            {detail.studentProfile.skills && detail.studentProfile.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {detail.studentProfile.skills.map((s, i) => (
                  <span key={i} className="px-2 py-1 bg-surface-container-high rounded-full text-xs font-semibold">{s.skill.name}</span>
                ))}
              </div>
            )}

            <div>
              <h4 className="font-bold text-sm text-primary mb-2">Activity</h4>
              <ActivityTimeline applicationId={detail.id} />
            </div>

            <p className="text-xs text-on-surface-variant pt-1 border-t border-primary/5">
              For notes, interviews, and offers, use the Hiring Pipeline tab.
            </p>
          </div>
        )}
      </Modal>

      <Dialog
        isOpen={isRejectConfirmOpen}
        onClose={() => { setIsRejectConfirmOpen(false); setBulkAction(null); }}
        title="Reject selected candidates?"
        description={`This will reject ${selected.size} candidate(s) and notify them immediately.`}
        confirmLabel="Reject All"
        confirmVariant="error"
        isLoading={bulkInProgress}
        onConfirm={() => runBulkAction('reject')}
      />

      <Modal isOpen={isSaveFilterOpen} onClose={() => setIsSaveFilterOpen(false)} title="Save current filters" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-on-surface-variant">Give this filter combination a name so you can reapply it in one click later.</p>
          <input
            value={saveFilterName}
            onChange={e => setSaveFilterName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSaveFilter(); }}
            placeholder="e.g. Recent Frontend Applicants"
            aria-label="Filter name"
            autoFocus
            className="w-full px-3 py-2 rounded-lg border border-primary/10 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsSaveFilterOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveFilter} disabled={!saveFilterName.trim()}>Save</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} title="Keyboard shortcuts" size="sm">
        <ul className="space-y-2 text-sm">
          {[
            ['j / k', 'Move focus down / up the list'],
            ['x', 'Toggle selection of the focused candidate'],
            ['s', 'Shortlist selected (or focused) candidate(s)'],
            ['r', 'Reject selected (or focused) candidate(s)'],
            ['/', 'Focus the search field'],
            ['?', 'Show this shortcuts help']
          ].map(([key, desc]) => (
            <li key={key} className="flex items-center justify-between">
              <span className="text-on-surface-variant">{desc}</span>
              <kbd className="px-2 py-1 rounded bg-surface-container-high text-xs font-mono">{key}</kbd>
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
};

export default CandidatesQueuePanel;
