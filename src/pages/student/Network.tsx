import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { Section } from '../../components/ui/Section';
import { Toolbar, FilterChip } from '../../components/ui/Toolbar';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../contexts/ToastContext';
import { NetworkService, EventService, CompanyService } from '../../services';
import type { NetworkConnection } from '../../services';
import type { Mentor, Recruiter, Event as CBEvent, Company } from '../../types';

type Tab = 'All' | 'Mentors' | 'Recruiters' | 'Events';
const TABS: Tab[] = ['All', 'Mentors', 'Recruiters', 'Events'];

export const Network: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>('All');
  const [registeredEventIds, setRegisteredEventIds] = useState<string[]>([]);

  const [incomingRequests, setIncomingRequests] = useState<NetworkConnection[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CBEvent[]>([]);
  const [topCompanies, setTopCompanies] = useState<Company[]>([]);

  const loadConnections = useCallback(async () => {
    setRequestsLoading(true);
    setRequestsError(null);
    try {
      const connections = await NetworkService.getConnections();
      setIncomingRequests(connections.filter(c => c.direction === 'incoming' && c.status === 'PENDING'));
    } catch {
      setRequestsError('Unable to load your connection requests right now. Please try again.');
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  useEffect(() => { loadConnections(); }, [loadConnections]);
  useEffect(() => {
    NetworkService.getMentors().then(setMentors).catch(() => setMentors([]));
    NetworkService.getRecruiters().then(setRecruiters).catch(() => setRecruiters([]));
    EventService.getEvents().then(e => setUpcomingEvents(e.slice(0, 4))).catch(() => setUpcomingEvents([]));
    CompanyService.getCompanies().then(c => setTopCompanies(c.slice(0, 5))).catch(() => setTopCompanies([]));
  }, []);

  const handleRespond = async (connectionId: string, name: string, action: 'accept' | 'decline') => {
    setRespondingId(connectionId);
    try {
      if (action === 'accept') { await NetworkService.acceptConnection(connectionId); showToast(`Connection with ${name} accepted.`, 'success'); }
      else { await NetworkService.declineConnection(connectionId); showToast(`Invitation from ${name} declined.`, 'info'); }
      setIncomingRequests(prev => prev.filter(r => r.id !== connectionId));
    } catch {
      showToast(`Could not ${action} this request. Please try again.`, 'error');
    } finally { setRespondingId(null); }
  };

  const handleRegister = async (id: string, eventName: string) => {
    if (registeredEventIds.includes(id)) { showToast(`You're already registered for ${eventName}.`, 'info'); return; }
    try {
      await EventService.registerForEvent(id);
      setRegisteredEventIds(prev => [...prev, id]);
      showToast(`Registered for ${eventName}.`, 'success');
    } catch { showToast('Failed to register for this event. Please try again.', 'error'); }
  };

  const showMentors = activeTab === 'All' || activeTab === 'Mentors';
  const showRecruiters = activeTab === 'All' || activeTab === 'Recruiters';
  const showEvents = activeTab === 'All' || activeTab === 'Events';

  return (
    <PageLayout searchPlaceholder="Search people, mentors, companies…">
      <PageHeader
        title="Professional network"
        description="Connect with mentors, recruiters and alumni who can accelerate your career."
      />

      <div className="space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard label="Pending requests" value={incomingRequests.length} icon="person_add" hint={incomingRequests.length ? 'need a response' : 'all clear'} />
          <StatCard label="Mentors available" value={mentors.length} icon="school" hint="book a session" onClick={() => setActiveTab('Mentors')} />
          <StatCard label="Recruiters" value={recruiters.length} icon="badge" hint="actively hiring" onClick={() => setActiveTab('Recruiters')} />
          <StatCard label="Upcoming events" value={upcomingEvents.length} icon="event" hint="register early" onClick={() => setActiveTab('Events')} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            <Toolbar filters={TABS.map(t => <FilterChip key={t} active={activeTab === t} onClick={() => setActiveTab(t)}>{t}</FilterChip>)} />

            <Section title="Connection requests" description={incomingRequests.length ? 'People waiting to connect with you' : undefined}>
              {requestsLoading ? (
                <Card><p className="text-label-md text-on-surface-variant">Loading your requests…</p></Card>
              ) : requestsError ? (
                <EmptyState icon="cloud_off" title="Couldn't load requests" description={requestsError} actionLabel="Retry" onAction={loadConnections} />
              ) : incomingRequests.length === 0 ? (
                <Card><p className="text-label-md text-on-surface-variant">No pending connection requests right now.</p></Card>
              ) : (
                <Card className="!p-0 overflow-hidden">
                  <ul className="divide-y divide-outline-variant/60">
                    {incomingRequests.map(req => (
                      <li key={req.id} className="flex items-center gap-3 p-4">
                        {req.counterpart.avatarUrl
                          ? <img src={req.counterpart.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                          : <span className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-semibold shrink-0">{req.counterpart.name[0] || '?'}</span>}
                        <div className="min-w-0 flex-grow">
                          <p className="text-body-md font-medium text-on-surface truncate">{req.counterpart.name}</p>
                          {req.counterpart.role && <p className="text-label-sm text-on-surface-variant truncate">{req.counterpart.role}</p>}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button size="sm" variant="primary" disabled={respondingId === req.id} onClick={() => handleRespond(req.id, req.counterpart.name, 'accept')}>{respondingId === req.id ? '…' : 'Accept'}</Button>
                          <Button size="sm" variant="outline" disabled={respondingId === req.id} onClick={() => handleRespond(req.id, req.counterpart.name, 'decline')}>Decline</Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </Section>

            {showMentors && (
              <Section title="Mentors" description="Practitioners open to guiding students">
                {mentors.length === 0 ? (
                  <EmptyState icon="school" title="No mentors available yet" description="Mentors appear here as they join the platform. Check back soon." />
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {mentors.slice(0, 4).map(m => (
                      <Card key={m.id}>
                        <div className="flex items-start gap-3">
                          <img className="w-12 h-12 rounded-full object-cover shrink-0" alt={m.name} src={m.avatar} />
                          <button onClick={() => navigate(`/student/mentor/${m.id}`)} className="min-w-0 flex-grow text-left">
                            <p className="text-body-md font-semibold text-on-surface truncate hover:text-primary transition-colors">{m.name}</p>
                            <p className="text-label-sm text-on-surface-variant truncate">{m.role} @ {m.companyName}</p>
                          </button>
                          <Badge tone="warning" icon="star">{m.rating.toFixed(1)}</Badge>
                        </div>
                        {m.expertise.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">{m.expertise.slice(0, 3).map(s => <Badge key={s} tone="neutral">{s}</Badge>)}</div>
                        )}
                        {m.bio && <p className="text-label-md text-on-surface-variant mt-3 leading-relaxed line-clamp-2">{m.bio}</p>}
                        <div className="flex items-center justify-between mt-4">
                          <span className="text-label-sm text-on-surface-variant">{m.availabilitySlots.length} slots · {m.reviewsCount} reviews</span>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => navigate(`/student/mentor/${m.id}`)}>View profile</Button>
                            <Button size="sm" variant="primary" onClick={() => navigate(`/student/mentor/${m.id}`)}>Book session</Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </Section>
            )}

            {showRecruiters && (
              <Section title="Recruiters" description="Verified recruiters hiring now">
                {recruiters.length === 0 ? (
                  <EmptyState icon="badge" title="No recruiters yet" description="Verified recruiters will appear here as companies join." />
                ) : (
                  <div className="space-y-3">
                    {recruiters.slice(0, 5).map(r => (
                      <Card key={r.id} className="!p-4">
                        <div className="flex items-center gap-3">
                          <img className="w-11 h-11 rounded-xl object-cover shrink-0" alt={r.name} src={r.avatar} />
                          <div className="min-w-0 flex-grow">
                            <p className="text-body-md font-semibold text-on-surface truncate flex items-center gap-1">{r.name}<span className="material-symbols-outlined text-[16px] text-primary">verified</span></p>
                            <p className="text-label-sm text-on-surface-variant truncate">Recruiter @ {r.companyName} · {r.activeJobs.length} open roles</p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button size="sm" variant="ghost" onClick={() => navigate('/student/jobs')}>Roles</Button>
                            <Button size="sm" variant="outline" onClick={() => navigate('/student/messages')}>Message</Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </Section>
            )}
          </div>

          <div className="space-y-8">
            {showEvents && (
              <Card>
                <CardHeader icon="event" title="Upcoming events" />
                {upcomingEvents.length === 0 ? (
                  <p className="text-label-md text-on-surface-variant">No upcoming events right now.</p>
                ) : (
                  <div className="space-y-4">
                    {upcomingEvents.map(evt => {
                      const d = new Date(evt.date);
                      return (
                        <div key={evt.id} className="flex gap-3">
                          <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary-container flex flex-col items-center justify-center shrink-0">
                            <span className="text-[9px] font-bold uppercase leading-none">{d.toLocaleDateString('en-US', { month: 'short' })}</span>
                            <span className="text-lg font-bold leading-none mt-0.5">{d.getDate()}</span>
                          </div>
                          <div className="min-w-0 flex-grow">
                            <button onClick={() => navigate(`/student/event/${evt.id}`)} className="text-left">
                              <p className="text-label-md font-semibold text-on-surface leading-snug hover:text-primary transition-colors">{evt.title}</p>
                            </button>
                            <p className="text-label-sm text-on-surface-variant mt-0.5">{evt.remainingSeats} seats left</p>
                            <div className="flex gap-2 mt-2">
                              <Button size="sm" variant="ghost" onClick={() => navigate(`/student/event/${evt.id}`)}>Details</Button>
                              <Button size="sm" variant={registeredEventIds.includes(evt.id) ? 'secondary' : 'outline'}
                                onClick={() => handleRegister(evt.id, evt.title)} disabled={registeredEventIds.includes(evt.id)}>
                                {registeredEventIds.includes(evt.id) ? 'Registered' : 'Register'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            )}

            <Card>
              <CardHeader icon="apartment" title="Top hiring companies" />
              {topCompanies.length === 0 ? (
                <p className="text-label-md text-on-surface-variant">No companies to show yet.</p>
              ) : (
                <div className="space-y-1">
                  {topCompanies.map(comp => (
                    <button key={comp.id} onClick={() => navigate('/student/jobs')} className="flex items-center justify-between w-full p-2 rounded-xl hover:bg-surface-container transition-colors text-left">
                      <span className="flex items-center gap-3 min-w-0">
                        <span className="w-8 h-8 rounded-lg bg-surface-container-high text-primary flex items-center justify-center font-semibold shrink-0">{comp.name[0]}</span>
                        <span className="text-label-md font-medium text-on-surface truncate">{comp.name}</span>
                      </span>
                      {comp.openJobsCount > 0 ? <Badge tone="success">Hiring</Badge> : <Badge tone="neutral">No openings</Badge>}
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Network;
