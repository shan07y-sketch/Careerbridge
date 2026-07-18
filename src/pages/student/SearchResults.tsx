import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { JobService, CompanyService, EventService, NetworkService } from '../../services';
import type { Job, Company, Mentor, Event } from '../../types';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageHeader } from '../../components/ui/PageHeader';
import { Section } from '../../components/ui/Section';
import { Toolbar, FilterChip } from '../../components/ui/Toolbar';
import { Button } from '../../components/ui/Button';
import { JobCard } from '../../components/cards/JobCard';
import { MentorCard } from '../../components/cards/MentorCard';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Card } from '../../components/ui/Card';

type SearchCategory = 'all' | 'jobs' | 'companies' | 'mentors' | 'events';

export const SearchResults: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || searchParams.get('query') || '';
  const navigate = useNavigate();

  // Search Results Database State
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // Recent Searches -- persisted locally from the user's own real search
  // history (no backend model exists for this yet, so we don't fabricate
  // entries; this is the user's genuine activity, just stored client-side).
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('cb_recent_searches');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!query.trim()) return;
    setRecentSearches(prev => {
      const next = [query, ...prev.filter(s => s.toLowerCase() !== query.toLowerCase())].slice(0, 6);
      try { localStorage.setItem('cb_recent_searches', JSON.stringify(next)); } catch { /* ignore storage errors */ }
      return next;
    });
  }, [query]);

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        const [jobsData, companiesData, mentorsData, eventsData] = await Promise.all([
          JobService.getJobs(),
          CompanyService.getCompanies(),
          NetworkService.getMentors(),
          EventService.getEvents()
        ]);
        setJobs(jobsData);
        setCompanies(companiesData);
        setMentors(mentorsData);
        setEvents(eventsData);
      } catch (err) {
        console.error('Failed to load search context data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, []);

  // Filter Match Logics
  const filteredJobs = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.companyName.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q)
    );
  }, [jobs, query]);

  const filteredCompanies = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  }, [companies, query]);

  const filteredMentors = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return mentors.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q) ||
        m.expertise.some(exp => exp.toLowerCase().includes(q))
    );
  }, [mentors, query]);

  const filteredEvents = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.organizer.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
    );
  }, [events, query]);

  // Aggregate matches count
  const totalMatches = filteredJobs.length + filteredCompanies.length + filteredMentors.length + filteredEvents.length;

  // Pagination bounds based on active category
  const activeList = useMemo(() => {
    if (activeCategory === 'jobs') return filteredJobs;
    if (activeCategory === 'companies') return filteredCompanies;
    if (activeCategory === 'mentors') return filteredMentors;
    if (activeCategory === 'events') return filteredEvents;
    return [];
  }, [activeCategory, filteredJobs, filteredCompanies, filteredMentors, filteredEvents]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return activeList.slice(start, start + itemsPerPage);
  }, [activeList, currentPage]);

  const totalPages = Math.ceil(activeList.length / itemsPerPage);

  // Reset page when category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, query]);

  const handleRecentClick = (term: string) => {
    setSearchParams({ q: term });
  };

  const handleClearHistory = () => {
    setRecentSearches([]);
    try { localStorage.removeItem('cb_recent_searches'); } catch { /* ignore storage errors */ }
  };

  const CATS: { id: SearchCategory; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: totalMatches },
    { id: 'jobs', label: 'Jobs', count: filteredJobs.length },
    { id: 'companies', label: 'Companies', count: filteredCompanies.length },
    { id: 'mentors', label: 'Mentors', count: filteredMentors.length },
    { id: 'events', label: 'Events', count: filteredEvents.length },
  ];

  return (
    <PageLayout searchPlaceholder="Search jobs, companies, mentors, events…">
      <PageHeader
        title="Search"
        description={query ? `${totalMatches} ${totalMatches === 1 ? 'match' : 'matches'} for “${query}”` : 'Find jobs, mentors, companies and events across CareerBridge.'}
      />

      {!query.trim() ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Section title="Popular searches">
              <Card>
                <div className="flex flex-wrap gap-2.5">
                  {['Frontend Engineer', 'Internship', 'Docker', 'Product Manager', 'Mentoring', 'Data Science'].map(tag => (
                    <button key={tag} onClick={() => handleRecentClick(tag)}
                      className="px-4 h-9 rounded-full bg-surface-container hover:bg-surface-container-high text-label-md font-semibold text-on-surface transition-colors">{tag}</button>
                  ))}
                </div>
              </Card>
            </Section>
          </div>
          <div>
            <Section title="Recent searches" action={recentSearches.length > 0 ? <Button size="sm" variant="ghost" className="!text-error" onClick={handleClearHistory}>Clear</Button> : undefined}>
              {recentSearches.length === 0 ? (
                <Card><p className="text-label-md text-on-surface-variant">Your recent searches will appear here.</p></Card>
              ) : (
                <Card className="!p-2">
                  {recentSearches.map((term, i) => (
                    <button key={i} onClick={() => handleRecentClick(term)}
                      className="flex items-center gap-2 w-full p-2.5 rounded-xl hover:bg-surface-container transition-colors text-left text-label-md text-on-surface">
                      <span className="material-symbols-outlined text-[18px] text-on-surface-variant">history</span>{term}
                    </button>
                  ))}
                </Card>
              )}
            </Section>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <Toolbar filters={CATS.map(c => (
            <FilterChip key={c.id} active={activeCategory === c.id} onClick={() => setActiveCategory(c.id)} count={c.count}>{c.label}</FilterChip>
          ))} />

          <div className="space-y-8">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><CardSkeleton /><CardSkeleton /></div>
            ) : totalMatches === 0 ? (
              <EmptyState icon="search_off" title="No results found"
                description={`Nothing matched “${query}”. Try different keywords, or browse jobs and mentors directly.`}
                actionLabel="Browse jobs" onAction={() => navigate('/student/jobs')} />
            ) : activeCategory === 'all' ? (
              /* All Results Combined Overview */
              <div className="space-y-10">
                {/* Jobs Group */}
                {filteredJobs.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b">
                      <h3 className="font-headline-md text-primary font-bold">Jobs & Internships ({filteredJobs.length})</h3>
                      <button onClick={() => setActiveCategory('jobs')} className="text-xs text-primary font-bold hover:underline">View All</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredJobs.slice(0, 2).map((job) => (
                        <JobCard key={job.id} job={job} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Companies Group */}
                {filteredCompanies.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b">
                      <h3 className="font-headline-md text-primary font-bold">Companies ({filteredCompanies.length})</h3>
                      <button onClick={() => setActiveCategory('companies')} className="text-xs text-primary font-bold hover:underline">View All</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredCompanies.slice(0, 2).map((company) => (
                        <Card key={company.id} hoverable className="flex items-center gap-4 cursor-pointer" onClick={() => navigate(`/student/company/${company.id}`)}>
                          <img src={company.logo} alt={company.name} className="w-12 h-12 rounded-lg object-contain border bg-white" />
                          <div className="text-left">
                            <h4 className="font-bold text-primary">{company.name}</h4>
                            <p className="text-xs text-on-surface-variant">{company.industry} • {company.location}</p>
                            <span className="text-[10px] text-primary font-semibold mt-1 inline-block">{company.openJobsCount} Open Positions</span>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mentors Group */}
                {filteredMentors.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b">
                      <h3 className="font-headline-md text-primary font-bold">Industry Mentors ({filteredMentors.length})</h3>
                      <button onClick={() => setActiveCategory('mentors')} className="text-xs text-primary font-bold hover:underline">View All</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredMentors.slice(0, 2).map((mentor) => (
                        <MentorCard key={mentor.id} mentor={mentor} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Events Group */}
                {filteredEvents.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b">
                      <h3 className="font-headline-md text-primary font-bold">Ecosystem Events ({filteredEvents.length})</h3>
                      <button onClick={() => setActiveCategory('events')} className="text-xs text-primary font-bold hover:underline">View All</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredEvents.slice(0, 2).map((event) => (
                        <Card key={event.id} hoverable className="flex items-start gap-4 cursor-pointer" onClick={() => navigate(`/student/event/${event.id}`)}>
                          <img src={event.banner} alt={event.title} className="w-20 h-14 rounded-lg object-cover border shrink-0" />
                          <div className="text-left">
                            <h4 className="font-bold text-xs text-primary leading-tight line-clamp-1">{event.title}</h4>
                            <p className="text-[10px] text-on-surface-variant mt-0.5">{event.organizer} • {event.location}</p>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold mt-2 inline-block ${event.registered ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                              {event.registered ? 'Registered' : 'Seats Open'}
                            </span>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Paginated Category Tab View */
              <div className="space-y-6">
                <div className="pb-2 border-b">
                  <h3 className="font-headline-md text-primary font-bold uppercase tracking-wider text-xs">
                    Filtered Category: {activeCategory.toUpperCase()}
                  </h3>
                </div>

                {paginatedItems.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeCategory === 'jobs' && paginatedItems.map((job) => (
                        <JobCard key={job.id} job={job as Job} />
                      ))}
                      {activeCategory === 'companies' && paginatedItems.map((c) => {
                        const company = c as Company;
                        return (
                          <Card key={company.id} hoverable className="flex items-center gap-4 cursor-pointer" onClick={() => navigate(`/student/company/${company.id}`)}>
                            <img src={company.logo} alt={company.name} className="w-12 h-12 rounded-lg object-contain border bg-white" />
                            <div className="text-left">
                              <h4 className="font-bold text-primary">{company.name}</h4>
                              <p className="text-xs text-on-surface-variant">{company.industry} • {company.location}</p>
                              <span className="text-[10px] text-primary font-semibold mt-1 inline-block">{company.openJobsCount} Open Positions</span>
                            </div>
                          </Card>
                        );
                      })}
                      {activeCategory === 'mentors' && paginatedItems.map((m) => (
                        <MentorCard key={m.id} mentor={m as Mentor} />
                      ))}
                      {activeCategory === 'events' && paginatedItems.map((e) => {
                        const event = e as Event;
                        return (
                          <Card key={event.id} hoverable className="flex items-start gap-4 cursor-pointer" onClick={() => navigate(`/student/event/${event.id}`)}>
                            <img src={event.banner} alt={event.title} className="w-20 h-14 rounded-lg object-cover border shrink-0" />
                            <div className="text-left">
                              <h4 className="font-bold text-xs text-primary leading-tight line-clamp-1">{event.title}</h4>
                              <p className="text-[10px] text-on-surface-variant mt-0.5">{event.organizer} • {event.location}</p>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold mt-2 inline-block ${event.registered ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                                {event.registered ? 'Registered' : 'Seats Open'}
                              </span>
                            </div>
                          </Card>
                        );
                      })}
                    </div>

                    {/* Pagination Bar */}
                    {totalPages > 1 && (
                      <div className="flex justify-center items-center gap-4 pt-8">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="px-4 py-2 bg-white dark:bg-surface-container-lowest rounded-xl border border-primary/5 shadow-sm text-xs font-bold text-on-surface-variant hover:text-primary disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          Previous
                        </button>
                        <span className="text-xs font-bold text-on-surface-variant">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="px-4 py-2 bg-white dark:bg-surface-container-lowest rounded-xl border border-primary/5 shadow-sm text-xs font-bold text-on-surface-variant hover:text-primary disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <EmptyState
                    icon="search_off"
                    title="No Matches Found"
                    description="No entries under this category match your queries."
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default SearchResults;
