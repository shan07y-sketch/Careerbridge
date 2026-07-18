/**
 * Mobile AI Mock Interview — portrait, full-screen, voice-first.
 *
 * Reuses the SAME engine as desktop: MockInterviewAIService (PostgreSQL
 * session state, per-answer auto-save server-side) and utils/speech for
 * TTS/STT. This file is presentation + device wiring only.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MockInterviewAIService } from '../../../services';
import type {
  MockInterviewDifficulty, MockInterviewHistoryEntry, MockInterviewType,
  StartMockInterviewResult,
} from '../../../services';
import { createSpeechSynthesizer, createSpeechTranscriber } from '../../../utils/speech';
import { useToast } from '../../../contexts/ToastContext';
import { useOfflineQueue } from '../../../contexts/OfflineQueueContext';
import { MobileShell, Card, Chip, SectionTitle, Segmented, Button, Sheet, SkeletonList, ScoreRing } from '../../components';

type Stage = 'setup' | 'live' | 'finishing' | 'done';

interface LiveQuestion {
  index: number;
  text: string;
  type: string;
}

const TYPES: { value: MockInterviewType; label: string }[] = [
  { value: 'MIXED', label: 'Mixed' },
  { value: 'HR', label: 'HR' },
  { value: 'TECHNICAL', label: 'Technical' },
  { value: 'BEHAVIORAL', label: 'Behavioral' },
];

const MobileMockInterview: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isOnline } = useOfflineQueue();

  /* ── Setup state ── */
  const [stage, setStage] = useState<Stage>('setup');
  const [interviewType, setInterviewType] = useState<MockInterviewType>('MIXED');
  const [difficulty, setDifficulty] = useState<MockInterviewDifficulty>('MEDIUM');
  const [numQuestions, setNumQuestions] = useState(5);
  const [targetRole, setTargetRole] = useState('');
  const [history, setHistory] = useState<MockInterviewHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  /* ── Live session state ── */
  const [sessionId, setSessionId] = useState('');
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [question, setQuestion] = useState<LiveQuestion | null>(null);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [typed, setTyped] = useState('');
  const [useTyping, setUseTyping] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [endConfirm, setEndConfirm] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [cameraOn, setCameraOn] = useState(true);

  const answerStartedAt = useRef(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const tts = useMemo(createSpeechSynthesizer, []);
  const stt = useMemo(createSpeechTranscriber, []);
  const sttSupported = stt.isSupported;

  /* ── History ── */
  useEffect(() => {
    MockInterviewAIService.getHistory()
      .then(setHistory)
      .catch(() => undefined)
      .finally(() => setHistoryLoading(false));
  }, []);

  /* ── Session timer ── */
  useEffect(() => {
    if (stage !== 'live' || paused) return;
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, [stage, paused]);

  /* ── Camera preview ── */
  useEffect(() => {
    if (stage !== 'live' || !cameraOn) {
      streamRef.current?.getTracks().forEach(tr => tr.stop());
      streamRef.current = null;
      return;
    }
    let cancelled = false;
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then(stream => {
        if (cancelled) { stream.getTracks().forEach(tr => tr.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setCameraOn(false));
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(tr => tr.stop());
      streamRef.current = null;
    };
  }, [stage, cameraOn]);

  /* ── Cleanup on unmount ── */
  useEffect(() => () => { tts.cancel(); if (listening) stt.stop(); },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []);

  const speakQuestion = useCallback(async (text: string) => {
    setSpeaking(true);
    await tts.speak(text);
    setSpeaking(false);
    answerStartedAt.current = Date.now();
  }, [tts]);

  const beginQuestion = useCallback((q: LiveQuestion) => {
    setQuestion(q);
    setTranscript('');
    setInterim('');
    setTyped('');
    answerStartedAt.current = Date.now();
    speakQuestion(q.text);
  }, [speakQuestion]);

  /* ── Start ── */
  const start = async () => {
    setStarting(true);
    try {
      const res: StartMockInterviewResult = await MockInterviewAIService.startInterview({
        interviewType, difficulty, numQuestions,
        targetRole: targetRole.trim() || undefined,
      });
      setSessionId(res.mockInterviewId);
      setTotalQuestions(res.totalQuestions);
      setElapsed(0);
      setStage('live');
      setUseTyping(!sttSupported);
      beginQuestion({ index: res.questionIndex, text: res.question, type: res.questionType });
      if (res.planEstimated) showToast('AI plan unavailable — using estimated question plan', 'info');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not start the interview', 'error');
    } finally {
      setStarting(false);
    }
  };

  /* ── Mic control ── */
  const toggleMic = () => {
    if (speaking || thinking || paused) return;
    if (listening) {
      const final = stt.stop();
      setListening(false);
      setInterim('');
      if (final) setTranscript(final);
    } else {
      stt.start(
        u => { setTranscript(u.finalTranscript); setInterim(u.interimTranscript); },
        msg => { setListening(false); showToast(msg, 'error'); setUseTyping(true); },
      );
      setListening(true);
    }
  };

  /* ── Submit answer (auto-saved server-side per answer) ── */
  const submit = async () => {
    if (!question || thinking) return;
    let answer = useTyping ? typed.trim() : (transcript || interim).trim();
    if (listening) {
      answer = stt.stop().trim() || answer;
      setListening(false);
      setInterim('');
    }
    if (!answer) { showToast('Say or type your answer first', 'error'); return; }

    setThinking(true);
    try {
      const res = await MockInterviewAIService.submitAnswer(sessionId, question.index, {
        transcript: answer,
        answerMethod: useTyping ? 'text' : 'voice',
        durationSec: Math.max(1, (Date.now() - answerStartedAt.current) / 1000),
      });
      if (res.isLastQuestion || res.nextQuestion == null || res.nextQuestionIndex == null) {
        await finish();
      } else {
        beginQuestion({ index: res.nextQuestionIndex, text: res.nextQuestion, type: res.nextQuestionType || '' });
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not submit — your progress is saved, try again', 'error');
    } finally {
      setThinking(false);
    }
  };

  const finish = async () => {
    setStage('finishing');
    tts.cancel();
    try {
      const report = await MockInterviewAIService.endInterview(sessionId);
      setFinalScore(report.score);
      setStage('done');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not generate the report', 'error');
      setStage('live');
    }
  };

  const abandon = async () => {
    setEndConfirm(false);
    await finish();
  };

  const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  /* ════════════════ LIVE / FINISHING / DONE — full-screen stage ════════════════ */
  if (stage !== 'setup') {
    const progress = question && totalQuestions ? ((question.index + 1) / totalQuestions) * 100 : 0;

    return (
      <div className="m-interview-stage flex flex-col m-safe-top m-safe-bottom">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => setEndConfirm(true)} aria-label="End interview" className="m-press w-10 h-10 rounded-full flex items-center justify-center bg-white/10">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
          <div className="flex-1">
            <div className="h-1.5 rounded-full bg-white/15 overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Question {question ? question.index + 1 : '–'} of {totalQuestions} · {mmss(elapsed)}
            </p>
          </div>
          <span
            className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-red-400'}`}
            role="status"
            aria-label={isOnline ? 'Online' : 'Offline'}
            title={isOnline ? 'Online' : 'Offline'}
          />
          <button
            onClick={() => setPaused(p => { const next = !p; if (next) { tts.cancel(); setSpeaking(false); } return next; })}
            aria-label={paused ? 'Resume interview' : 'Pause interview'}
            className="m-press w-10 h-10 rounded-full flex items-center justify-center bg-white/10"
          >
            <span className="material-symbols-outlined text-[22px]">{paused ? 'play_arrow' : 'pause'}</span>
          </button>
        </div>

        {/* Stage content */}
        {stage === 'finishing' ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="flex gap-1.5 text-emerald-400"><span className="m-dot" /><span className="m-dot" /><span className="m-dot" /></div>
            <p className="font-bold">Generating your report…</p>
            <p className="text-sm text-slate-400">The AI is scoring every answer and writing your feedback. This can take a moment.</p>
          </div>
        ) : stage === 'done' ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8 text-center">
            <span className="material-symbols-outlined text-[56px] text-emerald-400">task_alt</span>
            <p className="text-xl font-extrabold">Interview complete</p>
            {finalScore != null && (
              <div className="bg-white/5 rounded-3xl p-6">
                <ScoreRing score={finalScore} label="overall" />
              </div>
            )}
            <Button full onClick={() => navigate(`/student/interview-report/${sessionId}`)}>View full report</Button>
            <button onClick={() => { setStage('setup'); setFinalScore(null); }} className="text-sm text-slate-400 font-semibold">
              Back to practice hub
            </button>
          </div>
        ) : paused ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <span className="material-symbols-outlined text-[56px] text-slate-400">pause_circle</span>
            <p className="text-lg font-bold">Interview paused</p>
            <p className="text-sm text-slate-400">Your progress is saved after every answer — take your time.</p>
            <Button onClick={() => setPaused(false)} icon="play_arrow">Resume</Button>
          </div>
        ) : (
          <>
            {/* Question + camera */}
            <div className="flex-1 overflow-y-auto px-4 pb-2">
              <div className="relative">
                <div className="bg-white/5 rounded-2xl p-4 mt-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-7 h-7 rounded-full bg-emerald-400/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[16px] text-emerald-400">smart_toy</span>
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                      {question?.type || 'Question'} {speaking && '· speaking…'}
                    </span>
                    {speaking && (
                      <button onClick={() => { tts.cancel(); setSpeaking(false); answerStartedAt.current = Date.now(); }} className="ml-auto text-[11px] font-bold text-emerald-400">
                        Skip voice
                      </button>
                    )}
                  </div>
                  <p className="text-[15px] leading-relaxed font-medium">{question?.text}</p>
                </div>

                {/* Camera PIP */}
                <div className="absolute -bottom-3 right-2 w-[88px] h-[118px] rounded-xl overflow-hidden bg-slate-800 border border-white/10 shadow-pop">
                  {cameraOn ? (
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover -scale-x-100" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-slate-500">videocam_off</span>
                    </div>
                  )}
                  <button
                    onClick={() => setCameraOn(v => !v)}
                    aria-label={cameraOn ? 'Turn camera off' : 'Turn camera on'}
                    className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-[14px]">{cameraOn ? 'videocam' : 'videocam_off'}</span>
                  </button>
                </div>
              </div>

              {/* Live transcript / typed answer */}
              <div className="mt-8">
                {thinking ? (
                  <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-3" role="status">
                    <div className="flex gap-1 text-emerald-400"><span className="m-dot" /><span className="m-dot" /><span className="m-dot" /></div>
                    <span className="text-sm text-slate-300 font-semibold">AI is evaluating your answer…</span>
                  </div>
                ) : useTyping ? (
                  <textarea
                    value={typed}
                    onChange={e => setTyped(e.target.value)}
                    placeholder="Type your answer here…"
                    aria-label="Your answer"
                    rows={5}
                    className="w-full rounded-2xl bg-white/5 border border-white/10 p-4 text-sm text-slate-100 outline-none placeholder:text-slate-500"
                  />
                ) : (
                  <div className="bg-white/5 rounded-2xl p-4 min-h-[110px]">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Live transcript</p>
                    <p className="text-sm leading-relaxed text-slate-100" aria-live="polite">
                      {transcript}
                      <span className="text-slate-400">{interim ? ` ${interim}` : ''}</span>
                      {!transcript && !interim && <span className="text-slate-500">Tap the mic and start speaking…</span>}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="px-4 pb-4 pt-2">
              <div className="flex items-center justify-center gap-6">
                {sttSupported && (
                  <button
                    onClick={() => setUseTyping(v => !v)}
                    aria-label={useTyping ? 'Switch to voice answer' : 'Switch to typed answer'}
                    className="m-press w-12 h-12 rounded-full bg-white/10 flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-[22px]">{useTyping ? 'mic' : 'keyboard'}</span>
                  </button>
                )}

                {!useTyping ? (
                  <button
                    onClick={toggleMic}
                    disabled={speaking || thinking}
                    aria-label={listening ? 'Stop recording' : 'Start recording'}
                    className={`m-press w-[72px] h-[72px] rounded-full flex items-center justify-center disabled:opacity-40 ${
                      listening ? 'bg-red-500' : 'bg-emerald-500'
                    }`}
                  >
                    {listening ? (
                      <span className="flex items-end gap-[3px] h-6" aria-hidden="true">
                        <span className="m-voice-bar h-6 bg-white" /><span className="m-voice-bar h-6 bg-white" /><span className="m-voice-bar h-6 bg-white" /><span className="m-voice-bar h-6 bg-white" /><span className="m-voice-bar h-6 bg-white" />
                      </span>
                    ) : (
                      <span className="material-symbols-outlined text-[32px]">mic</span>
                    )}
                  </button>
                ) : (
                  <div className="w-[72px]" aria-hidden="true" />
                )}

                <button
                  onClick={submit}
                  disabled={thinking || speaking || (!useTyping && !transcript && !interim && !listening) || (useTyping && !typed.trim())}
                  aria-label="Submit answer"
                  className="m-press w-12 h-12 rounded-full bg-white text-slate-900 flex items-center justify-center disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-[22px]">send</span>
                </button>
              </div>
              <p className="text-center text-[11px] text-slate-500 mt-2.5">
                {listening ? 'Listening — tap the mic again when you finish' : 'Answers auto-save after every question'}
              </p>
            </div>
          </>
        )}

        {/* End confirmation */}
        <Sheet open={endConfirm} onClose={() => setEndConfirm(false)} title="End interview?">
          <div className="space-y-3 pb-4">
            <p className="text-sm text-on-surface-variant">
              Answers you've already submitted are saved. Ending now will generate your report from those answers.
            </p>
            <Button full variant="danger" onClick={abandon}>End & generate report</Button>
            <Button full variant="outline" onClick={() => setEndConfirm(false)}>Keep going</Button>
          </div>
        </Sheet>
      </div>
    );
  }

  /* ════════════════ SETUP ════════════════ */
  const completed = history.filter(h => h.status === 'COMPLETED' && h.reports.length > 0);

  return (
    <MobileShell title="Mock Interview" subtitle="AI-powered practice">
      <div className="px-4 pt-4 space-y-2.5">
        <Card>
          <p className="text-sm font-bold mb-3">New practice session</p>

          <label className="text-xs font-bold text-on-surface-variant">Interview type</label>
          <div className="flex gap-2 overflow-x-auto py-2 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
            {TYPES.map(t => (
              <Chip key={t.value} selected={interviewType === t.value} onClick={() => setInterviewType(t.value)}>{t.label}</Chip>
            ))}
          </div>

          <label className="text-xs font-bold text-on-surface-variant">Difficulty</label>
          <div className="py-2">
            <Segmented<MockInterviewDifficulty>
              value={difficulty}
              onChange={setDifficulty}
              options={[
                { value: 'EASY', label: 'Easy' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'HARD', label: 'Hard' },
              ]}
            />
          </div>

          <label className="text-xs font-bold text-on-surface-variant">Questions</label>
          <div className="py-2">
            <Segmented<'3' | '5' | '8'>
              value={String(numQuestions) as '3' | '5' | '8'}
              onChange={v => setNumQuestions(Number(v))}
              options={[{ value: '3', label: '3' }, { value: '5', label: '5' }, { value: '8', label: '8' }]}
            />
          </div>

          <label className="text-xs font-bold text-on-surface-variant" htmlFor="mi-role">Target role (optional)</label>
          <input
            id="mi-role"
            value={targetRole}
            onChange={e => setTargetRole(e.target.value)}
            placeholder="e.g. Backend Engineer"
            className="w-full h-11 px-4 mt-2 mb-3 rounded-xl bg-surface-container text-sm outline-none"
          />

          <Button full icon="play_arrow" onClick={start} disabled={starting || !isOnline}>
            {starting ? 'Preparing questions…' : 'Start interview'}
          </Button>
          {!isOnline && <p className="text-[11px] text-error mt-2 text-center">You're offline — connect to start an interview.</p>}
          {!sttSupported && <p className="text-[11px] text-on-surface-variant mt-2 text-center">Voice input isn't supported on this device — you'll type your answers.</p>}
        </Card>

        <SectionTitle>Past interviews</SectionTitle>
        {historyLoading ? (
          <SkeletonList count={3} itemClass="h-16" />
        ) : completed.length === 0 ? (
          <Card><p className="text-sm text-on-surface-variant">No completed interviews yet. Your reports will appear here.</p></Card>
        ) : (
          <div className="space-y-2.5">
            {completed.map(h => (
              <Card key={h.id} onClick={() => navigate(`/student/interview-report/${h.id}`)}>
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                    <span className="text-sm font-extrabold text-on-primary-container">{Math.round(h.reports[0].score)}</span>
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{h.jobTitle || h.interviewType}</p>
                    <p className="text-xs text-on-surface-variant">
                      {h.interviewType} · {h.difficulty} · {new Date(h.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MobileShell>
  );
};

export default MobileMockInterview;
