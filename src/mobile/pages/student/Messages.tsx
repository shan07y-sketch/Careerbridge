/**
 * Mobile Messages — thread list + full-screen conversation view.
 * Same MessageService + auth as desktop; presentation only.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Thread, Message } from '../../../types';
import { MessageService } from '../../../services';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { MobileShell, SkeletonList, EmptyState, ErrorState, PullToRefresh, Avatar } from '../../components';

const MobileMessages: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setThreads(await MessageService.getThreads());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openThread = async (thread: Thread) => {
    setActive(thread);
    setMessagesLoading(true);
    try {
      setMessages(await MessageService.getMessagesByThreadId(thread.id));
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not load conversation', 'error');
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!active || !draft.trim() || sending) return;
    setSending(true);
    try {
      const sent = await MessageService.sendMessage(active.id, user?.id || '', draft.trim());
      setMessages(prev => [...prev, sent]);
      setDraft('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Message not sent', 'error');
    } finally {
      setSending(false);
    }
  };

  /* ── Conversation view ── */
  if (active) {
    return (
      <MobileShell title={active.participantName} subtitle={active.participantRole} back hideTabs>
        {/* Override back to close the thread instead of leaving the page */}
        <div className="fixed inset-0 z-50 bg-surface flex flex-col">
          <header className="flex items-center gap-3 h-14 px-2 border-b border-on-surface/5 m-safe-top bg-surface">
            <button onClick={() => setActive(null)} aria-label="Back to conversations" className="m-press w-10 h-10 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <Avatar src={active.participantAvatar} name={active.participantName} size={36} />
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">{active.participantName}</p>
              <p className="text-[11px] text-on-surface-variant">{active.participantRole}</p>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {messagesLoading ? (
              <SkeletonList count={5} itemClass="h-12" />
            ) : (
              messages.map(m => {
                const mine = m.senderId === user?.id;
                return (
                  <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                      mine ? 'bg-primary text-on-primary rounded-br-md' : 'bg-surface-container text-on-surface rounded-bl-md'
                    }`}>
                      {m.content}
                      <div className={`text-[10px] mt-0.5 ${mine ? 'text-on-primary/70' : 'text-on-surface-variant'}`}>
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          <div className="flex items-end gap-2 px-3 py-2 border-t border-on-surface/5 m-safe-bottom bg-surface">
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Message…"
              aria-label="Type a message"
              rows={1}
              className="flex-1 max-h-28 resize-none rounded-3xl bg-surface-container px-4 py-2.5 text-sm outline-none"
            />
            <button
              onClick={send}
              disabled={!draft.trim() || sending}
              aria-label="Send message"
              className="m-press w-11 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
          </div>
        </div>
      </MobileShell>
    );
  }

  /* ── Thread list ── */
  return (
    <MobileShell title="Messages" subtitle={`${threads.length} conversations`}>
      {loading ? (
        <SkeletonList count={6} itemClass="h-16" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => { setLoading(true); load(); }} />
      ) : threads.length === 0 ? (
        <EmptyState icon="forum" title="No conversations yet" hint="Messages from recruiters and connections will appear here." />
      ) : (
        <PullToRefresh onRefresh={load}>
          <div className="divide-y divide-on-surface/5">
            {threads.map(t => (
              <button key={t.id} onClick={() => openThread(t)} className="m-press w-full flex items-center gap-3 px-4 py-3 text-left">
                <Avatar src={t.participantAvatar} name={t.participantName} size={44} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={`text-sm truncate ${t.unreadCount > 0 ? 'font-bold' : 'font-semibold'}`}>{t.participantName}</p>
                    <span className="text-[11px] text-on-surface-variant shrink-0">{t.lastMessageTime}</span>
                  </div>
                  <p className={`text-xs truncate ${t.unreadCount > 0 ? 'text-on-surface font-medium' : 'text-on-surface-variant'}`}>
                    {t.lastMessage}
                  </p>
                </div>
                {t.unreadCount > 0 && (
                  <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-on-primary text-[11px] font-bold flex items-center justify-center">
                    {t.unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </PullToRefresh>
      )}
    </MobileShell>
  );
};

export default MobileMessages;
