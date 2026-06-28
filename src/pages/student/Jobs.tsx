import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { JobService } from '../../services';
import type { Job } from '../../types';
import { PageLayout } from '../../components/layout/PageLayout';
import { useToast } from '../../contexts/ToastContext';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

export const Jobs: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [activeWorkMode, setActiveWorkMode] = useState<'All' | 'Remote' | 'Hybrid' | 'On-site'>('All');
  const [easyApplyFilter, setEasyApplyFilter] = useState(false);
  const [aiMatchFilterOnly, setAiMatchFilterOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'match' | 'newest' | 'salary' | 'deadline'>('match');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const fetchJobsData = async () => {
    try {
      setIsLoading(true);
      const items = await JobService.getJobs();
      setJobs(items);

      const saved = await JobService.getSavedJobs();
      setSavedJobIds(saved.map(j => j.id));
    } catch (err) {
      console.error('Failed to load opportunities list', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobsData();
  }, []);

  const handleToggleSave = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const isSaved = await JobService.toggleSaveJob(jobId);
      if (isSaved) {
        setSavedJobIds(prev => [...prev, jobId]);
        showToast('Opportunity bookmarked successfully!', 'success');
      } else {
        setSavedJobIds(prev => prev.filter(id => id !== jobId));
        showToast('Opportunity removed from bookmarks.', 'success');
      }
    } catch (err) {
      showToast('Failed to bookmark job.', 'error');
    }
  };

  const handleApply = (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/student/jobs/${jobId}`);
  };

  // Filtering Pipeline
  const filteredJobs = useMemo(() => {
    let result = [...jobs];

    // Search query matches
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        j =>
          j.title.toLowerCase().includes(q) ||
          j.companyName.toLowerCase().includes(q) ||
          j.description.toLowerCase().includes(q)
      );
    }

    // Work Mode
    if (activeWorkMode !== 'All') {
      result = result.filter(j => j.workMode === activeWorkMode);
    }

    // Easy Apply
    if (easyApplyFilter) {
      result = result.filter(j => j.easyApply);
    }

    // AI Match Threshold (85%+)
    if (aiMatchFilterOnly) {
      result = result.filter(j => j.matchRate >= 85);
    }

    // Sorting
    if (sortBy === 'match') {
      result.sort((a, b) => b.matchRate - a.matchRate);
    } else if (sortBy === 'newest') {
      result.sort((a, b) => b.postedTime.localeCompare(a.postedTime));
    } else if (sortBy === 'salary') {
      const getSalaryNum = (range: string) => {
        const matches = range.replace('$', '').replace(/k/g, '').split('-');
        return matches.length > 0 ? parseInt(matches[0].trim()) : 0;
      };
      result.sort((a, b) => getSalaryNum(b.salaryRange) - getSalaryNum(a.salaryRange));
    } else if (sortBy === 'deadline') {
      result.sort((a, b) => (a.deadline || '').localeCompare(b.deadline || ''));
    }

    return result;
  }, [jobs, searchTerm, activeWorkMode, easyApplyFilter, aiMatchFilterOnly, sortBy]);

  // Pagination details
  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredJobs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredJobs, currentPage]);

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);

  return (
    <PageLayout fullWidth>
      <main className="px-8 py-12 min-h-screen text-left bg-[#f9faf7]">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Main Feed Content */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Page Header */}
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-headline-lg text-primary">Discover Opportunities</h2>
                <p className="text-body-md text-on-surface-variant mt-1">Our AI analyzes your unique career DNA to find the perfect match.</p>
              </div>

              <div className="flex gap-4">
                <div className="text-center px-4">
                  <p className="text-headline-md font-bold text-primary">{jobs.length}</p>
                  <p className="text-[10px] uppercase font-bold text-outline">Total Jobs</p>
                </div>
                <div className="text-center px-4 border-x border-outline-variant/30">
                  <p className="text-headline-md font-bold text-primary">{jobs.filter(j => j.matchRate >= 85).length}</p>
                  <p className="text-[10px] uppercase font-bold text-outline">Matches</p>
                </div>
                <div className="text-center px-4">
                  <p className="text-headline-md font-bold text-primary-container bg-primary-fixed px-2 rounded-md">2</p>
                  <p className="text-[10px] uppercase font-bold text-outline">New Today</p>
                </div>
              </div>
            </section>

            {/* AI Match Summary Dashboard Panel */}
            <section className="relative overflow-hidden bg-primary-container text-white rounded-2xl p-8 shadow-xl group">
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary-fixed/20 rounded-full blur-3xl group-hover:bg-primary-fixed/30 transition-all duration-700" />
              
              <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    <span className="text-label-md font-bold tracking-widest uppercase text-xs">Career Insights</span>
                  </div>
                  <h3 className="font-display text-headline-lg mb-2">92 jobs match your profile</h3>
                  <p className="text-primary-fixed/80 text-xs leading-relaxed">Your current resume shows strong alignment with senior engineering roles at top-tier tech firms.</p>
                </div>

                <div className="flex flex-col items-center md:items-end">
                  <div className="grid grid-cols-2 gap-3 mb-6 w-full text-xs">
                    <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                      <p className="text-[9px] uppercase tracking-wider text-primary-fixed/70">Resume Strength</p>
                      <p className="text-lg font-bold">87%</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                      <p className="text-[9px] uppercase tracking-wider text-primary-fixed/70">Top Role</p>
                      <p className="text-xs font-bold truncate">Frontend Engineer</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl col-span-2">
                      <p className="text-[9px] uppercase tracking-wider text-primary-fixed/70">Next Skill to Learn</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="material-symbols-outlined text-primary-fixed text-[18px]">terminal</span>
                        <p className="font-bold">Docker</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full text-xs font-bold">
                    <button onClick={() => showToast('Starting SQL matching learning path...', 'success')} className="flex-1 py-2.5 bg-primary-fixed text-primary rounded-xl hover:bg-white transition-colors cursor-pointer border-none uppercase text-[10px]">Improve My Match</button>
                    <button onClick={() => navigate('/student/resume-analyzer')} className="flex-1 py-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 backdrop-blur-sm transition-colors cursor-pointer border-none uppercase text-[10px]">Analyze Resume</button>
                  </div>
                </div>
              </div>
            </section>

            {/* Filters Row Options */}
            <section className="flex flex-col gap-4 bg-white p-6 rounded-2xl border border-primary/5 shadow-sm">
              <div className="relative group mb-2">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
                <input 
                  type="text"
                  placeholder="Search for roles, companies, or specific technologies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-full py-2.5 pl-10 pr-4 text-xs focus:ring-2 focus:ring-primary/20 placeholder:text-on-surface-variant/60 outline-none text-on-surface dark:text-white"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => {
                    setActiveWorkMode('All');
                    setEasyApplyFilter(false);
                    setAiMatchFilterOnly(false);
                  }}
                  className="px-4 py-2 bg-primary text-white rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer border-none shadow"
                >
                  <span className="material-symbols-outlined text-[16px]">tune</span> Reset Filters
                </button>

                <button 
                  onClick={() => setActiveWorkMode(prev => prev === 'Remote' ? 'All' : 'Remote')}
                  className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                    activeWorkMode === 'Remote' 
                      ? 'bg-secondary-container text-secondary border-transparent' 
                      : 'bg-secondary-container/20 text-secondary border-secondary-container/40 hover:bg-secondary-container/40'
                  }`}
                >
                  Remote
                </button>

                <button 
                  onClick={() => setActiveWorkMode(prev => prev === 'Hybrid' ? 'All' : 'Hybrid')}
                  className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                    activeWorkMode === 'Hybrid' 
                      ? 'bg-secondary-container text-secondary border-transparent' 
                      : 'bg-secondary-container/20 text-secondary border-secondary-container/40 hover:bg-secondary-container/40'
                  }`}
                >
                  Hybrid
                </button>

                <button 
                  onClick={() => setAiMatchFilterOnly(prev => !prev)}
                  className={`px-4 py-2 rounded-full text-xs font-bold border flex items-center gap-1 transition-colors cursor-pointer ${
                    aiMatchFilterOnly 
                      ? 'bg-[#023629] text-white border-transparent' 
                      : 'bg-primary-fixed/20 text-primary-container border-primary-fixed/40'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">stars</span> AI Match
                </button>

                <button 
                  onClick={() => setEasyApplyFilter(prev => !prev)}
                  className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                    easyApplyFilter 
                      ? 'bg-secondary-container text-secondary border-transparent' 
                      : 'bg-secondary-container/20 text-secondary border-secondary-container/40 hover:bg-secondary-container/40'
                  }`}
                >
                  Easy Apply
                </button>
              </div>

              {/* Sort By selectors */}
              <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10 text-xs font-bold text-outline">
                <span>Sort by:</span>
                <div className="flex gap-4">
                  <button onClick={() => setSortBy('match')} className={`pb-1 cursor-pointer bg-transparent border-none ${sortBy === 'match' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'}`}>Best Match</button>
                  <button onClick={() => setSortBy('newest')} className={`pb-1 cursor-pointer bg-transparent border-none ${sortBy === 'newest' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'}`}>Newest</button>
                  <button onClick={() => setSortBy('salary')} className={`pb-1 cursor-pointer bg-transparent border-none ${sortBy === 'salary' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'}`}>Highest Salary</button>
                  <button onClick={() => setSortBy('deadline')} className={`pb-1 cursor-pointer bg-transparent border-none ${sortBy === 'deadline' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'}`}>Deadline Soon</button>
                </div>
              </div>
            </section>

            {/* Jobs List Grid Output */}
            <section className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
              ) : paginatedJobs.length === 0 ? (
                <EmptyState 
                  icon="search_off"
                  title="No matches found"
                  description="Try clearing your search terms or expanding filter requirements."
                  actionLabel="Clear Filters"
                  onAction={() => {
                    setSearchTerm('');
                    setActiveWorkMode('All');
                    setEasyApplyFilter(false);
                    setAiMatchFilterOnly(false);
                  }}
                />
              ) : (
                <div className="space-y-4">
                  {paginatedJobs.map(job => {
                    const isSaved = savedJobIds.includes(job.id);
                    return (
                      <div 
                        key={job.id}
                        onClick={(e) => handleApply(job.id, e)}
                        className="bg-white border border-primary/5 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all hover:border-primary/20 group cursor-pointer text-left"
                      >
                        <div className="flex flex-col md:flex-row gap-6">
                          
                          {/* Logo */}
                          <div className="w-16 h-16 rounded-2xl bg-white shadow-inner flex items-center justify-center p-3 shrink-0 border border-outline-variant/10">
                            {job.companyLogo ? (
                              <img className="w-full h-auto object-contain" alt={job.companyName} src={job.companyLogo} />
                            ) : (
                              <span className="material-symbols-outlined text-outline text-2xl">business</span>
                            )}
                          </div>

                          {/* Body */}
                          <div className="flex-grow">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                              <div>
                                <div className="flex flex-wrap gap-1.5 mb-2 text-[9px] font-bold">
                                  {job.easyApply && (
                                    <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded uppercase tracking-wider">Easy Apply</span>
                                  )}
                                  <span className="px-2 py-0.5 bg-primary-fixed/20 text-primary rounded uppercase tracking-wider">{job.workMode}</span>
                                </div>
                                <h4 className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors text-[18px] leading-snug">
                                  {job.title}
                                </h4>
                                <p className="text-xs font-semibold text-on-surface-variant mt-0.5">
                                  {job.companyName} • <span className="text-outline font-normal">{job.location}</span>
                                </p>
                              </div>

                              <div className="flex flex-col items-end shrink-0">
                                <div className="bg-primary-fixed/30 text-primary-container px-3 py-1 rounded-lg flex items-center gap-1.5 mb-2 text-xs">
                                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                                  <span className="font-bold text-label-md">{job.matchRate || 85}% Match</span>
                                </div>
                                <p className="text-xs font-bold text-primary">{job.salaryRange || '$120k - $150k'}</p>
                              </div>
                            </div>

                            {/* Why this matches section */}
                            <div className="mt-4 bg-surface-container/50 rounded-xl p-4 border border-outline-variant/10 text-xs">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-outline mb-2">Why This Matches You</p>
                              <div className="grid md:grid-cols-2 gap-2 text-on-surface-variant font-semibold">
                                <div className="flex items-center gap-2">
                                  <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span> React matches your profile
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span> {job.matchRate || 85}% Skill alignment
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span> Direct experience in {job.workMode} roles
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span> Top 5% of applicants
                                </div>
                              </div>
                            </div>

                            {/* Actions and Skills */}
                            <div className="mt-6 flex items-center justify-between pt-4 border-t border-outline-variant/10 flex-wrap gap-4 text-[10px]">
                              <div className="flex flex-wrap gap-1.5">
                                {(job.technologies?.slice(0, 3) || ['React', 'Figma', 'UI Design']).map(tech => (
                                  <span key={tech} className="px-3 py-1 bg-surface-container-high text-on-surface-variant rounded-md font-bold">
                                    {tech}
                                  </span>
                                ))}
                              </div>

                              <div className="flex gap-2">
                                <button 
                                  onClick={(e) => handleToggleSave(job.id, e)}
                                  className={`p-2 rounded-lg transition-colors cursor-pointer border-none flex items-center justify-center ${
                                    isSaved ? 'text-primary' : 'text-outline hover:text-primary'
                                  }`}
                                  title="Bookmark Opportunity"
                                >
                                  <span className="material-symbols-outlined text-lg" style={isSaved ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                                    bookmark
                                  </span>
                                </button>
                                <button 
                                  onClick={(e) => handleApply(job.id, e)}
                                  className="px-6 py-2 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-all active:scale-95 text-xs border-none cursor-pointer"
                                >
                                  View Details
                                </button>
                              </div>
                            </div>

                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Pagination control dock */}
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
            </section>

          </div>

          {/* Right Column: Side Info Cards */}
          <aside className="lg:col-span-4 hidden lg:flex flex-col gap-6 text-xs text-left">
            
            {/* Career Tip banner */}
            <div className="bg-secondary-container/20 rounded-2xl p-6 border border-secondary-container/30">
              <div className="flex items-center gap-2 mb-4 text-secondary">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
                <h5 className="font-bold uppercase tracking-wider text-[11px]">Today's Career Tip</h5>
              </div>
              <p className="font-bold text-secondary text-sm mb-2">Mastering the 'Star' Method</p>
              <p className="text-on-secondary-fixed-variant leading-relaxed font-semibold">
                When answering behavioral questions, structure your response by describing the Situation, Task, Action, and Result. This creates a clear narrative for recruiters.
              </p>
              <button onClick={() => showToast('Opening behavioral preparation resources...', 'info')} className="mt-4 text-secondary font-bold flex items-center gap-1 hover:underline cursor-pointer bg-transparent border-none">
                Read more <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>

            {/* Quick Compare Card */}
            <div className="bg-white rounded-2xl p-6 border border-primary/5 shadow-sm space-y-4">
              <h5 className="font-bold uppercase tracking-wider text-outline">Quick Compare</h5>
              <div className="space-y-3 font-semibold text-xs">
                <div className="grid grid-cols-3 gap-2 pb-2 border-b border-primary/5 text-[10px] text-outline font-bold">
                  <span>Role</span>
                  <span>Match</span>
                  <span>Salary</span>
                </div>
                <div className="grid grid-cols-3 gap-2 items-center">
                  <span className="truncate text-primary">Google SWE</span>
                  <span className="text-green-600 font-bold">94%</span>
                  <span className="text-primary truncate">$180k-240k</span>
                </div>
                <div className="grid grid-cols-3 gap-2 items-center">
                  <span className="truncate text-primary">Microsoft AI</span>
                  <span className="text-green-600 font-bold">89%</span>
                  <span className="text-primary truncate">$150k-210k</span>
                </div>
              </div>
              <button 
                onClick={() => showToast('Opening complete side-by-side comparison matrices...', 'info')}
                className="w-full py-2 bg-primary text-white rounded-xl font-bold cursor-pointer border-none text-[10px] uppercase"
              >
                Compare Now
              </button>
            </div>

            {/* Recently Viewed Jobs Card */}
            <div className="bg-white rounded-2xl p-6 border border-primary/5 shadow-sm space-y-4">
              <h5 className="font-bold uppercase tracking-wider text-outline">Recently Viewed Jobs</h5>
              <div className="space-y-3 text-xs">
                <div 
                  onClick={() => navigate('/student/jobs/job_1')}
                  className="flex justify-between items-center cursor-pointer hover:bg-surface-container/20 p-1.5 rounded transition-colors"
                >
                  <div>
                    <p className="font-bold text-primary">Senior Product Designer</p>
                    <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">Stripe • Hybrid</p>
                  </div>
                  <span className="bg-primary/10 text-primary font-bold px-2 py-0.5 rounded text-[8px] uppercase shrink-0">98% Match</span>
                </div>

                <div 
                  onClick={() => navigate('/student/jobs/job_3')}
                  className="flex justify-between items-center border-t border-primary/5 pt-3 cursor-pointer hover:bg-surface-container/20 p-1.5 rounded transition-colors"
                >
                  <div>
                    <p className="font-bold text-primary">Product Manager, AWS</p>
                    <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">Amazon • Hybrid</p>
                  </div>
                  <span className="bg-primary/10 text-primary font-bold px-2 py-0.5 rounded text-[8px] uppercase shrink-0">82% Match</span>
                </div>
              </div>
            </div>

            {/* Trending Skills in Engineering list */}
            <div className="bg-white rounded-2xl p-6 border border-primary/5 shadow-sm">
              <h5 className="font-bold uppercase tracking-wider text-outline mb-4">Trending Skills in Engineering</h5>
              
              <div className="space-y-4 font-bold text-primary">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center font-bold">1</div>
                    <p className="font-bold">Generative AI</p>
                  </div>
                  <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-bold">+12%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center font-bold">2</div>
                    <p className="font-bold">System Design</p>
                  </div>
                  <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-bold">+8%</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center font-bold">3</div>
                    <p className="font-bold">Go / Rust</p>
                  </div>
                  <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-bold">+5%</span>
                </div>
              </div>

              <button onClick={() => navigate('/student/network')} className="w-full mt-6 py-2 bg-surface-container-high text-on-surface font-bold rounded-xl hover:bg-surface-container-highest transition-colors cursor-pointer border-none">
                View Skill Map
              </button>
            </div>

            {/* Interview Reminder */}
            <div className="bg-white rounded-2xl p-6 border border-primary/5 shadow-sm relative overflow-hidden">
              <div className="absolute right-0 top-0 w-1 bg-primary h-full" />
              <h5 className="font-bold uppercase tracking-wider text-outline mb-4">Upcoming Interview</h5>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-fixed/20 flex flex-col items-center justify-center text-primary-container shrink-0 font-bold">
                  <span className="text-[9px] uppercase">Oct</span>
                  <span className="text-lg font-extrabold leading-none mt-0.5">24</span>
                </div>
                <div>
                  <p className="font-bold text-primary">Tech Interview @ Netflix</p>
                  <p className="text-on-surface-variant font-semibold mt-0.5">Tomorrow • 10:00 AM PST</p>
                  
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => showToast('Opening video conferencing console...', 'success')} className="px-4 py-1.5 bg-primary text-white font-bold rounded-lg hover:opacity-90 cursor-pointer border-none text-[11px]">Join Meeting</button>
                    <button onClick={() => showToast('More option calendar events details.', 'info')} className="p-1.5 text-outline hover:text-primary transition-colors border border-outline-variant/30 rounded-lg cursor-pointer bg-white flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">more_vert</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Community Recommendation */}
            <div className="bg-primary-container text-white rounded-2xl p-6 shadow-lg">
              <h5 className="font-bold uppercase tracking-wider text-primary-fixed mb-4">Mentorship Program</h5>
              <p className="text-sm font-bold mb-2">Get matched with a Lead at Google</p>
              <p className="opacity-80 mb-4 font-semibold leading-relaxed">Users with mentors are 3x more likely to secure an offer in their first 60 days.</p>
              
              <button 
                onClick={() => navigate('/student/network')}
                className="w-full py-2 bg-white text-primary font-bold rounded-xl hover:bg-primary-fixed transition-colors cursor-pointer border-none"
              >
                Join Mentorship
              </button>
            </div>

            {/* AI Recommendation Card */}
            <div className="bg-surface-container-low rounded-2xl p-6 border border-primary/10 shadow-sm">
              <div className="flex items-center gap-2 mb-3 text-primary">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
                <h5 className="font-bold uppercase tracking-wider">AI Recommendation</h5>
              </div>
              <p className="font-bold mb-1">Resume Analysis recommended</p>
              <p className="text-on-surface-variant font-semibold mb-4">Estimated Match Increase: <span className="text-green-600 font-bold">+6%</span></p>
              
              <button 
                onClick={() => navigate('/student/resume-analyzer')}
                className="w-full py-2.5 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-all cursor-pointer border-none"
              >
                Analyze Resume
              </button>
            </div>

          </aside>

        </div>
      </main>
    </PageLayout>
  );
};

export default Jobs;
