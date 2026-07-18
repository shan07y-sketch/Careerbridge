import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Interview } from '../../types';
import { InterviewService } from '../../services';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, statusTone } from '../../components/ui/Badge';
import { ProgressRing } from '../../components/ui/Progress';
import { EmptyState } from '../../components/ui/EmptyState';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../contexts/ToastContext';

const PREP_STEPS = [
  'Re-read the job description and company overview',
  'Prepare STAR-structured answers for behavioural questions',
  'Test your camera, microphone and internet connection',
  'Run a timed mock interview to warm up',
  'Prepare two thoughtful questions to ask the interviewer',
];

export const InterviewDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [interview, setInterview] = useState<Interview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [checked, setChecked] = useState<boolean[]>(PREP_STEPS.map(() => false));

  useEffect(() => {
    InterviewService.getInterviews()
      .then(items => setInterview(items.find(i => i.id === id) || null))
      .catch(err => console.error('Failed to load interview', err))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (<PageLayout><PageHeader title="Interview" /><div className="grid gap-4"><CardSkeleton /></div></PageLayout>);
  }
  if (!interview) {
    return (
      <PageLayout>
        <PageHeader title="Interview" />
        <EmptyState icon="event_busy" title="Interview not found"
          description="We couldn't find this interview. It may have been rescheduled or cancelled."
          actionLabel="Back to applications" onAction={() => navigate('/student/applications')} />
      </PageLayout>
    );
  }

  const doneCount = checked.filter(Boolean).length;
  const when = new Date(interview.dateTime);
  const validDate = !isNaN(when.getTime());

  return (
    <PageLayout>
      <PageHeader
        title={`${interview.type} interview`}
        description={`${interview.jobTitle} · ${interview.companyName}`}
        breadcrumbs={[{ label: 'Applications', onClick: () => navigate('/student/applications') }, { label: interview.companyName }]}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate('/student/mock-interview')}
              leftIcon={<span className="material-symbols-outlined text-[19px]">smart_display</span>}>Practice</Button>
            {interview.roomLink
              ? <Button variant="primary" onClick={() => window.open(interview.roomLink, '_blank', 'noopener')}
                  leftIcon={<span className="material-symbols-outlined text-[19px]">videocam</span>}>Join call</Button>
              : <Button variant="primary" disabled onClick={() => showToast('The join link activates shortly before the interview.', 'info')}>Join call</Button>}
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          <Card className="!p-6">
            <div className="flex items-center gap-4">
              <img src={interview.companyLogo} alt="" className="w-14 h-14 rounded-xl object-contain bg-surface-container p-2 shrink-0" />
              <div className="min-w-0 flex-grow">
                <p className="text-body-lg font-semibold text-on-surface truncate">{interview.jobTitle}</p>
                <p className="text-label-md text-on-surface-variant truncate">{interview.companyName}</p>
              </div>
              <Badge tone={statusTone(interview.status)}>{interview.status}</Badge>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mt-5">
              <div className="p-3 rounded-xl bg-surface-container">
                <p className="text-label-sm text-on-surface-variant uppercase tracking-wide">When</p>
                <p className="text-body-md font-medium text-on-surface mt-0.5">{validDate ? when.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : interview.dateTime}</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-container">
                <p className="text-label-sm text-on-surface-variant uppercase tracking-wide">Format</p>
                <p className="text-body-md font-medium text-on-surface mt-0.5">{interview.type}</p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader icon="checklist" title="Preparation checklist" subtitle={`${doneCount} of ${PREP_STEPS.length} done`} />
            <div className="space-y-2">
              {PREP_STEPS.map((step, idx) => (
                <label key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer">
                  <input type="checkbox" checked={checked[idx]} onChange={() => setChecked(c => c.map((v, i) => i === idx ? !v : v))}
                    className="mt-0.5 w-4 h-4 rounded accent-primary" />
                  <span className={`text-label-md ${checked[idx] ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>{step}</span>
                </label>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="text-center">
            <CardHeader icon="insights" title="Readiness" />
            <div className="flex justify-center py-2"><ProgressRing value={interview.readinessScore} size={110} /></div>
            <p className="text-label-md text-on-surface-variant">Based on your practice and profile. Run a mock interview to raise it.</p>
            <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/student/mock-interview')}>Practice now</Button>
          </Card>

          <Card>
            <CardHeader icon="forum" title="Questions?" subtitle="Reach the hiring team" />
            <p className="text-label-md text-on-surface-variant">Scheduling conflict or a question before the call? Message the coordinator directly.</p>
            <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/student/messages')}>Open messages</Button>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default InterviewDetails;
