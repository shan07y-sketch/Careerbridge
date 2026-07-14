import React, { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';

interface SupportTicket {
  id: string;
  subject: string;
  priority: 'High' | 'Medium' | 'Low';
  status: string;
}

interface ChatMessage {
  sender: 'ai' | 'user';
  text: string;
}

export const UniversityHelpCenter: React.FC = () => {
  const { showToast } = useToast();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Bookmarked status
  const [bookmarkedArticle1, setBookmarkedArticle1] = useState(false);
  const [bookmarkedArticle2, setBookmarkedArticle2] = useState(true);

  // Tickets state
  const [tickets, setTickets] = useState<SupportTicket[]>([
    { id: '#PH-2041', subject: 'Unable to sync Google Calendar with Drive Schedule', priority: 'High', status: 'In Progress' },
    { id: '#PH-2038', subject: 'Custom Report Export failing for large datasets', priority: 'Medium', status: 'Open' }
  ]);

  // Ticket modal state
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketPriority, setTicketPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [ticketDescription, setTicketDescription] = useState('');

  // AI chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { sender: 'ai', text: 'Hello Sarah! I can help you find documentation, troubleshoot errors, or explain new features. How can I assist you today?' }
  ]);
  const [chatInput, setChatInput] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      showToast(`Searching support database for: "${searchQuery}"`, 'success');
    }
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');
    setTimeout(() => {
      let reply = "I've searched our Help docs. Could you please clarify if this relates to the student dashboard or API settings?";
      if (userMsg.toLowerCase().includes('csv') || userMsg.toLowerCase().includes('upload')) {
        reply = "For bulk student imports, ensure your CSV uses the templates pinned in the sidebar resources. Column headers must match exactly.";
      } else if (userMsg.toLowerCase().includes('calendar') || userMsg.toLowerCase().includes('google')) {
        reply = "Google Calendar sync can be re-authorized inside Settings → Integrations → Google Workspace by toggling the connection status.";
      } else if (userMsg.toLowerCase().includes('sso') || userMsg.toLowerCase().includes('login')) {
        reply = "SAML SSO settings require Super Admin credentials. Navigate to Settings → Security tab to upload your corporate identity provider metadata.";
      }
      setChatMessages(prev => [...prev, { sender: 'ai', text: reply }]);
      showToast('AI response generated.', 'info');
    }, 800);
  };

  const handleCreateTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim()) {
      showToast('Validation Error: Ticket Subject is required.', 'error');
      return;
    }
    const newTicket: SupportTicket = {
      id: `#PH-${Math.floor(1000 + Math.random() * 9000)}`,
      subject: ticketSubject.trim(),
      priority: ticketPriority,
      status: 'Open'
    };
    setTickets(prev => [newTicket, ...prev]);
    setShowCreateTicketModal(false);
    setTicketSubject('');
    setTicketDescription('');
    showToast(`Support Ticket ${newTicket.id} created successfully!`, 'success');
  };

  return (
    <div className="w-full text-left relative">

      {/* ── Help Center Header Section ────────────────────────────────── */}
      <div className="relative py-6 overflow-hidden mb-2">
        <div className="relative z-10">
          {/* Title Row */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
            <div className="max-w-2xl">
              <span className="inline-block px-3 py-1 bg-primary-container text-primary-fixed text-label-sm rounded-full mb-4">
                University Support &amp; Docs
              </span>
              <h2 className="font-display text-display text-primary leading-tight">Help Center</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">
                Find guides, tutorials, FAQs, documentation, AI assistance, and technical support to power your career bridge journey.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 shrink-0">
              <button
                onClick={() => showToast('Downloading CareerBridge Admin User Guide (PDF)...', 'success')}
                className="bg-white border border-outline-variant px-5 py-2.5 rounded-xl text-label-md hover:bg-surface-container-low transition-all flex items-center gap-2 cursor-pointer font-bold"
              >
                <span className="material-symbols-outlined text-[18px]">download</span> Download User Guide
              </button>
              <button
                onClick={() => setShowCreateTicketModal(true)}
                className="bg-primary text-on-primary px-6 py-2.5 rounded-xl text-label-md font-bold shadow-lg hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer border-none"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span> Create Support Ticket
              </button>
            </div>
          </div>

          {/* Global Search */}
          <div className="max-w-4xl mx-auto mt-4 mb-8">
            <form
              onSubmit={handleSearchSubmit}
              className="relative p-2 bg-white rounded-2xl shadow-xl border border-outline-variant/20 flex items-center group focus-within:shadow-primary/10 focus-within:ring-4 focus-within:ring-primary/10 transition-all"
            >
              <div className="flex-1 flex items-center gap-4 px-4">
                <span className="material-symbols-outlined text-primary text-[28px] shrink-0">search</span>
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full border-none focus:ring-0 text-body-lg placeholder:text-on-surface-variant/40 bg-transparent outline-none"
                  placeholder="Search guides, documentation, features, FAQs..."
                  type="text"
                />
              </div>
              <div className="flex items-center gap-2 pr-2 shrink-0">
                <button
                  type="button"
                  onClick={() => showToast('Voice search activated...', 'info')}
                  className="p-3 text-on-surface-variant hover:text-primary transition-colors bg-transparent border-none cursor-pointer flex"
                >
                  <span className="material-symbols-outlined">mic</span>
                </button>
                <button
                  type="submit"
                  className="bg-primary-container text-on-primary-container px-6 py-3 rounded-xl font-bold text-label-md border-none cursor-pointer"
                >
                  Search
                </button>
              </div>
            </form>

            <div className="flex justify-center gap-6 mt-4 text-label-sm text-on-surface-variant flex-wrap">
              <span>Trending:&nbsp;
                <button
                  onClick={() => { setSearchQuery('Bulk Upload Students'); showToast('Searching for: Bulk Upload Students', 'info'); }}
                  className="text-primary hover:underline bg-transparent border-none cursor-pointer font-bold p-0"
                >
                  Bulk Upload Students
                </button>
              </span>
              <span>•</span>
              <span>
                <button
                  onClick={() => { setSearchQuery('API Webhooks'); showToast('Searching for: API Webhooks', 'info'); }}
                  className="text-primary hover:underline bg-transparent border-none cursor-pointer font-bold p-0"
                >
                  API Webhooks
                </button>
              </span>
              <span>•</span>
              <span>
                <button
                  onClick={() => { setSearchQuery('Drive Reporting'); showToast('Searching for: Drive Reporting', 'info'); }}
                  className="text-primary hover:underline bg-transparent border-none cursor-pointer font-bold p-0"
                >
                  Drive Reporting
                </button>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Grid Layout ──────────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-gutter pb-section-gap">

        {/* ── Left Column (8 cols) ──────────────────────────────────── */}
        <div className="col-span-12 lg:col-span-8 space-y-12">

          {/* Knowledge Categories */}
          <div>
            <h3 className="text-headline-md font-headline-md text-primary mb-6">Knowledge Categories</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1 */}
              <div
                onClick={() => { setSearchQuery('Getting Started'); showToast('Opening category: Getting Started...', 'info'); }}
                className="bg-white p-6 rounded-2xl border border-outline-variant/20 hover:shadow-md transition-shadow group cursor-pointer"
              >
                <div className="w-12 h-12 bg-secondary-container/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
                </div>
                <h4 className="font-bold text-body-lg text-primary">Getting Started</h4>
                <p className="text-label-md text-on-surface-variant mt-2 leading-relaxed">New to Placement Hub? Start with our 5-minute quickstart guide.</p>
              </div>

              {/* Card 2 */}
              <div
                onClick={() => { setSearchQuery('Campus Drives'); showToast('Opening category: Campus Drives...', 'info'); }}
                className="bg-white p-6 rounded-2xl border border-outline-variant/20 hover:shadow-md transition-shadow group cursor-pointer"
              >
                <div className="w-12 h-12 bg-secondary-container/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>event_seat</span>
                </div>
                <h4 className="font-bold text-body-lg text-primary">Campus Drives</h4>
                <p className="text-label-md text-on-surface-variant mt-2 leading-relaxed">Management of schedules, student shortlisting, and drive logistics.</p>
              </div>

              {/* Card 3 */}
              <div
                onClick={() => { setSearchQuery('AI Services'); showToast('Opening category: AI Services...', 'info'); }}
                className="bg-white p-6 rounded-2xl border border-outline-variant/20 hover:shadow-md transition-shadow group cursor-pointer"
              >
                <div className="w-12 h-12 bg-secondary-container/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>neurology</span>
                </div>
                <h4 className="font-bold text-body-lg text-primary">AI Services</h4>
                <p className="text-label-md text-on-surface-variant mt-2 leading-relaxed">Leveraging Bridge AI for resume analysis and student matching.</p>
              </div>
            </div>
          </div>

          {/* Video Tutorials */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-headline-md font-headline-md text-primary">Video Tutorials</h3>
              <button
                onClick={() => showToast('Opening video masterclass library...', 'info')}
                className="text-primary text-label-md font-bold hover:underline bg-transparent border-none cursor-pointer p-0"
              >
                View All Masterclass
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Video 1 */}
              <div
                onClick={() => showToast('Loading: Configuring Advanced Analytics...', 'info')}
                className="group cursor-pointer"
              >
                <div className="relative rounded-2xl overflow-hidden aspect-video mb-3">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDuLIF3qZw-g5KuBfsJHyfVNj1H6UT75H1KCgpE79jcb0lAMMwwIjMcvxe4rfMOqd2QgTZon6IWzRQX8aJaUqTWmskZmGv-EIDYTXIH3cDvmcEWAlB9358Pw6J8RlidrWz4gyN59kKUA43m0u57QXJbw5WxchY-UP_FHUg7JG4f2rCD_MaJrczEEYZ_4dkRODbWcTrS-tn28jagzta8o_vsg0QuZ0wbWSpwbMO4sAQJWJV5suOZq2re"
                    alt="SaaS Analytics Dashboard"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all flex items-center justify-center">
                    <div className="w-14 h-14 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-all">
                      <span className="material-symbols-outlined text-primary text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                    </div>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded text-[10px] font-bold">12:45</div>
                </div>
                <h4 className="font-bold text-body-md text-primary">Configuring Advanced Analytics for Recruitment Rounds</h4>
                <div className="mt-2 w-full bg-surface-container-high h-1 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-2/3"></div>
                </div>
                <p className="text-label-sm text-on-surface-variant mt-2">65% Completed</p>
              </div>

              {/* Video 2 */}
              <div
                onClick={() => showToast('Loading: Mastering Resume Scanner...', 'info')}
                className="group cursor-pointer"
              >
                <div className="relative rounded-2xl overflow-hidden aspect-video mb-3">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCLaGc-8a791KLoKYhSS6HvoiKeFJtpFKPVhYwoQQMDOt9M80LTg4120M3yo8-PEI_5MYsYu-xvOoQvQ5m2tbXeaYxLwa7G3lmRE2SjACqTKz2n_jG11k_JFlB8k9txjuGUmnilXNECa-pRb_8mpxbMSFr_Kgcc76Vz6dS_YXj2msKeQtezMIYbkIyOPeTDcbEL2f0WIXOuhkpKR5bXqg1QK6jReILwtIiiBF8yxmveVV9GIMx0FZGG"
                    alt="AI Resume Scanner Interface"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all flex items-center justify-center">
                    <div className="w-14 h-14 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-all">
                      <span className="material-symbols-outlined text-primary text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                    </div>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded text-[10px] font-bold">08:12</div>
                </div>
                <h4 className="font-bold text-body-md text-primary">Mastering the Bridge AI Resume Scanner 2.0</h4>
                <div className="mt-2 w-full bg-surface-container-high h-1 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-0"></div>
                </div>
                <p className="text-label-sm text-on-surface-variant mt-2">Not Started</p>
              </div>
            </div>
          </div>

          {/* Popular Documentation */}
          <div>
            <h3 className="text-headline-md font-headline-md text-primary mb-6">Popular Documentation</h3>
            <div className="space-y-4">
              {/* Article 1 */}
              <div
                onClick={() => showToast('Opening records migration article...', 'info')}
                className="bg-white p-5 rounded-2xl border border-outline-variant/20 flex items-center gap-6 hover:border-primary/20 transition-all cursor-pointer group"
              >
                <div className="hidden sm:flex w-14 h-14 bg-surface-container-low rounded-xl items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary">article</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-secondary-container/40 text-on-secondary-container text-[10px] font-bold rounded uppercase">Data Migration</span>
                    <span className="text-on-surface-variant text-[12px]">8 min read</span>
                  </div>
                  <h4 className="font-bold text-body-lg text-primary group-hover:text-on-primary-container transition-colors">
                    Importing Student Records from External LMS Systems
                  </h4>
                  <p className="text-label-md text-on-surface-variant line-clamp-1 mt-1">
                    Step-by-step technical guide for CSV mapping and error resolution during bulk imports.
                  </p>
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setBookmarkedArticle1(prev => !prev);
                    showToast(!bookmarkedArticle1 ? 'Article bookmarked.' : 'Bookmark removed.', 'success');
                  }}
                  className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors bg-transparent border-none cursor-pointer flex shrink-0"
                  style={{ fontVariationSettings: bookmarkedArticle1 ? "'FILL' 1" : "'FILL' 0" }}
                >
                  bookmark
                </button>
              </div>

              {/* Article 2 */}
              <div
                onClick={() => showToast('Opening SSO security article...', 'info')}
                className="bg-white p-5 rounded-2xl border border-outline-variant/20 flex items-center gap-6 hover:border-primary/20 transition-all cursor-pointer group"
              >
                <div className="hidden sm:flex w-14 h-14 bg-surface-container-low rounded-xl items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary">security</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-secondary-container/40 text-on-secondary-container text-[10px] font-bold rounded uppercase">Security</span>
                    <span className="text-on-surface-variant text-[12px]">5 min read</span>
                  </div>
                  <h4 className="font-bold text-body-lg text-primary group-hover:text-on-primary-container transition-colors">
                    Setting Up SSO and Multi-Factor Authentication
                  </h4>
                  <p className="text-label-md text-on-surface-variant line-clamp-1 mt-1">
                    Enterprise-grade security configuration for admin and student accounts via SAML.
                  </p>
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setBookmarkedArticle2(prev => !prev);
                    showToast(!bookmarkedArticle2 ? 'Article bookmarked.' : 'Bookmark removed.', 'success');
                  }}
                  className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors bg-transparent border-none cursor-pointer flex shrink-0"
                  style={{ fontVariationSettings: bookmarkedArticle2 ? "'FILL' 1" : "'FILL' 0" }}
                >
                  bookmark
                </button>
              </div>
            </div>
          </div>

          {/* Recent Support Tickets Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 overflow-hidden">
            <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center">
              <h3 className="text-headline-md font-headline-md text-primary">Recent Support Tickets</h3>
              <button
                onClick={() => showToast('Opening complete support ticket records library...', 'info')}
                className="text-primary text-label-md font-bold hover:underline bg-transparent border-none cursor-pointer p-0"
              >
                Track All Tickets
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-container-low text-on-surface-variant text-label-sm uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Ticket ID</th>
                    <th className="px-6 py-4">Subject</th>
                    <th className="px-6 py-4">Priority</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {tickets.map(t => (
                    <tr key={t.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-primary">{t.id}</td>
                      <td className="px-6 py-4 text-body-md">{t.subject}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          t.priority === 'High'
                            ? 'bg-error-container text-on-error-container'
                            : 'bg-secondary-container text-on-secondary-container'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${t.priority === 'High' ? 'bg-error' : 'bg-secondary'}`}></span>
                          {t.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-bold text-label-sm ${t.status === 'In Progress' ? 'text-primary' : 'text-on-surface-variant'}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => showToast(`Loading conversation logs for ${t.id}...`, 'info')}
                          className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors bg-transparent border-none cursor-pointer"
                        >
                          open_in_new
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Sidebar Right (4 cols) ────────────────────────────────── */}
        <div className="col-span-12 lg:col-span-4 space-y-8">

          {/* Bridge AI Assistant */}
          <div className="bg-primary-container text-white p-6 rounded-3xl relative overflow-hidden shadow-xl">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary-fixed text-primary rounded-lg flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                </div>
                <div>
                  <h4 className="font-bold text-body-lg text-on-primary-container">Bridge AI Assistant</h4>
                  <p className="text-[10px] uppercase tracking-widest text-on-primary-container/60">Always Online</p>
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-3 max-h-[200px] overflow-y-auto mb-4 pr-1">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-2xl text-label-md leading-relaxed ${
                      msg.sender === 'ai'
                        ? 'bg-white/10 border border-white/10 italic text-on-primary-container'
                        : 'bg-white/20 text-on-primary-container ml-6 text-right'
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="relative">
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                  className="w-full bg-white border-none rounded-xl py-3 px-4 pr-12 text-primary text-body-md focus:ring-4 focus:ring-primary-fixed/20 shadow-inner outline-none"
                  placeholder="Ask AI a question..."
                  type="text"
                />
                <button
                  onClick={handleSendMessage}
                  className="absolute right-2 top-1.5 bg-primary p-1.5 rounded-lg text-white hover:bg-tertiary transition-colors border-none cursor-pointer flex"
                >
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
            </div>
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary-fixed opacity-5 blur-3xl rounded-full pointer-events-none"></div>
          </div>

          {/* System Status */}
          <div className="bg-white p-6 rounded-2xl border border-outline-variant/20">
            <h4 className="font-bold text-body-lg text-primary mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">monitor_heart</span> System Status
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></span>
                  <span className="text-[11px] font-bold text-primary uppercase">Auth</span>
                </div>
                <p className="text-[10px] text-on-surface-variant">Operational</p>
              </div>
              <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></span>
                  <span className="text-[11px] font-bold text-primary uppercase">Database</span>
                </div>
                <p className="text-[10px] text-on-surface-variant">Operational</p>
              </div>
              <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></span>
                  <span className="text-[11px] font-bold text-primary uppercase">AI Engine</span>
                </div>
                <p className="text-[10px] text-on-surface-variant">Operational</p>
              </div>
              <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  <span className="text-[11px] font-bold text-primary uppercase">Reports</span>
                </div>
                <p className="text-[10px] text-on-surface-variant">Degraded</p>
              </div>
            </div>
          </div>

          {/* Pinned Resources */}
          <div className="bg-white p-6 rounded-2xl border border-outline-variant/20">
            <h4 className="font-bold text-body-lg text-primary mb-4 flex items-center justify-between">
              Pinned Resources
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">push_pin</span>
            </h4>
            <ul className="space-y-4 list-none p-0 m-0">
              <li>
                <button
                  onClick={() => showToast('Opening Platform Roadmap...', 'info')}
                  className="group flex items-start gap-3 w-full text-left bg-transparent border-none cursor-pointer p-0"
                >
                  <div className="mt-1 w-2 h-2 rounded-full bg-primary group-hover:scale-125 transition-transform shrink-0"></div>
                  <div>
                    <p className="text-label-md font-bold text-primary group-hover:underline">Platform Roadmap 2024</p>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">Updated 2 days ago</p>
                  </div>
                </button>
              </li>
              <li>
                <button
                  onClick={() => showToast('Downloading excel templates...', 'success')}
                  className="group flex items-start gap-3 w-full text-left bg-transparent border-none cursor-pointer p-0"
                >
                  <div className="mt-1 w-2 h-2 rounded-full bg-primary group-hover:scale-125 transition-transform shrink-0"></div>
                  <div>
                    <p className="text-label-md font-bold text-primary group-hover:underline">Bulk Upload Template (Excel)</p>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">Asset • 245 KB</p>
                  </div>
                </button>
              </li>
              <li>
                <button
                  onClick={() => showToast('Downloading security whitepaper...', 'success')}
                  className="group flex items-start gap-3 w-full text-left bg-transparent border-none cursor-pointer p-0"
                >
                  <div className="mt-1 w-2 h-2 rounded-full bg-primary group-hover:scale-125 transition-transform shrink-0"></div>
                  <div>
                    <p className="text-label-md font-bold text-primary group-hover:underline">Security Whitepaper</p>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">PDF • 1.2 MB</p>
                  </div>
                </button>
              </li>
            </ul>
          </div>

          {/* Direct Support */}
          <div className="bg-surface-container-high/40 p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-outline-variant/10 shrink-0">
                <span className="material-symbols-outlined text-primary">headset_mic</span>
              </div>
              <div>
                <h4 className="font-bold text-body-md text-primary">Direct Support</h4>
                <p className="text-label-sm text-on-surface-variant">Mon - Fri, 9AM - 6PM</p>
              </div>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => showToast('Initiating support chat connection...', 'success')}
                className="w-full bg-white border border-outline-variant/20 py-2.5 rounded-xl text-label-md font-bold text-primary hover:bg-white/60 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">chat</span> Live Chat Now
              </button>
              <button
                onClick={() => showToast('Opening email support form...', 'info')}
                className="w-full bg-white border border-outline-variant/20 py-2.5 rounded-xl text-label-md font-bold text-primary hover:bg-white/60 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">mail</span> Email Support
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Create Support Ticket Modal ───────────────────────────────── */}
      {showCreateTicketModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full text-left relative shadow-2xl">
            <button
              onClick={() => setShowCreateTicketModal(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-surface-container transition-colors cursor-pointer bg-transparent border-none flex"
            >
              <span className="material-symbols-outlined text-primary">close</span>
            </button>

            <h3 className="font-bold text-headline-md text-primary mb-2">Create Support Ticket</h3>
            <p className="text-on-surface-variant text-label-md mb-6">
              Describe the platform issue you are experiencing and the placement support staff will coordinate soon.
            </p>

            <form onSubmit={handleCreateTicketSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-on-surface-variant font-bold text-label-md block">Ticket Subject</label>
                <input
                  value={ticketSubject}
                  onChange={e => setTicketSubject(e.target.value)}
                  className="w-full bg-surface-bright border border-outline-variant/40 rounded-xl px-4 py-2.5 text-label-md outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Sync Google Calendar fails"
                  type="text"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-on-surface-variant font-bold text-label-md block">Priority Severity</label>
                <select
                  value={ticketPriority}
                  onChange={e => setTicketPriority(e.target.value as any)}
                  className="w-full bg-surface-bright border border-outline-variant/40 rounded-xl px-4 py-2.5 text-label-md outline-none cursor-pointer"
                >
                  <option value="High">High (System blocker)</option>
                  <option value="Medium">Medium (Affects daily schedules)</option>
                  <option value="Low">Low (General optimization request)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-on-surface-variant font-bold text-label-md block">Full Details Description</label>
                <textarea
                  value={ticketDescription}
                  onChange={e => setTicketDescription(e.target.value)}
                  className="w-full bg-surface-bright border border-outline-variant/40 rounded-xl px-4 py-3 text-label-md outline-none resize-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Provide precise details of errors or page load latency..."
                  rows={4}
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateTicketModal(false)}
                  className="px-5 py-2.5 border border-outline-variant rounded-xl text-on-surface text-label-md font-bold hover:bg-surface-container cursor-pointer bg-white"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary text-on-primary rounded-xl text-label-md font-bold hover:opacity-90 shadow-sm border-none cursor-pointer"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UniversityHelpCenter;
