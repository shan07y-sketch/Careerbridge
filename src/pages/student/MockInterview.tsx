import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Dialog } from '../../components/ui/Dialog';
import { useToast } from '../../contexts/ToastContext';
import { MockInterviewAIService, ApplicationService } from '../../services';
import type {
  StartMockInterviewResult,
  SubmitMockAnswerResult,
  MockInterviewType,
  MockInterviewDifficulty,
  MockInterviewHistoryEntry
} from '../../services';
import type { Application } from '../../types';
import { createSpeechSynthesizer, createSpeechTranscriber } from '../../utils/speech';
import type { SpeechSynthesizer, SpeechTranscriber } from '../../utils/speech';
import { InterviewObserver } from '../../utils/interviewObserver';

type Phase = 'setup' | 'live' | 'submitting' | 'ending';
type AnswerMode = 'idle' | 'listening' | 'review';

interface ActiveQuestion {
  index: number;
  text: string;
  type: string;
  difficulty: string;
  expectedSkills: string[];
}

const INTERVIEW_TYPES: { key: MockInterviewType; label: string; icon: string; blurb: string }[] = [
  { key: 'MIXED', label: 'Mixed', icon: 'all_inclusive', blurb: 'HR + technical + behavioral + aptitude' },
  { key: 'TECHNICAL', label: 'Technical', icon: 'terminal', blurb: 'Deep-dives on your stack and projects' },
  { key: 'HR', label: 'HR', icon: 'handshake', blurb: 'Motivation, fit and career goals' },
  { key: 'BEHAVIORAL', label: 'Behavioral', icon: 'psychology', blurb: 'STAR stories from real experience' },
  { key: 'APTITUDE', label: 'Aptitude', icon: 'neurology', blurb: 'Reasoning, estimation and judgment' }
];

const DIFFICULTIES: { key: MockInterviewDifficulty; label: string; blurb: string }[] = [
  { key: 'EASY', label: 'Easy', blurb: 'Warm-up pace' },
  { key: 'MEDIUM', label: 'Medium', blurb: 'Realistic screen' },
  { key: 'HARD', label: 'Hard', blurb: 'On-site pressure' }
];

