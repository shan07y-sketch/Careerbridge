import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApplicationService } from '../../services';
import type { Application } from '../../types';
import { PageLayout } from '../../components/layout/PageLayout';
import { useToast } from '../../contexts/ToastContext';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

export const Applications: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);

  // Filter States
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'match'>('newest');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const loadApplications = async () => {
    try {
      setIsLoading(true);
      const items = await ApplicationService.getApplications();
      setApplications(items);
    } catch (err) {
      console.error('Failed to load applications', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleWithdraw = (appId: string) => {
    setApplications(prev => prev.filter(app => app.id !== appId));
    showToast('Application withdrawn successfully.', 'success');
  };

  // Filter & Sort Logic
  const filteredApps = useMemo(() => {
    let result = [...applications];

    // Status Filter
    if (selectedStatus !== 'All') {
      result = result.filter(app => app.status === selectedStatus.toLowerCase());
    }

    // Search Box
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        app =>
          app.jobTitle.toLowerCase().includes(q) ||
          app.companyName.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy === 'newest') {
      result.sort((a, b) => b.dateApplied.localeCompare(a.dateApplied));
    } else if (sortBy === 'match') {
      result.sort((a, b) => (b.applicationScore || 80) - (a.applicationScore || 80));
    }

    return result;
  }, [applications, selectedStatus, searchTerm, sortBy]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus, searchTerm, sortBy]);

  const paginatedApps = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredApps.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredApps, currentPage]);

  const totalPages = Math.ceil(filteredApps.length / itemsPerPage);

  // Statistics summaries
  const totalApplied = applications.length;
  const interviewingCount = applications.filter(a => a.status === 'interviewing').length || 2;
  const offerCount = applications.filter(a => a.status === 'offer').length || 1;
  const reviewCount = applications.filter(a => a.status === 'applied').length;
  const rejectedCount = applications.filter(a => a.status === 'rejected').length;

  return (
    <PageLayout fullWidth>
      <main className="px-8 py-12 min-h-screen text-left bg-[#f9faf7]">
        <div className="max-w-[1400px] mx-auto flex flex-col xl:flex-row gap-8">
          
          {/* Left Column: Applications Tracker Feed */}
          <div className="flex-grow space-y-6 max-w-[1000px]">
            
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-primary/5">
              <div>
                <h2 className="font-display text-headline-lg text-primary mb-2">My Applications</h2>
                <p className="font-body-lg text-on-surface-variant max-w-xl">Track every application, interview and offer from one place.</p>
              </div>

              <div className="flex gap-4">
                <div className="px-6 py-4 bg-white rounded-2xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5 text-center">
                  <p className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Applied</p>
                  <p className="text-xl text-primary font-extrabold">{totalApplied}</p>
                </div>
                
                <div className="px-6 py-4 bg-white rounded-2xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5 text-center">
                  <p className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Interviews</p>
                  <p className="text-xl text-primary font-extrabold">{interviewingCount}</p>
                </div>

                <div className="px-6 py-4 bg-primary text-white rounded-2xl shadow-lg text-center">
                  <p className="text-[10px] opacity-85 mb-1 uppercase tracking-wider">Offers</p>
                  <p className="text-xl font-extrabold">{offerCount}</p>
                </div>
              </div>
            </div>

            {/* Summary metrics Grid row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              
              <div className="p-4 bg-white rounded-2xl border border-primary/5 shadow-sm text-xs">
                <span className="material-symbols-outlined text-primary mb-2 text-lg">send</span>
                <p className="font-bold text-on-surface-variant">Applied</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-bold">{totalApplied}</span>
                  <span className="text-[10px] text-primary flex items-center font-bold">
                    <span className="material-symbols-outlined text-xs">trending_up</span> 12%
                  </span>
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-primary/5 shadow-sm text-xs">
                <span className="material-symbols-outlined text-primary mb-2 text-lg">visibility</span>
                <p className="font-bold text-on-surface-variant">Under Review</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-bold">{reviewCount}</span>
                  <span className="text-[10px] text-primary flex items-center font-bold">
                    <span className="material-symbols-outlined text-xs">trending_up</span> 4%
                  </span>
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-primary/5 shadow-sm text-xs">
                <span className="material-symbols-outlined text-secondary mb-2 text-lg">calendar_today</span>
                <p className="font-bold text-on-surface-variant">Interviews</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-bold">{interviewingCount}</span>
                  <span className="text-[10px] text-primary flex items-center font-bold">
                    <span className="material-symbols-outlined text-xs">trending_up</span> 100%
                  </span>
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-primary/5 shadow-sm text-xs">
                <span className="material-symbols-outlined text-primary-container mb-2 text-lg">emoji_events</span>
                <p className="font-bold text-on-surface-variant">Offers</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-bold">{offerCount}</span>
                  <span className="text-[10px] text-primary flex items-center font-bold">
                    <span className="material-symbols-outlined text-xs">trending_flat</span>
                  </span>
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-primary/5 shadow-sm text-xs">
                <span className="material-symbols-outlined text-error mb-2 text-lg">cancel</span>
                <p className="font-bold text-on-surface-variant">Rejected</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-bold">{rejectedCount}</span>
                  <span className="text-[10px] text-error flex items-center font-bold">
                    <span className="material-symbols-outlined text-xs">trending_down</span> 2%
                  </span>
                </div>
              </div>

            </div>

            {/* Filter controls row */}
            <div className="flex flex-col gap-4 bg-white p-5 rounded-2xl border border-primary/5 shadow-sm">
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
                <input 
                  type="text"
                  placeholder="Search applications by role or company name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:ring-2 focus:ring-primary/20 placeholder:text-on-surface-variant/60 outline-none text-on-surface dark:text-white"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                  {['All', 'Applied', 'Interviewing', 'Offer', 'Rejected'].map(status => {
                    const isActive = selectedStatus === status;
                    return (
                      <button
                        key={status}
                        onClick={() => setSelectedStatus(status)}
                        className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                          isActive 
                            ? 'bg-primary text-white border-transparent' 
                            : 'bg-white text-on-surface-variant border-primary/5 hover:bg-surface-container-high'
                        }`}
                      >
                        {status}
                      </button>
                    );
                  })}
                </div>

                <div className="text-xs font-bold text-primary">
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent border-none text-xs font-bold focus:ring-0 cursor-pointer p-1"
                  >
                    <option value="newest">Sort by: Newest</option>
                    <option value="match">AI Match</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submissions Cards Timeline List */}
            {isLoading ? (
              <div className="space-y-4">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : filteredApps.length === 0 ? (
              <EmptyState 
                icon="assignment"
                title="No applications"
                description={searchTerm ? "No applications match your search query." : "You have no submitted applications in this category."}
                actionLabel="Discover Jobs"
                onAction={() => navigate('/student/jobs')}
              />
            ) : (
              <div className="space-y-4">
                {paginatedApps.map(app => {
                  
                  // progress bar steps calculation
                  const statusColors = {
                    applied: 'w-1/4 bg-primary',
                    interviewing: 'w-1/2 bg-primary',
                    offer: 'w-full bg-primary',
                    rejected: 'w-full bg-error'
                  }[app.status] || 'w-1/4 bg-primary';

                  const timelineSteps = [
                    { label: 'Applied', date: 'Oct 12', active: true },
                    { label: 'Review', date: 'Oct 14', active: app.status !== 'applied' },
                    { label: 'Technical', date: '', active: app.status === 'interviewing' || app.status === 'offer' },
                    { label: 'HR Round', date: '', active: app.status === 'offer' },
                    { label: 'Offer', date: '', active: app.status === 'offer' }
                  ];

                  return (
                    <div 
                      key={app.id}
                      className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5 hover:shadow-md transition-all text-xs"
                    >
                      <div className="flex flex-col md:flex-row gap-6 mb-8 text-left">
                        <div className="w-16 h-16 rounded-xl bg-surface-container-low flex items-center justify-center p-2 border border-primary/5 shrink-0 overflow-hidden">
                          {app.companyLogo ? (
                            <img className="w-full h-full object-contain" alt={app.companyName} src={app.companyLogo} />
                          ) : (
                            <span className="material-symbols-outlined text-outline text-2xl">business</span>
                          )}
                        </div>

                        <div className="flex-grow">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-headline-md text-primary font-bold text-[18px] leading-tight">{app.jobTitle}</h3>
                              <p className="text-xs font-semibold text-on-surface-variant mt-0.5">{app.companyName} • London, UK (Remote)</p>
                            </div>
                            
                            <div className="flex items-center gap-2 px-3 py-1 bg-primary-fixed text-on-primary-fixed rounded-lg font-bold text-[10px]">
                              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                              98% AI Match
                            </div>
                          </div>

                          <div className="flex gap-4 mt-4 font-semibold text-on-surface-variant">
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">payments</span> £85,000 - £110,000</span>
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">schedule</span> Applied {app.dateApplied}</span>
                          </div>
                        </div>
                      </div>

                      {/* Interactive Progress timeline tracker HUD */}
                      <div className="relative flex items-center justify-between mb-8 px-4">
                        <div className="absolute left-8 right-8 h-0.5 bg-surface-container-highest top-4 -z-10" />
                        <div className={`absolute left-8 h-0.5 top-4 -z-10 transition-all duration-300 ${statusColors}`} style={{ width: '80%' }} />
                        
                        {timelineSteps.map((step, idx) => (
                          <div key={idx} className="flex flex-col items-center gap-1 text-center w-20">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                              step.active 
                                ? 'bg-primary text-white font-bold' 
                                : 'bg-surface-container-highest text-outline font-semibold'
                            }`}>
                              {step.active ? (
                                <span className="material-symbols-outlined text-sm">check</span>
                              ) : null}
                            </div>
                            <p className={`text-[10px] uppercase font-bold ${step.active ? 'text-primary' : 'text-on-surface-variant opacity-70'}`}>
                              {step.label}
                            </p>
                            {step.date && (
                              <p className="text-[9px] text-on-surface-variant opacity-70">{step.date}</p>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Collapsible Details Drawer */}
                      {expandedAppId === app.id && (
                        <div className="mt-6 pt-6 border-t border-primary/5 grid grid-cols-1 md:grid-cols-2 gap-6 text-left animate-fade-in">
                          <div className="space-y-4">
                            <div>
                              <p className="text-[10px] text-outline uppercase font-bold tracking-wider">Recruiter Activity & Notes</p>
                              <div className="bg-surface-container-low p-3 rounded-lg mt-1 font-semibold text-on-surface leading-relaxed">
                                <p className="text-primary font-bold">Recruiter: Sarah Jenkins</p>
                                <p className="text-on-surface-variant mt-1 text-[11px]">"Strong match on TypeScript and React. Checked ATS formatting index: 92%. Awaiting technical assessment response."</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-[11px] font-bold">
                              <div className="p-3 bg-surface-container-low rounded-lg">
                                <p className="text-[9px] uppercase text-outline">Expected Response</p>
                                <p className="text-primary mt-1">Oct 28 (5 days left)</p>
                              </div>
                              <div className="p-3 bg-surface-container-low rounded-lg">
                                <p className="text-[9px] uppercase text-outline">Resume Viewed</p>
                                <p className="text-green-600 mt-1 flex items-center gap-0.5">
                                  <span className="material-symbols-outlined text-xs">check_circle</span> Yes
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <p className="text-[10px] text-outline uppercase font-bold tracking-wider">Interview Preparation</p>
                              <div className="bg-primary/5 p-3 rounded-lg mt-1 space-y-2">
                                <div className="flex justify-between font-bold">
                                  <span>Prep Progress</span>
                                  <span className="text-primary">81% Complete</span>
                                </div>
                                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                                  <div className="bg-primary h-full w-[81%]" />
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-[11px] font-bold">
                              <div className="p-3 bg-surface-container-low rounded-lg">
                                <p className="text-[9px] uppercase text-outline">Missing Documents</p>
                                <p className="text-on-surface-variant mt-1 font-semibold">None (All Clear)</p>
                              </div>
                              <div className="p-3 bg-[#e9dfc8] text-[#4c4635] rounded-lg">
                                <p className="text-[9px] uppercase text-secondary">AI Recommendation</p>
                                <p className="text-secondary mt-1">Complete SQL quiz</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Bottom action triggers */}
                      <div className="flex gap-3 mt-6 pt-4 border-t border-primary/5">
                        <button 
                          onClick={() => setExpandedAppId(expandedAppId === app.id ? null : app.id)}
                          className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold cursor-pointer border-none text-[11px]"
                        >
                          {expandedAppId === app.id ? 'Hide Details' : 'View Tracker Details'}
                        </button>
                        <button 
                          onClick={() => navigate(`/student/jobs/${app.jobId}`)}
                          className="px-6 py-2.5 bg-surface-container-high text-primary rounded-xl font-bold cursor-pointer border-none text-[11px]"
                        >
                          Job Description
                        </button>
                        <button 
                          onClick={() => navigate('/student/messages')}
                          className="px-6 py-2.5 bg-secondary-container/40 text-primary rounded-xl font-bold cursor-pointer border-none text-[11px]"
                        >
                          Message Recruiter
                        </button>
                        <button 
                          onClick={() => handleWithdraw(app.id)}
                          className="px-6 py-2.5 text-error rounded-xl font-bold hover:bg-error/5 transition-colors ml-auto cursor-pointer bg-transparent border-none text-[11px]"
                        >
                          Withdraw
                        </button>
                      </div>

                    </div>
                  );
                })}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4 pt-8 text-xs font-bold">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-white rounded-xl border border-primary/5 shadow-sm text-on-surface-variant hover:text-primary disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      Previous
                    </button>
                    <span className="text-on-surface-variant">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-white rounded-xl border border-primary/5 shadow-sm text-on-surface-variant hover:text-primary disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Right Column: Side Intelligence Panel */}
          <aside className="w-80 space-y-6 hidden xl:block shrink-0 text-xs text-left">
            
            {/* Upcoming Interviews schedule */}
            <div className="bg-white p-6 rounded-2xl border border-primary/5 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-bold text-primary uppercase tracking-widest text-[11px]">Interviews</h4>
                <span className="px-2 py-1 bg-primary/10 text-primary rounded text-[9px] font-bold">2 TODAY</span>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-surface-container-low rounded-xl border-l-4 border-primary">
                  <p className="text-[10px] text-primary font-bold mb-1">DesignStream</p>
                  <p className="font-bold text-sm mb-3">Technical Presentation</p>
                  
                  <div className="flex items-center gap-3 text-on-surface-variant font-semibold mb-4">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">event</span> Today</span>
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">alarm</span> 14:00</span>
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">videocam</span> Zoom</span>
                  </div>

                  <div className="flex items-center gap-2 mb-4 font-bold text-primary">
                    <div className="flex-1 h-1 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="bg-primary h-full w-[81%]" />
                    </div>
                    <span className="text-[9px]">Readiness: 81%</span>
                  </div>

                  <button 
                    onClick={() => showToast('Opening Zoom presentation console...', 'success')}
                    className="w-full py-2 bg-primary text-white rounded-lg font-bold cursor-pointer border-none text-[11px]"
                  >
                    Join Meeting
                  </button>
                </div>

                <div className="p-4 bg-white rounded-xl border border-primary/5 font-bold">
                  <p className="text-on-surface-variant mb-1">Innovate Corp</p>
                  <p className="text-primary text-sm mb-3">Culture Fit Interview</p>
                  <div className="flex items-center gap-3 text-on-surface-variant font-semibold">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">event</span> Tomorrow</span>
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">alarm</span> 10:30</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Career Tip card */}
            <div className="bg-primary-container text-white rounded-2xl p-6 relative overflow-hidden text-left">
              <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-8xl opacity-10 rotate-12">tips_and_updates</span>
              <p className="opacity-70 mb-2 uppercase tracking-wider text-[10px] font-bold">Today's Tip</p>
              <h4 className="font-bold text-sm mb-3">Quantify your impact.</h4>
              <p className="opacity-80 leading-relaxed mb-4 font-medium">
                Instead of "Managed social media," try "Increased social media engagement by 40% through targeted content strategy."
              </p>
              <button 
                onClick={() => showToast('Opening professional development tips resources...', 'info')}
                className="font-bold underline underline-offset-4 cursor-pointer bg-transparent border-none text-white text-[11px]"
              >
                Read full guide
              </button>
            </div>

            {/* Pending actions checklist items */}
            <div className="bg-white p-6 rounded-2xl border border-primary/5 shadow-sm">
              <h4 className="font-bold text-primary uppercase tracking-widest mb-6 text-[11px]">Pending Actions</h4>
              
              <div className="space-y-4">
                <div 
                  onClick={() => showToast('Offer accepted! Compiling hiring contract packages...', 'success')}
                  className="flex items-center gap-4 group cursor-pointer p-2 rounded-xl border-2 border-primary/20 bg-primary/5"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-xl">edit_note</span>
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-primary truncate">Accept Offer</p>
                      <span className="px-1.5 py-0.5 bg-error text-white text-[8px] font-bold rounded uppercase shrink-0">Due Today</span>
                    </div>
                    <p className="text-[10px] text-on-surface-variant font-semibold truncate">CloudNexus deadline in 2 hours</p>
                  </div>
                  <span className="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 transition-opacity text-sm shrink-0">arrow_forward_ios</span>
                </div>

                <div 
                  onClick={() => showToast('Uploading portfolio documentation file...', 'info')}
                  className="flex items-center gap-4 group cursor-pointer p-2 rounded-xl border border-transparent hover:bg-surface-container"
                >
                  <div className="w-10 h-10 rounded-lg bg-secondary-container/40 flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined text-xl">description</span>
                  </div>
                  <div className="flex-grow min-w-0 font-bold">
                    <p className="text-primary truncate">Upload Portfolio</p>
                    <p className="text-[10px] text-on-surface-variant font-medium truncate mt-0.5">Required for DesignStream application</p>
                  </div>
                  <span className="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 transition-opacity text-sm shrink-0">arrow_forward_ios</span>
                </div>
              </div>
            </div>

            {/* AI suggestions box */}
            <div className="bg-white p-6 rounded-2xl border-2 border-primary/5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary">auto_awesome</span>
                <h4 className="font-bold text-primary uppercase tracking-widest text-[11px]">AI Suggestions</h4>
              </div>

              <div className="flex flex-col gap-2 font-bold text-on-surface">
                <button onClick={() => navigate('/student/network')} className="flex items-center justify-between w-full p-3 bg-surface-container-low hover:bg-primary/5 rounded-xl transition-colors cursor-pointer border-none text-[11px] text-left">
                  <span>Practice SQL</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
                <button onClick={() => navigate('/student/resume-analyzer')} className="flex items-center justify-between w-full p-3 bg-surface-container-low hover:bg-primary/5 rounded-xl transition-colors cursor-pointer border-none text-[11px] text-left">
                  <span>Resume Analysis</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
                <button onClick={() => navigate('/student/mock-interview')} className="flex items-center justify-between w-full p-3 bg-surface-container-low hover:bg-primary/5 rounded-xl transition-colors cursor-pointer border-none text-[11px] text-left">
                  <span>Mock Interview</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>

          </aside>

        </div>
      </main>
    </PageLayout>
  );
};

export default Applications;
