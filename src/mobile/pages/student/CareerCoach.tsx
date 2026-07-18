/**
 * Mobile AI Career Coach — view the latest stored career insight and
 * generate a fresh one for a target role. Reads/writes through the same
 * CareerService as desktop; reports are never fabricated client-side.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { CareerService } from '../../../services';
import type { AICareerInsight } from '../../../types';
import { useToast } from '../../../contexts/ToastContext';
import { MobileShell, Card, Chip, SectionTitle, ScoreRing, Skeleton, EmptyState, Button, Expandable } from '../../components';

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
    <MobileShell title="AI Career Coach" subtitle="Personalized career intelligence">
      <div className="px-4 pt-4 space-y-2.5">
        {/* Target role input */}
        <Card>
          <label className="text-xs font-bold text-on-surface-variant" htmlFor="target-role">Target role</label>
          <div className="flex gap-2 mt-2">
            <input
              id="target-role"
              value={targetRole}
              onChange={e => setTargetRole(e.target.value)}
              placeholder="e.g. Frontend Engineer"
              className="flex-1 h-11 px-4 rounded-xl bg-surface-container text-sm outline-none"
            />
            <Button onClick={generate} disabled={generating}>
              {generating ? '…' : 'Analyze'}
            </Button>
          </div>
          {generating && (
            <div className="flex items-center gap-2 mt-3 text-primary" role="status">
              <span className="m-dot" /><span className="m-dot" /><span className="m-dot" />
              <span className="text-xs font-semibold ml-1">AI is analyzing your profile…</span>
            </div>
          )}
        </Card>

        {loading ? (
          <><Skeleton className="h-40" /><Skeleton className="h-32" /></>
        ) : !insight ? (
          <EmptyState icon="neurology" title="No career insight yet" hint="Enter your target role above and tap Analyze to generate a personalized report." />
        ) : (
          <>
            {/* Readiness */}
            <Card className="flex flex-col items-center py-6">
              <ScoreRing score={insight.readinessPercent} label="ready" />
              <p className="text-sm font-bold mt-3">Readiness for {insight.targetRole}</p>
              <p className="text-xs text-on-surface-variant text-center mt-1 max-w-[280px]">{insight.summary}</p>
              {estimated && <Chip tone="warning">Estimated — AI unavailable</Chip>}
              <p className="text-[11px] text-on-surface-variant mt-2">
                Generated {new Date(insight.createdAt).toLocaleDateString()}
              </p>
            </Card>

            {insight.whyThisScore && (
              <Expandable title="Why this score?">
                <p className="text-sm text-on-surface-variant leading-relaxed">{insight.whyThisScore}</p>
              </Expandable>
            )}

            {/* Skills */}
            {insight.matchedSkills.length > 0 && (
              <>
                <SectionTitle>Skills you already have</SectionTitle>
                <div className="flex flex-wrap gap-2">
                  {insight.matchedSkills.map(s => <Chip key={s} tone="success">{s}</Chip>)}
                </div>
              </>
            )}
            {insight.missingSkills.length > 0 && (
              <>
                <SectionTitle>Skills to build</SectionTitle>
                <div className="flex flex-wrap gap-2">
                  {insight.missingSkills.map(s => <Chip key={s} tone="warning">{s}</Chip>)}
                </div>
              </>
            )}

            {/* Roadmap */}
            {insight.roadmap.length > 0 && (
              <>
                <SectionTitle>Learning roadmap</SectionTitle>
                <div className="space-y-2.5">
                  {insight.roadmap.map((step, i) => (
                    <Card key={i}>
                      <div className="flex gap-3">
                        <span className="w-7 h-7 rounded-full bg-primary text-on-primary text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                        <div>
                          <p className="text-sm font-bold">{step.title}</p>
                          <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">{step.description}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {/* Recommendations */}
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
          </>
        )}
      </div>
    </MobileShell>
  );
};

export default MobileCareerCoach;
