/**
 * Mobile AI Career Coach — premium view of the latest stored career insight
 * and generation of a fresh one for a target role. Reads/writes through the
 * same CareerService as desktop; reports are never fabricated client-side.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { CareerService } from '../../../services';
import type { AICareerInsight } from '../../../types';
import { useToast } from '../../../contexts/ToastContext';
import { MobileShell, Card, Chip, SectionTitle, ScoreRing, Skeleton, EmptyState, Expandable } from '../../components';

const MobileCareerCoach: React.FC = () => {
  const { showToast } = useToast();
  const [insight, setInsight] = useState<AICareerInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [targetRole, setTargetRole] = useState('');

  const load = useCallback(async () => {
    try {
      const latest = await CareerService.getLatestAICareerInsight();
      setInsight(latest);
      if (latest?.targetRole) setTargetRole(latest.targetRole);
    } catch {
      setInsight(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const generate = async () => {
    if (!targetRole.trim()) { showToast('Enter a target role first', 'error'); return; }
    setGenerating(true);
    try {
      setInsight(await CareerService.generateAICareerInsight(targetRole.trim()));
      showToast('Career insight generated');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Generation failed', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const estimated = insight?.modelVersion?.endsWith('-estimated');

  return (
    <MobileShell bare>
      {/* ---- Aurora hero ---- */}
      <section className="m-hero m-safe-top px-5 pt-5 pb-6 rounded-b-[28px]">
        <div className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center">
            <span className="material-symbols-outlined text-white">neurology</span>
          </span>
          <div>
            <p className="text-[13px] text-white/70 leading-none">AI Career Coach</p>
            <h1 className="text-xl font-extrabold leading-tight">Your career intelligence</h1>
          </div>
        </div>

        {insight && !generating && (
          <div className="mt-4 flex items-center gap-4 rounded-3xl m-glass p-4">
            <ScoreRing score={insight.readinessPercent} size={72} label="ready" />
            <div className="min-w-0">
              <p className="text-sm font-bold">Readiness for {insight.targetRole}</p>
              <p className="text-[13px] text-white/75 leading-snug line-clamp-3">{insight.summary}</p>
            </div>
          </div>
        )}
      </section>

      <div className="px-4">
        {/* ---- Target role generator ---- */}
        <div className="m-ai-cta rounded-3xl p-4 mt-4 shadow-lg">
          <label className="text-xs font-bold text-white/90" htmlFor="target-role">Analyze your fit for a role</label>
          <div className="flex gap-2 mt-2">
            <input
              id="target-role"
              value={targetRole}
              onChange={e => setTargetRole(e.target.value)}
              placeholder="e.g. Frontend Engineer"
              className="flex-1 h-11 px-4 rounded-xl bg-white/20 text-sm text-white placeholder:text-white/70 outline-none focus:ring-2 focus:ring-white/40"
            />
            <button
              onClick={generate}
              disabled={generating}
              className="m-press h-11 px-5 rounded-xl bg-white text-[#9333ea] text-sm font-bold disabled:opacity-60 relative z-10"
            >
              {generating ? '…' : 'Analyze'}
            </button>
          </div>
          {generating && (
            <div className="flex items-center gap-2 mt-3 text-white relative z-10" role="status">
              <span className="m-dot" /><span className="m-dot" /><span className="m-dot" />
              <span className="text-xs font-semibold ml-1">AI is analyzing your profile…</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-2.5 pt-4"><Skeleton className="h-40" /><Skeleton className="h-32" /></div>
        ) : !insight ? (
          <EmptyState icon="neurology" title="No career insight yet" hint="Enter your target role above and tap Analyze to generate a personalized report." />
        ) : (
          <>
            {estimated && (
              <div className="mt-4"><Chip tone="warning">Estimated — live AI unavailable, using deterministic fallback</Chip></div>
            )}

            {insight.whyThisScore && (
              <div className="pt-4">
                <Expandable title="Why this score?">
                  <p className="text-sm text-on-surface-variant leading-relaxed">{insight.whyThisScore}</p>
                </Expandable>
              </div>
            )}

            {/* Skills */}
            {insight.matchedSkills.length > 0 && (
              <>
                <SectionTitle>Skills you already have</SectionTitle>
                <Card className="m-rise m-rise-1">
                  <div className="flex flex-wrap gap-2">
                    {insight.matchedSkills.map(s => <Chip key={s} tone="success">{s}</Chip>)}
                  </div>
                </Card>
              </>
            )}
            {insight.missingSkills.length > 0 && (
              <>
                <SectionTitle>Skills to build</SectionTitle>
                <Card className="m-rise m-rise-2">
                  <div className="flex flex-wrap gap-2">
                    {insight.missingSkills.map(s => <Chip key={s} tone="warning">{s}</Chip>)}
                  </div>
                </Card>
              </>
            )}

            {/* Roadmap */}
            {insight.roadmap.length > 0 && (
              <>
                <SectionTitle>Learning roadmap</SectionTitle>
                <div className="space-y-2.5">
                  {insight.roadmap.map((step, i) => (
                    <div key={i} className={`m-card-lift rounded-3xl bg-surface-container/70 border border-on-surface/5 p-4 m-rise m-rise-${Math.min(i + 1, 5)}`}>
                      <div className="flex gap-3">
                        <span className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-[#3bb98b] text-white text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold">{step.title}</p>
                          <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">{step.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Recommendations */}
            <div className="pt-4 space-y-2.5">
              {insight.recommendedProjects.length > 0 && (
                <Expandable title="Recommended projects" subtitle={`${insight.recommendedProjects.length} ideas`}>
                  <ul className="space-y-2">
                    {insight.recommendedProjects.map((p, i) => (
                      <li key={i} className="flex gap-2 text-sm"><span className="material-symbols-outlined text-[18px] text-tertiary shrink-0">construction</span>{p}</li>
                    ))}
                  </ul>
                </Expandable>
              )}
              {insight.recommendedCourses.length > 0 && (
                <Expandable title="Recommended courses" subtitle={`${insight.recommendedCourses.length} courses`}>
                  <ul className="space-y-2">
                    {insight.recommendedCourses.map((c, i) => (
                      <li key={i} className="flex gap-2 text-sm"><span className="material-symbols-outlined text-[18px] text-info shrink-0">school</span>{c}</li>
                    ))}
                  </ul>
                </Expandable>
              )}
              {insight.recommendedInterviewTopics.length > 0 && (
                <Expandable title="Interview topics to practice" subtitle={`${insight.recommendedInterviewTopics.length} topics`}>
                  <ul className="space-y-2">
                    {insight.recommendedInterviewTopics.map((t, i) => (
                      <li key={i} className="flex gap-2 text-sm"><span className="material-symbols-outlined text-[18px] text-primary shrink-0">record_voice_over</span>{t}</li>
                    ))}
                  </ul>
                </Expandable>
              )}
            </div>

            <p className="text-center text-[11px] text-on-surface-variant py-4">
              Generated {new Date(insight.createdAt).toLocaleDateString()} · {insight.modelVersion}
            </p>
          </>
        )}
        <div className="h-4" />
      </div>
    </MobileShell>
  );
};

export default MobileCareerCoach;
