import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../../components/layout/PageLayout';
import { Dialog } from '../../components/ui/Dialog';
import { useToast } from '../../contexts/ToastContext';

export const MockInterview: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Screen layout states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isReportVisible, setIsReportVisible] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [isEndingConfirmOpen, setIsEndingConfirmOpen] = useState(false);

  // Setup options states
  const [interviewType, setInterviewType] = useState<'Technical' | 'HR' | 'Behavioral' | 'System Design' | 'Group Discussion'>('Technical');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [duration, setDuration] = useState<'15 min' | '30 min' | '60 min'>('30 min');
  const [targetCompany, setTargetCompany] = useState<'Google' | 'Microsoft' | 'Amazon'>('Microsoft');

  // Simulated recording duration countup
  const [recSeconds, setRecSeconds] = useState(0);
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setRecSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatRecTime = (sec: number) => {
    const mm = String(Math.floor(sec / 60)).padStart(2, '0');
    const ss = String(sec % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  const questions = {
    Technical: [
      "Can you explain the difference between a process and a thread in operating systems?",
      "How would you optimize rendering performance in a React 19 application with nested lists?",
      "Describe a time you had to resolve a complex CSS layout issue on a production app.",
      "What is the time complexity of lookup operations in a self-balancing binary search tree?",
      "Explain the concept of event bubbling and how event delegation resolves performance bottlenecks."
    ],
    HR: [
      "Tell me about a time you had to collaborate with a difficult stakeholder.",
      "Why do you want to join our engineering division at this stage in your career?",
      "What are your greatest professional strengths and where do you seek growth?",
      "How do you prioritize competing deadlines in a fast-paced release environment?",
      "Where do you see yourself in five years in terms of technology leadership?"
    ],
    Behavioral: [
      "Describe a situation where you made a mistake on a production release. How did you resolve it?",
      "Tell me about a time you had a difference of opinion with a product manager.",
      "Explain a scenario where you had to learn a completely new framework on a tight schedule.",
      "Tell me about a time you took the lead on a technical project without explicit directions.",
      "Describe how you handled a situation where a teammate was not pulling their weight."
    ],
    'System Design': [
      "How would you design a highly available notification delivery system for millions of users?",
      "Explain how you would structure a real-time collaborative whiteboarding document backend.",
      "What caching strategy would you use for a global news feed system with hot keys?",
      "Design a rate limiter that supports tier-based API usage plans.",
      "How do you design a database schema for an international ride-sharing platform?"
    ],
    'Group Discussion': [
      "How do we balance technical debt refactoring with delivering user features?",
      "Should companies invest in building custom AI models or consume third-party API solutions?",
      "How do we address security and privacy concerns in LLM integrations?",
      "What is the impact of remote work on engineering culture and pair programming?",
      "How do we ensure digital accessibility is integrated into the early product design phase?"
    ]
  }[interviewType];

  const handleStartSession = () => {
    setIsPlaying(true);
    setIsReportVisible(false);
    setCurrentQuestionIdx(0);
    showToast('Mock Interview started! Speak clearly into your microphone.', 'success');
  };

  const handleRecordToggle = () => {
    if (isRecording) {
      setIsRecording(false);
      showToast('Answer recorded successfully. Analysing responses...', 'success');
    } else {
      setIsRecording(true);
      showToast('Microphone active. Record your answer now.', 'info');
    }
  };

  const handleNextQuestion = () => {
    if (isRecording) setIsRecording(false);
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      setIsEndingConfirmOpen(true);
    }
  };

  const handleConfirmEnd = () => {
    setIsEndingConfirmOpen(false);
    setIsPlaying(false);
    setIsReportVisible(true);
    showToast('Scorecard compiled! Review your metrics below.', 'success');
  };

  return (
    <PageLayout>
      <main className="text-left max-w-container-max mx-auto space-y-stack-lg">
        {/* Page Header */}
        <div>
          <h2 className="font-display text-headline-lg text-primary">AI Mock Interview</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Practice interviews with real-world AI feedback.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          
          {/* Left Column: Setup / Live Video Workspace / Scorecard */}
          <div className="col-span-12 lg:col-span-8 space-y-section-gap">
            
            {/* Setup view */}
            {!isPlaying && !isReportVisible && (
              <section className="bg-white p-stack-lg rounded-xl shadow-[0_4px_20px_rgba(2,54,41,0.04)] border border-primary/5 space-y-8">
                <div className="flex items-center gap-stack-sm">
                  <span className="material-symbols-outlined text-primary">tune</span>
                  <h3 className="font-headline-md text-headline-md text-primary">Interview Setup</h3>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="font-label-md text-label-md block mb-3 text-on-surface-variant">Interview Type</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {(['Technical', 'HR', 'Behavioral', 'System Design', 'Group Discussion'] as const).map(type => {
                        const isSel = interviewType === type;
                        const icons = {
                          Technical: 'code',
                          HR: 'person',
                          Behavioral: 'psychology',
                          'System Design': 'account_tree',
                          'Group Discussion': 'groups'
                        }[type];
                        return (
                          <button
                            key={type}
                            onClick={() => setInterviewType(type)}
                            className={`flex flex-col items-center gap-2 p-5 rounded-xl transition-all border-2 cursor-pointer ${
                              isSel 
                                ? 'border-primary bg-primary-container/10 text-primary' 
                                : 'border-outline-variant hover:border-primary/40 text-on-surface-variant'
                            }`}
                          >
                            <span className="material-symbols-outlined text-2xl">{icons}</span>
                            <span className="font-label-md text-xs">{type}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="font-label-md text-label-md block mb-3 text-on-surface-variant">Difficulty Level</label>
                      <div className="flex flex-wrap gap-2">
                        {(['Easy', 'Medium', 'Hard'] as const).map(lvl => {
                          const isSel = difficulty === lvl;
                          return (
                            <button
                              key={lvl}
                              onClick={() => setDifficulty(lvl)}
                              className={`px-5 py-2 rounded-full font-label-md text-xs border cursor-pointer transition-colors ${
                                isSel 
                                  ? 'bg-primary-container text-white border-transparent' 
                                  : 'bg-secondary-container/20 text-on-secondary-container border-transparent hover:border-primary/20'
                              }`}
                            >
                              {lvl}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="font-label-md text-label-md block mb-3 text-on-surface-variant">Duration</label>
                      <div className="flex flex-wrap gap-2">
                        {(['15 min', '30 min', '60 min'] as const).map(dur => {
                          const isSel = duration === dur;
                          return (
                            <button
                              key={dur}
                              onClick={() => setDuration(dur)}
                              className={`px-5 py-2 rounded-full font-label-md text-xs border cursor-pointer transition-colors ${
                                isSel 
                                  ? 'bg-primary text-white border-transparent' 
                                  : 'bg-secondary-container/20 text-on-secondary-container border-transparent hover:border-primary/20'
                              }`}
                            >
                              {dur}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="font-label-md text-label-md block mb-3 text-on-surface-variant">Target Company</label>
                    <div className="flex flex-wrap gap-4 items-center">
                      {[
                        { id: 'Google', logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDU_wLc7-g4jS7OizyPBInFC7ACpzbsjHnOfgUBhYB2XNYt0Zh-8v21riodLa1YRn9118kLBIJ6vVWbKh9F5GLz7S54c3ULscu-slZZEVq2GKh8LC9-CqsxlcE8q2UtKUhiKMu0IRDINSIUzyEMpkUqhkZFJJX9aFwHDEcyMhVTG_PWGCsjq1A97QbDO-9LOYIsq2phw-hrRJdHRpuOec9McttXERuUh0_zIP0OmpZJtTXF_ZwFjhcCCGyuDVnEDQtKRGak72MMNFw' },
                        { id: 'Microsoft', logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBY6knHLcUMKe3l47iQYHmFLZGBldmMYSYayz_YqR4684i2PN-M6CyES8EVozgROxdD2nFJdVv25xAzTh1-oeqL2E9WgEdp15LZCOJDJWL6cc6ZefkMy0wtx49zGBh4G7NVOvDsYSXyNmO-UKTH-skVZ2Qbf69yJkyHpZACOUoqV9p5n0Ztv_0d3LoavFj8rsQpCX4zwOW1oXC-EIgbaXx0ySro3JdxPb1ASyP-wDNVf6UjSTkHP9kwSBuqDF4qOMeJ5GdAcmF-LgE' },
                        { id: 'Amazon', logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDpw9QGlt1QhgKfTOKGrnbM9yro6Q9IqSgHyghWIhm9mK73b7sw-Zi7EJDSbehuBJnCvnS2NVQ9Xdj7dhaMjz7rO9LluZF4Xa72j5ppEMi3jUey8YUpPem01Kx1qTz48G3TxgbzpPlZX_7Y-pjpfD3azy_k8oWtbV9_OGZ5ZSvsBsTea1ZUJZPd7FqhT6IJyul_dUMTgNu8Xt89sSwWAq_r52PnOW1lhATx_W7asXiejgvniCEKKpAnhsde_6HkwJq0PvCB9MLz64U' }
                      ].map(company => {
                        const isSel = targetCompany === company.id;
                        return (
                          <button
                            key={company.id}
                            onClick={() => setTargetCompany(company.id as any)}
                            className={`w-12 h-12 bg-surface-container rounded-lg flex items-center justify-center p-2 cursor-pointer transition-all ${
                              isSel ? 'border-2 border-primary scale-105' : 'border border-transparent hover:border-primary/20'
                            }`}
                          >
                            <img className="w-full h-full object-contain" alt={company.id} src={company.logo} />
                          </button>
                        );
                      })}
                      <button 
                        onClick={() => showToast('Enter custom company name.', 'info')}
                        className="w-12 h-12 bg-surface-container rounded-lg flex items-center justify-center p-2 border border-transparent hover:border-primary cursor-pointer text-on-surface-variant"
                      >
                        <span className="material-symbols-outlined">add</span>
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={handleStartSession}
                    className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-opacity-95 transition-all active:scale-95 shadow-lg cursor-pointer border-none text-xs uppercase tracking-wider"
                  >
                    Start Interview
                  </button>
                </div>
              </section>
            )}

            {/* Live Video Workspace */}
            {isPlaying && (
              <section className="relative bg-tertiary rounded-2xl overflow-hidden aspect-video shadow-2xl">
                <style>{`
                  .active-ring {
                      animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                  }
                  @keyframes pulse-ring {
                      0%, 100% { transform: scale(1); opacity: 0.8; }
                      50% { transform: scale(1.1); opacity: 0.4; }
                  }
                  .glass-card {
                      background: rgba(255, 255, 255, 0.15);
                      backdrop-filter: blur(12px);
                      border: 1px solid rgba(255, 255, 255, 0.1);
                  }
                `}</style>

                {/* AI Avatar animated visual */}
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-[#001f16]">
                  <div className="relative z-10 w-48 h-48 rounded-full border-4 border-primary-fixed/20 flex items-center justify-center">
                    <div className="w-40 h-40 rounded-full bg-primary-container active-ring flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-primary-container text-[64px]" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                    </div>
                  </div>
                </div>

                {/* Status indicator bar overlay */}
                <div className="absolute top-4 left-4 right-4 flex justify-between z-20">
                  <div className="flex gap-2 text-xs">
                    <div className="glass-card px-4 py-1.5 rounded-full flex items-center gap-2 text-white font-bold">
                      <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
                      REC {formatRecTime(recSeconds)}
                    </div>
                    <div className="glass-card px-4 py-1.5 rounded-full flex items-center gap-2 text-white font-bold">
                      <span className="material-symbols-outlined text-primary-fixed text-sm">videocam</span>
                      Cam: On
                    </div>
                  </div>
                  <div className="glass-card px-4 py-1.5 rounded-full flex items-center gap-2 text-white text-xs font-bold">
                    Progress: {currentQuestionIdx + 1}/{questions.length}
                  </div>
                </div>

                {/* Active question popup */}
                <div className="absolute bottom-[80px] left-8 right-8 z-20">
                  <div className="glass-card p-4 rounded-xl text-center bg-black/40 backdrop-blur-md border border-white/10 text-white">
                    <p className="font-display text-sm font-semibold leading-relaxed">
                      "{questions[currentQuestionIdx]}"
                    </p>
                  </div>
                </div>

                {/* simulated waveform graphics */}
                {isRecording && (
                  <div className="absolute bottom-[100px] left-1/2 -translate-x-1/2 flex items-end gap-1 h-8 z-30 pointer-events-none">
                    <div className="w-1 bg-[#a1d1be] h-4 animate-[bounce_1s_infinite]" />
                    <div className="w-1 bg-[#a1d1be] h-8 animate-[bounce_1.2s_infinite] [animation-delay:0.2s]" />
                    <div className="w-1 bg-[#a1d1be] h-6 animate-[bounce_0.8s_infinite] [animation-delay:0.4s]" />
                    <div className="w-1 bg-[#a1d1be] h-3 animate-[bounce_1.1s_infinite] [animation-delay:0.1s]" />
                    <div className="w-1 bg-[#a1d1be] h-7 animate-[bounce_0.9s_infinite] [animation-delay:0.3s]" />
                    <div className="w-1 bg-[#a1d1be] h-5 animate-[bounce_1.3s_infinite] [animation-delay:0.5s]" />
                  </div>
                )}

                {/* Controls container */}
                <div className="absolute bottom-0 w-full bg-black/40 backdrop-blur-md py-3 flex justify-center items-center gap-4 z-20">
                  <button 
                    onClick={() => setIsEndingConfirmOpen(true)}
                    className="p-3 rounded-full bg-error/20 text-error hover:bg-error hover:text-white transition-all cursor-pointer border-none flex items-center justify-center"
                    title="End Session"
                  >
                    <span className="material-symbols-outlined text-lg">call_end</span>
                  </button>

                  <button 
                    onClick={handleRecordToggle}
                    className={`px-8 py-3 rounded-full font-bold text-xs flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer border-none ${
                      isRecording ? 'bg-error text-white' : 'bg-primary text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">{isRecording ? 'stop' : 'mic'}</span>
                    {isRecording ? 'Stop Recording' : 'Record Answer'}
                  </button>

                  <button 
                    onClick={handleNextQuestion}
                    className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer border-none flex items-center justify-center"
                    title="Next Question"
                  >
                    <span className="material-symbols-outlined text-lg">skip_next</span>
                  </button>
                </div>
              </section>
            )}

            {/* Scorecard Results Dashboard */}
            {isReportVisible && (
              <section className="space-y-6">
                
                {/* Scorecard card details */}
                <div className="bg-white p-8 rounded-xl shadow-lg border border-primary/10">
                  <div className="flex justify-between items-center mb-8 border-b border-primary/5 pb-4">
                    <div>
                      <h3 className="font-headline-md text-headline-md text-primary font-bold">Interview Report</h3>
                      <p className="text-xs text-on-surface-variant font-semibold">Session ID: #88291 • Type: {interviewType}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-extrabold text-primary">88</div>
                      <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">Overall Score</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="p-4 bg-surface-container-low rounded-lg text-left">
                      <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1">Confidence</p>
                      <div className="text-xl font-bold text-primary">92%</div>
                    </div>
                    <div className="p-4 bg-surface-container-low rounded-lg text-left">
                      <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1">Communication</p>
                      <div className="text-xl font-bold text-primary">85%</div>
                    </div>
                    <div className="p-4 bg-surface-container-low rounded-lg text-left">
                      <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1">Technical</p>
                      <div className="text-xl font-bold text-primary">87%</div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-8 text-xs leading-relaxed">
                    <div>
                      <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider mb-3">Strengths</h4>
                      <ul className="space-y-2 text-on-surface-variant font-semibold">
                        <li className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                          Clear articulation of OS core parameters.
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                          Excellent structural description of thread memory models.
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-bold text-error uppercase tracking-wider mb-3">Weaknesses</h4>
                      <ul className="space-y-2 text-on-surface-variant font-semibold">
                        <li className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-error text-sm">error</span>
                          speaking rate slightly fast during concurrency answers.
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-error text-sm">error</span>
                          Missed detail on context switching latency metrics.
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-4">
                    <button 
                      onClick={() => {
                        setIsReportVisible(false);
                        setIsPlaying(false);
                      }}
                      className="flex-1 py-3 bg-primary text-white rounded-lg font-bold text-xs uppercase cursor-pointer border-none hover:opacity-95"
                    >
                      Next Mock Interview
                    </button>
                    <button 
                      onClick={() => navigate('/student/jobs')}
                      className="flex-1 py-3 border border-primary text-primary rounded-lg font-bold text-xs uppercase cursor-pointer bg-white hover:bg-surface-container"
                    >
                      View Recommended Jobs
                    </button>
                  </div>
                </div>

                {/* Transcripts history box */}
                <div className="bg-white p-8 rounded-xl border border-primary/5 text-xs text-left">
                  <h3 className="font-headline-md text-headline-md text-primary font-bold mb-6 border-b border-primary/5 pb-3">Interview Transcript</h3>
                  
                  <div className="space-y-6">
                    <div className="p-4 bg-surface-container-low rounded-lg border-l-4 border-primary">
                      <p className="font-bold text-primary mb-1 text-[10px] uppercase tracking-wider">Question</p>
                      <p className="text-on-surface font-semibold">"Can you explain the difference between a process and a thread?"</p>
                    </div>

                    <div className="p-4 bg-white rounded-lg border border-outline-variant/30">
                      <p className="font-bold text-on-surface-variant mb-1 text-[10px] uppercase tracking-wider">Your Answer</p>
                      <p className="text-on-surface font-medium leading-relaxed">
                        "A process is an independent execution unit with its own memory space, while a thread is a subset of a process that shares memory resources with other threads in the same process."
                      </p>
                    </div>

                    <div className="p-4 bg-primary-container/5 rounded-lg border border-primary/5">
                      <p className="font-bold text-primary flex items-center gap-1.5 mb-1 text-[10px] uppercase tracking-wider">
                        <span className="material-symbols-outlined text-sm">psychology</span>
                        AI Feedback
                      </p>
                      <p className="text-on-surface italic font-medium leading-relaxed">
                        "Excellent definition. You correctly identified the memory sharing aspect. To improve, mention that threads are lighter weight to create than processes and cause less context switching overhead."
                      </p>
                    </div>
                  </div>
                </div>

              </section>
            )}

          </div>

          {/* Right Column: Sidebar */}
          <aside className="col-span-12 lg:col-span-4 space-y-6">
            
            {/* Live AI evaluation panel */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-primary/5 text-xs">
              <div className="flex items-center gap-2 mb-6 pb-3 border-b border-primary/5">
                <span className="material-symbols-outlined text-primary">analytics</span>
                <h3 className="font-headline-md text-[16px] text-primary font-bold">Live AI Feedback</h3>
                {isPlaying && (
                  <span className="ml-auto flex items-center gap-1.5 text-[10px] text-primary font-bold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    Live Updating...
                  </span>
                )}
              </div>

              <div className="space-y-4">
                {/* Confidence meter */}
                <div>
                  <div className="flex justify-between font-bold mb-1.5">
                    <span>Confidence Level</span>
                    <span className="text-primary font-bold">85%</span>
                  </div>
                  <div className="w-full bg-surface-container rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: '85%' }} />
                  </div>
                </div>

                {/* Communication meter */}
                <div>
                  <div className="flex justify-between font-bold mb-1.5">
                    <span>Communication</span>
                    <span className="text-primary font-bold">78%</span>
                  </div>
                  <div className="w-full bg-surface-container rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: '78%' }} />
                  </div>
                </div>

                {/* Technical Accuracy meter */}
                <div>
                  <div className="flex justify-between font-bold mb-1.5">
                    <span>Technical Accuracy</span>
                    <span className="text-primary font-bold">90%</span>
                  </div>
                  <div className="w-full bg-surface-container rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: '90%' }} />
                  </div>
                </div>

                <div className="pt-4 border-t border-outline-variant/30 space-y-2 font-semibold">
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-primary text-sm">visibility</span>
                      Eye Contact
                    </span>
                    <span className="text-primary font-bold">Good</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-primary text-sm">speed</span>
                      Speaking Speed
                    </span>
                    <span className="text-primary font-bold">Optimal</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-outline-variant/30">
                  <p className="font-bold text-on-surface-variant mb-2">Keywords Detected:</p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 bg-secondary-container/30 text-primary font-bold rounded border border-primary/10">Process</span>
                    <span className="px-2 py-0.5 bg-secondary-container/30 text-primary font-bold rounded border border-primary/10">Memory</span>
                    <span className="px-2 py-0.5 bg-secondary-container/30 text-primary font-bold rounded border border-primary/10">Context Switching</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tip of day card */}
            <div className="bg-secondary-container/30 p-5 rounded-xl border-l-4 border-primary text-xs">
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-primary text-lg">lightbulb</span>
                <div>
                  <h4 className="font-bold text-primary mb-1">Today's Interview Tip</h4>
                  <p className="text-on-secondary-fixed-variant leading-relaxed font-medium">
                    Maintain consistent eye contact with the camera, not the screen, to project confidence during virtual rounds.
                  </p>
                </div>
              </div>
            </div>

            {/* Technical topics list */}
            <div className="bg-white p-6 rounded-xl border border-primary/5 text-xs text-left">
              <h4 className="font-bold text-primary mb-4 uppercase tracking-wider">Top Technical Topics</h4>
              <ul className="space-y-2">
                {[
                  { title: 'Distributed Systems', icon: 'hub' },
                  { title: 'React Hooks', icon: 'integration_instructions' },
                  { title: 'System Design', icon: 'architecture' }
                ].map(topic => (
                  <li 
                    key={topic.title}
                    onClick={() => showToast(`Loading topic outline: ${topic.title}`, 'info')}
                    className="flex items-center gap-2 p-2 hover:bg-surface-container rounded-lg cursor-pointer transition-colors font-semibold"
                  >
                    <span className="material-symbols-outlined text-primary text-sm">{topic.icon}</span>
                    <span className="text-on-surface">{topic.title}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recent performance score list */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-primary/5 text-xs text-left">
              <h4 className="font-bold text-primary mb-4 uppercase tracking-wider">Recent Performance</h4>
              <div className="space-y-4 font-semibold">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-on-surface">Google Technical</p>
                    <p className="text-[10px] text-outline mt-0.5">Yesterday</p>
                  </div>
                  <span className="text-lg font-bold text-primary">92</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-on-surface">HR Behavioral</p>
                    <p className="text-[10px] text-outline mt-0.5">3 days ago</p>
                  </div>
                  <span className="text-lg font-bold text-primary/60">84</span>
                </div>
              </div>
            </div>

          </aside>

        </div>
      </main>

      {/* End Session Dialog confirm box */}
      <Dialog
        isOpen={isEndingConfirmOpen}
        onClose={() => setIsEndingConfirmOpen(false)}
        title="End Interview Session"
        description="Are you sure you want to finish the mock interview session? Your final responses will be locked and compiled into an AI Scorecard."
        confirmLabel="Finish & View Report"
        onConfirm={handleConfirmEnd}
        confirmVariant="primary"
      />
    </PageLayout>
  );
};

export default MockInterview;