export const MockInterview: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // ------------------------------------------------------------- setup ----
  const [phase, setPhase] = useState<Phase>('setup');
  const [interviewType, setInterviewType] = useState<MockInterviewType>('MIXED');
  const [difficulty, setDifficulty] = useState<MockInterviewDifficulty>('MEDIUM');
  const [numQuestions, setNumQuestions] = useState(6);
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [selectedApplicationJobId, setSelectedApplicationJobId] = useState('');
  const [applications, setApplications] = useState<Application[]>([]);
  const [history, setHistory] = useState<MockInterviewHistoryEntry[]>([]);
  const [starting, setStarting] = useState(false);

  // -------------------------------------------------------------- live ----
  const [mockInterviewId, setMockInterviewId] = useState<string | null>(null);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [activeQuestion, setActiveQuestion] = useState<ActiveQuestion | null>(null);
  const [lastFeedback, setLastFeedback] = useState<SubmitMockAnswerResult | null>(null);
  const [planEstimated, setPlanEstimated] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [answerMode, setAnswerMode] = useState<AnswerMode>('idle');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [typedAnswer, setTypedAnswer] = useState('');
  const [useTextFallback, setUseTextFallback] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isEndingConfirmOpen, setIsEndingConfirmOpen] = useState(false);

  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoChunksRef = useRef<Blob[]>([]);
  const answerStartedAtRef = useRef<number | null>(null);
  const synthRef = useRef<SpeechSynthesizer | null>(null);
  const transcriberRef = useRef<SpeechTranscriber | null>(null);
  const observerRef = useRef<InterviewObserver | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const sttSupported = createSpeechTranscriber().isSupported;

  useEffect(() => {
    synthRef.current = createSpeechSynthesizer();
    (async () => {
      const [apps, past] = await Promise.all([
        ApplicationService.getApplications().catch(() => [] as Application[]),
        MockInterviewAIService.getHistory().catch(() => [] as MockInterviewHistoryEntry[])
      ]);
      setApplications(apps);
      setHistory(past.filter((h: MockInterviewHistoryEntry) => h.status === 'COMPLETED').slice(0, 5));
    })();
    return () => {
      synthRef.current?.cancel();
      transcriberRef.current?.stop();
      observerRef.current?.stop();
      mediaStreamRef.current?.getTracks().forEach(t => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (answerMode === 'listening') {
      interval = setInterval(() => setRecSeconds(prev => prev + 1), 1000);
    } else {
      setRecSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [answerMode]);

  const formatRecTime = (sec: number) => {
    const mm = String(Math.floor(sec / 60)).padStart(2, '0');
    const ss = String(sec % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  // -------------------------------------------------------- observations --

  const reportObservation = useCallback((type: string, detail?: string) => {
    const id = sessionIdRef.current;
    if (id) void MockInterviewAIService.addObservation(id, type, detail);
  }, []);

  // --------------------------------------------------------------- voice --

  const speakQuestion = useCallback(async (text: string) => {
    const synth = synthRef.current;
    if (!synth?.isSupported) return;
    setIsSpeaking(true);
    await synth.speak(text);
    setIsSpeaking(false);
  }, []);

  const applyQuestion = useCallback(
    (q: { index: number; text: string; type: string; difficulty: string; expectedSkills: string[] }) => {
      setActiveQuestion(q);
      setLastFeedback(null);
      setAnswerMode('idle');
      setLiveTranscript('');
      setInterimTranscript('');
      setTypedAnswer('');
      void speakQuestion(q.text);
    },
    [speakQuestion]
  );

  // -------------------------------------------------------------- camera --

  const requestMedia = async (): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      mediaStreamRef.current = stream;
      setCameraError(null);
      if (videoPreviewRef.current) videoPreviewRef.current.srcObject = stream;
      return stream;
    } catch {
      setCameraError('Camera access was declined — the interview continues without camera observations.');
      reportObservation('camera_denied');
      try {
        const audioOnly = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = audioOnly;
        return audioOnly;
      } catch {
        setUseTextFallback(true);
        showToast('Microphone unavailable — you can type your answers instead.', 'info');
        return null;
      }
    }
  };

  // --------------------------------------------------------------- start --

  const handleStartSession = async () => {
    if (!selectedApplicationJobId && !jobTitle.trim()) {
      showToast('Pick one of your applications or enter a job title to practice for.', 'error');
      return;
    }
    setStarting(true);
    try {
      const result: StartMockInterviewResult = await MockInterviewAIService.startInterview({
        interviewType,
        difficulty,
        numQuestions,
        jobId: selectedApplicationJobId || undefined,
        jobTitle: jobTitle.trim() || undefined,
        companyName: companyName.trim() || undefined
      });
      setMockInterviewId(result.mockInterviewId);
      sessionIdRef.current = result.mockInterviewId;
      setTotalQuestions(result.totalQuestions);
      setPlanEstimated(result.planEstimated);

      const stream = await requestMedia();
      setPhase('live');
      if (!sttSupported) setUseTextFallback(true);

      observerRef.current = new InterviewObserver({
        video: videoPreviewRef.current,
        stream,
        onObservation: (type, detail) => reportObservation(type, detail)
      });
      observerRef.current.start();

      applyQuestion({
        index: result.questionIndex,
        text: result.question,
        type: result.questionType,
        difficulty: result.questionDifficulty,
        expectedSkills: result.expectedSkills
      });
      showToast('Interview started — the AI interviewer will read each question aloud.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not start the mock interview.', 'error');
    } finally {
      setStarting(false);
    }
  };

  // ------------------------------------------------------------ answering --

  const startAnswering = () => {
    if (!activeQuestion) return;
    synthRef.current?.cancel();
    setIsSpeaking(false);
    answerStartedAtRef.current = Date.now();
    observerRef.current?.markActivity();

    if (useTextFallback) {
      setAnswerMode('listening');
      return;
    }

    // Speech-to-text for the real transcript.
    const transcriber = createSpeechTranscriber();
    transcriberRef.current = transcriber;
    setLiveTranscript('');
    setInterimTranscript('');
    transcriber.start(
      update => {
        setLiveTranscript(update.finalTranscript);
        setInterimTranscript(update.interimTranscript);
        observerRef.current?.markActivity();
      },
      message => {
        showToast(`${message} Switching to typed answers.`, 'info');
        setUseTextFallback(true);
        setAnswerMode('listening');
      }
    );

    // Record audio/video clips as evidence alongside the transcript.
    const stream = mediaStreamRef.current;
    if (stream) {
      audioChunksRef.current = [];
      videoChunksRef.current = [];
      const audioTracks = stream.getAudioTracks();
      const videoTracks = stream.getVideoTracks();
      if (audioTracks.length > 0) {
        const audioRecorder = new MediaRecorder(new MediaStream(audioTracks));
        audioRecorder.ondataavailable = e => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        audioRecorderRef.current = audioRecorder;
        audioRecorder.start();
      }
      if (videoTracks.length > 0) {
        const videoRecorder = new MediaRecorder(new MediaStream(videoTracks));
        videoRecorder.ondataavailable = e => {
          if (e.data.size > 0) videoChunksRef.current.push(e.data);
        };
        videoRecorderRef.current = videoRecorder;
        videoRecorder.start();
      }
    }
    setAnswerMode('listening');
  };

  const stopAnswering = () => {
    if (useTextFallback) {
      setAnswerMode('review');
      return;
    }
    const finalText = transcriberRef.current?.stop() ?? '';
    transcriberRef.current = null;
    audioRecorderRef.current?.stop();
    videoRecorderRef.current?.stop();
    setLiveTranscript(finalText);
    setInterimTranscript('');
    setAnswerMode('review');
    if (!finalText.trim()) {
      showToast('No speech was recognized — you can type your answer instead.', 'info');
    }
  };

  const submitAnswer = async () => {
    if (!mockInterviewId || !activeQuestion) return;
    const transcript = (useTextFallback ? typedAnswer : liveTranscript || typedAnswer).trim();
    if (!transcript) {
      showToast('Say or type your answer before submitting.', 'error');
      return;
    }
    const durationSec = answerStartedAtRef.current ? (Date.now() - answerStartedAtRef.current) / 1000 : undefined;
    setPhase('submitting');
    try {
      // Recorder stop events have flushed by the time submit runs (user
      // clicked review first); package whatever evidence clips exist.
      const audioBlob = audioChunksRef.current.length > 0 ? new Blob(audioChunksRef.current, { type: 'audio/webm' }) : null;
      const videoBlob = videoChunksRef.current.length > 0 ? new Blob(videoChunksRef.current, { type: 'video/webm' }) : null;
      audioChunksRef.current = [];
      videoChunksRef.current = [];

      const result = await MockInterviewAIService.submitAnswer(mockInterviewId, activeQuestion.index, {
        transcript,
        answerMethod: useTextFallback || !liveTranscript ? 'text' : 'voice',
        durationSec,
        audioBlob,
        videoBlob
      });
      setLastFeedback(result);
      setAnswerMode('idle');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not evaluate your answer.', 'error');
    } finally {
      setPhase('live');
    }
  };

  const handleContinue = () => {
    if (!lastFeedback) return;
    if (lastFeedback.isLastQuestion) {
      setIsEndingConfirmOpen(true);
      return;
    }
    applyQuestion({
      index: lastFeedback.nextQuestionIndex!,
      text: lastFeedback.nextQuestion!,
      type: lastFeedback.nextQuestionType!,
      difficulty: lastFeedback.nextQuestionDifficulty ?? 'medium',
      expectedSkills: lastFeedback.nextExpectedSkills ?? []
    });
  };

  const handleConfirmEnd = async () => {
    if (!mockInterviewId) return;
    setIsEndingConfirmOpen(false);
    setPhase('ending');
    synthRef.current?.cancel();
    transcriberRef.current?.stop();
    observerRef.current?.stop();
    try {
      await MockInterviewAIService.endInterview(mockInterviewId);
      mediaStreamRef.current?.getTracks().forEach(t => t.stop());
      showToast('Report generated from your interview.', 'success');
      navigate(`/student/interview-report/${mockInterviewId}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not generate the final report.', 'error');
      setPhase('live');
    }
  };

  const inputClass =
    'w-full h-11 px-3.5 rounded-xl border border-outline-variant/70 bg-surface-container-lowest text-body-md text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary/40 focus:ring-0 focus:shadow-focus-brand outline-none transition-all';

  // ---------------------------------------------------------------- view --

  return (
    <PageLayout>
      <PageHeader
        title="AI mock interview"
        description="A personalized, adaptive interview built from your profile, resume and target job — with voice, camera observations and a full report."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {phase === 'setup' && (
            <Card>
              <CardHeader icon="tune" title="Interview setup" subtitle="The AI prepares unique questions from your profile, resume, skills and this role" />
              <div className="space-y-6">
                <div>
                  <span className="text-label-md font-semibold text-on-surface block mb-2">Interview type</span>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {INTERVIEW_TYPES.map(t => (
                      <button
                        key={t.key}
                        onClick={() => setInterviewType(t.key)}
                        className={`p-3 rounded-xl text-left transition-colors border ${
                          interviewType === t.key
                            ? 'bg-primary text-on-primary border-primary'
                            : 'bg-surface-container text-on-surface-variant border-transparent hover:bg-surface-container-high'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px] block mb-1">{t.icon}</span>
                        <span className="text-label-md font-semibold block">{t.label}</span>
                        <span className={`text-[10px] leading-tight block mt-0.5 ${interviewType === t.key ? 'text-on-primary/80' : ''}`}>{t.blurb}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-label-md font-semibold text-on-surface block mb-2">Difficulty</span>
                  <div className="flex flex-wrap gap-2">
                    {DIFFICULTIES.map(d => (
                      <button
                        key={d.key}
                        onClick={() => setDifficulty(d.key)}
                        className={`px-4 py-2.5 rounded-xl text-label-md font-semibold transition-colors ${
                          difficulty === d.key ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                        }`}
                      >
                        {d.label}
                        <span className={`block text-[10px] font-normal ${difficulty === d.key ? 'text-on-primary/80' : ''}`}>{d.blurb}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {applications.length > 0 && (
                  <label className="block">
                    <span className="text-label-md font-semibold text-on-surface">Practice for one of your applications <span className="text-on-surface-variant font-normal">(recommended)</span></span>
                    <select
                      value={selectedApplicationJobId}
                      onChange={e => setSelectedApplicationJobId(e.target.value)}
                      className={`mt-1.5 ${inputClass}`}
                    >
                      <option value="">— No, use a custom job title —</option>
                      {applications.map(app => (
                        <option key={app.id} value={app.jobId}>
                          {app.jobTitle} · {app.companyName}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {!selectedApplicationJobId && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-label-md font-semibold text-on-surface">Job title</span>
                      <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Frontend Engineer" className={`mt-1.5 ${inputClass}`} />
                    </label>
                    <label className="block">
                      <span className="text-label-md font-semibold text-on-surface">Company <span className="text-on-surface-variant font-normal">(optional)</span></span>
                      <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Novatech Systems" className={`mt-1.5 ${inputClass}`} />
                    </label>
                  </div>
                )}

                <div>
                  <span className="text-label-md font-semibold text-on-surface block mb-2">Number of questions</span>
                  <div className="flex flex-wrap gap-2">
                    {[4, 6, 8, 10].map(n => (
                      <button
                        key={n}
                        onClick={() => setNumQuestions(n)}
                        className={`w-11 h-11 rounded-xl text-label-md font-semibold transition-colors ${
                          numQuestions === n ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleStartSession}
                  disabled={starting}
                  leftIcon={<span className="material-symbols-outlined text-[19px]">{starting ? 'hourglass_top' : 'play_arrow'}</span>}
                >
                  {starting ? 'Preparing your personalized interview…' : 'Start interview'}
                </Button>
              </div>
            </Card>
          )}

          {(phase === 'live' || phase === 'submitting' || phase === 'ending') && activeQuestion && (
            <>
              <section className="relative bg-tertiary rounded-2xl overflow-hidden aspect-video shadow-2xl">
                <video ref={videoPreviewRef} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover bg-[#001f16]" />

                <div className="absolute top-4 left-4 right-4 flex justify-between z-20">
                  <div className="flex gap-2 text-xs">
                    {answerMode === 'listening' && (
                      <div className="bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 text-white font-bold">
                        <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
                        {useTextFallback ? 'ANSWERING' : 'LISTENING'} {formatRecTime(recSeconds)}
                      </div>
                    )}
                    {isSpeaking && (
                      <div className="bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 text-white font-bold">
                        <span className="material-symbols-outlined text-[14px] animate-pulse">graphic_eq</span>
                        Interviewer speaking…
                      </div>
                    )}
                  </div>
                  <div className="bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 text-white text-xs font-bold">
                    Question {activeQuestion.index + 1}/{totalQuestions}
                    <span className="opacity-60">·</span>
                    <span className="uppercase">{activeQuestion.difficulty}</span>
                  </div>
                </div>

                <div className="absolute bottom-[86px] left-6 right-6 z-20">
                  <div className="p-4 rounded-xl text-center bg-black/40 backdrop-blur-md border border-white/10 text-white">
                    <p className="text-[10px] uppercase tracking-wider text-primary-fixed/80 mb-1 font-bold">{activeQuestion.type}</p>
                    <p className="font-display text-sm font-semibold leading-relaxed">"{activeQuestion.text}"</p>
                    <button
                      onClick={() => void speakQuestion(activeQuestion.text)}
                      className="mt-2 text-[10px] uppercase tracking-wide font-bold text-primary-fixed/90 hover:text-white bg-white/10 rounded-full px-3 py-1 cursor-pointer border-none inline-flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[13px]">replay</span> Repeat question
                    </button>
                  </div>
                </div>

                <div className="absolute bottom-0 w-full bg-black/40 backdrop-blur-md py-3 flex justify-center items-center gap-4 z-20">
                  <button
                    onClick={() => setIsEndingConfirmOpen(true)}
                    className="p-3 rounded-full bg-error/20 text-error hover:bg-error hover:text-white transition-all cursor-pointer border-none flex items-center justify-center"
                    title="End interview"
                  >
                    <span className="material-symbols-outlined text-lg">call_end</span>
                  </button>

                  {!lastFeedback && answerMode === 'idle' && (
                    <button
                      onClick={startAnswering}
                      disabled={phase !== 'live'}
                      className="px-8 py-3 rounded-full font-bold text-xs flex items-center gap-2 bg-primary text-white transition-transform hover:scale-105 cursor-pointer border-none disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-sm">{useTextFallback ? 'keyboard' : 'mic'}</span>
                      {useTextFallback ? 'Type Answer' : 'Answer by Voice'}
                    </button>
                  )}
                  {!lastFeedback && answerMode === 'listening' && (
                    <button
                      onClick={stopAnswering}
                      className="px-8 py-3 rounded-full font-bold text-xs flex items-center gap-2 bg-error text-white cursor-pointer border-none hover:scale-105 transition-transform"
                    >
                      <span className="material-symbols-outlined text-sm">stop</span> Done Answering
                    </button>
                  )}
                  {!lastFeedback && answerMode === 'review' && (
                    <button
                      onClick={() => void submitAnswer()}
                      disabled={phase === 'submitting'}
                      className="px-8 py-3 rounded-full font-bold text-xs flex items-center gap-2 bg-primary text-white cursor-pointer border-none hover:scale-105 transition-transform disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-sm">send</span>
                      {phase === 'submitting' ? 'Evaluating…' : 'Submit Answer'}
                    </button>
                  )}
                  {lastFeedback && (
                    <button
                      onClick={handleContinue}
                      disabled={phase === 'ending'}
                      className="px-8 py-3 rounded-full font-bold text-xs flex items-center gap-2 bg-primary text-white cursor-pointer border-none hover:scale-105 transition-transform disabled:opacity-50"
                    >
                      {lastFeedback.isLastQuestion ? 'Finish & Generate Report' : 'Next Question'}
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  )}
                </div>
              </section>

              {cameraError && <p className="text-xs text-on-surface-variant px-2">{cameraError}</p>}
              {planEstimated && (
                <div className="px-2"><Badge tone="warning" icon="info">Estimated – AI unavailable: questions were generated by the offline engine.</Badge></div>
              )}

              {/* Live transcript / typed answer */}
              {!lastFeedback && answerMode !== 'idle' && (
                <Card className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-primary uppercase tracking-wider text-[10px]">
                      {useTextFallback ? 'Your answer' : 'Live transcript (speech-to-text)'}
                    </h4>
                    {!useTextFallback && answerMode === 'review' && (
                      <button
                        onClick={() => { setUseTextFallback(true); setTypedAnswer(liveTranscript); }}
                        className="text-[10px] font-bold text-primary cursor-pointer bg-transparent border-none underline"
                      >
                        Edit as text
                      </button>
                    )}
                  </div>
                  {useTextFallback ? (
                    <textarea
                      value={typedAnswer}
                      onChange={e => { setTypedAnswer(e.target.value); observerRef.current?.markActivity(); }}
                      rows={5}
                      placeholder="Type your answer here…"
                      className="w-full p-3.5 rounded-xl border border-outline-variant/70 bg-surface-container-lowest text-body-md text-on-surface outline-none focus:border-primary/40 transition-all resize-y"
                    />
                  ) : (
                    <p className="text-sm text-on-surface leading-relaxed min-h-[3rem]">
                      {liveTranscript}
                      {interimTranscript && <span className="text-on-surface-variant italic"> {interimTranscript}</span>}
                      {!liveTranscript && !interimTranscript && (
                        <span className="text-on-surface-variant italic">Start speaking — your words appear here…</span>
                      )}
                    </p>
                  )}
                </Card>
              )}

              {/* Per-answer AI feedback */}
              {lastFeedback && (
                <Card className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-primary uppercase tracking-wider text-[10px]">AI Feedback on Your Answer</h4>
                    {lastFeedback.evaluation.estimated && <Badge tone="warning" icon="info">Estimated – AI unavailable</Badge>}
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed italic">"{lastFeedback.evaluation.feedback}"</p>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {(
                      [
                        ['Technical', lastFeedback.evaluation.technicalScore],
                        ['Communication', lastFeedback.evaluation.communicationScore],
                        ['Problem solving', lastFeedback.evaluation.problemSolvingScore],
                        ['Relevance', lastFeedback.evaluation.relevanceScore],
                        ['Completeness', lastFeedback.evaluation.completenessScore],
                        ['Grammar', lastFeedback.evaluation.grammarScore]
                      ] as [string, number][]
                    ).map(([label, value]) => (
                      <div key={label} className="bg-surface-container-low p-3 rounded-lg text-center">
                        <p className="text-[9px] text-outline uppercase font-bold leading-tight">{label}</p>
                        <p className="text-lg font-bold text-primary">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-surface-container-low p-3 rounded-lg">
                      <p className="text-[10px] text-outline uppercase font-bold">Pace</p>
                      <p className="font-bold text-primary">{lastFeedback.wordsPerMinute ? `${Math.round(lastFeedback.wordsPerMinute)} wpm` : '—'}</p>
                    </div>
                    <div className="bg-surface-container-low p-3 rounded-lg">
                      <p className="text-[10px] text-outline uppercase font-bold">Filler words</p>
                      <p className="font-bold text-primary">{lastFeedback.fillerWordCount}</p>
                    </div>
                  </div>
                  {lastFeedback.evaluation.suggestedBetterAnswer && (
                    <div className="bg-primary-container/20 border border-primary/10 p-3 rounded-lg">
                      <p className="text-[10px] text-primary uppercase font-bold mb-1">A stronger answer</p>
                      <p className="text-xs text-on-surface-variant leading-relaxed">{lastFeedback.evaluation.suggestedBetterAnswer}</p>
                    </div>
                  )}
                </Card>
              )}
            </>
          )}
        </div>

        <aside className="space-y-6">
          {phase === 'setup' && history.length > 0 && (
            <Card>
              <CardHeader icon="history" title="Recent interviews" />
              <ul className="space-y-2">
                {history.map(h => (
                  <li key={h.id}>
                    <button
                      onClick={() => navigate(`/student/interview-report/${h.id}`)}
                      className="w-full text-left p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer border-none"
                    >
                      <span className="text-label-md font-semibold text-on-surface block">{h.jobTitle}</span>
                      <span className="text-[11px] text-on-surface-variant">
                        {new Date(h.completedAt ?? h.createdAt).toLocaleDateString()} · {h.interviewType} · {h.reports[0] ? `${h.reports[0].score}/100` : 'no report'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card>
            <CardHeader icon="lightbulb" title="How it works" />
            <ul className="space-y-3 text-label-md text-on-surface-variant">
              <li className="flex gap-2"><span className="material-symbols-outlined text-[18px] text-primary shrink-0">record_voice_over</span>The AI interviewer speaks each question aloud; answer naturally by voice.</li>
              <li className="flex gap-2"><span className="material-symbols-outlined text-[18px] text-primary shrink-0">trending_up</span>Questions adapt: strong answers raise the difficulty, struggles bring supportive follow-ups.</li>
              <li className="flex gap-2"><span className="material-symbols-outlined text-[18px] text-primary shrink-0">videocam</span>With camera permission, participation events (like leaving the frame) are noted factually in your report.</li>
              <li className="flex gap-2"><span className="material-symbols-outlined text-[18px] text-primary shrink-0">picture_as_pdf</span>Every answer is stored and your final report is downloadable as a branded PDF.</li>
            </ul>
          </Card>

          <Card>
            <CardHeader icon="structure" title="Answer like a pro" />
            <ul className="space-y-3 text-label-md text-on-surface-variant">
              <li className="flex gap-2"><span className="material-symbols-outlined text-[18px] text-primary shrink-0">star</span>Use STAR: Situation, Task, Action, Result.</li>
              <li className="flex gap-2"><span className="material-symbols-outlined text-[18px] text-primary shrink-0">speed</span>Pause before answering — a steady pace reads as composure.</li>
              <li className="flex gap-2"><span className="material-symbols-outlined text-[18px] text-primary shrink-0">numbers</span>Quantify results — numbers make answers memorable.</li>
            </ul>
          </Card>
        </aside>
      </div>

      <Dialog
        isOpen={isEndingConfirmOpen}
        onClose={() => setIsEndingConfirmOpen(false)}
        title="Finish interview"
        description="Your answered questions will be compiled into a permanent AI report with scores, feedback and a learning roadmap. Unanswered questions are discarded."
        confirmLabel="Finish & Generate Report"
        onConfirm={handleConfirmEnd}
        confirmVariant="primary"
      />
    </PageLayout>
  );
};

export default MockInterview;
