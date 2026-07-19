/**
 * Mobile AI Career Coach — premium streaming chat.
 * Real conversational coach backed by CoachService (Gemini SSE): streaming
 * replies, markdown, conversation history with pin/delete, profile-grounded
 * answers. No fabricated responses.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CoachService } from '../../../services';
import type { CoachConversationSummary } from '../../../services';
import { useToast } from '../../../contexts/ToastContext';
import { MobileShell, Sheet, Markdown, Avatar, EmptyState } from '../../components';
import { useAuth } from '../../../contexts/AuthContext';

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
  estimated?: boolean;
  streaming?: boolean;
}

const SUGGESTIONS = [
  'Am I ready for my target role?',
  'What skills should I learn next?',
  'How do I prep for a technical interview?',
  'How can I raise my resume ATS score?'
];

const MobileCoach: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [convos, setConvos] = useState<CoachConversationSummary[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const loadConvos = useCallback(async () => {
    try { setConvos(await CoachService.listConversations()); } catch { /* history is non-critical */ }
  }, []);

  useEffect(() => { loadConvos(); }, [loadConvos]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => () => abortRef.current?.abort(), []);

  const newChat = () => {
    if (streaming) return;
    setMessages([]);
    setConversationId(null);
    setHistoryOpen(false);
  };

  const openConversation = async (id: string) => {
    setHistoryOpen(false);
    if (streaming) return;
    try {
      const convo = await CoachService.getConversation(id);
      setConversationId(convo.id);
      setMessages(convo.messages.map(m => ({ role: m.role, content: m.content, estimated: m.estimated })));
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not open conversation', 'error');
    }
  };

  const pin = async (c: CoachConversationSummary) => {
    try {
      await CoachService.updateConversation(c.id, { pinned: !c.pinned });
      loadConvos();
    } catch { showToast('Could not update', 'error'); }
  };

  const remove = async (c: CoachConversationSummary) => {
    try {
      await CoachService.deleteConversation(c.id);
      if (c.id === conversationId) newChat();
      loadConvos();
    } catch { showToast('Could not delete', 'error'); }
  };

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || streaming) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content }, { role: 'assistant', content: '', streaming: true }]);
    setStreaming(true);

    const patchLast = (fn: (m: ChatMsg) => ChatMsg) =>
      setMessages(prev => prev.map((m, i) => (i === prev.length - 1 ? fn(m) : m)));

    const controller = new AbortController();
    abortRef.current = controller;

    await CoachService.streamChat(
      { conversationId: conversationId ?? undefined, content },
      {
        signal: controller.signal,
        onMeta: m => setConversationId(m.conversationId),
        onDelta: t => patchLast(m => ({ ...m, content: m.content + t })),
        onDone: r => { patchLast(m => ({ ...m, streaming: false, estimated: r.estimated })); loadConvos(); },
        onError: msg => {
          patchLast(m => ({ ...m, streaming: false, content: m.content || `⚠️ ${msg}` }));
          showToast(msg, 'error');
        }
      }
    );
    setStreaming(false);
    abortRef.current = null;
  };

  const empty = messages.length === 0;

  return (
    <MobileShell bare>
      {/* ---- Compact aurora header ---- */}
      <header className="m-hero m-safe-top sticky top-0 z-20 px-4 pt-3 pb-3 rounded-b-3xl">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-white">neurology</span>
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-extrabold leading-none">AI Career Coach</p>
            <p className="text-[11px] text-white/70 mt-0.5">Grounded in your real profile</p>
          </div>
          <button onClick={() => setHistoryOpen(true)} aria-label="Conversation history" className="m-press w-9 h-9 rounded-full m-glass flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-[20px]">history</span>
          </button>
          <button onClick={newChat} aria-label="New chat" className="m-press w-9 h-9 rounded-full m-glass flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-[20px]">edit_square</span>
          </button>
        </div>
      </header>

      {/* ---- Messages ---- */}
      <div className="px-4 pt-4" style={{ paddingBottom: 'calc(150px + env(safe-area-inset-bottom, 0px))' }}>
        {empty ? (
          <div className="pt-6">
            <div className="flex flex-col items-center text-center px-4">
              <span className="w-16 h-16 rounded-3xl m-ai-cta flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-white text-[32px]">auto_awesome</span>
              </span>
              <p className="mt-4 text-lg font-extrabold text-on-surface">Hi {user?.name?.split(' ')[0] || 'there'} 👋</p>
              <p className="text-sm text-on-surface-variant mt-1 max-w-[280px]">
                I'm your AI career coach. Ask me anything about jobs, skills, interviews or your resume — I know your profile.
              </p>
            </div>
            <div className="mt-6 space-y-2.5">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="m-press m-card-lift w-full text-left rounded-2xl bg-surface-container/70 border border-on-surface/5 p-3.5 flex items-center gap-3"
                >
                  <span className="material-symbols-outlined text-primary text-[20px]">chat_bubble</span>
                  <span className="text-sm font-medium text-on-surface flex-1">{s}</span>
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px]">north_east</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {m.role === 'assistant' ? (
                  <span className="w-8 h-8 rounded-full m-ai-cta flex items-center justify-center shrink-0 self-start">
                    <span className="material-symbols-outlined text-white text-[18px]">neurology</span>
                  </span>
                ) : (
                  <Avatar src={user?.profilePicture} name={user?.name || 'You'} size={32} />
                )}
                <div className={`min-w-0 max-w-[82%] rounded-3xl px-4 py-2.5 ${
                  m.role === 'user'
                    ? 'bg-primary text-on-primary rounded-tr-md'
                    : 'bg-surface-container/80 border border-on-surface/5 rounded-tl-md'
                }`}>
                  {m.role === 'user' ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                  ) : m.content ? (
                    <>
                      <Markdown content={m.content} />
                      {m.streaming && <span className="inline-block w-1.5 h-4 bg-primary/60 ml-0.5 align-middle animate-pulse" aria-hidden="true" />}
                      {m.estimated && !m.streaming && (
                        <p className="text-[10px] text-warning font-semibold mt-1.5">Offline fallback — live AI was unavailable</p>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-1 py-1 text-on-surface-variant" role="status" aria-label="Coach is typing">
                      <span className="m-dot" /><span className="m-dot" /><span className="m-dot" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ---- Input bar (above tab bar) ---- */}
      <div
        className="fixed inset-x-0 z-30 bg-surface/95 backdrop-blur-md border-t border-on-surface/8 px-3 py-2"
        style={{ bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}
      >
        <form
          onSubmit={e => { e.preventDefault(); send(input); }}
          className="flex items-end gap-2"
        >
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder="Ask your career coach…"
            rows={1}
            aria-label="Message"
            className="flex-1 max-h-28 resize-none rounded-2xl bg-surface-container px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            aria-label="Send"
            className="m-press w-11 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0 disabled:opacity-40"
          >
            <span className="material-symbols-outlined">{streaming ? 'more_horiz' : 'arrow_upward'}</span>
          </button>
        </form>
      </div>

      {/* ---- History sheet ---- */}
      <Sheet open={historyOpen} onClose={() => setHistoryOpen(false)} title="Your conversations">
        <div className="pb-4">
          <button onClick={newChat} className="m-press w-full flex items-center gap-3 p-3 rounded-2xl bg-primary-container text-on-primary-container font-semibold text-sm mb-3">
            <span className="material-symbols-outlined text-[20px]">add</span>New conversation
          </button>
          {convos.length === 0 ? (
            <EmptyState icon="forum" title="No conversations yet" hint="Start chatting and your history will appear here." />
          ) : (
            <div className="space-y-1.5">
              {convos.map(c => (
                <div key={c.id} className={`flex items-center gap-2 rounded-2xl p-2.5 ${c.id === conversationId ? 'bg-primary/10' : 'bg-surface-container/60'}`}>
                  <button onClick={() => openConversation(c.id)} className="m-press flex-1 min-w-0 text-left">
                    <p className="text-sm font-semibold truncate flex items-center gap-1">
                      {c.pinned && <span className="material-symbols-outlined text-[14px] text-primary">push_pin</span>}
                      {c.title}
                    </p>
                    {c.lastMessage && <p className="text-xs text-on-surface-variant truncate">{c.lastMessage}</p>}
                  </button>
                  <button onClick={() => pin(c)} aria-label={c.pinned ? 'Unpin' : 'Pin'} className="m-press w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                    <span className={`material-symbols-outlined text-[18px] ${c.pinned ? 'text-primary' : 'text-on-surface-variant'}`}>push_pin</span>
                  </button>
                  <button onClick={() => remove(c)} aria-label="Delete" className="m-press w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px] text-error">delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Sheet>
    </MobileShell>
  );
};

export default MobileCoach;
