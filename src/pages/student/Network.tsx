import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../../components/layout/PageLayout';
import { useToast } from '../../contexts/ToastContext';

export const Network: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Active tab selection
  const [activeTab, setActiveTab] = useState<'All' | 'Peers' | 'Recruiters' | 'Mentors' | 'Alumni' | 'Companies'>('All');

  // Connection pending states
  const [connectedIds, setConnectedIds] = useState<string[]>([]);
  const [registeredEventIds, setRegisteredEventIds] = useState<string[]>([]);

  const handleConnect = (id: string, name: string) => {
    if (connectedIds.includes(id)) {
      setConnectedIds(prev => prev.filter(x => x !== id));
      showToast(`Connection request cancelled for ${name}.`, 'info');
    } else {
      setConnectedIds(prev => [...prev, id]);
      showToast(`Connection invitation sent to ${name}!`, 'success');
    }
  };

  const handleRegister = (id: string, eventName: string) => {
    if (registeredEventIds.includes(id)) {
      showToast(`You are already registered for ${eventName}.`, 'info');
    } else {
      setRegisteredEventIds(prev => [...prev, id]);
      showToast(`Registered successfully for ${eventName}!`, 'success');
    }
  };

  return (
    <PageLayout>
      <main className="text-left max-w-container-max mx-auto space-y-stack-lg">
        
        {/* Header Section */}
        <section>
          <h2 className="text-display font-display text-primary leading-tight">Professional Network</h2>
          <p className="text-body-lg text-on-surface-variant max-w-2xl mt-2">
            Connect with students, alumni, recruiters and mentors who can accelerate your career.
          </p>
        </section>

        {/* Search & Filters */}
        <section>
          <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5 space-y-4">
            
            {/* Category selection */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'All', label: 'All Members' },
                { id: 'Peers', label: 'Students' },
                { id: 'Recruiters', label: 'Recruiters' },
                { id: 'Mentors', label: 'Mentors' },
                { id: 'Alumni', label: 'Alumni' },
                { id: 'Companies', label: 'Companies' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                    activeTab === tab.id 
                      ? 'bg-primary text-white border-transparent' 
                      : 'bg-secondary-container text-on-secondary-container border-transparent hover:bg-secondary-fixed'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2 pt-4 border-t border-outline-variant/10 items-center text-xs">
              <span className="text-on-surface-variant font-bold mr-2">Quick Filters:</span>
              
              <button onClick={() => showToast('Filtered mentors currently open for sessions.', 'info')} className="px-3 py-1.5 rounded-lg border border-outline-variant/30 text-on-surface-variant font-semibold hover:border-primary hover:text-primary transition-all flex items-center gap-1 cursor-pointer bg-white">
                <span className="material-symbols-outlined text-[16px]">school</span> Open to Mentor
              </button>

              <button onClick={() => showToast('Filtered recruiters with open job roles.', 'info')} className="px-3 py-1.5 rounded-lg border border-outline-variant/30 text-on-surface-variant font-semibold hover:border-primary hover:text-primary transition-all flex items-center gap-1 cursor-pointer bg-white">
                <span className="material-symbols-outlined text-[16px]">campaign</span> Hiring Now
              </button>

              <button onClick={() => showToast('Filtered officially verified company recruiters.', 'info')} className="px-3 py-1.5 rounded-lg border border-outline-variant/30 text-on-surface-variant font-semibold hover:border-primary hover:text-primary transition-all flex items-center gap-1 cursor-pointer bg-white">
                <span className="material-symbols-outlined text-[16px]">verified</span> Verified Recruiters
              </button>

              <button onClick={() => showToast('Filtered members with mutual connections.', 'info')} className="px-3 py-1.5 rounded-lg border border-outline-variant/30 text-on-surface-variant font-semibold hover:border-primary hover:text-primary transition-all flex items-center gap-1 cursor-pointer bg-white">
                <span className="material-symbols-outlined text-[16px]">group</span> Mutual Connections
              </button>

              <button onClick={() => showToast('Filtered recent university graduates.', 'info')} className="px-3 py-1.5 rounded-lg border border-outline-variant/30 text-on-surface-variant font-semibold hover:border-primary hover:text-primary transition-all flex items-center gap-1 cursor-pointer bg-white">
                <span className="material-symbols-outlined text-[16px]">history_edu</span> Recent Graduates
              </button>

              <button onClick={() => showToast('Opening industry filter selectors...', 'info')} className="px-3 py-1.5 rounded-lg border border-outline-variant/30 text-on-surface-variant font-semibold hover:border-primary hover:text-primary transition-all flex items-center gap-1 cursor-pointer bg-white">
                <span className="material-symbols-outlined text-[16px]">filter_list</span> Industry
              </button>
            </div>
          </div>
        </section>

        {/* Content columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          
          {/* Left Column (8 cols) */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            
            {/* Pending Requests */}
            <div className="bg-white p-6 rounded-2xl border border-primary/5 shadow-sm space-y-4 text-left text-xs">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-primary text-sm">Pending Connection Requests (2)</h3>
                <span className="bg-primary/10 text-primary font-bold px-2 py-0.5 rounded text-[10px]">Action Required</span>
              </div>
              <div className="space-y-3 font-semibold text-on-surface">
                {[
                  { name: 'Tanya Sen', role: 'Software Engineer @ Canva', mutual: '3 mutual connections' },
                  { name: 'Marcus Brody', role: 'Talent Acquisition @ Figma', mutual: '5 mutual connections' }
                ].map((req, i) => (
                  <div key={i} className="flex justify-between items-center gap-3 border-t border-primary/5 pt-3 first:border-none first:pt-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold font-display text-xs">
                        {req.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-primary text-xs leading-none">{req.name}</p>
                        <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">{req.role} • {req.mutual}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => showToast(`Connection invitation from ${req.name} accepted!`, 'success')}
                        className="px-3 py-1.5 bg-primary text-white font-bold rounded-lg cursor-pointer border-none text-[10px]"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => showToast(`Invitation from ${req.name} declined.`, 'info')}
                        className="px-3 py-1.5 bg-surface-container-high text-on-surface rounded-lg cursor-pointer border-none text-[10px]"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Network Suggestions */}
            {(activeTab === 'All' || activeTab === 'Peers') && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-headline-md font-headline-md text-primary flex items-center gap-2 font-bold">
                    <span className="material-symbols-outlined text-primary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    AI Network Suggestions
                  </h3>
                  <button onClick={() => showToast('Loading additional AI network recommendations...', 'info')} className="text-xs font-bold text-primary hover:underline cursor-pointer bg-transparent border-none">See more</button>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                  
                  {/* Sarah Chen */}
                  <div className="min-w-[340px] bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(2,54,41,0.04)] border-l-4 border-primary hover:shadow-xl transition-shadow relative overflow-hidden group border border-primary/5 text-xs text-left">
                    <div className="absolute top-4 right-4 bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">98% AI Match</div>
                    
                    <div className="flex items-start gap-4 mb-4">
                      <img className="w-16 h-16 rounded-xl object-cover border border-primary/10 shrink-0" alt="Sarah Chen" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCNbG4Dzdvo-HLbvMtCXNjEguQCPeeCfL-QxKopYDyIKPHTSvduqZm8FGGKBlLKv4HBAEtM8HnH6CYm9kwWhcKR3pDFyE34nnHUJTXvTEVEWDnV-s41S0eRfp_95Ng6ZRK1Wcy2ZP7VIu0l4PVLTFhumaD5UtmD8wVC2W5V0ZQ8p5T-ZmruwmnAoQc4mXGV9Jy9glYRZN44Kl2EfOiVXYZ3qEsxQVQMWYAXQ2SlLXXp0OjYnWXLHr34aT-Uv7adddQ9ZrBDy4UpmFE" />
                      <div>
                        <h4 className="font-bold text-primary text-sm leading-tight">Sarah Chen</h4>
                        <p className="text-on-surface-variant font-medium mt-0.5">Tech Recruiter @ Stripe</p>
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-outline font-semibold">
                          <span className="material-symbols-outlined text-primary text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                          Verified • 96% Response
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-surface-container-low p-2.5 rounded-lg">
                        <p className="text-[9px] text-on-surface-variant uppercase font-bold">Mutuals</p>
                        <p className="font-bold text-primary mt-0.5">12 Connections</p>
                      </div>
                      <div className="bg-surface-container-low p-2.5 rounded-lg">
                        <p className="text-[9px] text-on-surface-variant uppercase font-bold">Shared Goal</p>
                        <p className="font-bold text-primary mt-0.5">AI Infrastructure</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="font-bold text-primary mb-1 uppercase tracking-wider text-[9px]">Recommendation Reason</p>
                      <div className="bg-primary/5 p-3 rounded-lg text-on-surface-variant italic font-medium">
                        "Both interested in Cloud Computing & Cloud Native Architecture."
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-6">
                      <span className="px-3 py-1 bg-secondary-container/40 rounded-full font-semibold text-on-secondary-container">#Kubernetes</span>
                      <span className="px-3 py-1 bg-secondary-container/40 rounded-full font-semibold text-on-secondary-container">#StripeJobs</span>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleConnect('sarah_chen', 'Sarah Chen')}
                        className={`flex-1 py-2 rounded-lg font-bold transition-all cursor-pointer border-none text-white ${
                          connectedIds.includes('sarah_chen') ? 'bg-primary-container text-primary-fixed' : 'bg-primary'
                        }`}
                      >
                        {connectedIds.includes('sarah_chen') ? 'Pending' : 'Connect'}
                      </button>
                      <button 
                        onClick={() => navigate('/student/messages')}
                        className="px-3 py-2 border border-primary/10 rounded-lg text-primary hover:bg-primary/5 cursor-pointer bg-white flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-[18px]">mail</span>
                      </button>
                    </div>
                  </div>

                  {/* Dr. Julian Voss */}
                  <div className="min-w-[340px] bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(2,54,41,0.04)] border-l-4 border-primary hover:shadow-xl transition-shadow relative overflow-hidden group border border-primary/5 text-xs text-left">
                    <div className="absolute top-4 right-4 bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">94% AI Match</div>
                    
                    <div className="flex items-start gap-4 mb-4">
                      <img className="w-16 h-16 rounded-xl object-cover border border-primary/10 shrink-0" alt="Dr. Julian Voss" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBnyUSw-OwzJHvjeN_iRQJw0gBLYzqByifLU3orpF9Zq_HilHzr59pCT6tI2HYBkSVhg5hjDlQlcYfmxOJfj2UxrVPuXruZyHItr_6TmzA3VqYCTAEHnrVLZt-5jHErdwPqdYbI2YbkoL8h6Asmt851F64JjgMrSawDLdRXcg3786Ao2G47DhKbB7P7dtvosdAlXwqEJ6HbMYSlFWGA3k8y7Jn09pCR-8Tep7WGIVarFrfJwEeCwcMp4c5vxlNqYTVbI29fZnB6328" />
                      <div>
                        <h4 className="font-bold text-primary text-sm leading-tight">Dr. Julian Voss</h4>
                        <p className="text-on-surface-variant font-medium mt-0.5">Staff Engineer @ Google</p>
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-outline font-semibold">
                          <span className="material-symbols-outlined text-primary text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                          Verified Mentor • 89% Resp.
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-surface-container-low p-2.5 rounded-lg">
                        <p className="text-[9px] text-on-surface-variant uppercase font-bold">Mutuals</p>
                        <p className="font-bold text-primary mt-0.5">8 Connections</p>
                      </div>
                      <div className="bg-surface-container-low p-2.5 rounded-lg">
                        <p className="text-[9px] text-on-surface-variant uppercase font-bold">Shared Goal</p>
                        <p className="font-bold text-primary mt-0.5">Scalable Systems</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="font-bold text-primary mb-1 uppercase tracking-wider text-[9px]">Recommendation Reason</p>
                      <div className="bg-primary/5 p-3 rounded-lg text-on-surface-variant italic font-medium">
                        "Expert in Distributed Systems. Mentor for graduate students entering Big Tech."
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-6">
                      <span className="px-3 py-1 bg-secondary-container/40 rounded-full font-semibold text-on-secondary-container">#Scale</span>
                      <span className="px-3 py-1 bg-secondary-container/40 rounded-full font-semibold text-on-secondary-container">#Go</span>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleConnect('julian_voss', 'Dr. Julian Voss')}
                        className={`flex-1 py-2 rounded-lg font-bold transition-all cursor-pointer border-none text-white ${
                          connectedIds.includes('julian_voss') ? 'bg-primary-container text-primary-fixed' : 'bg-primary'
                        }`}
                      >
                        {connectedIds.includes('julian_voss') ? 'Pending' : 'Connect'}
                      </button>
                      <button 
                        onClick={() => navigate('/student/profile')}
                        className="px-3 py-2 border border-primary/10 rounded-lg text-primary hover:bg-primary/5 cursor-pointer bg-white flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-[18px]">person</span>
                      </button>
                    </div>
                  </div>

                </div>
              </section>
            )}

            {/* Featured Mentors */}
            {(activeTab === 'All' || activeTab === 'Mentors') && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-headline-md font-headline-md text-primary font-bold">Featured Mentors</h3>
                  <div className="flex gap-2">
                    <button onClick={() => showToast('Scrolling featured mentors list left.', 'info')} className="w-10 h-10 rounded-full border border-primary/10 flex items-center justify-center hover:bg-primary/5 transition-colors cursor-pointer bg-white">
                      <span className="material-symbols-outlined text-lg">chevron_left</span>
                    </button>
                    <button onClick={() => showToast('Scrolling featured mentors list right.', 'info')} className="w-10 h-10 rounded-full border border-primary/10 flex items-center justify-center hover:bg-primary/5 transition-colors cursor-pointer bg-white">
                      <span className="material-symbols-outlined text-lg">chevron_right</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Elena Rodriguez */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-primary/5 flex flex-col gap-4 hover:shadow-md transition-shadow text-xs text-left">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-3">
                        <img className="w-12 h-12 rounded-full object-cover shrink-0 border" alt="Elena Rodriguez" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAHZ-UQ6_MU_mhN7zuABCi3BQH7kschXa0SxJNx2q4Eit-NBC8av5PU2zUeMhdS0x4wa2Qjjxw-hiLgoGQwN5YKCaSd0Mu93uUS4bTWAPA0alEUI6tT3iWpnObYwRcpM_P3A9dEfBAjFrbVx59_rj4wkjK9OPohY-xJyRD6PFAlqiM3TjdG1gpGsCOxmcB6R31i6Gx_r_YsTlVSTEi6MkZYjdnq-V7bW8JAHPGNscl1LyLMpFe7Kc5uMMfDELFfpHfPfky4An18cc8" />
                        <div>
                          <h5 className="font-bold text-primary text-sm leading-tight">Elena Rodriguez</h5>
                          <p className="text-on-surface-variant font-medium mt-0.5">VP Product @ Fintech Corp</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex items-center text-primary font-bold text-xs"><span className="material-symbols-outlined text-[16px] text-orange-400 mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>star</span> 4.9</div>
                        <span className="bg-[#ece2cb] text-[#201b0d] px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-tighter block mt-1">Available Today</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-on-surface-variant font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">work_history</span> 12+ Years Exp.
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">payments</span> Fintech Industry
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">event_available</span> 3 Slots Left
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">verified</span> 45 Mentorships
                      </div>
                    </div>
                    
                    <p className="text-on-surface-variant italic font-medium leading-relaxed">
                      "Passionate about helping first-gen students break into product management and fintech roles."
                    </p>
                    <button 
                      onClick={() => showToast('Mentoring session booked with Elena Rodriguez successfully!', 'success')}
                      className="w-full py-3 bg-secondary-container text-on-secondary-container font-bold rounded-xl hover:bg-secondary-fixed transition-colors cursor-pointer border-none text-xs"
                    >
                      Book Session
                    </button>
                  </div>

                  {/* Marcus Thorne */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-primary/5 flex flex-col gap-4 hover:shadow-md transition-shadow text-xs text-left">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-3">
                        <img className="w-12 h-12 rounded-full object-cover shrink-0 border" alt="Marcus Thorne" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC8QJlBQoEKt75CoKq_BKlzoM8wcmunpueL4qe94leyNXPXbepxZiiiEMLHF8oA_NNwd0iLniFhaIUBWClNhFGDhGrBSrxYEpzZW2vYxCr63_xJ8NYAeR7rjbcA0KexHzQOWFZ7ueVLq1IDMpolV-jObW8wsv1jpfOqrBnpPt6P-OF1LFN-jLBgWu4bLrlL-tVV8SZAOQ-Vha8XIcWyjdFRQsqrqSmUHyrtKQmAJePKK17_LplR6wbSf0N_zBBHaSsa_H7yIjozg_A" />
                        <div>
                          <h5 className="font-bold text-primary text-sm leading-tight">Marcus Thorne</h5>
                          <p className="text-on-surface-variant font-medium mt-0.5">Creative Director @ Meta</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex items-center text-primary font-bold text-xs"><span className="material-symbols-outlined text-[16px] text-orange-400 mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>star</span> 5.0</div>
                        <span className="bg-outline-variant/20 text-on-surface-variant px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-tighter block mt-1">Next Week</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-on-surface-variant font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">work_history</span> 15+ Years Exp.
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">palette</span> Design Industry
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">event_available</span> 5 Slots Left
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">verified</span> 120 Mentorships
                      </div>
                    </div>
                    
                    <p className="text-on-surface-variant italic font-medium leading-relaxed">
                      "Portfolio reviews and career pivoting into UX/UI and Design Management."
                    </p>
                    <button 
                      onClick={() => showToast('Mentoring session booked with Marcus Thorne successfully!', 'success')}
                      className="w-full py-3 bg-secondary-container text-on-secondary-container font-bold rounded-xl hover:bg-secondary-fixed transition-colors cursor-pointer border-none text-xs"
                    >
                      Book Session
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* Verified Recruiters */}
            {(activeTab === 'All' || activeTab === 'Recruiters') && (
              <section className="space-y-4">
                <h3 className="text-headline-md font-headline-md text-primary font-bold">Verified Recruiters</h3>
                <div className="space-y-3">
                  
                  {/* Jordan Smith */}
                  <div className="bg-white p-5 rounded-2xl border border-primary/5 flex flex-col md:flex-row md:items-center justify-between hover:shadow-md transition-shadow gap-4 text-xs text-left">
                    <div className="flex items-center gap-4">
                      <img className="w-14 h-14 rounded-lg object-cover shrink-0" alt="Jordan Smith" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCjPJb5fjqnSCHJmopRvreRYhlVAw8vkXfqkGYfkpO5SgTGEpzCeVBf1U-fnqGvW7AUeB9qky2033sbqH-Mz4QWo0b91fFYD06iRPO6ePU5WFdw_qx-Qi3QHHwZ905DBfLXwF3kzoivx3BYB5IqEBw1Ajc2bqtecpUB1Ebljakhi3KweOIwqg_s-Kvgc5C-BXhW9KIXS5ZeOzVUM05zT7dr4gKiPe6mQNQFyuLt2edMMGArHNy0ZYPFaCzNlGb4wWihYO6SQy-m9Rs" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h6 className="font-bold text-primary text-sm leading-tight">Jordan Smith</h6>
                          <span className="material-symbols-outlined text-primary text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                        </div>
                        <p className="text-on-surface-variant font-medium mt-0.5">Recruiter @ Amazon Web Services</p>
                        <div className="flex items-center gap-3 text-[11px] font-semibold text-outline mt-1">
                          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">timer</span> 2h Response</span>
                          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">star</span> 4.5 Rating</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6">
                      <div className="text-right">
                        <p className="text-[10px] text-outline font-bold uppercase tracking-wider">Hiring For</p>
                        <p className="font-bold text-primary">Cloud Engineers</p>
                        <p className="text-[11px] text-primary font-bold mt-0.5">12 Open Roles</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => navigate('/student/jobs')} className="bg-surface-container-high text-primary px-4 py-2 rounded-lg font-bold cursor-pointer border-none">View Company</button>
                        <button onClick={() => navigate('/student/messages')} className="bg-primary-container text-primary-fixed px-4 py-2 rounded-lg font-bold hover:scale-105 transition-transform cursor-pointer border-none">Message</button>
                      </div>
                    </div>
                  </div>

                  {/* Alicia Wong */}
                  <div className="bg-white p-5 rounded-2xl border border-primary/5 flex flex-col md:flex-row md:items-center justify-between hover:shadow-md transition-shadow gap-4 text-xs text-left">
                    <div className="flex items-center gap-4">
                      <img className="w-14 h-14 rounded-lg object-cover shrink-0" alt="Alicia Wong" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAYt6gPgrzlWVOR88gZN2T1ahDuUOEJzUSFGeSyRClf7LOxjS1GcjxCqG69pGDHZ2Okkx8Kk-pmu2gfnNgZaIV3jGKQB0daCVqNcL3aRAPMKBGmMd8--B1-9K0EJ3OUZ-hXhxOiEBOFc7R2jR5CW2FUTv_GMdLomFMtH84dSa0Gpf5JEoXO7b8T4wOF8eL3NYu-k4vgOkRv5AMEz7asWVb5s17smXNHs4ggobXKNlBleL46ce_r4SlwXiU_bN5Sihlaru9W9bkXOJw" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h6 className="font-bold text-primary text-sm leading-tight">Alicia Wong</h6>
                          <span className="material-symbols-outlined text-primary text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                        </div>
                        <p className="text-on-surface-variant font-medium mt-0.5">Graduate Lead @ Deloitte</p>
                        <div className="flex items-center gap-3 text-[11px] font-semibold text-outline mt-1">
                          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">timer</span> 4h Response</span>
                          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">star</span> 4.8 Rating</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6">
                      <div className="text-right">
                        <p className="text-[10px] text-outline font-bold uppercase tracking-wider">Hiring For</p>
                        <p className="font-bold text-primary">Assoc. Consultants</p>
                        <p className="text-[11px] text-primary font-bold mt-0.5">34 Open Roles</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => navigate('/student/jobs')} className="bg-surface-container-high text-primary px-4 py-2 rounded-lg font-bold cursor-pointer border-none">View Company</button>
                        <button onClick={() => navigate('/student/messages')} className="bg-primary-container text-primary-fixed px-4 py-2 rounded-lg font-bold hover:scale-105 transition-transform cursor-pointer border-none">Message</button>
                      </div>
                    </div>
                  </div>

                </div>
              </section>
            )}

            {/* Recommended Communities */}
            <section className="space-y-4">
              <h3 className="text-headline-md font-headline-md text-primary font-bold">Recommended Communities</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-left">
                {[
                  { title: 'Open Source Projects', desc: 'Contribute to live codebases with 200+ active student developers.', icon: 'code' },
                  { title: 'Study Groups', desc: 'Find peers for LeetCode, GRE, or Certification prep.', icon: 'groups' },
                  { title: 'Technical Clubs', desc: 'Join AI, Cybersecurity, or Fintech focused student associations.', icon: 'terminal' },
                  { title: 'Volunteer Opportunities', desc: 'Tech-for-good projects with local non-profits and charities.', icon: 'volunteer_activism' }
                ].map(group => (
                  <div 
                    key={group.title}
                    onClick={() => showToast(`Opening technical group: ${group.title}`, 'info')}
                    className="bg-surface-container p-5 rounded-2xl border border-primary/5 flex gap-4 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined text-xl">{group.icon}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-primary text-sm leading-tight">{group.title}</h4>
                      <p className="text-on-surface-variant font-medium mt-1 leading-relaxed">{group.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>

          {/* Right Column (4 cols) */}
          <aside className="col-span-12 lg:col-span-4 space-y-6 text-xs text-left">
            
            {/* Network Analytics Scorecard */}
            <div className="bg-[#001f16] text-[#f9faf7] p-8 rounded-3xl relative overflow-hidden shadow-lg">
              <div className="relative z-10 space-y-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-headline-md font-bold">Network Score: 84</h3>
                  <div className="w-12 h-12 rounded-full border-2 border-primary-fixed-dim/30 flex items-center justify-center font-bold text-sm">A+</div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-primary-fixed-dim uppercase tracking-widest font-bold text-[9px] mb-1">Total Connections</p>
                    <div className="flex items-end gap-2">
                      <p className="text-3xl font-extrabold leading-none">284</p>
                      <p className="text-primary-fixed-dim flex items-center gap-0.5 mb-0.5 font-bold">
                        <span className="material-symbols-outlined text-[14px]">trending_up</span> +12%
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-4 font-bold">
                    <div>
                      <p className="text-[9px] text-primary-fixed-dim/60 uppercase">Recruiters</p>
                      <p className="text-sm mt-0.5">12</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-primary-fixed-dim/60 uppercase">Mentors</p>
                      <p className="text-sm mt-0.5">8</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-primary-fixed-dim/60 uppercase">Alumni</p>
                      <p className="text-sm mt-0.5">412</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary-fixed-dim/10 rounded-full blur-3xl" />
            </div>

            {/* Networking Activity Feed */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-primary/5 space-y-4">
              <h3 className="font-bold text-primary uppercase tracking-wider text-[11px]">Networking Activity Feed</h3>
              <div className="space-y-3 text-xs text-on-surface font-semibold leading-relaxed">
                <div className="flex gap-2 items-start">
                  <span className="material-symbols-outlined text-sm text-primary shrink-0">circle_notifications</span>
                  <p>Elena Rodriguez published a post: <span className="italic font-bold">"Just finished the React 19 track on CareerBridge!"</span></p>
                </div>
                <div className="flex gap-2 items-start border-t border-primary/5 pt-2">
                  <span className="material-symbols-outlined text-sm text-primary shrink-0">circle_notifications</span>
                  <p>Google recruiter shared a new job opening: <span className="font-bold">Cloud Architect</span></p>
                </div>
              </div>
            </div>

            {/* Upcoming Career Events */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-primary/5">
              <h3 className="font-bold text-primary uppercase tracking-wider mb-6">Upcoming Events</h3>
              
              <div className="space-y-6">
                {[
                  { id: 'stripe_fair', title: 'Stripe Engineering Fair', day: '14', deadline: 'Sep 12', seats: '12 seats left' },
                  { id: 'alumni_night', title: 'Alumni Networking Night', day: '18', deadline: 'Sep 16', seats: '45 seats left' }
                ].map(evt => (
                  <div key={evt.id} className="flex gap-4 group cursor-pointer">
                    <div className="w-12 h-12 bg-secondary-container rounded-xl flex flex-col items-center justify-center text-on-secondary-container shrink-0">
                      <span className="text-[9px] font-bold leading-none uppercase">SEP</span>
                      <span className="font-bold text-lg leading-none mt-0.5">{evt.day}</span>
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-bold text-primary group-hover:text-surface-tint transition-colors text-sm leading-snug">{evt.title}</h4>
                      <div className="flex flex-col gap-0.5 mt-1 font-semibold text-on-surface-variant">
                        <p className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">timer</span> Deadline: {evt.deadline}</p>
                        <p className="text-error font-bold flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">event_seat</span> {evt.seats}</p>
                      </div>
                      
                      <button 
                        onClick={() => handleRegister(evt.id, evt.title)}
                        className={`mt-3 w-full py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                          registeredEventIds.includes(evt.id)
                            ? 'bg-primary text-white border-transparent'
                            : 'bg-primary/5 text-primary border-primary/10 hover:bg-primary hover:text-white'
                        }`}
                      >
                        {registeredEventIds.includes(evt.id) ? 'Registered' : 'Register Now'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => showToast('Opening complete events catalog...', 'info')}
                className="w-full mt-6 py-3 border border-primary/10 rounded-xl font-bold text-primary hover:bg-primary/5 transition-all cursor-pointer bg-white"
              >
                View All Events
              </button>
            </div>

            {/* Top Hiring Companies list */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-primary/5">
              <h3 className="font-bold text-primary uppercase tracking-wider mb-4">Top Hiring Companies</h3>
              
              <div className="space-y-4 font-bold text-primary">
                {[
                  { name: 'Google', char: 'G', tag: 'Hiring Now', active: true },
                  { name: 'Microsoft', char: 'M', tag: 'Hiring Now', active: true },
                  { name: 'Amazon', char: 'A', tag: 'Hiring Now', active: true },
                  { name: 'Zoho', char: 'Z', tag: 'Pool Open', active: false },
                  { name: 'Infosys', char: 'I', tag: 'Hiring Now', active: true }
                ].map(comp => (
                  <div 
                    key={comp.name}
                    onClick={() => navigate('/student/jobs')}
                    className="flex items-center justify-between group cursor-pointer hover:bg-surface-container/30 p-1 rounded transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-surface-container-high rounded-lg flex items-center justify-center font-bold text-primary text-xs shrink-0">{comp.char}</div>
                      <span className="font-bold text-primary text-xs">{comp.name}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase shrink-0 ${
                      comp.active ? 'bg-primary/10 text-primary' : 'bg-outline-variant/30 text-on-surface-variant'
                    }`}>
                      {comp.tag}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stanford Alumni list card */}
            <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm overflow-hidden shrink-0 border">
                  <img className="w-8 h-8 object-contain" alt="Stanford University Logo" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQa_Haunwby-rPkvy_K7oDNEbq7fYO4d_vOgWXuGcSDg2Y5bberhdY1SY87Dy4qdDvXDZrcNdts0uI0Q4tC1cyivWKR1ExvS5LLY8OflgeejxE9uQ1cPeceEe7JUq9VjseAX73Oc9ceURYOxsZfoDb1ARUj_7bHiyxLLir6xdVJtK1SyLLJnXBs-Yarx6mg2S7DMywqFBqNEgYuy39PfNY-sL1CjReHqSMotpvDOWesN3EAV4kGfm4MoqZghN-rRGfQlZomBl1tkU" />
                </div>
                <div>
                  <h4 className="font-bold text-primary text-xs leading-tight">Stanford Alumni</h4>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">412 Members on CareerBridge</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex -space-x-3 overflow-hidden">
                  <div className="inline-block h-8 w-8 rounded-full border-2 border-surface-container-low bg-slate-200" />
                  <div className="inline-block h-8 w-8 rounded-full border-2 border-surface-container-low bg-slate-300" />
                  <div className="h-8 w-8 rounded-full bg-primary-fixed-dim text-on-primary-fixed text-[10px] flex items-center justify-center font-bold border-2 border-surface-container-low">+409</div>
                </div>
                <p className="text-[10px] text-on-surface-variant font-semibold">Recently joined</p>
              </div>
            </div>

          </aside>

        </div>
      </main>
    </PageLayout>
  );
};

export default Network;
