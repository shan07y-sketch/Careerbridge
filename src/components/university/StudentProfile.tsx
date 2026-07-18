import React, { useEffect, useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { UniversityService, type UniversityStudent, type VerificationStatus } from '../../services';
import type { StudentPlacementInsight } from '../../types';
import { PageHeader } from '../ui/PageHeader';
import { StatCard } from '../ui/StatCard';
import { Section } from '../ui/Section';
import { Card, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ProgressRing } from '../ui/Progress';
import { EmptyState } from '../ui/EmptyState';
import { CardSkeleton } from '../ui/Skeleton';

interface StudentProfileProps { studentId: string; onBack: () => void; }
const STATUS_LABELS: Record<VerificationStatus, string> = { PENDING: 'Pending', VERIFIED: 'Verified', PLACEMENT_ELIGIBLE: 'Placement eligible', PLACEMENT_COMPLETED: 'Placed', REJECTED: 'Rejected' };
type BadgeTone = React.ComponentProps<typeof Badge>['tone'];
const STATUS_TONE: Record<VerificationStatus, BadgeTone> = { PENDING: 'neutral', VERIFIED: 'info', PLACEMENT_ELIGIBLE: 'warning', PLACEMENT_COMPLETED: 'success', REJECTED: 'error' };

export const StudentProfile: React.FC<StudentProfileProps> = ({ studentId, onBack }) => {
  const { showToast } = useToast();
  const [student, setStudent] = useState<UniversityStudent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insight, setInsight] = useState<StudentPlacementInsight | null>(null);
  const [isInsightLoading, setIsInsightLoading] = useState(true);
  const [isAssessing, setIsAssessing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true); setError(null);
      try {
        const students = await UniversityService.getStudents();
        const found = students.find(s => s.id === studentId) || null;
        if (!cancelled) { setStudent(found); if (!found) setError('Student not found.'); }
      } catch (err: any) { if (!cancelled) setError(err?.message || 'Failed to load student profile.'); }
      finally { if (!cancelled) setIsLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [studentId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsInsightLoading(true);
      try { const data = await UniversityService.getLatestStudentInsight(studentId); if (!cancelled) setInsight(data); }
      catch { /* none yet */ }
      finally { if (!cancelled) setIsInsightLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [studentId]);

  const handleAssess = async () => {
    setIsAssessing(true);
    try { setInsight(await UniversityService.assessStudentPlacement(studentId)); showToast('Placement prediction generated.', 'success'); }
    catch (err: any) { showToast(err?.message || 'Failed to generate prediction.', 'error'); }
    finally { setIsAssessing(false); }
  };
  const handleDownloadResume = () => {
    const url = student?.resumes?.[0]?.fileUrl;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
    else showToast('This student has not uploaded a resume yet.', 'info');
  };

  const header = <PageHeader title="Student profile" breadcrumbs={[{ label: 'Students', onClick: onBack }, { label: 'Profile' }]} />;
  if (isLoading) return <>{header}<div className="grid gap-4"><CardSkeleton /><CardSkeleton /></div></>;
  if (error || !student) return <>{header}<EmptyState icon="person_off" title="Student not found" description={error || 'This student could not be loaded.'} actionLabel="Back to students" onAction={onBack} /></>;

  const initials = `${student.user.firstName[0] || ''}${student.user.lastName[0] || ''}`.toUpperCase();

  return (
    <>
      <PageHeader
        title={`${student.user.firstName} ${student.user.lastName}`}
        description={`${student.user.email}${student.department?.name ? ` · ${student.department.name}` : ''}`}
        breadcrumbs={[{ label: 'Students', onClick: onBack }, { label: 'Profile' }]}
        actions={<><Button variant="outline" onClick={handleDownloadResume} leftIcon={<span className="material-symbols-outlined text-[19px]">download</span>}>Resume</Button></>}
      />
      <div className="space-y-8">
        <Card className="!p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {student.user.avatarUrl ? <img src={student.user.avatarUrl} alt="" className="w-20 h-20 rounded-2xl object-cover" /> : <span className="w-20 h-20 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center text-headline-sm font-semibold">{initials}</span>}
            <div className="min-w-0 flex-grow">
              <h2 className="text-headline-sm font-semibold text-on-surface">{student.user.firstName} {student.user.lastName}</h2>
              <p className="text-body-md text-on-surface-variant mt-1">{student.department?.name || 'No department'}</p>
              <div className="mt-3"><Badge tone={STATUS_TONE[student.verificationStatus]} icon="verified">{STATUS_LABELS[student.verificationStatus]}</Badge></div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
          <StatCard label="GPA" value={student.currentGpa != null ? student.currentGpa.toFixed(1) : '—'} icon="grade" hint="current" />
          <StatCard label="Graduation" value={student.graduationYear || '—'} icon="calendar_month" hint="expected" />
          <StatCard label="Status" value={STATUS_LABELS[student.verificationStatus]} icon="verified_user" hint="verification" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Section title="Skills">
              <Card>
                {(student.skills || []).length === 0 ? <p className="text-label-md text-on-surface-variant">No skills added by this student yet.</p> : (
                  <div className="flex flex-wrap gap-2">{student.skills.map((s: any) => <Badge key={s.id || s.skill?.name} tone="neutral">{s.skill?.name}{s.level ? ` · ${s.level}%` : ''}</Badge>)}</div>
                )}
              </Card>
            </Section>
            <Section title="Projects">
              <Card>
                {(student.projects || []).length === 0 ? <p className="text-label-md text-on-surface-variant">No projects listed.</p> : (
                  <div className="space-y-3">{student.projects.map((p: any) => (
                    <div key={p.id} className="rounded-xl border border-outline-variant/60 p-4"><p className="text-body-md font-semibold text-on-surface">{p.title || p.name}</p>{p.description && <p className="text-label-md text-on-surface-variant mt-1">{p.description}</p>}</div>
                  ))}</div>
                )}
              </Card>
            </Section>
            <Section title="Certifications">
              <Card>
                {(student.certifications || []).length === 0 ? <p className="text-label-md text-on-surface-variant">No certifications listed.</p> : (
                  <div className="flex flex-wrap gap-2">{student.certifications.map((c: any) => <Badge key={c.id} tone="neutral">{c.name || c.title}</Badge>)}</div>
                )}
              </Card>
            </Section>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader icon="auto_awesome" title="AI placement prediction"
                action={<Button size="sm" variant="outline" onClick={handleAssess} disabled={isAssessing}>{isAssessing ? '…' : insight ? 'Re-run' : 'Generate'}</Button>} />
              {isInsightLoading ? (
                <div className="h-24 bg-surface-container rounded-xl animate-pulse" />
              ) : !insight ? (
                <p className="text-label-md text-on-surface-variant">No prediction yet. Generate an AI assessment of this student's placement outlook.</p>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <ProgressRing value={insight.placementProbability} size={72} />
                    <div><Badge tone={insight.riskLevel === 'Low' ? 'success' : insight.riskLevel === 'Medium' ? 'warning' : 'error'}>{insight.riskLevel} risk</Badge><p className="text-label-sm text-on-surface-variant mt-1">Generated {new Date(insight.createdAt).toLocaleDateString()}</p></div>
                  </div>
                  <p className="text-label-md text-on-surface-variant">{insight.summary}</p>
                  {insight.strengths.length > 0 && <div><p className="text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant mb-1">Strengths</p><ul className="space-y-1">{insight.strengths.map((s, i) => <li key={i} className="flex gap-2 text-label-md text-on-surface"><span className="material-symbols-outlined text-[16px] text-success">check</span>{s}</li>)}</ul></div>}
                  {insight.riskFactors.length > 0 && <div><p className="text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant mb-1">Risk factors</p><ul className="space-y-1">{insight.riskFactors.map((r, i) => <li key={i} className="flex gap-2 text-label-md text-on-surface"><span className="material-symbols-outlined text-[16px] text-warning">priority_high</span>{r}</li>)}</ul></div>}
                  {insight.suggestedActions.length > 0 && <div><p className="text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant mb-1">Suggested actions</p><ul className="space-y-1">{insight.suggestedActions.map((a, i) => <li key={i} className="flex gap-2 text-label-md text-on-surface"><span className="material-symbols-outlined text-[16px] text-primary">arrow_forward</span>{a}</li>)}</ul></div>}
                </div>
              )}
            </Card>

            <Card>
              <CardHeader icon="description" title="Documents" />
              {student.resumes && student.resumes.length > 0 ? (
                <button onClick={handleDownloadResume} className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-surface-container transition-colors">
                  <span className="flex items-center gap-3 min-w-0"><span className="material-symbols-outlined text-on-surface-variant">picture_as_pdf</span><span className="text-label-md font-medium text-on-surface truncate">{student.resumes[0].fileName || 'Resume'}</span></span>
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px]">download</span>
                </button>
              ) : <p className="text-label-md text-on-surface-variant">No resume uploaded yet.</p>}
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentProfile;
