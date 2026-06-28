import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../../components/layout/PageLayout';
import { useToast } from '../../contexts/ToastContext';

export const AICareerReport: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [activeExplain, setActiveExplain] = useState<string | null>(null);

  const handleGeneratePlan = () => {
    showToast('AI Career Learning Plan compiled successfully!', 'success');
  };

  const explanations: Record<string, string> = {
    readiness: "Calculated based on your coursework completion, resume ATS matches, and interview mock metrics.",
    resume: "Scans your resume for action verbs, keyword densities, and visual layout parameters.",
    interview: "Determined from pronunciation scoreboards, speed check meters, and syntax responses.",
    match: "Evaluates your matching overlap against standard junior frontend engineer market specifications."
  };

  return (
    <PageLayout fullWidth>
      <main className="px-8 py-12 min-h-screen text-left bg-[#f9faf7]">
        <div className="max-w-[1400px] mx-auto space-y-stack-lg">
          
          {/* Hero Header */}
          <section className="mb-stack-lg text-left">
            <h1 className="font-display text-headline-lg text-primary mb-2">Career Insights</h1>
            <p className="font-body-lg text-on-surface-variant max-w-2xl">
              AI-powered analysis of your career readiness, skills, learning progress and job opportunities.
            </p>
          </section>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-12 gap-gutter items-start">
            
            {/* Left Column (8 cols) */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
              
              {/* HERO CARD (AI Summary) */}
              <div className="bg-white rounded-xl p-8 shadow-[0_4px_20px_rgba(2,54,41,0.04)] flex flex-col md:flex-row items-center gap-stack-lg border border-primary/5 text-xs">
                
                {/* SVG Progress Circle */}
                <div className="relative w-48 h-48 flex-shrink-0">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle className="text-surface-container" cx="50" cy="50" fill="transparent" r="42" stroke="currentColor" strokeWidth="8" />
                    <circle 
                      className="text-primary progress-ring__circle" 
                      cx="50" 
                      cy="50" 
                      fill="transparent" 
                      r="42" 
                      stroke="currentColor" 
                      strokeDasharray="264" 
                      strokeDashoffset="34" 
                      strokeLinecap="round" 
                      strokeWidth="8" 
                      style={{
                        transform: 'rotate(-90deg)',
                        transformOrigin: '50% 50%',
                        transition: 'stroke-dashoffset 0.35s'
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display text-headline-lg text-primary font-bold text-3xl">87%</span>
                    <span className="font-semibold text-on-surface-variant text-[10px]">Overall Ready</span>
                  </div>
                </div>

                <div className="flex-1 text-left space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    <h2 className="font-headline-md text-primary font-bold text-sm">AI Career Summary</h2>
                  </div>
                  <p className="font-body-lg text-on-surface-variant leading-relaxed text-xs">
                    You are <span className="font-bold text-primary">87% ready</span> for Frontend Engineer roles. Based on current market trends, improving your <span className="text-primary underline decoration-primary-fixed decoration-2 underline-offset-4 font-bold">Docker</span> and <span className="text-primary underline decoration-primary-fixed decoration-2 underline-offset-4 font-bold">System Design</span> skills can increase your market readiness score to <span className="font-bold text-primary">95%</span>.
                  </p>

                  <div className="bg-primary/5 p-3 rounded-lg text-[11px] leading-relaxed text-on-surface-variant font-semibold">
                    <p className="text-primary font-bold">Why this score was generated:</p>
                    <p className="mt-1">
                      Your score reflects a strong match in frontend development metrics (React, TypeScript, SQL), offset by missing backend deployment experience (Docker, AWS practitioner). Completing the upcoming learning modules will automatically elevate your matching profile.
                    </p>
                  </div>
                  
                  {/* Grid Overview with Interactive Tooltips */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center font-bold">
                    {[
                      { id: 'readiness', label: 'Readiness', val: '850/1000' },
                      { id: 'resume', label: 'Resume', val: '91%' },
                      { id: 'interview', label: 'Interview', val: '88%' },
                      { id: 'match', label: 'Job Match', val: '87%' }
                    ].map(stat => (
                      <div 
                        key={stat.id}
                        onClick={() => setActiveExplain(activeExplain === stat.id ? null : stat.id)}
                        className="p-3 bg-surface-container-low hover:bg-surface-container-high rounded-lg cursor-pointer transition-colors relative"
                      >
                        <p className="text-[9px] uppercase opacity-70 text-on-surface-variant flex items-center justify-center gap-0.5">
                          {stat.label} <span className="material-symbols-outlined text-[10px]">help</span>
                        </p>
                        <p className="text-sm text-primary mt-0.5">{stat.val}</p>
                        
                        {activeExplain === stat.id && (
                          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2.5 bg-white border border-primary/10 rounded shadow-lg text-[10px] font-medium text-left z-20 text-on-surface-variant leading-relaxed animate-fade-in">
                            {explanations[stat.id]}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Career Readiness and Job Match */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter text-xs text-left">
                {/* Readiness score card */}
                <div className="bg-white rounded-xl p-6 border border-primary/5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <h3 className="font-bold text-on-surface-variant mb-6 uppercase tracking-wider text-[11px]">Career Readiness Score</h3>
                  <div className="flex items-end gap-4 mb-4">
                    <span className="font-display text-4xl text-primary font-bold">850</span>
                    <div className="flex items-center text-primary font-bold pb-1">
                      <span className="material-symbols-outlined text-lg">arrow_drop_up</span>
                      <span>5% improvement</span>
                    </div>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full mb-2">
                    <div className="bg-primary h-full rounded-full" style={{ width: '85%' }} />
                  </div>
                  <div className="flex justify-between font-semibold text-on-surface-variant">
                    <span>Last month: 810</span>
                    <span>Target: 950</span>
                  </div>
                </div>

                {/* Job Match Analysis */}
                <div className="bg-white rounded-xl p-6 border border-primary/5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <h3 className="font-bold text-on-surface-variant mb-4 uppercase tracking-wider text-[11px]">Job Match Analysis</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary-fixed/20 rounded-lg flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined">terminal</span>
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="font-bold text-primary">Frontend Engineer</p>
                        <div className="w-full bg-surface-container-high h-1.5 rounded-full mt-1">
                          <div className="bg-primary h-full rounded-full" style={{ width: '94%' }} />
                        </div>
                      </div>
                      <span className="font-bold text-primary shrink-0">94%</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary-fixed/20 rounded-lg flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined">brush</span>
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="font-bold text-primary">UI Developer</p>
                        <div className="w-full bg-surface-container-high h-1.5 rounded-full mt-1">
                          <div className="bg-primary h-full rounded-full" style={{ width: '88%' }} />
                        </div>
                      </div>
                      <span className="font-bold text-primary shrink-0">88%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skill Gap Analysis */}
              <div className="bg-white rounded-xl p-8 border border-primary/5 shadow-sm text-xs text-left">
                <div className="flex items-center justify-between mb-8 pb-3 border-b border-primary/5">
                  <h3 className="font-headline-md text-primary font-bold">Skill Gap Analysis</h3>
                  <button 
                    onClick={() => showToast('Re-scanning resume skills matrix logs...', 'info')}
                    className="text-primary font-bold flex items-center gap-1 hover:underline cursor-pointer bg-transparent border-none"
                  >
                    <span className="material-symbols-outlined text-sm">refresh</span> Refresh analysis
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <div className="flex items-center gap-2 mb-4 text-primary font-bold">
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      <span>Core Strengths</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['React', 'TypeScript', 'SQL', 'Communication', 'Problem Solving'].map(s => (
                        <span key={s} className="px-4 py-2 bg-surface-container-low border border-primary/5 rounded-lg font-bold text-on-surface">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-4 text-error font-bold">
                      <span className="material-symbols-outlined text-sm">warning</span>
                      <span>Growth Opportunities</span>
                    </div>
                    <div className="space-y-3">
                      <div 
                        onClick={() => navigate('/student/network')}
                        className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg border border-primary/5 cursor-pointer hover:bg-surface-container-high transition-colors"
                      >
                        <div>
                          <p className="font-bold text-primary">Docker</p>
                          <p className="text-[9px] text-on-surface-variant font-bold uppercase mt-0.5">Intermediate • 10h remaining</p>
                        </div>
                        <span className="material-symbols-outlined text-primary">arrow_forward</span>
                      </div>

                      <div 
                        onClick={() => navigate('/student/network')}
                        className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg border border-primary/5 cursor-pointer hover:bg-surface-container-high transition-colors"
                      >
                        <div>
                          <p className="font-bold text-primary">AWS Fundamentals</p>
                          <p className="text-[9px] text-on-surface-variant font-bold uppercase mt-0.5">Beginner • 20h remaining</p>
                        </div>
                        <span className="material-symbols-outlined text-primary">arrow_forward</span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-2">
                        <span className="text-[9px] font-bold text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded">CI/CD</span>
                        <span className="text-[9px] font-bold text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded">System Design</span>
                        <span className="text-[9px] font-bold text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded">Testing</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personalized Roadmap */}
              <div className="bg-white rounded-xl p-8 border border-primary/5 shadow-sm text-xs text-left">
                <h3 className="font-headline-md text-primary font-bold mb-8">Personalized Roadmap</h3>
                
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-surface-container-high" />
                  
                  <div className="space-y-8">
                    
                    <div className="relative pl-12">
                      <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shrink-0">
                        <span className="material-symbols-outlined text-sm">done</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-primary text-sm leading-tight">Week 1: Docker Basics</h4>
                        <span className="font-bold text-primary">80% Complete</span>
                      </div>
                      <p className="text-on-surface-variant font-semibold mt-1 leading-relaxed">Containers, Images, and basic CLI commands.</p>
                    </div>

                    <div className="relative pl-12">
                      <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-primary-fixed border-2 border-primary flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined text-sm">play_arrow</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-primary text-sm leading-tight">Week 2: AWS Fundamentals</h4>
                        <span className="font-bold text-primary">20% Complete</span>
                      </div>
                      <p className="text-on-surface-variant font-semibold mt-1 leading-relaxed">IAM, EC2, and S3 core services overview.</p>
                    </div>

                    <div className="relative pl-12 opacity-50">
                      <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline shrink-0">
                        <span className="material-symbols-outlined text-sm">lock</span>
                      </div>
                      <h4 className="font-bold text-primary text-sm leading-tight">Week 3: System Design</h4>
                      <p className="text-on-surface-variant font-semibold mt-1 leading-relaxed">Scalability, availability, and microservices.</p>
                    </div>

                    <div className="relative pl-12 opacity-50">
                      <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline shrink-0">
                        <span className="material-symbols-outlined text-sm">lock</span>
                      </div>
                      <h4 className="font-bold text-primary text-sm leading-tight">Week 4: Mock Interview</h4>
                      <p className="text-on-surface-variant font-semibold mt-1 leading-relaxed">Full-stack technical round simulation.</p>
                    </div>

                  </div>
                </div>
              </div>

            </div>

            {/* Right Column (4 cols) */}
            <aside className="col-span-12 lg:col-span-4 space-y-6 text-xs text-left">
              
              {/* Tip of Day banner */}
              <div className="bg-primary text-white p-6 rounded-xl shadow-sm relative overflow-hidden text-left">
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center gap-2 text-primary-fixed">
                    <span className="material-symbols-outlined">lightbulb</span>
                    <h3 className="font-bold text-[11px] uppercase tracking-wider">Career Tip of the Day</h3>
                  </div>
                  <p className="font-medium leading-relaxed">
                    "Quantify your achievements on your resume. Instead of 'Lead a team', use 'Led a team of 5 to increase deployment frequency by 40%.'"
                  </p>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-10">
                  <span className="material-symbols-outlined text-[100px]">auto_stories</span>
                </div>
              </div>

              {/* Hiring Trends sectoral indexes */}
              <div className="bg-white rounded-xl p-6 border border-primary/5 shadow-sm text-left">
                <h3 className="font-bold text-primary uppercase tracking-wider mb-4 text-[11px]">Hiring Trends</h3>
                
                <div className="space-y-4 font-bold text-primary">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-secondary-container/30 flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined text-sm">trending_up</span>
                      </div>
                      <span>FinTech Sector</span>
                    </div>
                    <span>+12%</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-secondary-container/30 flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined text-sm">trending_up</span>
                      </div>
                      <span>Remote Work</span>
                    </div>
                    <span>+8.5%</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-primary/5 font-semibold text-outline">
                  <p className="text-[9px] uppercase tracking-wider font-bold mb-3">Trending Technologies</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Rust', 'Next.js 14', 'GraphQL', 'LangChain'].map(tech => (
                      <span key={tech} className="px-3 py-1 bg-secondary-container/40 text-primary rounded-full font-bold">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Interview Mastery charts */}
              <div className="bg-white rounded-xl p-6 border border-primary/5 shadow-sm text-left">
                <h3 className="font-bold text-primary uppercase tracking-wider mb-6 text-[11px]">Interview Mastery</h3>
                
                <div className="space-y-4 font-bold text-primary">
                  {[
                    { label: 'Communication', pct: 92 },
                    { label: 'Technical Knowledge', pct: 84 },
                    { label: 'Problem Solving', pct: 88 },
                    { label: 'Confidence', pct: 78 },
                    { label: 'Behavioral Skills', pct: 90 }
                  ].map(skill => (
                    <div key={skill.label} className="space-y-1.5">
                      <div className="flex justify-between font-bold text-xs">
                        <span>{skill.label}</span>
                        <span>{skill.pct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                        <div className="bg-primary h-full rounded-full" style={{ width: `${skill.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => navigate('/student/mock-interview')}
                  className="w-full mt-8 py-3 rounded-lg border border-primary text-primary font-bold hover:bg-primary-fixed/20 transition-all cursor-pointer bg-white"
                >
                  Start Practice Session
                </button>
              </div>

              {/* Today's Focus checklist items */}
              <div className="bg-white rounded-xl p-6 border border-primary/5 shadow-sm text-left">
                <div className="flex items-center gap-2 mb-6">
                  <span className="material-symbols-outlined text-primary">stars</span>
                  <h3 className="font-bold text-primary uppercase tracking-wider text-[11px]">Today's Focus</h3>
                </div>

                <div className="space-y-4 font-bold">
                  <div className="p-4 bg-primary-fixed/10 border border-primary/5 rounded-xl">
                    <p className="text-primary mb-3">Complete Docker Quiz</p>
                    <button 
                      onClick={() => showToast('Opening Docker fundamentals assessment quiz...', 'info')}
                      className="w-full py-2 bg-primary text-white rounded-lg font-bold hover:opacity-90 transition-all cursor-pointer border-none text-[11px]"
                    >
                      Start Now
                    </button>
                  </div>

                  <div 
                    onClick={() => navigate('/student/resume-analyzer')}
                    className="p-4 bg-surface-container-low border border-primary/5 rounded-xl group cursor-pointer hover:bg-surface-container-high transition-colors flex justify-between items-center"
                  >
                    <p>Update Resume for AWS</p>
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-1 transition-transform">chevron_right</span>
                  </div>

                  <div 
                    onClick={() => navigate('/student/mock-interview')}
                    className="p-4 bg-surface-container-low border border-primary/5 rounded-xl group cursor-pointer hover:bg-surface-container-high transition-colors flex justify-between items-center"
                  >
                    <p>Schedule Mock Interview</p>
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-1 transition-transform">chevron_right</span>
                  </div>
                </div>
              </div>

              {/* Learning Reminders notifications */}
              <div className="bg-white rounded-xl p-6 border border-primary/5 shadow-sm text-left">
                <h3 className="font-bold text-on-surface-variant mb-4 uppercase tracking-wider text-[11px]">Learning Reminder</h3>
                <div className="flex items-center gap-3 font-bold text-primary">
                  <span className="material-symbols-outlined text-primary animate-bounce shrink-0">notifications_active</span>
                  <div>
                    <p>30 mins AWS prep</p>
                    <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">Scheduled for 6:00 PM</p>
                  </div>
                </div>
              </div>

            </aside>

          </div>

          {/* Certifications and Action grid */}
          <section className="space-y-6 pt-6 border-t border-primary/5 text-xs text-left">
            <h3 className="font-headline-md text-primary font-bold">Target Certifications</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
              
              {/* AWS Cloud Practitioner */}
              <div className="bg-white p-6 rounded-xl border border-primary/5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                  </div>
                  <span className="px-2 py-1 bg-primary-fixed/20 text-primary text-[9px] font-bold rounded uppercase shrink-0">Priority: High</span>
                </div>
                <h4 className="font-bold text-primary text-sm mb-2">AWS Cloud Practitioner</h4>
                <div className="flex gap-4 text-on-surface-variant font-semibold mb-6">
                  <span>Intermediate</span>
                  <span>15-20 hours</span>
                </div>
                <button 
                  onClick={() => showToast('Enrolled in AWS Practitioner Certification course!', 'success')}
                  className="w-full py-3 bg-surface-container-low text-primary font-bold rounded-lg group-hover:bg-primary group-hover:text-white transition-all cursor-pointer border-none"
                >
                  Enroll Now
                </button>
              </div>

              {/* Google Cloud Associate */}
              <div className="bg-white p-6 rounded-xl border border-primary/5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-red-50 text-red-600 rounded flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>cloud</span>
                  </div>
                  <span className="px-2 py-1 bg-surface-container text-on-surface-variant text-[9px] font-bold rounded uppercase shrink-0">Priority: Med</span>
                </div>
                <h4 className="font-bold text-primary text-sm mb-2">Google Cloud Associate</h4>
                <div className="flex gap-4 text-on-surface-variant font-semibold mb-6">
                  <span>Advanced</span>
                  <span>30-40 hours</span>
                </div>
                <button 
                  onClick={() => showToast('Enrolled in Google Cloud Associate course!', 'success')}
                  className="w-full py-3 bg-surface-container-low text-primary font-bold rounded-lg group-hover:bg-primary group-hover:text-white transition-all cursor-pointer border-none"
                >
                  Enroll Now
                </button>
              </div>

              {/* Meta Front-End Cert */}
              <div className="bg-white p-6 rounded-xl border border-primary/5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-blue-100 text-blue-800 rounded flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>code</span>
                  </div>
                  <span className="px-2 py-1 bg-surface-container text-on-surface-variant text-[9px] font-bold rounded uppercase shrink-0">Priority: Med</span>
                </div>
                <h4 className="font-bold text-primary text-sm mb-2">Meta Front-End Cert</h4>
                <div className="flex gap-4 text-on-surface-variant font-semibold mb-6">
                  <span>Beginner</span>
                  <span>40-50 hours</span>
                </div>
                <button 
                  onClick={() => showToast('Enrolled in Meta Front-End Certification course!', 'success')}
                  className="w-full py-3 bg-surface-container-low text-primary font-bold rounded-lg group-hover:bg-primary group-hover:text-white transition-all cursor-pointer border-none"
                >
                  Enroll Now
                </button>
              </div>

            </div>
          </section>

          {/* Sticky Drawer bottom controls */}
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-4 bg-white/90 backdrop-blur-xl rounded-full border border-primary/10 shadow-2xl z-50 text-xs font-bold text-on-surface-variant">
            <button 
              onClick={handleGeneratePlan}
              className="bg-primary text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border-none text-[11px]"
            >
              Generate Personalized Learning Plan
            </button>
            <div className="h-6 w-px bg-primary/10 mx-2" />
            <button 
              onClick={() => showToast('Downloading detailed AI insights report PDF...', 'success')}
              className="p-3 text-on-surface hover:text-primary transition-colors rounded-full hover:bg-surface-container-low cursor-pointer bg-transparent border-none flex items-center justify-center"
              title="Download Report"
            >
              <span className="material-symbols-outlined">download</span>
            </button>
            <button 
              onClick={() => showToast('Copying share link to clipboard...', 'success')}
              className="p-3 text-on-surface hover:text-primary transition-colors rounded-full hover:bg-surface-container-low cursor-pointer bg-transparent border-none flex items-center justify-center"
              title="Share Insights"
            >
              <span className="material-symbols-outlined">share</span>
            </button>
          </div>

          {/* Spacer bottom */}
          <div className="h-24" />

        </div>
      </main>
    </PageLayout>
  );
};

export default AICareerReport;
