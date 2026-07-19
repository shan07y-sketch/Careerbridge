/**
 * Mobile Profile — premium identity hub.
 * Aurora hero with a real completion ring, skills with proficiency, account
 * verifications, portfolio links, and a resume summary that deep-links to the
 * dedicated Resume screen. All data from Profile/Resume services (real API).
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { ResumeService, ProfileService } from '../../../services';
import type { ResumeVersion } from '../../../services';
import type { Student } from '../../../types';
import { MobileShell, Card, Chip, SectionTitle, SkeletonList, ScoreRing, Avatar } from '../../components';

const MobileProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState<Student | null>(null);
  const [resumes, setResumes] = useState<ResumeVersion[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [p, r] = await Promise.allSettled([ProfileService.getStudentProfile(), ResumeService.getHistory()]);
    if (p.status === 'fulfilled') setProfile(p.value);
    if (r.status === 'fulfilled') setResumes(r.value);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const displayed = profile ?? user;
  const activeResume = resumes.find(r => r.isActive) ?? resumes[0];
  const atsScore = activeResume?.resumeAnalyses?.[0]?.score ?? displayed?.resumeScore ?? 0;

  if (loading) {
    return <MobileShell title="Profile"><SkeletonList count={4} /></MobileShell>;
  }

  // Honest profile completion derived from real fields (no fabricated metric).
  const checklist = [
    { done: !!displayed?.name && !!displayed?.degree && !!displayed?.university, label: 'Add education details', to: '/student/settings' },
    { done: !!displayed?.careerGoal, label: 'Set your career goal', to: '/student/settings' },
    { done: (displayed?.skills?.length ?? 0) > 0, label: 'Add your skills', to: '/student/settings' },
    { done: resumes.length > 0, label: 'Upload a resume', to: '/student/resume' },
    { done: !!displayed?.portfolioUrl || !!displayed?.gitHubConnected, label: 'Link a portfolio or GitHub', to: '/student/settings' },
    { done: !!displayed?.emailVerified, label: 'Verify your email', to: '/student/settings' },
  ];
  const completedCount = checklist.filter(c => c.done).length;
  const completion = Math.round((completedCount / checklist.length) * 100);
  const nextStep = checklist.find(c => !c.done);

  const verifications = [
    { on: !!displayed?.emailVerified, icon: 'mail', label: 'Email' },
    { on: !!displayed?.phoneVerified, icon: 'call', label: 'Phone' },
    { on: !!displayed?.linkedInConnected, icon: 'hub', label: 'LinkedIn' },
    { on: !!displayed?.gitHubConnected, icon: 'code', label: 'GitHub' },
  ];

  return (
    <MobileShell bare>
      {/* ---- Aurora identity hero ---- */}
      <section className="m-hero m-safe-top px-5 pt-5 pb-6 rounded-b-[28px]">
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-white/70 leading-none">Profile</p>
          <button
            onClick={() => navigate('/student/settings')}
            aria-label="Settings"
            className="m-press w-10 h-10 rounded-full m-glass flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-white text-[20px]">settings</span>
          </button>
        </div>

        <div className="mt-3 flex items-center gap-4">
          <Avatar src={displayed?.profilePicture} name={displayed?.name || 'Student'} size={64} />
          <div className="min-w-0">
            <p className="text-xl font-extrabold leading-tight truncate">{displayed?.name || 'Complete your profile'}</p>
            <p className="text-[13px] text-white/75 truncate">
              {displayed?.degree}{displayed?.gradYear ? ` · Class of ${displayed.gradYear}` : ''}
            </p>
            <p className="text-[13px] text-white/60 truncate">{displayed?.university}</p>
          </div>
        </div>

        {/* Completion ring + next step */}
        <div className="mt-4 flex items-center gap-4 rounded-3xl m-glass p-4">
          <ScoreRing score={completion} size={72} label="complete" />
          <div className="min-w-0">
            <p className="text-sm font-bold">Profile strength</p>
            <p className="text-[13px] text-white/75 leading-snug">
              {nextStep ? `Next: ${nextStep.label.toLowerCase()}` : 'Your profile is complete — nice work.'}
            </p>
            {nextStep && (
              <button
                onClick={() => navigate(nextStep.to)}
                className="mt-2 text-[13px] font-bold text-white underline underline-offset-4 decoration-white/40"
              >
                Complete it →
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="px-4">
        {/* ---- Resume summary → dedicated screen ---- */}
        <SectionTitle action={<button onClick={() => navigate('/student/resume')} className="text-xs font-semibold text-primary">Manage</button>}>
          Resume
        </SectionTitle>
        <button
          onClick={() => navigate('/student/resume')}
          className="m-card-lift w-full text-left rounded-3xl bg-surface-container/70 border border-on-surface/5 p-4 flex items-center gap-4"
        >
          {activeResume ? <ScoreRing score={atsScore} size={56} /> : (
            <span className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[26px] text-on-surface-variant">description</span>
            </span>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">{activeResume ? 'ATS readiness' : 'No resume yet'}</p>
            <p className="text-xs text-on-surface-variant truncate">
              {activeResume
                ? `${activeResume.fileName} · v${activeResume.version}`
                : 'Upload a resume to unlock your ATS score'}
            </p>
            {profile?.resumeScoreEstimated && activeResume && (
              <p className="text-[11px] text-on-surface-variant mt-0.5">Estimated — AI analysis unavailable</p>
            )}
          </div>
          <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
        </button>

        {/* ---- Career goal ---- */}
        {displayed?.careerGoal && (
          <>
            <SectionTitle>Career goal</SectionTitle>
            <Card>
              <p className="text-sm text-on-surface">{displayed.careerGoal}</p>
              {(displayed.preferredLocation || displayed.workMode) && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {displayed.workMode && <Chip tone="info">{displayed.workMode}</Chip>}
                  {displayed.preferredLocation && <Chip>{displayed.preferredLocation}</Chip>}
                  {displayed.jobTypePreference && <Chip>{displayed.jobTypePreference}</Chip>}
                </div>
              )}
            </Card>
          </>
        )}

        {/* ---- Skills with proficiency ---- */}
        {displayed && displayed.skills.length > 0 && (
          <>
            <SectionTitle>Skills</SectionTitle>
            <Card>
              <div className="space-y-3">
                {displayed.skills.slice(0, 8).map(s => (
                  <div key={s.name}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-on-surface">{s.name}</span>
                      {s.level > 0 && <span className="text-on-surface-variant">{Math.round(s.level)}%</span>}
                    </div>
                    {s.level > 0 && (
                      <div className="h-1.5 rounded-full bg-on-surface/8 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-primary to-[#3bb98b]" style={{ width: `${Math.min(100, s.level)}%` }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {displayed.skills.length > 8 && (
                <p className="text-[11px] text-on-surface-variant mt-3">+{displayed.skills.length - 8} more</p>
              )}
            </Card>
          </>
        )}

        {/* ---- Verifications ---- */}
        <SectionTitle>Verifications</SectionTitle>
        <div className="grid grid-cols-2 gap-2.5">
          {verifications.map(v => (
            <div key={v.label} className="m-card p-3 flex items-center gap-2.5">
              <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${v.on ? 'bg-success/15' : 'bg-on-surface/6'}`}>
                <span className={`material-symbols-outlined text-[20px] ${v.on ? 'text-success' : 'text-on-surface-variant'}`}>{v.icon}</span>
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{v.label}</p>
                <p className={`text-[11px] ${v.on ? 'text-success' : 'text-on-surface-variant'}`}>{v.on ? 'Verified' : 'Not linked'}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ---- Portfolio links ---- */}
        {(displayed?.portfolioUrl || displayed?.resumeUrl) && (
          <>
            <SectionTitle>Links</SectionTitle>
            <div className="space-y-2.5">
              {displayed?.portfolioUrl && (
                <a href={displayed.portfolioUrl} target="_blank" rel="noreferrer" className="m-card p-3.5 flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">public</span>
                  <span className="flex-1 min-w-0 text-sm font-semibold truncate">Portfolio</span>
                  <span className="material-symbols-outlined text-on-surface-variant text-[20px]">open_in_new</span>
                </a>
              )}
            </div>
          </>
        )}

        <div className="h-4" />
      </div>
    </MobileShell>
  );
};

export default MobileProfile;
