import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Interview } from '../../types';
import { InterviewService } from '../../services';
import { PageLayout } from '../../components/layout/PageLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../contexts/ToastContext';

export const InterviewDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [interview, setInterview] = useState<Interview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadInterview = async () => {
      try {
        const items = await InterviewService.getInterviews();
        // Fallback to nvidia interview if id doesn't match
        const found = items.find((i) => i.id === id) || items[0];
        setInterview(found);
      } catch (err) {
        console.error('Failed to load interview', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadInterview();
  }, [id]);

  if (isLoading) {
    return (
      <PageLayout>
        <div className="space-y-6 text-left">
          <Skeleton variant="rect" height={150} />
          <Skeleton variant="rect" height={250} />
        </div>
      </PageLayout>
    );
  }

  if (!interview) return null;

  return (
    <PageLayout>
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant/70 uppercase tracking-wider mb-4 text-left">
        <span className="cursor-pointer hover:underline" onClick={() => navigate('/student/dashboard')}>Dashboard</span>
        <span className="material-symbols-outlined text-[12px]">chevron_right</span>
        <span className="text-primary">{interview.companyName} Interview Preparation</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter text-left items-start">
        {/* Main Brief Panel */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-primary/5 pb-6 gap-4">
              <div>
                <p className="text-xs font-bold text-primary dark:text-primary-fixed uppercase tracking-wider">
                  {interview.type} Interview Round
                </p>
                <h1 className="font-display text-headline-lg text-primary dark:text-primary-fixed mt-1">
                  {interview.companyName} • {interview.jobTitle}
                </h1>
              </div>
              <div className="bg-secondary-container dark:bg-primary-container/20 text-primary dark:text-primary-fixed p-3 rounded-xl text-center shrink-0">
                <span className="block text-[10px] font-bold uppercase opacity-65">Scheduled Time</span>
                <span className="text-sm font-extrabold">{interview.dateTime}</span>
              </div>
            </div>

            {/* Preparation Steps checklist */}
            <div className="space-y-4">
              <h3 className="font-headline-md text-primary dark:text-primary-fixed">Your Preparation Checklist</h3>
              <div className="space-y-3">
                {[
                  { label: 'Review core frontend technologies (React Hooks, State Management)', done: true },
                  { label: 'Prepare answer drafts for behavioral STAR questions', done: true },
                  { label: 'Test camera and audio equipment inside Mock Interview Room', done: false },
                  { label: 'Read through the job description and company overview', done: false }
                ].map((item, idx) => (
                  <label key={idx} className="flex items-start gap-3 p-3 bg-surface-container-low dark:bg-surface-container rounded-xl cursor-pointer hover:bg-surface-container-high transition-colors">
                    <input 
                      type="checkbox" 
                      defaultChecked={item.done}
                      className="mt-0.5 w-4 h-4 rounded text-primary focus:ring-primary border-outline-variant"
                    />
                    <span className={`text-xs font-semibold ${item.done ? 'line-through text-on-surface-variant/50' : 'text-on-surface'}`}>
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Interview Prep tips */}
            <div className="space-y-4 pt-6 border-t border-primary/5">
              <h3 className="font-headline-md text-primary dark:text-primary-fixed">AI Prep Insights</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                NVIDIA interview boards regularly focus on **rendering optimization** and **web worker threads**. 
                We recommend checking out the *Mock Interview Room* to run a simulated round focused on rendering performance before joining this call.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-6 border-t border-primary/5">
              <Button
                className="flex-grow py-3"
                onClick={() => navigate('/student/mock-interview')}
              >
                Launch Mock Interview practice
              </Button>
              <Button
                variant="secondary"
                onClick={() => showToast('Interview link will become active 10 mins prior to schedule.', 'info')}
                className="px-6 text-primary border-primary/10"
              >
                Join Live Call
              </Button>
            </div>
          </Card>
        </div>

        {/* Side Panel Recruiter contact */}
        <div className="lg:col-span-4">
          <Card className="space-y-4">
            <h4 className="font-bold text-label-md text-primary uppercase tracking-wider">Hiring Point of Contact</h4>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-container text-white flex items-center justify-center font-bold">
                RC
              </div>
              <div>
                <h4 className="font-bold text-body-lg text-primary dark:text-primary-fixed">Recruitment Coordinator</h4>
                <p className="text-xs text-on-surface-variant">Stripe Talent Group</p>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Have scheduling conflicts or questions? Reach out directly.
            </p>
            <Button
              variant="secondary"
              className="w-full text-xs text-primary"
              onClick={() => navigate('/student/messages')}
            >
              Message Coordinator
            </Button>
          </Card>
        </div>
      </div>
      <div className="h-10"></div>
    </PageLayout>
  );
};
export default InterviewDetails;
