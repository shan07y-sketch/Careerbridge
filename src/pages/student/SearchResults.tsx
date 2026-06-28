import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { JobService, CompanyService, EventService, NetworkService } from '../../services';
import type { Job, Company, Mentor, Event } from '../../types';
import { PageLayout } from '../../components/layout/PageLayout';
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

  // Mock Recent Searches
  const [recentSearches, setRecentSearches] = useState<string[]>(['React Developer', 'MIT', 'Software Engineer', 'Google']);

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
  };

  return (
    <PageLayout>
      <section className="text-left space-y-2">
        <h1 className="font-display text-headline-lg text-primary dark:text-primary-fixed">Search Hub</h1>
        <p className="font-body-lg text-on-surface-variant">
          {query ? (
            <>
              Found <span className="font-bold text-primary dark:text-primary-fixed">{totalMatches} matches</span> for <span className="font-bold text-primary">"{query}"</span>
            </>
          ) : (
            'Search the ecosystem for jobs, mentors, companies, and events.'
          )}
        </p>
      </section>

      {/* Main Results Board */}
      {!query.trim() ? (
        /* Empty Query / Suggestions State */
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
          <Card className="col-span-12 lg:col-span-8 p-8 space-y-6">
            <h3 className="font-headline-md text-primary dark:text-primary-fixed">Popular Search Recommendations</h3>
            <div className="flex flex-wrap gap-2.5">
              {['Vite Developer', 'Docker', 'Google Internship', 'MIT Placement', 'Mentoring Session', 'AI Career Prep'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleRecentClick(tag)}
                  className="bg-primary-container/5 hover:bg-primary/10 hover:text-primary text-primary dark:text-primary-fixed border border-primary/10 rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </Card>
          
          {recentSearches.length > 0 && (
            <aside className="col-span-12 lg:col-span-4 bg-white dark:bg-surface-container p-6 rounded-xl border border-primary/5 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-xs uppercase tracking-wider text-on-surface-variant">Recent Searches</h4>
                <button onClick={handleClearHistory} className="text-xs text-error font-medium hover:underline">Clear</button>
              </div>
              <ul className="space-y-3">
                {recentSearches.map((term, i) => (
                  <li key={i}>
                    <button
                      onClick={() => handleRecentClick(term)}
                      className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer w-full text-left"
                    >
                      <span className="material-symbols-outlined text-[16px]">history</span>
                      {term}
                    </button>
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </section>
      ) : (
        /* Loaded Search Board */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">
          {/* Side Tabs */}
          <aside className="lg:col-span-3 space-y-2">
            {[
              { id: 'all', label: 'All Matches', count: totalMatches, icon: 'grid_view' },
              { id: 'jobs', label: 'Jobs', count: filteredJobs.length, icon: 'work' },
              { id: 'companies', label: 'Companies', count: filteredCompanies.length, icon: 'corporate_fare' },
              { id: 'mentors', label: 'Mentors', count: filteredMentors.length, icon: 'person' },
              { id: 'events', label: 'Events', count: filteredEvents.length, icon: 'event' }
            ].map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as SearchCategory)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-white dark:bg-surface-container text-on-surface-variant hover:bg-surface-container-high border border-primary/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">{cat.icon}</span>
                    <span>{cat.label}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-surface-container-high text-on-surface-variant'}`}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </aside>

          {/* Results Listings */}
          <main className="lg:col-span-9 space-y-8">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : totalMatches === 0 ? (
              <EmptyState
                icon="search_off"
                title="No Results Found"
                description="We couldn't find any listings matching your search keyword. Try another search or filter."
              />
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
          </main>
        </div>
      )}

      <div className="h-10"></div>
    </PageLayout>
  );
};

export default SearchResults;
