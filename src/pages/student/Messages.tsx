import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMessages } from '../../contexts/MessageContext';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { PageLayout } from '../../components/layout/PageLayout';

export const Messages: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { threads, activeThreadId, setActiveThreadId, sendMessage, messages } = useMessages();

  // Local state parameters
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Recruiters' | 'Mentors' | 'Pinned'>('All');
  const [isTypingIndicatorActive, setIsTypingIndicatorActive] = useState(true);
  const [showAiAssistant, setShowAiAssistant] = useState(true);

  // References for scrolling chat area
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Default thread selection on load
  useEffect(() => {
    if (threads.length > 0 && !activeThreadId) {
      setActiveThreadId(threads[0].id);
    }
  }, [threads, activeThreadId, setActiveThreadId]);

  // Auto-scroll chat area on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeThread = useMemo(() => {
    return threads.find((t) => t.id === activeThreadId) || threads[0] || null;
  }, [threads, activeThreadId]);

  // Filter Pipeline for Sidebar conversations
  const filteredThreads = useMemo(() => {
    return threads.filter(t => {
      // Search checking
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = t.participantName.toLowerCase().includes(q);
        const matchesRole = t.participantRole.toLowerCase().includes(q);
        if (!matchesName && !matchesRole) return false;
      }

      // Tab checking
      if (activeFilter === 'Recruiters') {
        return t.participantRole.toLowerCase().includes('recruiter');
      }
      if (activeFilter === 'Mentors') {
        return t.participantRole.toLowerCase().includes('mentor');
      }
      if (activeFilter === 'Pinned') {
        return t.id === 'th_sarah_chen'; // Mock pinned status
      }
      return true;
    });
  }, [threads, searchQuery, activeFilter]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeThread) return;
    sendMessage(inputText.trim());
    setInputText('');
    
    // Deactivate typing indicator when user sends response
    setIsTypingIndicatorActive(false);
  };

  const handleAiAction = (actionType: 'professional' | 'grammar' | 'shorten' | 'expand' | 'followup' | 'summarize') => {
    if (actionType === 'followup') {
      setInputText("Hi Sarah, thank you for the feedback. Tuesday afternoon works perfectly for me. Shall we say 2:00 PM EST? Looking forward to our introductory call.");
      showToast('AI suggestion loaded into chat input!', 'success');
    } else if (actionType === 'professional') {
      if (inputText.trim()) {
        setInputText(prev => `Dear ${activeThread?.participantName || 'Recruiter'},\n\nI hope this message finds you well. ${prev}\n\nSincerely,\n${user?.name || 'Alex'}`);
        showToast('AI changed message tone to Professional!', 'success');
      } else {
        showToast('Type a draft first to apply AI Professional Tone!', 'info');
      }
    } else {
      showToast('AI Writing feature processed successfully.', 'success');
    }
  };

  const handleAttachResume = () => {
    showToast('Your updated resume has been attached to this chat thread.', 'success');
    sendMessage("Attached Resume: Alex_Chen_Resume_2026.pdf");
  };

  return (
    <PageLayout fullWidth>
      {/* Top Header bar inside PageLayout offset shell */}
      <div className="flex flex-col flex-grow h-[calc(100vh-64px)] text-left">
        
        {/* Navigation bar links sub-header */}
        <div className="px-6 py-4 bg-white dark:bg-surface-container-lowest border-b border-outline-variant/30 flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-8">
            <h2 className="font-headline-md text-headline-md font-bold text-primary dark:text-primary-fixed">Messages</h2>
            <nav className="hidden md:flex items-center space-x-6 h-full text-xs font-semibold">
              <span className="text-primary dark:text-primary-fixed border-b-2 border-primary pb-1 cursor-pointer">All Chats</span>
              <span className="text-on-surface-variant hover:text-primary cursor-pointer transition-colors" onClick={() => showToast('Filtered unread messages list.', 'info')}>Unread</span>
              <span className="text-on-surface-variant hover:text-primary cursor-pointer transition-colors" onClick={() => showToast('Opened archived chats folder.', 'info')}>Archived</span>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => showToast('New message thread form opened.', 'info')}
              className="bg-primary-container text-on-primary-container px-6 py-2 rounded-full font-label-md hover:opacity-90 transition-all cursor-pointer font-bold border border-primary/10 text-xs"
            >
              New Message
            </button>
          </div>
        </div>

        {/* Content Shell */}
        <div className="flex flex-grow overflow-hidden items-stretch">
          
          {/* Left Column: Conversation List */}
          <aside className="w-80 flex-shrink-0 flex flex-col border-r border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container-lowest">
            <div className="p-4 space-y-4 shrink-0">
              {/* Search input */}
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary text-[18px]">search</span>
                <input 
                  type="text"
                  placeholder="Search by recruiter, company, or keyword"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-surface-container-low dark:bg-surface-container border border-outline-variant/30 rounded-xl text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-xs text-on-surface dark:text-white"
                />
              </div>

              {/* Filters list scroll */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {['All', 'Recruiters', 'Mentors', 'Pinned'].map((filterItem) => {
                  const isActive = activeFilter === filterItem;
                  return (
                    <button
                      key={filterItem}
                      onClick={() => setActiveFilter(filterItem as any)}
                      className={`flex-shrink-0 px-4 py-1.5 rounded-full font-label-sm text-[10px] uppercase font-bold tracking-wider cursor-pointer border transition-all ${
                        isActive
                          ? 'bg-primary-container text-white border-transparent'
                          : 'bg-secondary-container/40 text-secondary border-primary/5 hover:bg-secondary-container'
                      }`}
                    >
                      {filterItem}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conversation list blocks */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1 bg-surface-container-low/20">
              
              {/* Pinned Section */}
              <div className="mb-4">
                <p className="px-3 pb-2 text-[9px] uppercase tracking-widest font-bold text-outline flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">keep</span> Pinned Chats
                </p>
                {filteredThreads.filter(t => t.id === 'th_sarah_chen').map((thread) => {
                  const isActive = thread.id === activeThread?.id;
                  return (
                    <div
                      key={thread.id}
                      onClick={() => setActiveThreadId(thread.id)}
                      className={`p-4 rounded-xl flex items-start gap-3 cursor-pointer transition-all border ${
                        isActive 
                          ? 'bg-secondary-container/30 border-primary border-l-4' 
                          : 'hover:bg-surface-container border-transparent bg-white shadow-sm'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <img 
                          className="w-12 h-12 rounded-full object-cover border border-primary/5" 
                          alt={thread.participantName} 
                          src={thread.participantAvatar} 
                        />
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h4 className="font-label-md text-primary truncate font-bold text-xs">{thread.participantName}</h4>
                          <span className="text-[9px] text-outline font-semibold">{thread.lastMessageTime}</span>
                        </div>
                        <p className="text-[10px] text-secondary font-bold truncate">{thread.participantRole}</p>
                        <p className="text-[11px] text-on-surface-variant line-clamp-1 mt-1 font-medium">{thread.lastMessage}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* All Chats Section */}
              <div>
                <p className="px-3 pb-2 text-[9px] uppercase tracking-widest font-bold text-outline">Active Conversations</p>
                {filteredThreads.filter(t => t.id !== 'th_sarah_chen').map((thread) => {
                  const isActive = thread.id === activeThread?.id;
                  return (
                    <div
                      key={thread.id}
                      onClick={() => setActiveThreadId(thread.id)}
                      className={`p-4 rounded-xl flex items-start gap-3 cursor-pointer transition-all border ${
                        isActive 
                          ? 'bg-secondary-container/30 border-primary border-l-4' 
                          : 'hover:bg-surface-container border-transparent'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <img 
                          className="w-12 h-12 rounded-full object-cover border border-primary/5" 
                          alt={thread.participantName} 
                          src={thread.participantAvatar} 
                        />
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h4 className="font-label-md text-primary truncate font-bold text-xs">{thread.participantName}</h4>
                          <span className="text-[9px] text-outline font-semibold">{thread.lastMessageTime}</span>
                        </div>
                        <p className="text-[10px] text-secondary font-bold truncate">{thread.participantRole}</p>
                        <p className="text-[11px] text-on-surface-variant line-clamp-1 mt-1 font-medium">{thread.lastMessage}</p>
                      </div>
                      {thread.unreadCount > 0 && (
                        <div className="w-2.5 h-2.5 bg-primary rounded-full shrink-0 self-center" />
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          </aside>

          {/* Center Column: Chat Window */}
          <section className="flex-1 flex flex-col bg-surface dark:bg-surface-dim overflow-hidden relative">
            {activeThread ? (
              <>
                {/* Chat header */}
                <div className="px-6 py-4 border-b border-outline-variant/30 flex justify-between items-center bg-white dark:bg-surface-container-lowest shrink-0 z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant shrink-0">
                      <img className="w-full h-full object-cover" alt={activeThread.participantName} src={activeThread.participantAvatar} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-headline-md text-[16px] font-bold text-primary dark:text-primary-fixed leading-tight">{activeThread.participantName}</h3>
                        <span className="material-symbols-outlined text-primary text-[16px] font-extrabold" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                        {activeThread.id === 'th_sarah_chen' && (
                          <span className="w-2 h-2 bg-green-500 rounded-full ml-1" />
                        )}
                      </div>
                      <p className="text-[10px] text-outline font-semibold">
                        {activeThread.participantRole} • Online • Responds in 1h
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => showToast('Initializing meeting video call...', 'info')}
                      className="p-2 rounded-lg hover:bg-surface-container-high text-outline hover:text-primary transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-xl">videocam</span>
                    </button>
                    <button 
                      onClick={() => showToast('Initializing phone voice call...', 'info')}
                      className="p-2 rounded-lg hover:bg-surface-container-high text-outline hover:text-primary transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-xl">call</span>
                    </button>
                    <div className="w-px h-6 bg-outline-variant/50 mx-2" />
                    
                    <button 
                      onClick={handleAttachResume}
                      className="px-4 py-2 border border-outline-variant rounded-lg text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-surface-container transition-all flex items-center gap-1.5 cursor-pointer bg-white"
                    >
                      <span className="material-symbols-outlined text-[14px]">description</span>
                      Attach Resume
                    </button>
                    
                    <button 
                      onClick={() => navigate('/student/network')}
                      className="px-4 py-2 border border-outline-variant rounded-lg text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-surface-container transition-all cursor-pointer bg-white"
                    >
                      View Profile
                    </button>
                  </div>
                </div>

                {/* Message bubbles body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-surface-container-low/20">
                  <div className="flex justify-center">
                    <span className="px-4 py-1 rounded-full bg-surface-container-high dark:bg-surface-container text-[10px] text-outline font-extrabold uppercase tracking-widest">Today</span>
                  </div>

                  {messages.map((msg) => {
                    const isMe = msg.senderId === 'me';
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-start gap-3 max-w-[80%] ${isMe ? 'ml-auto' : ''}`}>
                        {!isMe && (
                          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-primary/5">
                            <img className="w-full h-full object-cover" alt={msg.senderName} src={msg.senderAvatar || activeThread.participantAvatar} />
                          </div>
                        )}
                        <div>
                          <div className={`p-4 rounded-2xl shadow-sm leading-relaxed text-xs ${
                            isMe 
                              ? 'bg-primary-container text-white rounded-tr-none text-left' 
                              : 'bg-white dark:bg-surface-container-lowest text-on-surface dark:text-white rounded-tl-none border border-outline-variant/10 text-left'
                          }`}>
                            <p>{msg.content}</p>
                          </div>
                          <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-[9px] text-outline font-semibold">{msg.timestamp}</span>
                            {isMe && (
                              <span className="material-symbols-outlined text-primary text-[12px] font-extrabold">done_all</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Typing Indicator */}
                  {activeThread.id === 'th_sarah_chen' && isTypingIndicatorActive && (
                    <div className="flex items-center gap-2 text-outline">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                      <span className="text-[10px] font-semibold italic">Sarah is typing...</span>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* AI Assistant docked box */}
                {showAiAssistant && (
                  <div className="mx-6 mb-2">
                    <div className="bg-white dark:bg-surface-container border border-secondary-fixed shadow-sm rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary-fixed flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-secondary flex items-center gap-1">
                            AI Writing Assistant
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {[
                              { id: 'professional', label: 'Professional Tone' },
                              { id: 'grammar', label: 'Grammar Check' },
                              { id: 'shorten', label: 'Shorten' },
                              { id: 'expand', label: 'Expand' },
                              { id: 'followup', label: 'Follow-up' },
                              { id: 'summarize', label: 'Summarize' }
                            ].map(action => (
                              <button 
                                key={action.id}
                                onClick={() => handleAiAction(action.id as any)}
                                className="px-3 py-1 rounded-full bg-secondary-container/30 text-[9px] font-bold text-secondary hover:bg-secondary-container/50 transition-colors border border-secondary-fixed/50 cursor-pointer"
                              >
                                {action.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => setShowAiAssistant(false)} className="text-outline hover:text-primary transition-colors cursor-pointer self-start">
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Input Text Form */}
                <div className="p-6 border-t border-outline-variant/30 bg-white dark:bg-surface-container-lowest shrink-0">
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend();
                    }}
                    className="bg-surface-container-low dark:bg-surface-container border border-outline-variant/30 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200"
                  >
                    <textarea 
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={`Type a message to ${activeThread.participantName}...`}
                      className="w-full bg-transparent border-none focus:ring-0 text-xs text-on-surface dark:text-white resize-none h-12 custom-scrollbar p-2 outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                    />
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-primary/5">
                      <div className="flex gap-0.5">
                        <button type="button" onClick={() => showToast('Emoji panel opened.', 'info')} className="p-2 hover:bg-surface-container-high rounded-lg text-outline transition-colors cursor-pointer" title="Emoji"><span className="material-symbols-outlined text-[18px]">sentiment_satisfied</span></button>
                        <button type="button" onClick={() => showToast('Images uploader opened.', 'info')} className="p-2 hover:bg-surface-container-high rounded-lg text-outline transition-colors cursor-pointer" title="Images"><span className="material-symbols-outlined text-[18px]">image</span></button>
                        <button type="button" onClick={() => showToast('PDF document selector opened.', 'info')} className="p-2 hover:bg-surface-container-high rounded-lg text-outline transition-colors cursor-pointer" title="PDF"><span className="material-symbols-outlined text-[18px]">picture_as_pdf</span></button>
                        <button type="button" onClick={handleAttachResume} className="p-2 hover:bg-surface-container-high rounded-lg text-outline transition-colors cursor-pointer" title="Resume"><span className="material-symbols-outlined text-[18px]">description</span></button>
                        <button type="button" onClick={() => showToast('Portfolio shared asset selected.', 'info')} className="p-2 hover:bg-surface-container-high rounded-lg text-outline transition-colors cursor-pointer" title="Portfolio"><span className="material-symbols-outlined text-[18px]">folder_shared</span></button>
                        <button type="button" onClick={() => showToast('Recording voice message...', 'info')} className="p-2 hover:bg-surface-container-high rounded-lg text-outline transition-colors cursor-pointer" title="Voice Message"><span className="material-symbols-outlined text-[18px]">mic</span></button>
                      </div>
                      <button 
                        type="submit"
                        className="bg-primary text-white dark:bg-primary-container px-6 py-2 rounded-xl font-bold text-xs flex items-center gap-2 hover:shadow-lg active:scale-95 transition-all cursor-pointer"
                      >
                        Send
                        <span className="material-symbols-outlined text-[16px]">send</span>
                      </button>
                    </div>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center text-center p-8 bg-surface-container-low/20">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4">chat_bubble</span>
                <p className="font-bold text-body-lg text-primary">No Conversation Selected</p>
                <p className="text-sm text-on-surface-variant max-w-sm mt-1">
                  Select a chat from the lists on the left to review your recruitment progress.
                </p>
              </div>
            )}
          </section>

          {/* Right Panel: Information & Actions */}
          {activeThread && (
            <section className="w-72 flex-shrink-0 border-l border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container-lowest overflow-y-auto custom-scrollbar p-6 space-y-6">
              {/* Profile summary card */}
              <div className="text-center pb-6 border-b border-outline-variant/10">
                <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-primary/10 mx-auto mb-4 shadow-sm shrink-0">
                  <img className="w-full h-full object-cover" alt={activeThread.participantName} src={activeThread.participantAvatar} />
                </div>
                <h4 className="font-headline-md text-[18px] font-bold text-primary dark:text-primary-fixed">{activeThread.participantName}</h4>
                <p className="text-xs text-outline mt-1 font-semibold">{activeThread.participantRole}</p>
                
                <div className="flex justify-center gap-4 mt-5">
                  <div className="text-center">
                    <p className="text-xs font-bold text-primary dark:text-primary-fixed">5.0</p>
                    <p className="text-[9px] text-outline uppercase tracking-wider font-bold">Rating</p>
                  </div>
                  <div className="w-px h-8 bg-outline-variant/50" />
                  <div className="text-center">
                    <p className="text-xs font-bold text-primary dark:text-primary-fixed">12k+</p>
                    <p className="text-[9px] text-outline uppercase tracking-wider font-bold">Network</p>
                  </div>
                  <div className="w-px h-8 bg-outline-variant/50" />
                  <div className="text-center">
                    <p className="text-xs font-bold text-primary dark:text-primary-fixed">14</p>
                    <p className="text-[9px] text-outline uppercase tracking-wider font-bold">Mutuals</p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-outline-variant/30 text-left space-y-2.5 text-xs text-on-surface-variant">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-outline uppercase font-bold tracking-wider">Open Positions</span>
                    <span className="font-bold text-primary">12 Open Roles</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-outline uppercase font-bold tracking-wider">Hiring Status</span>
                    <span className="font-bold text-green-500">Active</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-outline uppercase font-bold tracking-wider">Response Rate</span>
                    <span className="font-bold text-primary">95%</span>
                  </div>
                </div>

                <div className="mt-6 text-left">
                  <h5 className="text-[10px] font-bold text-outline uppercase tracking-widest mb-3">Shared Skills</h5>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2.5 py-1 bg-surface-container dark:bg-surface-container-high rounded text-[10px] font-bold text-on-surface-variant">Product Design</span>
                    <span className="px-2.5 py-1 bg-surface-container dark:bg-surface-container-high rounded text-[10px] font-bold text-on-surface-variant">Fintech</span>
                    <span className="px-2.5 py-1 bg-surface-container dark:bg-surface-container-high rounded text-[10px] font-bold text-on-surface-variant">Figma</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions buttons list */}
              <div className="space-y-2.5">
                <h5 className="text-[10px] font-bold text-outline uppercase tracking-widest mb-2">Quick Actions</h5>
                
                <button 
                  onClick={() => showToast('Scheduled introductory Zoom call!', 'success')}
                  className="w-full py-3 px-4 rounded-xl border border-primary/10 hover:bg-primary-container hover:text-on-primary-container text-primary dark:text-primary-fixed-dim font-bold text-xs text-left flex items-center gap-3 transition-all cursor-pointer bg-white dark:bg-surface-container group"
                >
                  <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">calendar_today</span>
                  Schedule Meeting
                </button>
                
                <button 
                  onClick={handleAttachResume}
                  className="w-full py-3 px-4 rounded-xl border border-primary/10 hover:bg-primary-container hover:text-on-primary-container text-primary dark:text-primary-fixed-dim font-bold text-xs text-left flex items-center gap-3 transition-all cursor-pointer bg-white dark:bg-surface-container group"
                >
                  <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">description</span>
                  Share Resume
                </button>

                <button 
                  onClick={() => showToast('Referral request sent successfully!', 'success')}
                  className="w-full py-3 px-4 rounded-xl border border-primary/10 hover:bg-primary-container hover:text-on-primary-container text-primary dark:text-primary-fixed-dim font-bold text-xs text-left flex items-center gap-3 transition-all cursor-pointer bg-white dark:bg-surface-container group"
                >
                  <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">verified</span>
                  Request Referral
                </button>

                <button 
                  onClick={() => showToast('Mock interview booked with Stripe requirements.', 'success')}
                  className="w-full py-3 px-4 rounded-xl border border-primary/10 hover:bg-primary-container hover:text-on-primary-container text-primary dark:text-primary-fixed-dim font-bold text-xs text-left flex items-center gap-3 transition-all cursor-pointer bg-white dark:bg-surface-container group"
                >
                  <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">school</span>
                  Book Mock Interview
                </button>

                <button 
                  onClick={() => showToast('Resume review requested.', 'success')}
                  className="w-full py-3 px-4 rounded-xl border border-primary/10 hover:bg-primary-container hover:text-on-primary-container text-primary dark:text-primary-fixed-dim font-bold text-xs text-left flex items-center gap-3 transition-all cursor-pointer bg-white dark:bg-surface-container group"
                >
                  <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">rate_review</span>
                  Request Resume Review
                </button>
              </div>

              {/* Upcoming Meetings section */}
              <div className="space-y-3 pt-6 border-t border-outline-variant/10">
                <h5 className="text-[10px] font-bold text-outline uppercase tracking-widest">Upcoming Meetings</h5>
                <div className="p-3.5 rounded-xl bg-surface-container dark:bg-surface-container border border-outline-variant/30 text-xs text-left">
                  <div className="flex justify-between items-start mb-2.5">
                    <div>
                      <p className="font-bold text-primary">Introductory Call</p>
                      <p className="text-[10px] text-outline font-semibold">Tomorrow, 2:00 PM • Zoom</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[8px] font-bold uppercase shrink-0">In 22h</span>
                  </div>
                  <button 
                    onClick={() => showToast('Opening Zoom video room...', 'info')}
                    className="w-full py-2 bg-primary text-white rounded-lg font-bold text-[10px] cursor-pointer border-none transition-opacity hover:opacity-90"
                  >
                    Join Meeting
                  </button>
                </div>
              </div>

              {/* Shared Assets/Documents list */}
              <div className="space-y-3 pt-6 border-t border-outline-variant/10">
                <div className="flex justify-between items-center">
                  <h5 className="text-[10px] font-bold text-outline uppercase tracking-widest">Shared Assets</h5>
                  <button onClick={() => showToast('Displaying all shared files panel...', 'info')} className="text-[10px] text-primary font-bold hover:underline cursor-pointer bg-transparent border-none">See All</button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container transition-all cursor-pointer border border-transparent hover:border-outline-variant/30">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-950/20 flex items-center justify-center text-red-600 flex-shrink-0">
                        <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>picture_as_pdf</span>
                      </div>
                      <div className="min-w-0 text-xs">
                        <p className="font-bold truncate text-primary dark:text-primary-fixed">Portfolio_v2_2026.pdf</p>
                        <p className="text-[9px] text-outline font-semibold">Oct 24 • PDF</p>
                      </div>
                    </div>
                    <button onClick={() => showToast('Downloading case study file...', 'success')} className="p-1.5 text-outline hover:text-primary transition-colors cursor-pointer bg-transparent border-none">
                      <span className="material-symbols-outlined text-[18px]">download</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-container transition-all cursor-pointer border border-transparent hover:border-outline-variant/30 text-xs">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950/20 flex items-center justify-center text-blue-600 shrink-0">
                      <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>link</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold truncate text-primary dark:text-primary-fixed">Fintech_Case_Study</p>
                      <p className="text-[9px] text-outline font-semibold">behance.net/portfolio</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mutual connections circle */}
              <div className="space-y-3 pt-6 border-t border-outline-variant/10">
                <h5 className="text-[10px] font-bold text-outline uppercase tracking-widest">Mutual Connections</h5>
                <div className="flex -space-x-3 overflow-hidden">
                  <div className="inline-block h-10 w-10 rounded-full border-2 border-white bg-slate-200" />
                  <div className="inline-block h-10 w-10 rounded-full border-2 border-white bg-slate-300" />
                  <div className="inline-block h-10 w-10 rounded-full border-2 border-white bg-slate-450" />
                  <div className="h-10 w-10 rounded-full bg-secondary-container border-2 border-white flex items-center justify-center text-secondary text-[10px] font-bold">+11</div>
                </div>
                <p className="text-[9px] text-outline font-semibold leading-relaxed mt-2">
                  You both know Marcus Thorne, Elena Rodriguez, and 9 others.
                </p>
              </div>

            </section>
          )}

        </div>
      </div>
    </PageLayout>
  );
};

export default Messages;
