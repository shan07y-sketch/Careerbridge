import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApplicationService } from '../../services';
import type { Application } from '../../types';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { Section } from '../../components/ui/Section';
import { Toolbar, FilterChip } from '../../components/ui/Toolbar';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, statusTone } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/Progress';
import { useToast } from '../../contexts/ToastContext';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Dialog } from '../../components/ui/Dialog';
import { exportApplicationsCSV } from '../../utils/exportUtils';

type StatusFilter = 'All' | 'Applied' | 'Interviewing' | 'Offer' | 'Rejected';
const STATUS_FILTERS: StatusFilter[] = ['All', 'Applied', 'Interviewing', 'Offer', 'Rejected'];

/** Stage progress derived purely from the real application status. */
const STAGE_ORDER = ['applied', 'interviewing', 'offer'];
const stageProgress = (status: Application['status']): number => {
  if (status === 'rejected') return 100;
  const idx = STAGE_ORDER.indexOf(status);
  return idx < 0 ? 0 : Math.round(((idx + 1) / STAGE_ORDER.length) * 100);
};

export const Applications: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);

  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'match'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const loadApplications = async () => {
    try {
      setIsLoading(true);
      setError(false);
      const items = await ApplicationService.getApplications();
      setApplications(items);
    } catch (err) {
      console.error('Failed to load applications', err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadApplications(); }, []);
  useEffect(() => { setCurrentPage(1); }, [selectedStatus, searchTerm, sortBy]);

  const [offerActionId, setOfferActionId] = useState<string | null>(null);
  const [withdrawTargetId, setWithdrawTargetId] = useState<string | null>(null);
  const [declineTargetId, setDeclineTargetId] = useState<string | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  const confirmWithdraw = async () => {
    if (!withdrawTargetId) return;
    setIsWithdrawing(true);
    try {
      await ApplicationService.retractApplication(withdrawTargetId);
      setApplications(prev => prev.filter(app => app.id !== withdrawTargetId));
      showToast('Application withdrawn successfully.', 'success');
      setWithdrawTargetId(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not withdraw application.', 'error');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleAcceptOffer = async (appId: string) => {
    setOfferActionId(appId);
    try {
      await ApplicationService.acceptOffer(appId);
      showToast('Offer accepted! Congratulations.', 'success');
      await loadApplications();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not accept offer.', 'error');
    } finally {
      setOfferActionId(null);
    }
  };

  const confirmDeclineOffer = async () => {
    if (!declineTargetId) return;
    setIsDeclining(true);
    setOfferActionId(declineTargetId);
    try {
      await ApplicationService.declineOffer(declineTargetId);
      showToast('Offer declined.', 'success');
      setDeclineTargetId(null);
      await loadApplications();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not decline offer.', 'error');
    } finally {
      setIsDeclining(false);
      setOfferActionId(null);
    }
  };

  const pendingOffers = applications.filter(app => app.offer?.status === 'EXTENDED');
  const upcomingInterviews = applications
    .flatMap(app => (app.interviews || []).map(iv => ({ ...iv, app })))
    .filter(iv => iv.status === 'SCHEDULED' && new Date(iv.scheduledAt).getTime() > Date.now())
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const filteredApps = useMemo(() => {
    let result = [...applications];
    if (selectedStatus !== 'All') result = result.filter(app => app.status === selectedStatus.toLowerCase());
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(app =>
        app.jobTitle.toLowerCase().includes(q) || app.companyName.toLowerCase().includes(q));
    }
    if (sortBy === 'newest') result.sort((a, b) => b.dateApplied.localeCompare(a.dateApplied));
    else result.sort((a, b) => (b.applicationScore ?? 0) - (a.applicationScore ?? 0));
    return result;
  }, [applications, selectedStatus, searchTerm, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredApps.length / itemsPerPage));
  const paginatedApps = useMemo(
    () => filteredApps.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [filteredApps, currentPage]);

  const totalApplied = applications.length;
  const activeCount = applications.filter(a => a.status === 'applied' || a.status === 'interviewing').length;
  const interviewingCount = applications.filter(a => a.status === 'interviewing').length;
  const offerCount = applications.filter(a => a.status === 'offer').length;
  const countFor = (s: StatusFilter) =>
    s === 'All' ? applications.length : applications.filter(a => a.status === s.toLowerCase()).length;

  return (
    <PageLayout searchPlaceholder="Search applications…">
      <PageHeader
        title="My applications"
        description="Track every application, interview and offer from one place."
        actions={
          <>
            <Button variant="outline" disabled={filteredApps.length === 0}
              onClick={() => { exportApplicationsCSV(filteredApps); showToast('Applications exported to CSV.', 'success'); }}
              leftIcon={<span className="material-symbols-outlined text-[19px]">download</span>}>
              Export
            </Button>
            <Button variant="primary" onClick={() => navigate('/student/jobs')}
              leftIcon={<span className="material-symbols-outlined text-[19px]">work</span>}>
              Find jobs
            </Button>
          </>
        }
      />

      <div className="space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard label="Total applied" value={totalApplied} icon="send" hint="all time" />
          <StatCard label="Active" value={activeCount} icon="pending_actions" hint="in progress" onClick={() => setSelectedStatus('Applied')} />
          <StatCard label="Interviewing" value={interviewingCount} icon="videocam" hint="scheduled or in review" onClick={() => setSelectedStatus('Interviewing')} />
          <StatCard label="Offers" value={offerCount} icon="handshake" hint={offerCount > 0 ? 'Congratulations!' : 'keep going'} onClick={() => setSelectedStatus('Offer')} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-4">
            <Toolbar
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="Search by role or company…"
              filters={STATUS_FILTERS.map(s => (
                <FilterChip key={s} active={selectedStatus === s} onClick={() => setSelectedStatus(s)} count={countFor(s)}>{s}</FilterChip>
              ))}
              actions={
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'newest' | 'match')}
                  className="h-10 px-3 rounded-xl border border-outline-variant/70 bg-surface-container-lowest text-label-md font-semibold text-on-surface focus:border-primary/40 focus:ring-0 outline-none cursor-pointer"
                  aria-label="Sort applications">
                  <option value="newest">Newest</option>
                  <option value="match">Application score</option>
                </select>
              }
            />

            {isLoading ? (
              <div className="grid gap-4">{[0, 1, 2].map(i => <CardSkeleton key={i} />)}</div>
            ) : error ? (
              <EmptyState icon="cloud_off" title="Couldn't load applications"
                description="We hit a problem reaching the applications service. Please try again."
                actionLabel="Retry" onAction={loadApplications} />
            ) : filteredApps.length === 0 ? (
              <EmptyState icon="assignment"
                title={applications.length === 0 ? 'No applications yet' : 'No applications match your filters'}
                description={applications.length === 0
                  ? 'When you apply to a role it appears here with a live status timeline. Browse open jobs to get started.'
                  : 'Try a different status filter or clear your search.'}
                actionLabel={applications.length === 0 ? 'Browse jobs' : 'Show all'}
                onAction={applications.length === 0 ? () => navigate('/student/jobs') : () => { setSelectedStatus('All'); setSearchTerm(''); }} />
            ) : (
              <div className="space-y-4">
                {paginatedApps.map(app => {
                  const timeline = app.timeline && app.timeline.length > 0 ? app.timeline : null;
                  const isExpanded = expandedAppId === app.id;
                  return (
                    <Card key={app.id} className="!p-6">
                      <div className="flex gap-4">
                        <div className="w-14 h-14 rounded-xl bg-surface-container flex items-center justify-center p-2 shrink-0 overflow-hidden">
                          {app.companyLogo
                            ? <img className="w-full h-full object-contain" alt={app.companyName} src={app.companyLogo} />
                            : <span className="material-symbols-outlined text-on-surface-variant text-2xl">business</span>}
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="text-body-lg font-semibold text-on-surface truncate">{app.jobTitle}</h3>
                              <p className="text-label-md text-on-surface-variant mt-0.5 truncate">{app.companyName}</p>
                            </div>
                            <Badge tone={statusTone(app.status)}>{app.status.charAt(0).toUpperCase() + app.status.slice(1)}</Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 mt-2 text-label-sm text-on-surface-variant">
                            <span className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">schedule</span>Applied {app.dateApplied}</span>
                            {typeof app.applicationScore === 'number' && (
                              <span className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">bolt</span>{app.applicationScore}% match</span>
                            )}
                            {app.expectedResponseDate && (
                              <span className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">event_upcoming</span>Response by {app.expectedResponseDate}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <ProgressBar value={stageProgress(app.status)} tone={app.status === 'rejected' ? 'bg-error' : 'bg-primary'} />
                      </div>

                      {isExpanded && (
                        <div className="mt-5 pt-5 border-t border-outline-variant/60 space-y-4 animate-fade-in">
                          {timeline ? (
                            <div>
                              <p className="text-label-sm font-semibold text-on-surface-variant uppercase tracking-wide mb-3">Status timeline</p>
                              <ol className="space-y-3">
                                {timeline.map((step, idx) => (
                                  <li key={idx} className="flex gap-3">
                                    <span className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${step.active ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}>
                                      <span className="material-symbols-outlined text-[15px]">{step.active ? 'check' : 'radio_button_unchecked'}</span>
                                    </span>
                                    <div>
                                      <p className="text-label-md font-semibold text-on-surface">{step.stage}{step.date ? <span className="text-on-surface-variant font-normal"> · {step.date}</span> : null}</p>
                                      {step.description && <p className="text-label-sm text-on-surface-variant mt-0.5">{step.description}</p>}
                                    </div>
                                  </li>
                                ))}
                              </ol>
                            </div>
                          ) : (
                            <p className="text-label-md text-on-surface-variant">No detailed timeline recorded for this application yet.</p>
                          )}
                          {app.recruiterName && (
                            <p className="text-label-md text-on-surface-variant">Recruiter: <span className="font-semibold text-on-surface">{app.recruiterName}</span></p>
                          )}
                          {app.missingDocuments && app.missingDocuments.length > 0 && (
                            <p className="text-label-md text-warning">Missing documents: {app.missingDocuments.join(', ')}</p>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-outline-variant/60">
                        <Button size="sm" variant="secondary" onClick={() => setExpandedAppId(isExpanded ? null : app.id)}>
                          {isExpanded ? 'Hide details' : 'View details'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/student/jobs/${app.jobId}`)}>Job description</Button>
                        <Button size="sm" variant="ghost" onClick={() => navigate('/student/messages')}>Message recruiter</Button>
                        <Button size="sm" variant="ghost" className="!text-error ml-auto" onClick={() => setWithdrawTargetId(app.id)}>Withdraw</Button>
                      </div>
                    </Card>
                  );
                })}

                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4 pt-6">
                    <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}>Previous</Button>
                    <span className="text-label-md font-semibold text-on-surface-variant">Page {currentPage} of {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}>Next</Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Side panel — real, backend-derived data only */}
          <div className="space-y-8">
            <Section title="Pending offers" description={pendingOffers.length ? `${pendingOffers.length} awaiting your decision` : undefined}>
              {pendingOffers.length === 0 ? (
                <Card><p className="text-label-md text-on-surface-variant">No offers awaiting a decision right now.</p></Card>
              ) : (
                <div className="space-y-3">
                  {pendingOffers.map(app => (
                    <Card key={app.id} className="!p-4 border-primary/30">
                      <p className="text-label-md font-semibold text-on-surface truncate">{app.offer?.title}</p>
                      <p className="text-label-sm text-on-surface-variant truncate mt-0.5">
                        {app.companyName}{app.offer?.salary ? ` · ${app.offer?.currency} ${app.offer.salary.toLocaleString()}` : ''}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="primary" className="flex-1" disabled={offerActionId === app.id} onClick={() => handleAcceptOffer(app.id)}>
                          {offerActionId === app.id ? 'Working…' : 'Accept'}
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1" disabled={offerActionId === app.id} onClick={() => setDeclineTargetId(app.id)}>Decline</Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Section>

            <Section title="Upcoming interviews" description={upcomingInterviews.length ? `${upcomingInterviews.length} scheduled` : undefined}>
              {upcomingInterviews.length === 0 ? (
                <Card><p className="text-label-md text-on-surface-variant">No interviews scheduled yet. They'll show here once a recruiter books one.</p></Card>
              ) : (
                <div className="space-y-3">
                  {upcomingInterviews.slice(0, 4).map(iv => (
                    <Card key={iv.id} className="!p-4">
                      <p className="text-label-sm text-primary font-semibold">{iv.app.companyName}</p>
                      <p className="text-label-md font-semibold text-on-surface mt-0.5">{iv.title}</p>
                      <div className="flex items-center gap-3 mt-2 text-label-sm text-on-surface-variant flex-wrap">
                        <span className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-[15px]">event</span>{new Date(iv.scheduledAt).toLocaleDateString()}</span>
                        <span className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-[15px]">alarm</span>{new Date(iv.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Section>

            <Card>
              <CardHeader icon="explore" title="Keep building" subtitle="Strengthen your candidacy" />
              <div className="flex flex-col gap-2">
                <Button variant="ghost" className="!justify-between" onClick={() => navigate('/student/mock-interview')}>Practice a mock interview<span className="material-symbols-outlined text-[18px]">arrow_forward</span></Button>
                <Button variant="ghost" className="!justify-between" onClick={() => navigate('/student/profile')}>Review your profile<span className="material-symbols-outlined text-[18px]">arrow_forward</span></Button>
                <Button variant="ghost" className="!justify-between" onClick={() => navigate('/student/career-report')}>Open career report<span className="material-symbols-outlined text-[18px]">arrow_forward</span></Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Dialog isOpen={!!withdrawTargetId} onClose={() => setWithdrawTargetId(null)}
        title="Withdraw this application?"
        description="The recruiter will be notified and this cannot be undone. You'll need to reapply if you change your mind."
        confirmLabel="Withdraw application" confirmVariant="error" onConfirm={confirmWithdraw} isLoading={isWithdrawing} />

      <Dialog isOpen={!!declineTargetId} onClose={() => setDeclineTargetId(null)}
        title="Decline this offer?"
        description="This cannot be undone. The recruiter will be notified that you've declined."
        confirmLabel="Decline offer" confirmVariant="error" onConfirm={confirmDeclineOffer} isLoading={isDeclining} />
    </PageLayout>
  );
};

export default Applications;
