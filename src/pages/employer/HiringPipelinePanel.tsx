import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { Dialog } from '../../components/ui/Dialog';
import { HiringPipelineService } from '../../services';
import type { PipelineApplication, PipelineApplicationDetail, PipelineAnalytics, SharedInterviewReportEntry } from '../../services';
import type { CandidateEvaluation, CandidateComparisonResult } from '../../types';
import { StatusBadge, STATUS_LABELS } from '../../components/employer/StatusBadge';
import { ActivityTimeline } from '../../components/employer/ActivityTimeline';

const CURRENCY_OPTIONS = ['USD', 'GBP', 'EUR', 'CAD', 'AUD', 'INR'];

/**
 * The Hiring Pipeline Workflow: the single place a recruiter works an
 * application from "just applied" through to a hired candidate --
 * queue -> candidate detail -> notes/interviews/offer -- without leaving
 * CareerBridge. This connects directly to the Resume workflow (resume
 * preview/download reuses the same authorized recruiter-access endpoint)
 * and to the student-side Applications page (every action here notifies
 * the candidate and updates what they see there).
 */
export const HiringPipelinePanel: React.FC = () => {
  const { showToast } = useToast();

  // --- Analytics ---------------------------------------------------------
  const [analytics, setAnalytics] = useState<PipelineAnalytics | null>(null);

  // --- Queue --------------------------------------------------------------
  const [applications, setApplications] = useState<PipelineApplication[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'status' | 'candidateName'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [queueLoading, setQueueLoading] = useState(true);
  const [queueError, setQueueError] = useState<string | null>(null);

  // --- Candidate detail -----------------------------------------------------
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<PipelineApplicationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);

  // --- Notes ------------------------------------------------------------
  const [noteDraft, setNoteDraft] = useState('');

  // --- Interview modal ----------------------------------------------------
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [interviewForm, setInterviewForm] = useState({ title: '', scheduledAt: '', duration: 45, locationUrl: '' });

  // --- Offer modal --------------------------------------------------------
  const [isOfferOpen, setIsOfferOpen] = useState(false);
  const [offerForm, setOfferForm] = useState({ title: '', salary: '', currency: 'USD', startDate: '', notes: '' });

  // --- Confirmation dialogs (replace jarring native window.confirm) -------
  const [isRejectConfirmOpen, setIsRejectConfirmOpen] = useState(false);
  const [isWithdrawConfirmOpen, setIsWithdrawConfirmOpen] = useState(false);

  // --- Candidate-shared mock interview reports -----------------------------
  const [sharedReports, setSharedReports] = useState<SharedInterviewReportEntry[]>([]);

  // --- Employer AI: candidate evaluation (Phase 4) -------------------------
  const [evaluation, setEvaluation] = useState<CandidateEvaluation | null>(null);
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);

  // --- Employer AI: candidate comparison (Phase 4) -------------------------
  const [selectedForCompare, setSelectedForCompare] = useState<Set<string>>(new Set());
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [comparisonResult, setComparisonResult] = useState<CandidateComparisonResult | null>(null);

  // Debounce free-text search so we don't fire a network request on every
  // keystroke -- typing "engineer" would otherwise trigger 8 separate queries.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const loadAnalytics = useCallback(async () => {
    try {
      const data = await HiringPipelineService.getAnalytics();
      setAnalytics(data);
    } catch {
      // Analytics is a supplementary strip -- a failure here shouldn't block the queue.
      setAnalytics(null);
    }
  }, []);

  const loadQueue = useCallback(async () => {
    setQueueLoading(true);
    setQueueError(null);
    try {
      const result = await HiringPipelineService.getQueue({
        search: search || undefined,
        status: statusFilter || undefined,
        sortBy,
        sortOrder,
        page,
        limit
      });
      setApplications(result.applications);
      setTotal(result.total);
    } catch (err) {
      setQueueError(err instanceof Error ? err.message : 'Failed to load the application queue.');
    } finally {
      setQueueLoading(false);
    }
  }, [search, statusFilter, sortBy, sortOrder, page]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const openCandidate = async (id: string) => {
    setSelectedId(id);
    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);
    setEvaluation(null);
    setEvaluationError(null);
    try {
      const data = await HiringPipelineService.getDetail(id);
      setDetail(data);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'Failed to load candidate details.');
    } finally {
      setDetailLoading(false);
    }

    try {
      const latest = await HiringPipelineService.getLatestEvaluation(id);
      setEvaluation(latest ?? null);
    } catch {
      setEvaluation(null);
    }

    try {
      setSharedReports(await HiringPipelineService.getSharedInterviewReports(id));
    } catch {
      setSharedReports([]);
    }
  };

  const handleGenerateEvaluation = async () => {
    if (!selectedId) return;
    setEvaluationLoading(true);
    setEvaluationError(null);
    try {
      const result = await HiringPipelineService.evaluateCandidate(selectedId);
      setEvaluation(result);
    } catch (err) {
      setEvaluationError(err instanceof Error ? err.message : 'Could not generate AI evaluation.');
    } finally {
      setEvaluationLoading(false);
    }
  };

  const toggleCompareSelection = (id: string) => {
    setSelectedForCompare(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCompareCandidates = async () => {
    const ids = Array.from(selectedForCompare);
    if (ids.length < 2) {
      showToast('Select at least two candidates for the same job to compare.', 'info');
      return;
    }
    const jobId = applications.find(a => a.id === ids[0])?.job.id;
    if (!jobId || !ids.every(id => applications.find(a => a.id === id)?.job.id === jobId)) {
      showToast('Candidates must all be applying to the same job to compare.', 'error');
      return;
    }

    setIsCompareOpen(true);
    setCompareLoading(true);
    setCompareError(null);
    setComparisonResult(null);
    try {
      const result = await HiringPipelineService.compareCandidates(jobId, ids);
      setComparisonResult(result);
    } catch (err) {
      setCompareError(err instanceof Error ? err.message : 'Could not generate candidate comparison.');
    } finally {
      setCompareLoading(false);
    }
  };

  const refreshDetailAndQueue = async () => {
    if (selectedId) {
      const data = await HiringPipelineService.getDetail(selectedId);
      setDetail(data);
    }
    await loadQueue();
    await loadAnalytics();
  };

  const closeCandidate = () => {
    setSelectedId(null);
    setDetail(null);
    setDetailError(null);
    setNoteDraft('');
  };

  const handleShortlist = async () => {
    if (!detail) return;
    setActionInProgress(true);
    try {
      await HiringPipelineService.shortlist(detail.id);
      showToast('Candidate shortlisted.', 'success');
      await refreshDetailAndQueue();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not shortlist candidate.', 'error');
    } finally {
      setActionInProgress(false);
    }
  };

  const confirmReject = async () => {
    if (!detail) return;
    setActionInProgress(true);
    try {
      await HiringPipelineService.reject(detail.id);
      showToast('Candidate rejected.', 'success');
      setIsRejectConfirmOpen(false);
      await refreshDetailAndQueue();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not reject candidate.', 'error');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleAddNote = async () => {
    if (!detail || !noteDraft.trim()) return;
    setActionInProgress(true);
    try {
      await HiringPipelineService.addNote(detail.id, noteDraft.trim());
      setNoteDraft('');
      await refreshDetailAndQueue();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not add note.', 'error');
    } finally {
      setActionInProgress(false);
    }
  };

  const handlePreviewResume = async (resumeId: string) => {
    try {
      await HiringPipelineService.previewResume(resumeId);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not open resume preview.', 'error');
    }
  };

  const handleDownloadResume = async (resumeId: string, fileName: string) => {
    try {
      await HiringPipelineService.downloadResume(resumeId, fileName);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not download resume.', 'error');
    }
  };

  const handleScheduleInterview = async () => {
    if (!detail || !interviewForm.title || !interviewForm.scheduledAt) {
      showToast('Interview title and date/time are required.', 'error');
      return;
    }
    setActionInProgress(true);
    try {
      await HiringPipelineService.scheduleInterview(detail.id, {
        title: interviewForm.title,
        scheduledAt: new Date(interviewForm.scheduledAt).toISOString(),
        duration: interviewForm.duration,
        locationUrl: interviewForm.locationUrl || undefined
      });
      showToast('Interview scheduled.', 'success');
      setIsScheduleOpen(false);
      setInterviewForm({ title: '', scheduledAt: '', duration: 45, locationUrl: '' });
      await refreshDetailAndQueue();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not schedule interview.', 'error');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleCreateOffer = async () => {
    if (!detail || !offerForm.title || !offerForm.salary || !offerForm.startDate) {
      showToast('Offer title, salary, and start date are required.', 'error');
      return;
    }
    setActionInProgress(true);
    try {
      await HiringPipelineService.createOffer(detail.id, {
        title: offerForm.title,
        salary: parseFloat(offerForm.salary),
        currency: offerForm.currency,
        startDate: new Date(offerForm.startDate).toISOString(),
        notes: offerForm.notes || undefined
      });
      showToast('Offer extended to candidate.', 'success');
      setIsOfferOpen(false);
      setOfferForm({ title: '', salary: '', currency: 'USD', startDate: '', notes: '' });
      await refreshDetailAndQueue();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not create offer.', 'error');
    } finally {
      setActionInProgress(false);
    }
  };

  const confirmWithdrawOffer = async () => {
    if (!detail?.offer) return;
    setActionInProgress(true);
    try {
      await HiringPipelineService.withdrawOffer(detail.offer.id);
      showToast('Offer withdrawn.', 'success');
      setIsWithdrawConfirmOpen(false);
      await refreshDetailAndQueue();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not withdraw offer.', 'error');
    } finally {
      setActionInProgress(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const activeResume = detail?.studentProfile.resumes?.[0];

  return (
    <div className="space-y-8 text-left">
      <PageHeader title="Talent pipeline" description="Every candidate across your open roles — review, tag, schedule interviews and extend offers." />
      {/* Analytics strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Jobs', value: analytics?.activeJobs ?? '—' },
          { label: 'Total Applications', value: analytics?.totalApplications ?? '—' },
          { label: 'Avg. Time to Hire', value: analytics?.timeToHireDays != null ? `${analytics.timeToHireDays}d` : '—' },
          { label: 'Offer Acceptance', value: analytics?.offerAcceptanceRate != null ? `${analytics.offerAcceptanceRate}%` : '—' }
        ].map(metric => (
          <div key={metric.label} className="bg-white dark:bg-surface-container-lowest rounded-xl p-4 border border-primary/5 shadow-sm">
            <p className="text-2xl font-bold text-primary dark:text-primary-fixed">{metric.value}</p>
            <p className="text-xs text-on-surface-variant font-semibold mt-1">{metric.label}</p>
          </div>
        ))}
      </div>

      {/* Queue controls */}
      <div className="bg-white dark:bg-surface-container-lowest rounded-xl p-4 border border-primary/5 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <label htmlFor="pipeline-search" className="sr-only">Search candidates or job titles</label>
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg" aria-hidden="true">search</span>
          <input
            id="pipeline-search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search candidates or job titles..."
            aria-label="Search candidates or job titles"
            className="w-full pl-10 pr-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <label htmlFor="pipeline-status-filter" className="sr-only">Filter by status</label>
        <select
          id="pipeline-status-filter"
          value={statusFilter}
          onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}
          aria-label="Filter by status"
          className="px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <label htmlFor="pipeline-sort" className="sr-only">Sort order</label>
        <select
          id="pipeline-sort"
          value={`${sortBy}:${sortOrder}`}
          onChange={(e) => {
            const [by, order] = e.target.value.split(':');
            setSortBy(by as any);
            setSortOrder(order as any);
          }}
          aria-label="Sort order"
          className="px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="createdAt:desc">Newest first</option>
          <option value="createdAt:asc">Oldest first</option>
          <option value="candidateName:asc">Candidate A–Z</option>
          <option value="candidateName:desc">Candidate Z–A</option>
          <option value="status:asc">Status</option>
        </select>
      </div>

      {/* Compare selected bar */}
      {selectedForCompare.size > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-primary">{selectedForCompare.size} candidate{selectedForCompare.size === 1 ? '' : 's'} selected</span>
          <div className="flex gap-2">
            <button onClick={() => setSelectedForCompare(new Set())} className="text-xs font-bold text-on-surface-variant hover:text-primary">Clear</button>
            <Button onClick={handleCompareCandidates}>Compare with AI</Button>
          </div>
        </div>
      )}

      {/* Queue */}
      <div className="bg-white dark:bg-surface-container-lowest rounded-xl border border-primary/5 shadow-sm overflow-hidden">
        {queueLoading ? (
          <div className="flex items-center justify-center gap-3 text-on-surface-variant py-16">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            Loading application queue...
          </div>
        ) : queueError ? (
          <div className="flex flex-col items-center gap-3 text-center py-16">
            <span className="material-symbols-outlined text-error text-3xl">error</span>
            <p className="text-on-surface-variant text-sm">{queueError}</p>
            <Button variant="secondary" onClick={loadQueue}>Retry</Button>
          </div>
        ) : applications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 text-center py-16">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant">inbox</span>
            <p className="font-bold text-on-surface">No applications match your filters</p>
            <p className="text-sm text-on-surface-variant">Try clearing search or status filters.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low text-on-surface-variant text-xs uppercase font-bold">
              <tr>
                <th className="px-4 py-3 w-8"></th>
                <th className="text-left px-4 py-3">Candidate</th>
                <th className="text-left px-4 py-3">Job</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Applied</th>
                <th className="text-left px-4 py-3">Next Interview</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {applications.map(app => (
                <tr
                  key={app.id}
                  tabIndex={0}
                  role="button"
                  aria-label={`Review ${app.studentProfile.firstName} ${app.studentProfile.lastName}'s application for ${app.job.title}`}
                  className="hover:bg-surface-container-low/50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/40"
                  onClick={() => openCandidate(app.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openCandidate(app.id);
                    }
                  }}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      aria-label={`Select ${app.studentProfile.firstName} ${app.studentProfile.lastName} to compare`}
                      checked={selectedForCompare.has(app.id)}
                      onChange={() => toggleCompareSelection(app.id)}
                      className="w-4 h-4"
                    />
                  </td>
                  <td className="px-4 py-3 font-semibold text-on-surface">
                    {app.studentProfile.firstName} {app.studentProfile.lastName}
                    <div className="text-xs text-on-surface-variant font-normal">{app.studentProfile.user.email}</div>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">{app.job.title}</td>
                  <td className="px-4 py-3"><StatusBadge status={app.status} /></td>
                  <td className="px-4 py-3 text-on-surface-variant">{new Date(app.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {app.interviews?.[0] ? new Date(app.interviews[0].scheduledAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); openCandidate(app.id); }}
                      className="text-xs font-bold text-primary dark:text-primary-fixed hover:underline focus:outline-none focus:ring-2 focus:ring-primary/40 rounded"
                      tabIndex={-1}
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!queueLoading && !queueError && applications.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-outline-variant/30 text-xs text-on-surface-variant">
            <span>{total} total application{total === 1 ? '' : 's'}</span>
            <div className="flex items-center gap-2">
              <button aria-label="Previous page" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-2 py-1 rounded disabled:opacity-30 hover:bg-surface-container-high font-bold focus:outline-none focus:ring-2 focus:ring-primary/40">Prev</button>
              <span aria-live="polite">Page {page} of {totalPages}</span>
              <button aria-label="Next page" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-2 py-1 rounded disabled:opacity-30 hover:bg-surface-container-high font-bold focus:outline-none focus:ring-2 focus:ring-primary/40">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Candidate detail modal */}
      <Modal isOpen={!!selectedId} onClose={closeCandidate} title="Candidate Review" size="xl">
        {detailLoading ? (
          <div className="flex items-center justify-center gap-3 text-on-surface-variant py-16">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            Loading candidate...
          </div>
        ) : detailError ? (
          <div className="flex flex-col items-center gap-3 text-center py-16">
            <span className="material-symbols-outlined text-error text-3xl">error</span>
            <p className="text-on-surface-variant text-sm">{detailError}</p>
            <Button variant="secondary" onClick={() => selectedId && openCandidate(selectedId)}>Retry</Button>
          </div>
        ) : detail ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h4 className="text-lg font-bold text-primary dark:text-primary-fixed">
                  {detail.studentProfile.firstName} {detail.studentProfile.lastName}
                </h4>
                <p className="text-sm text-on-surface-variant">{detail.studentProfile.user.email} • Applying for {detail.job.title}</p>
                <div className="mt-2"><StatusBadge status={detail.status} /></div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" disabled={actionInProgress || detail.status === 'SHORTLISTED'} onClick={handleShortlist}>
                  Shortlist
                </Button>
                <Button variant="secondary" disabled={actionInProgress || detail.status === 'REJECTED'} onClick={() => setIsRejectConfirmOpen(true)}>
                  Reject
                </Button>
              </div>
            </div>

            {/* Skills */}
            {detail.studentProfile.skills && detail.studentProfile.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {detail.studentProfile.skills.map(s => (
                  <span key={s.skill.name} className="text-xs bg-surface-container-high dark:bg-surface-container px-2 py-1 rounded font-semibold text-on-surface-variant">
                    {s.skill.name}
                  </span>
                ))}
              </div>
            )}

            {/* AI Candidate Evaluation (Employer AI, Phase 4) -- reuses the
                same Resume Intelligence and Mock Interview AI signals from
                the student side, read through the lens of this job. */}
            <div className="border border-primary/10 rounded-lg p-4 bg-primary/5">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-bold text-sm text-primary dark:text-primary-fixed flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  AI Candidate Evaluation
                </h5>
                <Button variant="secondary" onClick={handleGenerateEvaluation} disabled={evaluationLoading}>
                  {evaluationLoading ? 'Analyzing…' : evaluation ? 'Refresh' : 'Generate'}
                </Button>
              </div>

              {evaluationError && <p className="text-xs text-error">{evaluationError}</p>}

              {!evaluation && !evaluationLoading && !evaluationError && (
                <p className="text-xs text-on-surface-variant">No AI evaluation yet -- generate one from this candidate's resume analysis and mock interview history.</p>
              )}

              {evaluation && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-primary">{evaluation.fitScore}%</span>
                    <span className="text-xs font-bold uppercase tracking-wide px-2 py-1 rounded bg-primary/10 text-primary">{evaluation.recommendation}</span>
                    {evaluation.modelVersion?.endsWith('-estimated') && (
                      <span className="text-xs font-medium px-2 py-1 rounded bg-amber-100 text-amber-700">Estimated · AI unavailable</span>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant">{evaluation.summary}</p>
                  {evaluation.interviewSignal && (
                    <p className="text-xs text-on-surface-variant italic">Interview signal: {evaluation.interviewSignal}</p>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-on-surface-variant mb-1">Strengths</p>
                      <ul className="text-xs space-y-0.5 list-disc list-inside text-on-surface-variant">
                        {evaluation.strengths.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-on-surface-variant mb-1">Concerns</p>
                      <ul className="text-xs space-y-0.5 list-disc list-inside text-on-surface-variant">
                        {evaluation.concerns.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {evaluation.skillsMatch.map(s => (
                      <span key={s} className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded">{s}</span>
                    ))}
                    {evaluation.skillsGap.map(s => (
                      <span key={s} className="text-[10px] font-bold bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded">missing: {s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Mock interview reports the candidate explicitly shared. The
                values shown are the SAME stored report the student sees. */}
            {sharedReports.length > 0 && (
              <div className="border border-primary/10 rounded-lg p-4">
                <h5 className="font-bold text-sm text-primary dark:text-primary-fixed flex items-center gap-1.5 mb-3">
                  <span className="material-symbols-outlined text-base">interpreter_mode</span>
                  AI Interview Reports <span className="font-normal text-xs text-on-surface-variant">(shared by candidate)</span>
                </h5>
                <ul className="space-y-2">
                  {sharedReports.map(entry => (
                    <li key={entry.mockInterviewId} className="flex items-center justify-between gap-3 bg-surface-container-low rounded-lg p-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-on-surface truncate">
                          {entry.jobTitle}{entry.companyName ? ` · ${entry.companyName}` : ''}
                        </p>
                        <p className="text-[11px] text-on-surface-variant">
                          {entry.interviewType} · {entry.difficulty}
                          {entry.completedAt ? ` · ${new Date(entry.completedAt).toLocaleDateString()}` : ''}
                          {entry.report?.estimated ? ' · Estimated – AI unavailable' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {entry.report && (
                          <div className="text-right">
                            <p className="text-lg font-bold text-primary leading-none">{entry.report.score}<span className="text-[10px] text-on-surface-variant">/100</span></p>
                            {entry.report.interviewReadiness != null && (
                              <p className="text-[10px] text-on-surface-variant">readiness {entry.report.interviewReadiness}</p>
                            )}
                          </div>
                        )}
                        <button
                          onClick={() => {
                            if (!selectedId) return;
                            HiringPipelineService.downloadSharedInterviewReportPdf(selectedId, entry.mockInterviewId).catch(err =>
                              showToast(err instanceof Error ? err.message : 'Download failed.', 'error')
                            );
                          }}
                          className="text-xs font-bold text-primary dark:text-primary-fixed border border-primary px-3 py-1.5 rounded hover:bg-primary-fixed/20"
                        >
                          PDF
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Resume */}
            <div className="border border-outline-variant rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">description</span>
                <div>
                  <p className="font-semibold text-sm">{activeResume ? activeResume.fileName : 'No resume on file'}</p>
                  {!activeResume && <p className="text-xs text-on-surface-variant">This candidate has not uploaded a resume yet.</p>}
                </div>
              </div>
              {activeResume && (
                <div className="flex gap-2">
                  <button onClick={() => handlePreviewResume(activeResume.id)} className="text-xs font-bold text-primary dark:text-primary-fixed border border-primary px-3 py-1.5 rounded hover:bg-primary-fixed/20">
                    Preview
                  </button>
                  <button onClick={() => handleDownloadResume(activeResume.id, activeResume.fileName)} className="text-xs font-bold text-primary dark:text-primary-fixed border border-primary px-3 py-1.5 rounded hover:bg-primary-fixed/20">
                    Download
                  </button>
                </div>
              )}
            </div>

            {/* Unified activity timeline -- one chronological feed across stage
                changes, notes, interviews, and offer events, instead of the
                previously-separate disconnected sections. */}
            <div>
              <h5 className="font-bold text-sm text-primary dark:text-primary-fixed mb-3">Activity</h5>
              <ActivityTimeline applicationId={detail.id} />
            </div>

            {/* Interviews */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-bold text-sm text-primary dark:text-primary-fixed">Interviews</h5>
                <Button variant="secondary" onClick={() => setIsScheduleOpen(true)}>Schedule Interview</Button>
              </div>
              {detail.interviews.length === 0 ? (
                <p className="text-xs text-on-surface-variant">No interviews scheduled yet.</p>
              ) : (
                <div className="space-y-2">
                  {detail.interviews.map(iv => (
                    <div key={iv.id} className="border border-outline-variant rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{iv.title}</p>
                        <p className="text-xs text-on-surface-variant">{new Date(iv.scheduledAt).toLocaleString()} • {iv.duration} min • {iv.status}</p>
                      </div>
                      {iv.locationUrl && (
                        <a href={iv.locationUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-primary hover:underline">Join Link</a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Offer */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-bold text-sm text-primary dark:text-primary-fixed">Offer</h5>
                {!detail.offer && (
                  <Button variant="secondary" onClick={() => setIsOfferOpen(true)}>Create Offer</Button>
                )}
              </div>
              {detail.offer ? (
                <div className="border border-outline-variant rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{detail.offer.title} — {detail.offer.currency} {detail.offer.salary.toLocaleString()}</p>
                    <p className="text-xs text-on-surface-variant">
                      Start {new Date(detail.offer.startDate).toLocaleDateString()} • Status: {detail.offer.status}
                    </p>
                  </div>
                  {detail.offer.status === 'EXTENDED' && (
                    <button onClick={() => setIsWithdrawConfirmOpen(true)} className="text-xs font-bold text-error border border-error px-3 py-1.5 rounded hover:bg-error/10">
                      Withdraw
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant">No offer has been created yet.</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <h5 className="font-bold text-sm text-primary dark:text-primary-fixed mb-3">Internal Notes</h5>
              <div className="flex gap-2 mb-3">
                <label htmlFor="internal-note-draft" className="sr-only">Add an internal note or comment</label>
                <input
                  id="internal-note-draft"
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && noteDraft.trim()) handleAddNote(); }}
                  placeholder="Add an internal note or comment..."
                  aria-label="Add an internal note or comment"
                  className="flex-1 px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <Button onClick={handleAddNote} disabled={actionInProgress || !noteDraft.trim()}>Add</Button>
              </div>
              {detail.notes.length === 0 ? (
                <p className="text-xs text-on-surface-variant">No internal notes yet. Notes are only visible to your team.</p>
              ) : (
                <div className="space-y-2">
                  {detail.notes.map(note => (
                    <div key={note.id} className="bg-surface-container-low rounded-lg p-3">
                      <p className="text-sm">{note.content}</p>
                      <p className="text-[10px] text-on-surface-variant mt-1">{note.authorRecruiter.user.email} • {new Date(note.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Schedule interview modal */}
      <Modal isOpen={isScheduleOpen} onClose={() => setIsScheduleOpen(false)} title="Schedule Interview" size="md">
        <div className="space-y-4">
          <div>
            <label htmlFor="interview-title" className="text-xs font-bold text-on-surface-variant uppercase">Title</label>
            <input
              id="interview-title"
              value={interviewForm.title}
              onChange={(e) => setInterviewForm({ ...interviewForm, title: e.target.value })}
              placeholder="e.g. Technical Screen"
              className="w-full mt-1 px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-sm"
            />
          </div>
          <div>
            <label htmlFor="interview-datetime" className="text-xs font-bold text-on-surface-variant uppercase">Date & Time</label>
            <input
              id="interview-datetime"
              type="datetime-local"
              min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
              value={interviewForm.scheduledAt}
              onChange={(e) => setInterviewForm({ ...interviewForm, scheduledAt: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-sm"
            />
          </div>
          <div>
            <label htmlFor="interview-duration" className="text-xs font-bold text-on-surface-variant uppercase">Duration (minutes)</label>
            <input
              id="interview-duration"
              type="number"
              min={5}
              value={interviewForm.duration}
              onChange={(e) => setInterviewForm({ ...interviewForm, duration: parseInt(e.target.value, 10) || 0 })}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-sm"
            />
          </div>
          <div>
            <label htmlFor="interview-link" className="text-xs font-bold text-on-surface-variant uppercase">Meeting Link (optional)</label>
            <input
              id="interview-link"
              value={interviewForm.locationUrl}
              onChange={(e) => setInterviewForm({ ...interviewForm, locationUrl: e.target.value })}
              placeholder="https://meet.example.com/..."
              className="w-full mt-1 px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setIsScheduleOpen(false)} className="px-4 py-2 text-sm font-bold text-on-surface-variant hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 rounded">Cancel</button>
            <Button onClick={handleScheduleInterview} isLoading={actionInProgress}>Schedule</Button>
          </div>
        </div>
      </Modal>

      {/* Create offer modal */}
      <Modal isOpen={isOfferOpen} onClose={() => setIsOfferOpen(false)} title="Create Offer" size="md">
        <div className="space-y-4">
          <div>
            <label htmlFor="offer-title" className="text-xs font-bold text-on-surface-variant uppercase">Job Title</label>
            <input
              id="offer-title"
              value={offerForm.title}
              onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
              placeholder="e.g. Software Engineer II"
              className="w-full mt-1 px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="offer-salary" className="text-xs font-bold text-on-surface-variant uppercase">Annual Salary</label>
              <input
                id="offer-salary"
                type="number"
                min={1}
                value={offerForm.salary}
                onChange={(e) => setOfferForm({ ...offerForm, salary: e.target.value })}
                placeholder="120000"
                className="w-full mt-1 px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-sm"
              />
            </div>
            <div>
              <label htmlFor="offer-currency" className="text-xs font-bold text-on-surface-variant uppercase">Currency</label>
              <select
                id="offer-currency"
                value={offerForm.currency}
                onChange={(e) => setOfferForm({ ...offerForm, currency: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-sm"
              >
                {CURRENCY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="offer-start-date" className="text-xs font-bold text-on-surface-variant uppercase">Start Date</label>
            <input
              id="offer-start-date"
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={offerForm.startDate}
              onChange={(e) => setOfferForm({ ...offerForm, startDate: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-sm"
            />
          </div>
          <div>
            <label htmlFor="offer-notes" className="text-xs font-bold text-on-surface-variant uppercase">Notes (optional)</label>
            <textarea
              id="offer-notes"
              value={offerForm.notes}
              onChange={(e) => setOfferForm({ ...offerForm, notes: e.target.value })}
              rows={3}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setIsOfferOpen(false)} className="px-4 py-2 text-sm font-bold text-on-surface-variant hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 rounded">Cancel</button>
            <Button onClick={handleCreateOffer} isLoading={actionInProgress}>Extend Offer</Button>
          </div>
        </div>
      </Modal>
      {/* AI Candidate Comparison modal (Employer AI, Phase 4) */}
      <Modal isOpen={isCompareOpen} onClose={() => setIsCompareOpen(false)} title="AI Candidate Comparison" size="lg">
        {compareLoading ? (
          <div className="flex items-center justify-center gap-3 text-on-surface-variant py-12">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            Comparing candidates...
          </div>
        ) : compareError ? (
          <div className="flex flex-col items-center gap-3 text-center py-12">
            <span className="material-symbols-outlined text-error text-3xl">error</span>
            <p className="text-on-surface-variant text-sm">{compareError}</p>
          </div>
        ) : comparisonResult ? (
          <div className="space-y-4">
            <p className="text-sm text-on-surface-variant">{comparisonResult.overallRecommendation}</p>
            <div className="space-y-2">
              {[...comparisonResult.rankings].sort((a, b) => a.rank - b.rank).map(r => {
                const app = applications.find(a => a.id === r.candidateId);
                return (
                  <div key={r.candidateId} className="border border-outline-variant rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-primary dark:text-primary-fixed">
                        #{r.rank} {app ? `${app.studentProfile.firstName} ${app.studentProfile.lastName}` : r.candidateId}
                      </p>
                      <p className="text-xs text-on-surface-variant">{r.summary}</p>
                    </div>
                    <span className="text-lg font-bold text-primary shrink-0 ml-4">{r.fitScore}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Confirmation dialogs -- consistent app-styled dialogs instead of
          the browser's native window.confirm(), which is jarring, blocks
          the main thread, can't be styled, and looks unfinished next to the
          rest of the workflow. */}
      <Dialog
        isOpen={isRejectConfirmOpen}
        onClose={() => setIsRejectConfirmOpen(false)}
        title="Reject candidate?"
        description={detail ? `${detail.studentProfile.firstName} ${detail.studentProfile.lastName} will be notified that their application for ${detail.job.title} was not successful. This cannot be undone.` : ''}
        confirmLabel="Reject Application"
        confirmVariant="error"
        onConfirm={confirmReject}
        isLoading={actionInProgress}
      />

      <Dialog
        isOpen={isWithdrawConfirmOpen}
        onClose={() => setIsWithdrawConfirmOpen(false)}
        title="Withdraw this offer?"
        description="The candidate will be notified immediately that the offer has been withdrawn. This cannot be undone."
        confirmLabel="Withdraw Offer"
        confirmVariant="error"
        onConfirm={confirmWithdrawOffer}
        isLoading={actionInProgress}
      />
    </div>
  );
};

export default HiringPipelinePanel;
