import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { Job } from '../../types';
import { JobService } from '../../services';
import { PageLayout } from '../../components/layout/PageLayout';
import { JobCard } from '../../components/cards/JobCard';
import { ProgressChart } from '../../components/charts/ProgressChart';
import { useToast } from '../../contexts/ToastContext';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Job[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const jobs = await JobService.getJobs();
        // Show first 2 jobs as recommended
        setRecommendedJobs(jobs.slice(0, 2));
        // Show next 2 jobs as recently viewed
        setRecentlyViewed(jobs.slice(2, 4));
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setIsLoadingJobs(false);
      }
    };
    loadDashboardData();
  }, []);

  const handleApplySuccess = () => {
    showToast('Application updated successfully on dashboard!', 'success');
  };

  return (
    <PageLayout fullWidth>
      <main className="px-8 py-12 min-h-screen text-left bg-[#f9faf7] space-y-stack-lg">
        
        {/* Top Hero Layout */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
          
          {/* Welcome Card banner */}
          <div className="lg:col-span-2 bg-primary-container p-8 rounded-2xl text-white flex flex-col justify-center relative overflow-hidden shadow-lg">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-on-primary-container/20 rounded-full blur-3xl" />
            
            <h2 className="font-display text-headline-lg font-bold mb-2">
              Good Morning, {user?.name?.split(' ')[0] || 'Alex'}
            </h2>
            
            <div className="flex gap-4 mb-4 text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <span className="opacity-70 uppercase tracking-wider">Profile Strength:</span>
                <span className="text-primary-fixed-dim">{user?.resumeScore || 82}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="opacity-70 uppercase tracking-wider">Career Readiness:</span>
                <span className="text-primary-fixed-dim">{user?.readinessScore || 87}%</span>
              </div>
            </div>
            
            <p className="font-body-md text-primary-fixed opacity-90 mb-6 max-w-md">
              Your AI analyzed your profile and found <span className="font-bold underline text-white">4 new matching opportunities</span>. 
              Resume score is at {user?.resumeScore || 82}%. Next recommendation: Complete SQL for Developers.
            </p>
            
            <div className="flex gap-3 text-xs font-bold">
              <button 
                onClick={() => navigate('/student/profile')}
                className="bg-[#bcedd9] text-[#002117] px-6 py-2.5 rounded-full hover:scale-[1.02] transition-all cursor-pointer border-none"
              >
                Improve My Profile
              </button>
              <button 
                onClick={() => navigate('/student/career-report')}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-2.5 rounded-full transition-colors cursor-pointer"
              >
                Career Readiness Report
              </button>
            </div>
          </div>

          {/* Readiness Circular Progress Card */}
          <div className="bg-white p-8 rounded-2xl border border-primary/5 shadow-sm flex flex-col items-center justify-center text-center">
            <ProgressChart 
              percent={user?.readinessScore || 87} 
              size={110} 
              label="Ready" 
              className="mb-4"
            />
            <p className="font-label-md text-label-md font-bold text-primary">Career Readiness</p>
            <p className="text-xs text-on-surface-variant mt-1">Excellent progress this week!</p>
          </div>
        </section>

        {/* Continue Learning Widget */}
        <section className="bg-white p-6 rounded-2xl border border-primary/5 shadow-sm text-xs text-left flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-lg">play_circle</span>
            </div>
            <div>
              <p className="font-bold text-primary">Continue Where You Left Off</p>
              <p className="text-on-surface-variant font-medium mt-0.5">Lesson: Docker CLI Basics • 80% Completed</p>
            </div>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex-1 md:w-48 bg-surface-container-high h-2 rounded-full overflow-hidden">
              <div className="bg-primary h-full w-[80%]" />
            </div>
            <button 
              onClick={() => {
                showToast('Resuming Docker CLI basics course...', 'info');
                navigate('/student/career-report');
              }} 
              className="px-6 py-2 bg-primary text-white font-bold rounded-xl cursor-pointer border-none text-[11px]"
            >
              Resume
            </button>
          </div>
        </section>

        {/* Content Columns: Left Main (8 cols), Right Sidebar (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          
          {/* Left Column (Main Feed) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Recommended Jobs */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-headline-md text-headline-md text-primary font-bold">Recommended Jobs</h3>
                <Link to="/student/jobs" className="text-primary font-bold text-xs hover:underline">
                  See All
                </Link>
              </div>
              
              <div className="space-y-4">
                {isLoadingJobs ? (
                  <div className="h-24 bg-white rounded-2xl animate-pulse" />
                ) : (
                  recommendedJobs.map((job) => (
                    <JobCard 
                      key={job.id} 
                      job={job} 
                      onApplySuccess={handleApplySuccess}
                    />
                  ))
                )}
              </div>
            </section>

            {/* Recently Viewed Jobs */}
            <section className="space-y-4">
              <h3 className="font-headline-md text-headline-md text-primary font-bold">Recently Viewed Jobs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentlyViewed.map(job => (
                  <div 
                    key={job.id} 
                    onClick={() => navigate(`/student/jobs/${job.id}`)}
                    className="bg-white p-5 rounded-2xl border border-primary/5 hover:shadow-md transition-shadow cursor-pointer text-xs text-left space-y-3"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-bold text-primary text-sm leading-tight group-hover:underline">{job.title}</h4>
                        <p className="text-on-surface-variant font-medium mt-0.5">{job.companyName} • {job.location}</p>
                      </div>
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[8px] font-bold uppercase shrink-0">
                        {job.matchRate}% Match
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-[10px] text-outline font-semibold border-t border-primary/5 pt-2">
                      <span>{job.salaryRange}</span>
                      <span>{job.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Recent Activity Feed */}
            <section className="space-y-4 text-xs text-left">
              <h3 className="font-headline-md text-headline-md text-primary font-bold">Recent Activity</h3>
              <div className="bg-white p-6 rounded-2xl border border-primary/5 shadow-sm space-y-4 font-semibold text-on-surface">
                {[
                  { desc: 'Stripe recruiter viewed your application for Senior Product Designer.', time: '2 hours ago', icon: 'visibility', color: 'text-primary' },
                  { desc: 'Elena Rodriguez accepted your connection request.', time: 'Yesterday', icon: 'person_add', color: 'text-secondary' },
                  { desc: 'Submitted application for Frontend Developer position at Deloitte.', time: '3 days ago', icon: 'send', color: 'text-primary' }
                ].map((act, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className={`material-symbols-outlined text-lg mt-0.5 ${act.color}`}>{act.icon}</span>
                    <div>
                      <p>{act.desc}</p>
                      <p className="text-[10px] text-outline font-medium mt-0.5">{act.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>

          {/* Right Column (Sidebar Widgets) */}
          <aside className="lg:col-span-4 space-y-6 text-xs text-left">
            
            {/* Profile Completion Card */}
            <div className="bg-white p-6 rounded-2xl border border-primary/5 shadow-sm space-y-4">
              <div className="flex justify-between items-center font-bold">
                <span className="text-primary text-sm">Profile Completion</span>
                <span className="text-primary">85%</span>
              </div>
              <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full w-[85%]" />
              </div>
              <ul className="space-y-2 text-on-surface-variant font-semibold">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-600 text-sm">check_circle</span>
                  Resume uploaded and ATS optimized
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-outline text-sm">circle</span>
                  Link portfolio or GitHub account
                </li>
              </ul>
            </div>

            {/* Interview Countdown Alert */}
            <div className="bg-[#001f16] text-[#f9faf7] p-6 rounded-2xl shadow-lg relative overflow-hidden">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-primary-fixed mb-1">Interview Countdown</h4>
              <p className="text-sm font-bold">Netflix Technical Interview</p>
              <div className="flex gap-2 text-center mt-3 text-white">
                <div className="bg-white/10 px-2 py-1 rounded">
                  <span className="block font-bold text-sm">18</span>
                  <span className="text-[8px] uppercase tracking-wider">Hours</span>
                </div>
                <div className="bg-white/10 px-2 py-1 rounded">
                  <span className="block font-bold text-sm">45</span>
                  <span className="text-[8px] uppercase tracking-wider">Mins</span>
                </div>
              </div>
            </div>

            {/* Daily AI recommendations */}
            <div className="bg-[#e9dfc8] text-[#4c4635] p-6 rounded-2xl border border-secondary-container/40">
              <div className="flex items-center gap-2 mb-3 text-secondary">
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                <h4 className="font-bold uppercase tracking-wider text-[10px]">AI Focus Recommendation</h4>
              </div>
              <p className="font-bold text-sm">Complete SQL for Developers</p>
              <p className="font-medium mt-1 leading-relaxed">Completing this track can match you with 18 more local engineering positions.</p>
              <button 
                onClick={() => navigate('/student/career-report')}
                className="w-full mt-4 py-2 bg-primary text-white rounded-lg font-bold border-none cursor-pointer text-[10px]"
              >
                Go to learning path
              </button>
            </div>

            {/* Upcoming Deadlines expiring list */}
            <div className="bg-white p-6 rounded-2xl border border-primary/5 shadow-sm text-left">
              <h4 className="font-bold text-primary uppercase tracking-wider mb-4">Upcoming Deadlines</h4>
              <div className="space-y-4 font-semibold text-on-surface">
                <div className="flex justify-between items-center">
                  <div>
                    <p>Senior Designer • Stripe</p>
                    <p className="text-[10px] text-error font-bold mt-0.5">3 days left</p>
                  </div>
                  <span className="material-symbols-outlined text-error text-lg">warning</span>
                </div>

                <div className="flex justify-between items-center border-t border-primary/5 pt-3">
                  <div>
                    <p>Product Lead • Canva</p>
                    <p className="text-[10px] text-outline mt-0.5">12 days left</p>
                  </div>
                  <span className="material-symbols-outlined text-outline text-lg">event</span>
                </div>
              </div>
            </div>

          </aside>

        </div>
      </main>
    </PageLayout>
  );
};

export default Dashboard;
