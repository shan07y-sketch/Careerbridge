import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Mentor } from '../../types';
import { NetworkService } from '../../services';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageHeader } from '../../components/ui/PageHeader';
import { Section } from '../../components/ui/Section';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../contexts/ToastContext';

export const MentorProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) { setIsLoading(false); return; }
    NetworkService.getMentors()
      .then(items => setMentor(items.find((m: Mentor) => m.id === id) || null))
      .catch(err => console.error('Failed to load mentor profile', err))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (<PageLayout><PageHeader title="Mentor" /><div className="grid gap-4"><CardSkeleton /></div></PageLayout>);
  }
  if (!mentor) {
    return (
      <PageLayout>
        <PageHeader title="Mentor" />
        <EmptyState icon="person_off" title="Mentor not found"
          description="We couldn't find this mentor. They may no longer be available."
          actionLabel="Back to network" onAction={() => navigate('/student/network')} />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title={mentor.name}
        description={`${mentor.role} at ${mentor.companyName}`}
        breadcrumbs={[{ label: 'Network', onClick: () => navigate('/student/network') }, { label: 'Mentor' }]}
        actions={<Button variant="primary" onClick={() => navigate('/student/messages')} leftIcon={<span className="material-symbols-outlined text-[19px]">chat</span>}>Message</Button>}
      />

      <div className="space-y-8">
        <Card className="!p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <img className="w-20 h-20 rounded-2xl object-cover shrink-0" alt={mentor.name} src={mentor.avatar} />
            <div className="min-w-0 flex-grow">
              <h2 className="text-headline-sm font-semibold text-on-surface">{mentor.name}</h2>
              <p className="text-body-md text-on-surface-variant mt-1">{mentor.role} · {mentor.companyName}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge tone="warning" icon="star">{mentor.rating.toFixed(1)} ({mentor.reviewsCount} reviews)</Badge>
                <Badge tone="neutral" icon="event_available">{mentor.availabilitySlots.length} slots</Badge>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            <Section title="About"><Card><p className="text-body-md text-on-surface-variant leading-relaxed">{mentor.bio}</p></Card></Section>
            {mentor.expertise.length > 0 && (
              <Section title="Expertise">
                <Card><div className="flex flex-wrap gap-2">{mentor.expertise.map(e => <Badge key={e} tone="neutral">{e}</Badge>)}</div></Card>
              </Section>
            )}
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader icon="event" title="Book a 1:1 session" />
              {mentor.availabilitySlots.length > 0 ? (
                <div className="space-y-2">
                  {mentor.availabilitySlots.slice(0, 6).map((slot, i) => (
                    <button key={i} onClick={() => showToast(`Session request sent to ${mentor.name} for ${slot}.`, 'success')}
                      className="flex items-center justify-between w-full p-3 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors text-left">
                      <span className="text-label-md font-medium text-on-surface">{slot}</span>
                      <span className="material-symbols-outlined text-[18px] text-primary">arrow_forward</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-label-md text-on-surface-variant">No open slots right now. Start a conversation to coordinate a time.</p>
              )}
              <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/student/messages')}>Message to schedule</Button>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default MentorProfile;
