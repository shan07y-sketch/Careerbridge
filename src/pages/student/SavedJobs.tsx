import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { JobService, ApplicationService } from '../../services';
import type { Job } from '../../types';
import { PageLayout } from '../../components/layout/PageLayout';
import { useToast } from '../../contexts/ToastContext';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

export const SavedJobs: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<'All' | 'Remote' | 'Hybrid' | 'Internship' | 'Full-Time'>('All');
  const [aiMatchFilter, setAiMatchFilter] = useState(false);
  const [companyFilter, setCompanyFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [salaryFilter, setSalaryFilter] = useState('');

  const fetchSavedJobs = async () => {
    try {
      setIsLoading(true);
      const items = await JobService.getSavedJobs();
      setSavedJobs(items);
    } catch (err) {
      console.error('Failed to load saved jobs', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const items = await ApplicationService.getApplications();
      setApplications(items);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSavedJobs();
    fetchApplications();
  }, []);

  const handleUnsave = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await JobService.toggleSaveJob(jobId);
      showToast('Job removed from saved list.', 'success');
      fetchSavedJobs();
    } catch (err) {
      showToast('Failed to unsave job.', 'error');
    }
  };

  const handleApply = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await ApplicationService.applyToJob(jobId);
      showToast('Application submitted successfully!', 'success');
      fetchSavedJobs();
    } catch (err: any) {
      if (err.message === 'Already applied to this job') {
        showToast('You have already applied to this position.', 'info');
      } else {
        showToast('Failed to submit application.', 'error');
      }
    }
  };

  // Filter Pipeline
  const filteredJobs = useMemo(() => {
    return savedJobs.filter(j => {
      // Search Box
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchTitle = j.title.toLowerCase().includes(q);
        const matchCompany = j.companyName.toLowerCase().includes(q);
        if (!matchTitle && !matchCompany) return false;
      }

      // Categories
      if (activeCategory !== 'All') {
        if (activeCategory === 'Remote') {
          if (!j.location.toLowerCase().includes('remote')) return false;
        } else if (activeCategory === 'Hybrid') {
          if (!j.location.toLowerCase().includes('hybrid')) return false;
        } else if (activeCategory === 'Internship') {
          if (!j.type?.toLowerCase().includes('intern')) return false;
        } else if (activeCategory === 'Full-Time') {
          if (!j.type?.toLowerCase().includes('full')) return false;
        }
      }

      // AI Match score filter
      if (aiMatchFilter) {
        if ((j.matchRate || 85) < 90) return false;
      }

      // Dropdown inputs
      if (companyFilter && j.companyName !== companyFilter) return false;
      if (locationFilter && !j.location.toLowerCase().includes(locationFilter.toLowerCase())) return false;
      if (salaryFilter && !j.salaryRange?.toLowerCase().includes(salaryFilter.toLowerCase())) return false;

      return true;
    });
  }, [savedJobs, searchTerm, activeCategory, aiMatchFilter, companyFilter, locationFilter, salaryFilter]);

  // Derived options for filter menus
  const companyOptions = useMemo(() => {
    return Array.from(new Set(savedJobs.map(j => j.companyName)));
  }, [savedJobs]);

  const locationOptions = useMemo(() => {
    return Array.from(new Set(savedJobs.map(j => {
      const parts = j.location.split(' • ');
      return parts[parts.length - 1] || j.location;
    })));
  }, [savedJobs]);

  const salaryOptions = useMemo(() => {
    return Array.from(new Set(savedJobs.map(j => j.salaryRange).filter(Boolean)));
  }, [savedJobs]);

  // Stats counters
  const totalSaved = savedJobs.length;
  const expiringSoonCount = savedJobs.filter(j => j.deadline?.includes('days') || j.deadline?.includes('Soon')).length || 1;
  const appliedCount = savedJobs.filter(j => applications.some(app => app.jobId === j.id)).length;

  return (
    <PageLayout fullWidth>
      <main className="px-8 py-12 min-h-screen text-left bg-[#f9faf7]">
        <div className="max-w-[1400px] mx-auto flex flex-col xl:flex-row gap-8">
          
          {/* Left Column: Main Saved Jobs Feed */}
          <div className="flex-grow space-y-6 max-w-[1000px]">
            
            {/* Header info */}
            <div>
              <h2 className="font-display text-headline-lg text-primary mb-2">Saved Jobs</h2>
              <p className="text-body-md text-on-surface-variant">Keep track of opportunities you're interested in and apply when you're ready.</p>
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Total Saved</p>
                <p className="text-[28px] font-bold text-primary">{totalSaved}</p>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Recently Added</p>
                <p className="text-[28px] font-bold text-primary">2</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Expiring Soon</p>
                <p className="text-[28px] font-bold text-error">{expiringSoonCount}</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Applied</p>
                <p className="text-[28px] font-bold text-primary">{appliedCount}</p>
              </div>
            </div>

            {/* Search Box */}
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
              <input 
                type="text"
                placeholder="Search saved jobs by title, company, or key attributes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-outline-variant/30 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:ring-2 focus:ring-primary/20 placeholder:text-on-surface-variant/60 outline-none text-on-surface dark:text-white"
              />
            </div>

            {/* Filter buttons list */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {(['All', 'Remote', 'Hybrid', 'Internship', 'Full-Time'] as const).map(cat => {
                  const isActive = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                        isActive 
                          ? 'bg-primary text-white border-transparent' 
                          : 'bg-white text-on-surface-variant border-primary/5 hover:bg-surface-container-high'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}

                <button
                  onClick={() => setAiMatchFilter(prev => !prev)}
                  className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1 cursor-pointer border transition-colors ${
                    aiMatchFilter 
                      ? 'bg-[#023629] text-white border-transparent' 
                      : 'bg-secondary-container/40 text-secondary border-primary/5 hover:bg-secondary-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">bolt</span>
                  AI Match (90%+)
                </button>
              </div>

              {/* Dropdown filters options */}
              <div className="flex items-center gap-2 text-xs font-bold text-primary">
                <select 
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  className="bg-transparent border-none text-xs font-bold focus:ring-0 cursor-pointer p-1"
                >
                  <option value="">Company</option>
                  {companyOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>

                <select 
                  value={salaryFilter}
                  onChange={(e) => setSalaryFilter(e.target.value)}
                  className="bg-transparent border-none text-xs font-bold focus:ring-0 cursor-pointer p-1"
                >
                  <option value="">Salary</option>
                  {salaryOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>

                <select 
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="bg-transparent border-none text-xs font-bold focus:ring-0 cursor-pointer p-1"
                >
                  <option value="">Location</option>
                  {locationOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>

            {/* Main Saved List */}
            {isLoading ? (
              <div className="space-y-4">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : filteredJobs.length === 0 ? (
              <EmptyState 
                icon="bookmark_border"
                title="No saved jobs"
                description={searchTerm ? "No bookmarks match your search filters." : "You haven't bookmarked any jobs yet."}
                actionLabel="Discover Jobs"
                onAction={() => navigate('/student/jobs')}
              />
            ) : (
              <div className="space-y-4">
                {filteredJobs.map(job => (
                  <div 
                    key={job.id} 
                    onClick={() => navigate(`/student/jobs/${job.id}`)}
                    className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300 group cursor-pointer text-left"
                  >
                    
                    {/* Header info */}
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex gap-4">
                        <div className="w-14 h-14 bg-surface-container rounded-xl flex items-center justify-center border border-outline-variant/10 overflow-hidden shrink-0">
                          {job.companyLogo ? (
                            <img className="w-8 h-8 object-contain" alt={job.companyName} src={job.companyLogo} />
                          ) : (
                            <span className="material-symbols-outlined text-outline text-2xl">business</span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-headline-md text-primary font-bold text-[18px] hover:underline leading-tight">
                              {job.title}
                            </h3>
                            <span className="bg-primary/5 text-primary text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-tighter shrink-0">
                              High Priority
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-on-surface-variant">
                            {job.companyName} • {job.location}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase">AI Match</p>
                          <p className="text-lg font-extrabold text-primary">{job.matchRate || 85}%</p>
                        </div>
                        <button 
                          onClick={(e) => handleUnsave(job.id, e)}
                          className="p-2 text-on-surface-variant hover:text-error transition-colors cursor-pointer bg-transparent border-none flex items-center justify-center"
                          title="Remove bookmark"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </div>

                    {/* Metadata details grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-xs text-on-surface-variant">
                      <div>
                        <p className="text-outline uppercase text-[10px] font-bold tracking-wider mb-1">Salary Range</p>
                        <p className="font-bold text-primary">{job.salaryRange || '$100k - $120k'}</p>
                      </div>
                      <div>
                        <p className="text-outline uppercase text-[10px] font-bold tracking-wider mb-1">Saved Date</p>
                        <p className="font-bold text-primary">Oct 12, 2023</p>
                      </div>
                      <div>
                        <p className="text-outline uppercase text-[10px] font-bold tracking-wider mb-1">Deadline</p>
                        <p className={`font-bold ${job.deadline?.includes('days') || job.deadline?.includes('Soon') ? 'text-error' : 'text-primary'}`}>
                          {job.deadline || 'Oct 30, 2023'}
                        </p>
                      </div>
                      <div>
                        <p className="text-outline uppercase text-[10px] font-bold tracking-wider mb-1">AI Insight</p>
                        <div className="flex items-center gap-1 font-bold text-secondary">
                          <span className="material-symbols-outlined text-[16px]">stars</span>
                          Fits Career Goal
                        </div>
                      </div>
                    </div>

                    {/* Tags & Action CTA buttons */}
                    <div className="flex items-center justify-between pt-6 border-t border-outline-variant/10 flex-wrap gap-4">
                      <div className="flex flex-wrap gap-1.5">
                        {(job.technologies?.slice(0, 3) || ['React', 'Figma', 'UI Design']).map((s: string) => (
                          <span key={s} className="bg-surface-container-high/40 px-3 py-1 rounded-lg text-[10px] font-bold text-on-surface-variant">
                            {s}
                          </span>
                        ))}
                        {job.technologies && job.technologies.length > 3 && (
                          <span className="bg-surface-container-high/40 px-3 py-1 rounded-lg text-[10px] font-bold text-on-surface-variant">
                            +{job.technologies.length - 3} more
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/student/jobs/${job.id}`);
                          }}
                          className="px-5 py-2 rounded-xl border border-primary/20 text-primary text-xs font-bold hover:bg-primary/5 transition-all cursor-pointer bg-white"
                        >
                          View Details
                        </button>
                        <button 
                          onClick={(e) => handleApply(job.id, e)}
                          className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-lg shadow-primary/10 active:scale-95 transition-all cursor-pointer border-none"
                        >
                          Apply Now
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}

            {/* Recommended Section at Bottom */}
            <section className="mt-12 pt-6 border-t border-primary/5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-headline-md text-primary font-bold">Recommended Jobs Based on Saved Jobs</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => showToast('Scrolling recommended jobs list left.', 'info')}
                    className="w-10 h-10 rounded-full border border-outline-variant/20 flex items-center justify-center hover:bg-primary/5 transition-colors cursor-pointer bg-white"
                  >
                    <span className="material-symbols-outlined text-lg">chevron_left</span>
                  </button>
                  <button 
                    onClick={() => showToast('Scrolling recommended jobs list right.', 'info')}
                    className="w-10 h-10 rounded-full border border-outline-variant/20 flex items-center justify-center hover:bg-primary/5 transition-colors cursor-pointer bg-white"
                  >
                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {[
                  { name: 'Canva', title: 'Senior Content Designer', match: '92%', logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB6D1kgQvkEwyIOLsclPYTjYsOVbl_Kmk0lnoz_NHfD6eOfbc381Ks9TerrAN8FY-K54Kbd1BmkRJbEn1Ve1AmQp2RGtziTMIvwb7-Yx1FbjA0OWzFORyXNeegw35Sebm7opHKLWN-v4uU4haVua5EaiUXoFe5_JYyBMwAdgyLrzL2BOOy60dUz6XWBgaNtavljfdvROpIfDfQjyQVBu_oHHR_dcyGp7wLWV_zF3kFOMrNFCkdQ5-XxxwPz3B2sEX6bXDRBiQ9lSr4' },
                  { name: 'Figma', title: 'Systems Designer', match: '89%', logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJmuJqxoHkGThvunmWo-5_cCUbMJy7nLtQiGwbLedwdItCWtCcsDlgAe1AjajuEMqke8L0AN9ZkyRmy9hXhutAFkG_o_tNIby_CEdNYROSRWpdOZwNI-2NuJk3LuW1QfJcRsVHfH58w8HIuHHtYWYPlVtlUa3IBSIm-3boi1bT9ufQkrYq4416F83vXGpF8QYcezMkcLjNKb6QHQOiRatLmkHIgfjhBOQhs8XDvesv1dML0CGN_uEs9QlCkmrOxxLLAGgMZcxRBko' },
                  { name: 'Atlassian', title: 'Product Lead', match: '87%', logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCDOWcC0XWoZrbU-tuNFD-nt4osrUL5dcTxWW-eStxy3cl1-O3d9j2dd6YkBe_ygkJvNn6YrK7GGKDQ1o9vXOEtJh-4ojTQDreAiPXFVAcCogFGy5C-aZ3ienDNRFzh51tann6sWAk9g7kKS0ig1RkBznudp5Hq62TrPyAex4NaiSoUpubOuXfIjda8VnWGk-10lolOi6YwNndR6if2MG1GefXMSAeBY4BRSnnPaIsU4NWIP_NAbF6wcJ1rrfaYI2PS5R94cZSVVQs' }
                ].map((recJob, i) => (
                  <div 
                    key={i} 
                    className="min-w-[320px] bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5 flex flex-col text-xs text-left"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-surface-container rounded-lg flex items-center justify-center border border-outline-variant/10 overflow-hidden shrink-0">
                        <img className="w-6 h-6 object-contain" alt={recJob.name} src={recJob.logo} />
                      </div>
                      <div>
                        <h4 className="font-bold text-primary truncate">{recJob.name}</h4>
                        <p className="text-[10px] text-on-surface-variant">Sydney • Hybrid</p>
                      </div>
                    </div>
                    
                    <h5 className="font-bold text-sm mb-4 text-primary leading-tight">{recJob.title}</h5>
                    
                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-primary/5">
                      <span className="text-secondary font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">bolt</span>
                        {recJob.match} Match
                      </span>
                      <button 
                        onClick={() => navigate('/student/jobs')}
                        className="text-primary font-bold hover:underline cursor-pointer bg-transparent border-none"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>

          {/* Right Column: Side Insights Panel */}
          <aside className="w-80 space-y-6 hidden xl:block shrink-0">
            
            {/* Career Tip banner */}
            <div className="bg-primary p-6 rounded-2xl text-[#f9faf7] relative overflow-hidden group text-xs text-left">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-6xl">lightbulb</span>
              </div>
              <div className="relative z-10 space-y-4">
                <h4 className="font-bold text-sm">Career Tip</h4>
                <p className="opacity-90 leading-relaxed font-medium">
                  Focus on tailoring your resume for High Priority matches first. These roles align 90%+ with your skills.
                </p>
                <button 
                  onClick={() => showToast('Opening professional development tips resources...', 'info')}
                  className="font-bold underline underline-offset-4 hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-none text-[#f9faf7]"
                >
                  Read more tips
                </button>
              </div>
            </div>

            {/* Saved job statistics meters */}
            <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5 text-xs text-left">
              <h4 className="font-bold text-primary mb-6">Saved Job Statistics</h4>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between font-bold mb-1.5">
                    <span className="text-on-surface-variant">Ready to Apply</span>
                    <span className="text-primary">65%</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[65%] rounded-full" />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between font-bold mb-1.5">
                    <span className="text-on-surface-variant">Skills Gaps Identified</span>
                    <span className="text-secondary">12%</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                    <div className="h-full bg-secondary w-[12%] rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Deadlines schedule list */}
            <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5 text-xs text-left">
              <h4 className="font-bold text-primary mb-4">Upcoming Deadlines</h4>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px] text-error">event</span>
                  </div>
                  <div>
                    <p className="font-bold text-primary">Senior Designer • Stripe</p>
                    <p className="text-[10px] text-error font-bold uppercase mt-0.5">Expiring in 3 days</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">event</span>
                  </div>
                  <div>
                    <p className="font-bold text-primary">Product Lead • Canva</p>
                    <p className="text-[10px] text-on-surface-variant font-bold uppercase mt-0.5">In 12 days</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">event</span>
                  </div>
                  <div>
                    <p className="font-bold text-primary">UX Researcher • Meta</p>
                    <p className="text-[10px] text-on-surface-variant font-bold uppercase mt-0.5">In 2 weeks</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommended features card */}
            <div className="bg-secondary-container/30 p-6 rounded-2xl border border-secondary/10 text-xs text-left">
              <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-3">Recommended for You</p>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                  <img className="w-6 h-6 object-contain" alt="Anthropic logo" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB6Jx3RHH-MqUh9tku-1_piYs2Kv2c0uN0b0iV8Ey3ZlAbBCX8VWG7halTgqHSimYO9b5BkPihJlEXL4K-Y8IccSadNNx9njuBs6bLysHI1orFNJQgX8dbEnx7BR-1SkT_St9Y6ochraRfX3iJFhAYKtXzHuek2OxLLVBen1HEJVTZIBXgSZ3V6M86m-LH0pIIcTSvKDl6ZRus49QqlnopQrRCZNKUyozaMSE6DXmkBqdYkg8Cq-ukrWJoMJziYpEfffGkt81hxQDY" />
                </div>
                <div>
                  <p className="font-bold text-primary">Interface Designer</p>
                  <p className="text-[10px] text-on-surface-variant">Anthropic • Hybrid</p>
                </div>
              </div>

              <button 
                onClick={() => showToast('Opening AI Copilot application dashboard...', 'info')}
                className="w-full bg-primary text-white py-2.5 rounded-xl font-bold active:scale-95 transition-all cursor-pointer border-none text-[11px]"
              >
                Apply with AI Assistant
              </button>
            </div>

          </aside>

        </div>
      </main>
    </PageLayout>
  );
};

export default SavedJobs;
