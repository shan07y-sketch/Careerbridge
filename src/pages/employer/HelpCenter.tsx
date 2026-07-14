import React, { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';

export const EmployerHelpCenter: React.FC = () => {
  const { showToast } = useToast();

  // Search input state
  const [searchQuery, setSearchQuery] = useState('');
  
  // AI query suggestions state
  const [aiSuggestions] = useState([
    { text: '"How do I set up custom interview scorecards?"', toast: 'Analyzing scorecard guides...' },
    { text: '"Summarize the latest candidate feedback reports."', toast: 'Summarizing feedback reports...' }
  ]);

  // Star ratings state
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');

  // Support Tickets State
  const [tickets, setTickets] = useState([
    { id: '#CB-24902', subject: 'Issue with LinkedIn Integration sync', priority: 'Critical', status: 'Pending', statusColor: 'bg-blue-500', assignee: 'Sarah Miller' },
    { id: '#CB-24855', subject: 'Missing candidate activity logs', priority: 'Normal', status: 'Resolved', statusColor: 'bg-primary', assignee: 'James Chen' }
  ]);

  const categories = [
    { icon: 'dashboard', title: 'Dashboard', desc: 'Customizing your recruiter workspace.' },
    { icon: 'work', title: 'Jobs', desc: 'Posting, editing, and closing listings.' },
    { icon: 'group', title: 'Candidates', desc: 'Management and pipeline workflows.' },
    { icon: 'event', title: 'Interviews', desc: 'Scheduling and feedback collection.' },
    { icon: 'mail', title: 'Messaging', desc: 'Communicating with talent effectively.' },
    { icon: 'insights', title: 'Analytics', desc: 'Hiring metrics and performance data.' },
    { icon: 'description', title: 'Reports', desc: 'Exporting compliance and activity logs.' },
    { icon: 'domain', title: 'Company', desc: 'Brand profile and employer settings.' },
    { icon: 'person_search', title: 'Recruiters', desc: 'Team permissions and seat management.' },
    { icon: 'notifications', title: 'Notifications', desc: 'Alert settings and delivery preferences.' },
    { icon: 'settings', title: 'Settings', desc: 'Core account and billing configuration.' },
    { icon: 'security', title: 'Security', desc: 'SSO, MFA, and data privacy controls.' },
    { icon: 'integration_instructions', title: 'Integrations', desc: 'Connecting your ATS and HRIS tools.' },
    { icon: 'payments', title: 'Billing', desc: 'Subscription management and invoices.' },
    { icon: 'diversity_3', title: 'Culture', desc: 'Showcasing company values to talent.' },
    { icon: 'school', title: 'Onboarding', desc: 'Hiring manager training resources.' }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    showToast(`Searching help articles for: "${searchQuery}"`, 'info');
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      showToast('Please select a star rating first.', 'error');
      return;
    }
    showToast('Thank you for your feedback!', 'success');
    setRating(0);
    setFeedbackText('');
  };

  const createTicket = () => {
    const newId = `#CB-${Math.floor(10000 + Math.random() * 90000)}`;
    const newTicket = {
      id: newId,
      subject: 'New general inquiry ticket',
      priority: 'Normal',
      status: 'Pending',
      statusColor: 'bg-blue-500',
      assignee: 'Support Team'
    };
    setTickets([newTicket, ...tickets]);
    showToast(`Created support ticket ${newId}`, 'success');
  };

  return (
    <div className="max-w-container-max mx-auto px-margin-desktop py-stack-lg text-left animate-slide-up">
      {/* Hero & Search Section */}
      <section className="mb-stack-lg">
        <div className="mb-8">
          <h2 className="font-headline-lg text-headline-lg text-primary mb-2 font-bold">Help Center</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
            Find answers, tutorials, documentation, and support resources to efficiently manage recruitment and hiring.
          </p>
        </div>
        <div className="relative mb-6">
          <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-lg p-2 flex flex-col md:flex-row items-center gap-2 border border-primary/5">
            <div className="flex items-center flex-1 w-full">
              <span className="material-symbols-outlined text-outline px-4">search</span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 border-none focus:ring-0 py-4 text-body-lg text-on-surface placeholder:text-on-surface-variant/50 outline-none w-full bg-transparent"
                placeholder="Search guides, FAQs, articles, or features..."
                type="text"
              />
            </div>
            <div className="flex items-center justify-between md:justify-end gap-3 pr-4 w-full md:w-auto">
              <button 
                type="button"
                onClick={() => showToast('Voice search is not supported on this browser.', 'info')}
                className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary transition-colors bg-transparent border-none p-2"
              >
                mic
              </button>
              <button
                type="button"
                onClick={() => showToast('Initializing AI smart search query...', 'info')}
                className="flex items-center gap-1.5 bg-primary-container/10 px-3 py-1.5 rounded-full border border-primary/20 shrink-0 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                <span className="text-xs font-bold text-primary tracking-tight">AI SEARCH</span>
              </button>
              <button 
                type="submit"
                className="bg-primary text-white px-8 py-3 rounded-xl font-label-md text-label-md hover:bg-primary/90 transition-colors cursor-pointer shrink-0 font-bold text-sm"
              >
                Search
              </button>
            </div>
          </form>
          <div className="mt-4 flex items-center gap-3 flex-wrap text-xs">
            <span className="text-label-md text-on-surface-variant font-semibold">Popular:</span>
            <button 
              onClick={() => showToast('Opening guide: Bulk Import Candidates', 'info')}
              className="px-3 py-1 bg-secondary-container/40 text-on-secondary-container rounded-full font-semibold hover:bg-secondary-container transition-colors cursor-pointer border-none"
            >
              Bulk Import Candidates
            </button>
            <button 
              onClick={() => showToast('Opening guide: API Integration', 'info')}
              className="px-3 py-1 bg-secondary-container/40 text-on-secondary-container rounded-full font-semibold hover:bg-secondary-container transition-colors cursor-pointer border-none"
            >
              API Integration
            </button>
            <button 
              onClick={() => showToast('Opening guide: Interview Scheduling', 'info')}
              className="px-3 py-1 bg-secondary-container/40 text-on-secondary-container rounded-full font-semibold hover:bg-secondary-container transition-colors cursor-pointer border-none"
            >
              Interview Scheduling
            </button>
            <button 
              onClick={() => showToast('Opening guide: GDPR Compliance', 'info')}
              className="px-3 py-1 bg-secondary-container/40 text-on-secondary-container rounded-full font-semibold hover:bg-secondary-container transition-colors cursor-pointer border-none"
            >
              GDPR Compliance
            </button>
          </div>
        </div>
      </section>

      {/* Layout Grid: Main Content (Left) + Sidebar (Right) */}
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 xl:col-span-9 space-y-12">
          {/* Quick Actions Grid */}
          <section>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div 
                onClick={() => showToast('Loading Getting Started guide...', 'info')}
                className="glass-card p-6 rounded-2xl hover-lift cursor-pointer flex flex-col gap-3 group transition-all duration-300 ease-out"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">rocket_launch</span>
                </div>
                <h4 className="font-bold text-primary text-sm">Getting Started</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">Basic setup and your first recruitment cycle.</p>
              </div>
              
              <div 
                onClick={() => showToast('Opening recruitment manuals...', 'info')}
                className="glass-card p-6 rounded-2xl hover-lift cursor-pointer flex flex-col gap-3 group transition-all duration-300 ease-out"
              >
                <div className="w-12 h-12 rounded-xl bg-tertiary-container flex items-center justify-center text-on-tertiary-container group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[#879b91]">menu_book</span>
                </div>
                <h4 className="font-bold text-primary text-sm">Recruitment Guides</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">Best practices for hiring top-tier talent.</p>
              </div>

              <div 
                onClick={() => showToast('Opening video tutorial directory...', 'info')}
                className="glass-card p-6 rounded-2xl hover-lift cursor-pointer flex flex-col gap-3 group transition-all duration-300 ease-out"
              >
                <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-container group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[#696250]">video_library</span>
                </div>
                <h4 className="font-bold text-primary text-sm">Video Tutorials</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">Visual walkthroughs of every feature.</p>
              </div>

              <div 
                onClick={() => showToast('Opening API developer docs...', 'info')}
                className="glass-card p-6 rounded-2xl hover-lift cursor-pointer flex flex-col gap-3 group transition-all duration-300 ease-out"
              >
                <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">code</span>
                </div>
                <h4 className="font-bold text-primary text-sm">API Docs</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">Integrate CareerBridge into your stack.</p>
              </div>

              {/* Second Row */}
              <div 
                onClick={() => showToast('Opening comprehensive knowledge base...', 'info')}
                className="glass-card p-6 rounded-2xl hover-lift cursor-pointer flex flex-col gap-3 group transition-all duration-300 ease-out"
              >
                <div className="w-12 h-12 rounded-xl bg-white border border-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-sm">
                  <span className="material-symbols-outlined">database</span>
                </div>
                <h4 className="font-bold text-primary text-sm">Knowledge Base</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">Deep dive into enterprise documentation.</p>
              </div>

              <div 
                onClick={createTicket}
                className="glass-card p-6 rounded-2xl hover-lift cursor-pointer flex flex-col gap-3 group transition-all duration-300 ease-out"
              >
                <div className="w-12 h-12 rounded-xl bg-white border border-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-sm">
                  <span className="material-symbols-outlined">confirmation_number</span>
                </div>
                <h4 className="font-bold text-primary text-sm">Support Ticket</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">Open a request with our expert team.</p>
              </div>

              <div 
                onClick={() => showToast('Connecting to a live agent...', 'info')}
                className="glass-card p-6 rounded-2xl hover-lift cursor-pointer flex flex-col gap-3 group transition-all duration-300 ease-out"
              >
                <div className="w-12 h-12 rounded-xl bg-white border border-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-sm">
                  <span className="material-symbols-outlined">chat</span>
                </div>
                <h4 className="font-bold text-primary text-sm">Live Chat</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">Real-time support from human agents.</p>
              </div>

              <div 
                onClick={() => showToast('Opening system status dashboard...', 'info')}
                className="glass-card p-6 rounded-2xl hover-lift cursor-pointer flex flex-col gap-3 group transition-all duration-300 ease-out"
              >
                <div className="w-12 h-12 rounded-xl bg-white border border-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-sm">
                  <span className="material-symbols-outlined">wifi_tethering</span>
                </div>
                <h4 className="font-bold text-primary text-sm">System Status</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">Real-time uptime and service health.</p>
              </div>
            </div>
          </section>

          {/* AI Support Assistant (Bento Card) */}
          <section>
            <div className="bg-primary-container text-white p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="relative z-10 max-w-lg">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  <h3 className="font-headline-md text-headline-md font-bold">Ask AI Assistant</h3>
                </div>
                <p className="text-primary-fixed-dim mb-6 text-body-md text-sm">
                  Get instant technical troubleshooting, feature explanations, or data insights directly from our enterprise-grade AI model.
                </p>
                <div className="space-y-3">
                  {aiSuggestions.map((sug, i) => (
                    <button 
                      key={i}
                      onClick={() => showToast(sug.toast, 'info')}
                      className="w-full text-left p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-between group cursor-pointer text-xs"
                    >
                      <span>{sug.text}</span>
                      <span className="material-symbols-outlined text-xs opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                    </button>
                  ))}
                </div>
                <div className="mt-8 flex gap-3 text-xs">
                  <button 
                    onClick={() => showToast('Generating custom report via AI...', 'success')}
                    className="bg-primary-fixed text-primary font-bold px-6 py-2.5 rounded-full cursor-pointer hover:bg-white transition-colors"
                  >
                    Generate Report
                  </button>
                  <button 
                    onClick={() => showToast('AI is explaining this feature...', 'info')}
                    className="bg-white/10 text-white font-bold px-6 py-2.5 rounded-full cursor-pointer hover:bg-white/20 transition-colors"
                  >
                    Explain Feature
                  </button>
                </div>
              </div>
              <div className="absolute right-[-10%] top-[-10%] opacity-20 pointer-events-none"></div>
            </div>
          </section>

          {/* Help Categories */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-headline-md text-headline-md text-primary font-bold">Browse by Category</h3>
              <button 
                onClick={() => showToast('Loading all documentation indices...', 'info')}
                className="text-primary font-bold text-sm hover:underline cursor-pointer bg-transparent border-none"
              >
                View All Documentation
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((cat, index) => (
                <div 
                  key={index}
                  className="bg-white border border-primary/5 p-5 rounded-2xl hover:border-primary/20 transition-all group flex flex-col justify-between text-left h-48"
                >
                  <div>
                    <span className="material-symbols-outlined text-primary/40 mb-3 block group-hover:text-primary transition-colors">{cat.icon}</span>
                    <h4 className="font-bold text-sm mb-1 text-primary">{cat.title}</h4>
                    <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">{cat.desc}</p>
                  </div>
                  <button 
                    onClick={() => showToast(`Loading articles for ${cat.title}...`, 'info')}
                    className="text-xs font-bold text-primary flex items-center gap-1 group-hover:gap-2 transition-all mt-4 cursor-pointer bg-transparent border-none w-fit"
                  >
                    View Articles <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Popular Articles */}
          <section>
            <h3 className="font-headline-md text-headline-md text-primary font-bold mb-6">Popular Articles</h3>
            <div className="space-y-3">
              <div 
                onClick={() => showToast('Opening: How to publish a job and optimize visibility', 'info')}
                className="bg-white border border-primary/5 p-4 rounded-xl flex items-center justify-between hover:bg-surface-container-low transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary/60">description</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface group-hover:text-primary transition-colors text-sm">How to publish a job and optimize visibility</h4>
                    <div className="flex items-center gap-3 text-xs text-on-surface-variant mt-1">
                      <span>4 min read</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">visibility</span> 12.4k views</span>
                    </div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline group-hover:translate-x-1 transition-transform">chevron_right</span>
              </div>

              <div 
                onClick={() => showToast('Opening: Best practices for scheduling group interviews', 'info')}
                className="bg-white border border-primary/5 p-4 rounded-xl flex items-center justify-between hover:bg-surface-container-low transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary/60">description</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface group-hover:text-primary transition-colors text-sm">Best practices for scheduling group interviews</h4>
                    <div className="flex items-center gap-3 text-xs text-on-surface-variant mt-1">
                      <span>7 min read</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">visibility</span> 8.2k views</span>
                    </div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline group-hover:translate-x-1 transition-transform">chevron_right</span>
              </div>

              <div 
                onClick={() => showToast('Opening: Managing data privacy and recruiter permissions', 'info')}
                className="bg-white border border-primary/5 p-4 rounded-xl flex items-center justify-between hover:bg-surface-container-low transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary/60">description</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface group-hover:text-primary transition-colors text-sm">Managing data privacy and recruiter permissions</h4>
                    <div className="flex items-center gap-3 text-xs text-on-surface-variant mt-1">
                      <span>12 min read</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">visibility</span> 5.1k views</span>
                    </div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline group-hover:translate-x-1 transition-transform">chevron_right</span>
              </div>
            </div>
          </section>

          {/* Video Learning Center */}
          <section>
            <h3 className="font-headline-md text-headline-md text-primary font-bold mb-6">Video Learning Center</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl overflow-hidden border border-primary/5 shadow-sm group">
                <div className="aspect-video relative bg-surface-dim overflow-hidden">
                  <img 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD0KBDgeRRAgmMNmZGDdb4DRijLHUxWy4Vx-sDcyYswYy49C8CWzQ2mZm90rAD-2XFGqgHyulFMbd1kF1Orm64ZMJsVgUO-3o-7IbJBxUgBVbXPLGOZmNuHBDtDEsk0UUr-DyNN-yAZGBAH2hD-R_FajE84v7iTljaNCfpEVERWipk9ppVxRAuVOiqXUNvn19YvUTMzSbHL6Bg2sJSlPyrnHDYdCmKvP4PZ5DUA7gese1r-5o9fu3Gp"
                    alt="Enterprise Walkthrough Video"
                  />
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => showToast('Playing: Enterprise Recruitment Walkthrough...', 'success')}
                      className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-primary shadow-lg hover:scale-105 transition-transform cursor-pointer border-none"
                    >
                      <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                    </button>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur text-white text-[10px] px-2 py-1 rounded font-bold">12:45</div>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Fundamental</span>
                    <span className="text-xs text-on-surface-variant">25% Complete</span>
                  </div>
                  <h4 className="font-bold text-primary mb-3 text-sm">Enterprise Recruitment Walkthrough</h4>
                  <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                    <div className="bg-primary h-full w-1/4 rounded-full"></div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl overflow-hidden border border-primary/5 shadow-sm group">
                <div className="aspect-video relative bg-surface-dim overflow-hidden">
                  <img 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAjmbBsJJ_xnENHiPHJJ-F6D45SYHQT2MXd8Qp0ADAf70r9tBx7QPH8YRT65pS9cvcDL9N76CuI6PbiZ1OMxVzOEaAqIIYPtjmqPBAgG6FlC98n4FuqzsfwmtaUbXgrhgnuJ-I3e5daCq4T8fdP1nIlVS1henyke8u_mJ85gpfYzSW2025jL8Z1pDvHKpWIvX2r9wGHrn6HWVr5caMC16oLkN9WKfPgZIJqBb6U9YxIvv9gxEDlwQu2"
                    alt="Dashboard Mastery Video"
                  />
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => showToast('Playing: Custom Dashboard Mastery...', 'success')}
                      className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-primary shadow-lg hover:scale-105 transition-transform cursor-pointer border-none"
                    >
                      <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                    </button>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur text-white text-[10px] px-2 py-1 rounded font-bold">08:12</div>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Advanced</span>
                    <span className="text-xs text-on-surface-variant">Not Started</span>
                  </div>
                  <h4 className="font-bold text-primary mb-3 text-sm">Custom Dashboard Mastery</h4>
                  <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                    <div className="bg-primary h-full w-0 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Support Tickets Data Table */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-headline-md text-headline-md text-primary font-bold">Active Support Tickets</h3>
              <button 
                onClick={createTicket}
                className="bg-white border border-primary text-primary px-4 py-2 rounded-lg text-xs font-bold hover:bg-primary hover:text-white transition-all cursor-pointer"
              >
                New Ticket
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-primary/5 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-primary/5">
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Ticket ID</th>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Assigned To</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5">
                  {tickets.map((ticket, idx) => (
                    <tr 
                      key={idx}
                      onClick={() => showToast(`Viewing ticket detail for ${ticket.id}`, 'info')}
                      className="hover:bg-surface-container-low transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 font-mono text-sm text-primary font-bold">{ticket.id}</td>
                      <td className="px-6 py-4 font-bold text-sm text-on-surface">{ticket.subject}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-[10px] font-black rounded uppercase ${
                          ticket.priority === 'Critical' ? 'bg-error-container text-on-error-container' : 'bg-secondary-container text-on-secondary-container'
                        }`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${ticket.statusColor}`}></div>
                          <span className="text-sm text-on-surface font-semibold">{ticket.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant font-semibold">{ticket.assignee}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right Sidebar Content */}
        <div className="col-span-12 xl:col-span-3 space-y-8">
          {/* Support Status */}
          <div className="bg-white border border-primary/5 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-primary text-sm">System Health</h4>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                <span className="text-[10px] font-bold text-primary">LIVE</span>
              </div>
            </div>
            <div className="space-y-4 font-semibold text-xs text-on-surface-variant">
              <div className="flex items-center justify-between">
                <span>Auth Services</span>
                <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Messaging Engine</span>
                <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
              </div>
              <div className="flex items-center justify-between">
                <span>AI Processing</span>
                <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
              </div>
              <div className="flex items-center justify-between">
                <span>External API</span>
                <span className="material-symbols-outlined text-error text-sm">report</span>
              </div>
            </div>
          </div>

          {/* Contact Support */}
          <div className="space-y-3">
            <h4 className="font-bold text-primary text-sm px-1">Connect with Us</h4>
            <div 
              onClick={() => showToast('Opening Live Chat system...', 'success')}
              className="bg-white border border-primary/5 rounded-xl p-4 hover:border-primary/20 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-lg">chat</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-primary">24/7 Live Chat</p>
                  <p className="text-[10px] text-on-surface-variant font-bold">~2m response time</p>
                </div>
              </div>
            </div>
            <div 
              onClick={() => showToast('Paging your dedicated account manager...', 'success')}
              className="bg-white border border-primary/5 rounded-xl p-4 hover:border-primary/20 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-lg">support_agent</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-primary">Dedicated Manager</p>
                  <p className="text-[10px] text-on-surface-variant font-bold">Enterprise support only</p>
                </div>
              </div>
            </div>
          </div>

          {/* Download Center */}
          <div className="bg-surface-container-low rounded-2xl p-6">
            <h4 className="font-bold text-primary text-sm mb-4">Resources</h4>
            <div className="space-y-4 text-xs font-bold text-primary">
              <button 
                onClick={() => showToast('Downloading Employer User Guide PDF...', 'success')}
                className="flex items-center gap-3 group cursor-pointer bg-transparent border-none text-left w-full"
              >
                <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors text-xl">picture_as_pdf</span>
                <span className="group-hover:underline">Employer User Guide</span>
              </button>
              <button 
                onClick={() => showToast('Downloading Recruiter Handbook PDF...', 'success')}
                className="flex items-center gap-3 group cursor-pointer bg-transparent border-none text-left w-full"
              >
                <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors text-xl">picture_as_pdf</span>
                <span className="group-hover:underline">Recruiter Handbook</span>
              </button>
              <button 
                onClick={() => showToast('Downloading Security Whitepaper PDF...', 'success')}
                className="flex items-center gap-3 group cursor-pointer bg-transparent border-none text-left w-full"
              >
                <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors text-xl">security</span>
                <span className="group-hover:underline">Security Whitepaper</span>
              </button>
            </div>
          </div>

          {/* Bookmarks & Pinned */}
          <div className="space-y-3">
            <h4 className="font-bold text-primary text-sm px-1">Pinned Articles</h4>
            <div className="space-y-2 text-xs font-semibold">
              <button 
                onClick={() => showToast('Opening article: Setting up SSO for Enterprise', 'info')}
                className="block text-on-surface-variant hover:text-primary transition-colors cursor-pointer bg-transparent border-none text-left"
              >
                • Setting up SSO for Enterprise
              </button>
              <button 
                onClick={() => showToast('Opening article: Bulk inviting team members', 'info')}
                className="block text-on-surface-variant hover:text-primary transition-colors cursor-pointer bg-transparent border-none text-left"
              >
                • Bulk inviting team members
              </button>
              <button 
                onClick={() => showToast('Opening article: Reporting candidate experience', 'info')}
                className="block text-on-surface-variant hover:text-primary transition-colors cursor-pointer bg-transparent border-none text-left"
              >
                • Reporting candidate experience
              </button>
            </div>
          </div>

          {/* Feedback Section */}
          <form onSubmit={handleFeedbackSubmit} className="bg-white border border-primary/10 rounded-2xl p-6 text-center shadow-sm">
            <p className="text-sm font-bold text-primary mb-3">Was this page helpful?</p>
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((index) => {
                const fillStyle = rating >= index ? "'FILL' 1" : "'FILL' 0";
                return (
                  <span
                    key={index}
                    onClick={() => setRating(index)}
                    className={`material-symbols-outlined cursor-pointer transition-colors ${rating >= index ? 'text-yellow-500' : 'text-outline'}`}
                    style={{ fontVariationSettings: fillStyle }}
                  >
                    star
                  </span>
                );
              })}
            </div>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="w-full text-xs rounded-lg border-primary/10 bg-surface-container-low mb-3 resize-none focus:ring-primary h-20 p-2 text-on-surface placeholder:text-on-surface-variant/50 outline-none border"
              placeholder="Tell us more..."
            />
            <button 
              type="submit"
              className="w-full bg-primary text-white text-xs font-bold py-2 rounded-lg cursor-pointer hover:bg-primary/95 transition-colors border-none"
            >
              Submit Feedback
            </button>
          </form>
        </div>
      </div>

      {/* Footer / Community Section */}
      <section className="mt-section-gap border-t border-primary/10 pt-12 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="col-span-1 md:col-span-2">
            <h3 className="font-headline-md text-headline-md text-primary font-bold mb-6">Recent Community Discussions</h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-extrabold text-sm shrink-0">JD</div>
                <div>
                  <h5 className="text-sm font-bold text-primary mb-1">Effective ways to source passive engineering candidates?</h5>
                  <p className="text-xs text-on-surface-variant mb-2 font-medium">Replied by CareerBridge Admin • 2 hours ago</p>
                  <div className="flex gap-4 text-[10px] font-black text-primary uppercase">
                    <span onClick={() => showToast('Opening discussion replies...', 'info')} className="cursor-pointer hover:underline">12 Replies</span>
                    <span onClick={() => showToast('Joining community discussion...', 'success')} className="cursor-pointer hover:underline">Join Discussion</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-tertiary-container flex items-center justify-center text-on-tertiary-container font-extrabold text-sm shrink-0">KL</div>
                <div>
                  <h5 className="text-sm font-bold text-primary mb-1">Integrating CareerBridge with Workday HRIS</h5>
                  <p className="text-xs text-on-surface-variant mb-2 font-medium">Replied by Technical Support • 5 hours ago</p>
                  <div className="flex gap-4 text-[10px] font-black text-primary uppercase">
                    <span onClick={() => showToast('Opening discussion replies...', 'info')} className="cursor-pointer hover:underline">28 Replies</span>
                    <span onClick={() => showToast('Joining community discussion...', 'success')} className="cursor-pointer hover:underline">Join Discussion</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-headline-md text-headline-md text-primary font-bold mb-6">Product Updates</h3>
            <div className="space-y-4">
              <div className="border-l-2 border-primary pl-4 py-1">
                <span className="text-[10px] font-black text-primary/60 uppercase">March 2024</span>
                <h5 className="text-sm font-bold text-primary">New AI Interview Insight Panel</h5>
              </div>
              <div className="border-l-2 border-outline-variant/60 pl-4 py-1 opacity-70">
                <span className="text-[10px] font-black text-primary/60 uppercase">February 2024</span>
                <h5 className="text-sm font-bold text-primary">Enhanced GDPR Auto-Anonymization</h5>
              </div>
              <button 
                onClick={() => showToast('Opening product roadmap...', 'info')}
                className="text-xs font-bold text-primary mt-4 inline-block hover:underline cursor-pointer bg-transparent border-none"
              >
                View Roadmap →
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EmployerHelpCenter;
