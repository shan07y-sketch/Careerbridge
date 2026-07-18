import React, { useEffect, useMemo, useState } from 'react';
import { EmployerMessageService } from '../../services';
import type { EmployerConversation, EmployerConversationMessage } from '../../services';
import { useToast } from '../../contexts/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { CardSkeleton } from '../../components/ui/Skeleton';

const otherParticipantLabel = (conv: EmployerConversation, myRecruiterId: string | null) => {
  const other = conv.participants.find(p => !p.recruiter || p.recruiter.id !== myRecruiterId);
  if (other?.studentProfile) return `${other.studentProfile.firstName} ${other.studentProfile.lastName}`;
  if (other?.recruiter) return `${other.recruiter.firstName ?? ''} ${other.recruiter.lastName ?? ''}`.trim() || 'Recruiter';
  return 'Conversation';
};

export const MessagingPanel: React.FC = () => {
  const { showToast } = useToast();
  const [conversations, setConversations] = useState<EmployerConversation[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<EmployerConversationMessage[] | null>(null);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const load = () => {
    setLoading(true); setError(null);
    EmployerMessageService.getConversations()
      .then(convs => { setConversations(convs); if (convs.length > 0 && !selectedId) setSelectedId(convs[0].id); })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load conversations.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  useEffect(() => {
    if (!selectedId) return;
    setMessagesLoading(true);
    EmployerMessageService.getMessages(selectedId)
      .then(setMessages)
      .catch(err => showToast(err instanceof Error ? err.message : 'Failed to load messages.', 'error'))
      .finally(() => setMessagesLoading(false));
  }, [selectedId]);

  const selectedConversation = useMemo(() => conversations?.find(c => c.id === selectedId) ?? null, [conversations, selectedId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !selectedId) return;
    setSending(true);
    try {
      const message = await EmployerMessageService.sendMessage(selectedId, draft.trim());
      setMessages(prev => [...(prev ?? []), message]);
      setDraft('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send message.', 'error');
    } finally { setSending(false); }
  };

  return (
    <>
      <PageHeader title="Messages" description="Conversations with candidates who have applied to your jobs." />
      {loading ? (
        <div className="grid gap-4"><CardSkeleton /></div>
      ) : error ? (
        <EmptyState icon="cloud_off" title="Couldn't load conversations" description={error} actionLabel="Retry" onAction={load} />
      ) : !conversations || conversations.length === 0 ? (
        <EmptyState icon="forum" title="No conversations yet"
          description="Start a conversation by messaging a candidate from their card in Candidates or the talent pipeline." />
      ) : (
        <div className="flex h-[calc(100vh-220px)] min-h-[480px] rounded-2xl border border-outline-variant/60 bg-surface-container-lowest overflow-hidden shadow-card">
          <aside className="w-72 shrink-0 border-r border-outline-variant/60 overflow-y-auto">
            {conversations.map(conv => {
              const label = otherParticipantLabel(conv, null);
              const last = conv.messages[0];
              return (
                <button key={conv.id} onClick={() => setSelectedId(conv.id)}
                  className={`w-full text-left px-4 py-3 border-b border-outline-variant/40 transition-colors ${selectedId === conv.id ? 'bg-primary-container/60' : 'hover:bg-surface-container'}`}>
                  <p className="text-label-md font-semibold text-on-surface truncate">{label}</p>
                  <p className="text-label-sm text-on-surface-variant truncate mt-0.5">{last?.content ?? 'No messages yet'}</p>
                </button>
              );
            })}
          </aside>

          <section className="flex-1 flex flex-col bg-surface">
            {!selectedConversation ? (
              <div className="flex-1 flex items-center justify-center text-label-md text-on-surface-variant">Select a conversation.</div>
            ) : (
              <>
                <div className="px-5 py-3 border-b border-outline-variant/60 bg-surface-container-lowest shrink-0">
                  <p className="text-body-md font-semibold text-on-surface">{otherParticipantLabel(selectedConversation, null)}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-surface-container-low/30">
                  {messagesLoading ? (
                    <p className="text-label-md text-on-surface-variant text-center">Loading messages…</p>
                  ) : !messages || messages.length === 0 ? (
                    <p className="text-label-md text-on-surface-variant text-center mt-6">No messages yet. Say hello 👋</p>
                  ) : messages.map(msg => {
                    const isMine = !!msg.senderRecruiterId;
                    return (
                      <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-body-md shadow-card ${isMine ? 'bg-primary text-on-primary rounded-br-sm' : 'bg-surface-container-lowest text-on-surface rounded-bl-sm'}`}>
                          {msg.content}
                          <span className="block text-label-sm mt-1 text-right opacity-70">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <form onSubmit={handleSend} className="p-4 border-t border-outline-variant/60 bg-surface-container-lowest flex items-center gap-2 shrink-0">
                  <input type="text" value={draft} onChange={e => setDraft(e.target.value)} placeholder="Type a message…"
                    className="flex-1 h-11 px-3.5 rounded-xl border border-outline-variant/70 bg-surface-container text-body-md text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary/40 focus:ring-0 outline-none transition-all" />
                  <Button type="submit" variant="primary" disabled={sending || !draft.trim()} rightIcon={<span className="material-symbols-outlined text-[18px]">send</span>}>Send</Button>
                </form>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
};

export default MessagingPanel;
