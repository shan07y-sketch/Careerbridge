import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { PageLayout } from '../../components/layout/PageLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isBioExpanded, setIsBioExpanded] = useState(false);

  const handleUploadResume = () => {
    // Navigate to settings or trigger upload alert
    navigate('/student/settings');
  };

  return (
    <PageLayout fullWidth>
      <div className="max-w-container-max mx-auto p-4 md:p-margin-desktop space-y-stack-lg">
        {/* Hero Profile Section */}
        <section className="bg-white dark:bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/30 relative overflow-hidden text-left">
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-primary-container to-surface-tint opacity-10"></div>
          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
            <div className="relative shrink-0">
              <img
                className="w-32 h-32 rounded-2xl object-cover ring-4 ring-surface shadow-xl border-2 border-primary-fixed"
                alt={user?.name || 'Alex Rivera'}
                src={user?.profilePicture}
              />
              <div className="absolute -bottom-2 -right-2 bg-primary text-white p-1 rounded-full border-4 border-white shadow-md flex items-center justify-center">
                <span className="material-symbols-outlined text-[16px] leading-none">check</span>
              </div>
            </div>
            
            <div className="flex-grow space-y-3 min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-display font-display text-primary dark:text-primary-fixed">{user?.name || 'Alex Rivera'}</h2>
                <span className="bg-primary text-white px-3 py-1 rounded-full text-label-sm font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  Open To Work
                </span>
              </div>
              <p className="text-headline-md text-on-surface-variant font-semibold truncate">
                {user?.careerGoal || 'Software Engineer (Frontend/AI)'}
              </p>
              <div className="flex flex-wrap gap-4 text-on-surface-variant/80 text-sm">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">school</span>
                  {user?.university || 'Massachusetts Institute of Technology'}
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  Expected Graduation: {user?.gradYear || 2026}
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">work</span>
                  {user?.workMode || 'Hybrid'} format preferred
                </span>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="px-3 py-1 bg-surface-container dark:bg-surface-container-low rounded text-label-sm font-semibold">Remote</span>
                <span className="px-3 py-1 bg-surface-container dark:bg-surface-container-low rounded text-label-sm font-semibold">Hybrid</span>
                <span className="px-3 py-1 bg-surface-container dark:bg-surface-container-low rounded text-label-sm font-semibold">On-site</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 w-full md:w-auto shrink-0">
              <Button
                onClick={handleUploadResume}
                leftIcon={<span className="material-symbols-outlined">description</span>}
              >
                Upload CV
              </Button>
              <Button
                variant="secondary"
                onClick={() => showToast('Share profile link copied!', 'success')}
                leftIcon={<span className="material-symbols-outlined">share</span>}
              >
                Share Profile
              </Button>
            </div>
          </div>
        </section>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
          {/* Left Column (Main Content) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Profile Completion Panel */}
            <section className="bg-primary-fixed/35 dark:bg-primary-container/20 rounded-xl p-6 border border-primary-fixed/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-headline-md flex items-center gap-2 text-primary dark:text-primary-fixed">
                  <span className="material-symbols-outlined">task_alt</span>
                  Complete Your Profile
                </h3>
                <span className="text-label-md font-bold text-primary dark:text-primary-fixed">92% Complete</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-surface-container p-4 rounded-lg flex flex-col justify-between border border-outline-variant hover:border-primary transition-colors">
                  <p className="text-label-md font-bold mb-2">Upload Resume</p>
                  <button onClick={handleUploadResume} className="text-primary dark:text-primary-fixed text-label-sm flex items-center gap-1 font-bold hover:underline">
                    Upload Now <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
                <div className="bg-white dark:bg-surface-container p-4 rounded-lg flex flex-col justify-between border border-outline-variant hover:border-primary transition-colors">
                  <p className="text-label-md font-bold mb-2">Add Portfolio</p>
                  <button onClick={() => navigate('/student/settings')} className="text-primary dark:text-primary-fixed text-label-sm flex items-center gap-1 font-bold hover:underline">
                    Add Links <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
                <div className="bg-white dark:bg-surface-container p-4 rounded-lg flex flex-col justify-between border border-outline-variant hover:border-primary transition-colors">
                  <p className="text-label-md font-bold mb-2">Verify Certs</p>
                  <button onClick={() => showToast('Certification verification loading...', 'info')} className="text-primary dark:text-primary-fixed text-label-sm flex items-center gap-1 font-bold hover:underline">
                    Verify Now <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>
            </section>

            {/* About Me */}
            <section className="bg-white dark:bg-surface-container-lowest rounded-xl p-6 border border-primary/5 shadow-sm">
              <h3 className="font-headline-md mb-4 text-primary dark:text-primary-fixed">About Me</h3>
              <div className="text-body-lg text-on-surface-variant relative leading-relaxed">
                <p className={`transition-all ${isBioExpanded ? '' : 'line-clamp-4'}`}>
                  I am a passionate computer science candidate specialized in building robust frontend systems and integrating machine learning pipelines. Pursuing a {user?.degree || 'B.S. in Computer Science'} at {user?.university || 'MIT'}, I focus on human-centric code architecture, micro-interactions, and AI features optimization. I have collaborated in campus hackathons, open-source utilities, and led design sprint groups. I strive to leverage clean typescript constructs to build next-generation web applications.
                </p>
                <button 
                  className="mt-2 text-primary dark:text-primary-fixed font-bold hover:underline"
                  onClick={() => setIsBioExpanded(!isBioExpanded)}
                >
                  {isBioExpanded ? 'Show Less' : 'Read More'}
                </button>
              </div>
            </section>

            {/* Skills Matrix */}
            <section className="bg-white dark:bg-surface-container-lowest rounded-xl p-6 border border-primary/5 shadow-sm">
              <h3 className="font-headline-md mb-6 text-primary dark:text-primary-fixed flex items-center justify-between">
                Skills Matrix
                <span className="text-label-sm text-on-surface-variant font-normal">Expertise levels catalog</span>
              </h3>
              <div className="flex flex-wrap gap-4">
                {user?.skills.map((skill) => (
                  <button 
                    key={skill.name}
                    className="group relative flex items-center gap-3 bg-surface-container-low dark:bg-surface-container p-3 rounded-xl border border-outline-variant hover:border-primary hover:bg-primary-fixed dark:hover:bg-primary-container transition-all duration-300 active:scale-95 text-left"
                  >
                    <div className="w-8 h-8 rounded bg-white flex items-center justify-center text-primary font-bold text-sm select-none">
                      {skill.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1 font-bold text-label-md text-primary dark:text-primary-fixed">
                        {skill.name}
                        {skill.level >= 80 && (
                          <span className="material-symbols-outlined text-[14px] text-blue-500" style={{ fontVariationSettings: "'FILL' 1" }}>
                            verified
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-on-surface-variant uppercase font-bold group-hover:text-primary dark:group-hover:text-primary-fixed">
                        {skill.level >= 90 ? 'Expert' : skill.level >= 70 ? 'Advanced' : 'Intermediate'} • {skill.level}%
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Work Experience */}
            <section className="bg-white dark:bg-surface-container-lowest rounded-xl p-6 border border-primary/5 shadow-sm">
              <h3 className="font-headline-md mb-6 text-primary dark:text-primary-fixed">Work Experience</h3>
              <div className="relative pl-8 border-l-2 border-outline-variant dark:border-outline hover:border-primary transition-colors group">
                <div className="absolute -left-[9px] top-0 w-4 h-4 bg-primary rounded-full group-hover:scale-125 transition-transform"></div>
                <div className="flex flex-col md:flex-row justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-lg text-primary dark:text-primary-fixed">Product Design & Frontend Intern</h4>
                    <p className="text-label-md font-medium text-on-surface-variant">TechNova Solutions • Internship</p>
                    <p className="text-label-sm text-outline">Jun 2025 — Aug 2025 (3 mos)</p>
                  </div>
                  <div className="flex gap-2 mt-4 md:mt-0">
                    <button className="text-xs font-bold text-primary dark:text-primary-fixed bg-primary-fixed dark:bg-primary-container px-3 py-1 rounded hover:opacity-90">View Company</button>
                    <button className="text-xs font-bold text-primary dark:text-primary-fixed border border-primary px-3 py-1 rounded hover:bg-primary-fixed/20">Review Letter</button>
                  </div>
                </div>
                <ul className="list-disc list-inside text-on-surface-variant space-y-2 mb-4 text-body-md">
                  <li>Redesigned the onboarding flow, increasing user retention by 15% in Q3.</li>
                  <li>Collaborated with engineering to implement a new design system using React and Tailwind.</li>
                  <li>Conducted 20+ usability testing sessions and translated findings into UI improvements.</li>
                </ul>
              </div>
            </section>

            {/* Key Projects */}
            <section className="bg-white dark:bg-surface-container-lowest rounded-xl p-6 border border-primary/5 shadow-sm">
              <h3 className="font-headline-md mb-6 text-primary dark:text-primary-fixed">Key Projects</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-outline-variant dark:border-outline rounded-xl overflow-hidden hover:scale-102 hover:shadow-md transition-all">
                  <div className="h-40 bg-surface-container dark:bg-surface-container-high relative group flex items-center justify-center text-primary font-bold">
                    [ EcoTrack App Banner ]
                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity gap-4">
                      <button className="bg-white p-2 rounded-full shadow-md hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-primary">link</span>
                      </button>
                      <button className="bg-white p-2 rounded-full shadow-md hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-primary">code</span>
                      </button>
                    </div>
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Completed</span>
                      <span className="bg-primary/80 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">94% Match</span>
                    </div>
                  </div>
                  <div className="p-4 text-left">
                    <h4 className="font-bold text-lg text-primary dark:text-primary-fixed mb-1">EcoTrack Dashboard</h4>
                    <p className="text-on-surface-variant text-label-sm mb-3">SaaS dashboard for monitoring carbon emissions in supply chains.</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column (Sidebar metrics) */}
          <aside className="lg:col-span-4 space-y-8">
            {/* AI insights panel */}
            <Card className="bg-primary text-on-primary shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-surface-tint opacity-20 -mr-8 -mt-8 rounded-full"></div>
              <h3 className="font-headline-md mb-6 flex items-center gap-2 text-white">
                <span className="material-symbols-outlined text-inverse-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  auto_awesome
                </span>
                AI Profile Rating
              </h3>
              
              <div className="space-y-6">
                <div>
                  <p className="text-label-sm opacity-70 mb-3 uppercase tracking-wider">Top Matching Partners</p>
                  <div className="flex items-center gap-2 bg-white/10 p-3 rounded-lg backdrop-blur-sm justify-around text-black font-bold">
                    <span className="bg-white px-2.5 py-1 rounded shadow-sm text-xs">Google</span>
                    <span className="bg-white px-2.5 py-1 rounded shadow-sm text-xs">Microsoft</span>
                    <span className="bg-white px-2.5 py-1 rounded shadow-sm text-xs">Stripe</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 p-3 rounded-lg text-left">
                    <p className="text-[10px] opacity-70 mb-0.5">Mock Readiness</p>
                    <p className="font-bold text-lg text-inverse-primary">88%</p>
                  </div>
                  <div className="bg-white/10 p-3 rounded-lg text-left">
                    <p className="text-[10px] opacity-70 mb-0.5">Est. Match Base</p>
                    <p className="font-bold text-lg text-inverse-primary">$135k+</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Profile Activity details */}
            <Card className="space-y-6">
              <h3 className="font-headline-md text-primary dark:text-primary-fixed border-b border-outline-variant/30 pb-2">Profile Statistics</h3>
              <div className="space-y-4">
                {[
                  { label: 'Recruiter Views', val: 42, icon: 'visibility', color: 'text-blue-500' },
                  { label: 'Profile Searches', val: 156, icon: 'search', color: 'text-purple-500' },
                  { label: 'App Responses', val: '+4', icon: 'mail', color: 'text-green-500 text-green-600 font-bold' },
                  { label: 'Network Contacts', val: 12, icon: 'group_add', color: 'text-orange-500' }
                ].map((act) => (
                  <div key={act.label} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined ${act.color.split(' ')[0]}`}>{act.icon}</span>
                      <span className="font-label-md text-on-surface-variant">{act.label}</span>
                    </div>
                    <span className={`font-bold text-base ${act.color.includes('font-bold') ? 'text-green-600' : 'text-primary dark:text-primary-fixed'}`}>{act.val}</span>
                  </div>
                ))}
              </div>
            </Card>
          </aside>
        </div>
      </div>
      <div className="h-10"></div>
    </PageLayout>
  );
};
export default Profile;
