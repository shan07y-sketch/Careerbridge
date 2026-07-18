import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Event as CBEvent } from '../../types';
import { EventService } from '../../services';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageHeader } from '../../components/ui/PageHeader';
import { Section } from '../../components/ui/Section';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../contexts/ToastContext';

export const EventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [event, setEvent] = useState<CBEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [registered, setRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    if (!id) { setIsLoading(false); return; }
    EventService.getEventById(id)
      .then(e => { if (e) { setEvent(e); setRegistered(e.registered); } })
      .catch(err => console.error('Failed to load event', err))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleRegister = async () => {
    if (!event) return;
    setRegistering(true);
    try {
      await EventService.registerForEvent(event.id);
      setRegistered(true);
      showToast('Registered. A calendar invite is on its way.', 'success');
    } catch {
      showToast('Could not register for this event. Please try again.', 'error');
    } finally { setRegistering(false); }
  };

  if (isLoading) {
    return (<PageLayout><PageHeader title="Event" /><div className="grid gap-4"><CardSkeleton /></div></PageLayout>);
  }
  if (!event) {
    return (
      <PageLayout>
        <PageHeader title="Event" />
        <EmptyState icon="event_busy" title="Event not found"
          description="We couldn't find this event. It may have ended or been removed."
          actionLabel="Back to network" onAction={() => navigate('/student/network')} />
      </PageLayout>
    );
  }

  const d = new Date(event.date);
  const validDate = !isNaN(d.getTime());

  return (
    <PageLayout>
      <PageHeader
        title={event.title}
        description={`Organized by ${event.organizer}`}
        breadcrumbs={[{ label: 'Network', onClick: () => navigate('/student/network') }, { label: 'Event' }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          {event.banner && (
            <div className="rounded-2xl overflow-hidden shadow-card">
              <img src={event.banner} alt="" className="w-full h-48 object-cover" />
            </div>
          )}
          <Section title="About the event">
            <Card><p className="text-body-md text-on-surface-variant leading-relaxed whitespace-pre-line">{event.description}</p></Card>
          </Section>

          {event.speakers?.length > 0 && (
            <Section title="Featured speakers">
              <div className="grid sm:grid-cols-2 gap-4">
                {event.speakers.map(sp => (
                  <Card key={sp.name} className="!p-4 flex items-center gap-3">
                    <img className="w-11 h-11 rounded-full object-cover shrink-0" alt={sp.name} src={sp.avatar} />
                    <div className="min-w-0">
                      <p className="text-body-md font-semibold text-on-surface truncate">{sp.name}</p>
                      <p className="text-label-sm text-on-surface-variant truncate">{sp.role}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </Section>
          )}
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader icon="event" title="Details & registration" />
            <div className="space-y-3">
              <div className="flex gap-3"><span className="material-symbols-outlined text-[20px] text-on-surface-variant">calendar_today</span><div><p className="text-label-sm text-on-surface-variant uppercase tracking-wide">Date</p><p className="text-body-md text-on-surface">{validDate ? d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }) : event.date}</p></div></div>
              <div className="flex gap-3"><span className="material-symbols-outlined text-[20px] text-on-surface-variant">location_on</span><div><p className="text-label-sm text-on-surface-variant uppercase tracking-wide">Location</p><p className="text-body-md text-on-surface">{event.location}</p></div></div>
              <div className="flex gap-3"><span className="material-symbols-outlined text-[20px] text-on-surface-variant">timer</span><div><p className="text-label-sm text-on-surface-variant uppercase tracking-wide">Registration deadline</p><p className="text-body-md text-on-surface">{event.deadline}</p></div></div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Badge tone={event.remainingSeats > 0 ? 'success' : 'error'}>{event.remainingSeats} of {event.totalSeats} seats left</Badge>
            </div>
            <Button variant="primary" className="w-full mt-4" onClick={handleRegister} disabled={registered || registering || event.remainingSeats <= 0}>
              {registered ? 'Registered' : registering ? 'Registering…' : event.remainingSeats <= 0 ? 'Fully booked' : 'Register for event'}
            </Button>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default EventDetails;
