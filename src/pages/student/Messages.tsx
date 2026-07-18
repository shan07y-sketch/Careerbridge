import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMessages } from '../../contexts/MessageContext';
import { PageLayout } from '../../components/layout/PageLayout';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';

type Filter = 'All' | 'Recruiters' | 'Mentors';
const FILTERS: Filter[] = ['All', 'Recruiters', 'Mentors'];

export const Messages: React.FC = () => {
  const navigate = useNavigate();
  const { threads, activeThreadId, setActiveThreadId, sendMessage, messages } = useMessages();

  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<Filter>('All');
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (threads.length > 0 && !activeThreadId) setActiveThreadId(threads[0].id);
  }, [threads, activeThreadId, setActiveThreadId]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const activeThread = useMemo(
    () => threads.find(t => t.id === activeThreadId) || threads[0] || null,
    [threads, activeThreadId]);

  const filteredThreads = useMemo(() => threads.filter(t => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!t.participantName.toLowerCase().includes(q) && !t.participantRole.toLowerCase().includes(q)) return false;
    }
    if (activeFilter === 'Recruiters') return t.participantRole.toLowerCase().includes('recruiter');
    if (activeFilter === 'Mentors') return t.participantRole.toLowerCase().includes('mentor');
    return true;
  }), [threads, searchQuery, activeFilter]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeThread) return;
    sendMessage(inputText.trim());
    setInputText('');
  };

  const selectThread = (id: string) => { setActiveThreadId(id); setMobileShowChat(true); };

  return (
    <PageLayout fullWidth title="Messages">
      <div className="flex h-[calc(100vh-64px)] text-left">
        {/* Thread list */}
        <aside className={`w-full md:w-80 flex-shrink-0 flex flex-col border-r border-outline-variant/60 bg-surface-container-lowest ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 space-y-3 shrink-0 border-b border-outline-variant/60">
            <h2 className="text-title-lg font-semibold text-on-surface px-1">Messages</h2>
            <div className="flex items-center gap-2 bg-surface-container px-3 h-10 rounded-xl border border-outline-variant/70 focus-within:border-primary/40 transition-all">
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">search</span>
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search conversations…"
                className="bg-transparent border-none focus:ring-0 text-label-md w-full p-0 text-on-surface placeholder:text-on-surface-variant/70" />
            </div>
            <div className="flex gap-2">
              {FILTERS.map(f => (
                <button key={f} onClick={() => setActiveFilter(f)}
                  className={`px-3 h-8 rounded-full text-label-sm font-semibold transition-colors ${activeFilter === f ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>{f}</button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {filteredThreads.length === 0 ? (
              <div className="p-6 text-center text-label-md text-on-surface-variant">No conversations match.</div>
            ) : filteredThreads.map(thread => {
              const isActive = thread.id === activeThread?.id;
              return (
                <button key={thread.id} onClick={() => selectThread(thread.id)}
                  className={`w-full p-3 rounded-xl flex items-start gap-3 text-left transition-colors ${isActive ? 'bg-primary-container/60' : 'hover:bg-surface-container'}`}>
                  <img className="w-11 h-11 rounded-full object-cover shrink-0" alt={thread.participantName} src={thread.participantAvatar} />
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-baseline gap-2">
                      <span className="text-label-md font-semibold text-on-surface truncate">{thread.participantName}</span>
                      <span className="text-label-sm text-on-surface-variant shrink-0">{thread.lastMessageTime}</span>
                    </div>
                    <p className="text-label-sm text-on-surface-variant truncate">{thread.participantRole}</p>
                    <p className="text-label-sm text-on-surface-variant/90 truncate mt-0.5">{thread.lastMessage}</p>
                  </div>
                  {thread.unreadCount > 0 && <span className="w-2.5 h-2.5 bg-primary rounded-full shrink-0 mt-2" />}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Chat window */}
        <section className={`flex-1 flex flex-col bg-surface overflow-hidden ${mobileShowChat ? 'flex' : 'hidden md:flex'}`}>
          {activeThread ? (
            <>
              <div className="px-5 py-3 border-b border-outline-variant/60 flex items-center justify-between bg-surface-container-lowest shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <button className="md:hidden p-1 -ml-1 text-on-surface-variant" onClick={() => setMobileShowChat(false)} aria-label="Back">
                    <span className="material-symbols-outlined">arrow_back</span>
                  </button>
                  <img className="w-10 h-10 rounded-full object-cover shrink-0" alt={activeThread.participantName} src={activeThread.participantAvatar} />
                  <div className="min-w-0">
                    <p className="text-body-md font-semibold text-on-surface truncate">{activeThread.participantName}</p>
                    <p className="text-label-sm text-on-surface-variant truncate">{activeThread.participantRole}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate('/student/network')}>View profile</Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-surface-container-low/30">
                {messages.length === 0 ? (
                  <p className="text-center text-label-md text-on-surface-variant mt-8">No messages yet. Say hello 👋</p>
                ) : messages.map(msg => {
                  const isMe = msg.senderId === 'me';
                  return (
                    <div key={msg.id} className={`flex items-end gap-2 max-w-[78%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                      {!isMe && <img className="w-7 h-7 rounded-full object-cover shrink-0" alt="" src={msg.senderAvatar || activeThread.participantAvatar} />}
                      <div>
                        <div className={`px-4 py-2.5 rounded-2xl text-body-md leading-relaxed shadow-card ${isMe ? 'bg-primary text-on-primary rounded-br-sm' : 'bg-surface-container-lowest text-on-surface rounded-bl-sm'}`}>
                          {msg.content}
                        </div>
                        <p className={`text-label-sm text-on-surface-variant mt-1 ${isMe ? 'text-right' : ''}`}>{msg.timestamp}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleSend} className="p-4 border-t border-outline-variant/60 bg-surface-container-lowest shrink-0">
                <div className="flex items-end gap-2 bg-surface-container border border-outline-variant/70 rounded-2xl p-2 focus-within:border-primary/40 focus-within:shadow-focus-brand transition-all">
                  <textarea value={inputText} onChange={e => setInputText(e.target.value)}
                    placeholder={`Message ${activeThread.participantName}…`}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    className="flex-grow bg-transparent border-none focus:ring-0 text-body-md text-on-surface resize-none h-11 py-2.5 px-2 outline-none placeholder:text-on-surface-variant/70" />
                  <Button type="submit" variant="primary" disabled={!inputText.trim()}
                    rightIcon={<span className="material-symbols-outlined text-[18px]">send</span>}>Send</Button>
                </div>
              </form>
            </>
          ) : (
            <EmptyState icon="forum" title="No conversation selected"
              description="Your messages with recruiters, mentors and coordinators appear here. Select a conversation to get started."
              className="m-auto" />
          )}
        </section>
      </div>
    </PageLayout>
  );
};

export default Messages;
