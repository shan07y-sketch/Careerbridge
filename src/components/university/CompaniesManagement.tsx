import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { UniversityService, UniversityEcosystemService, type PartnerCompany } from '../../services';
import { PageHeader } from '../ui/PageHeader';
import { StatCard } from '../ui/StatCard';
import { Toolbar, FilterChip } from '../ui/Toolbar';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { CardSkeleton } from '../ui/Skeleton';

type View = 'partners' | 'discover';

export const CompaniesManagement: React.FC = () => {
  const [companies, setCompanies] = useState<PartnerCompany[]>([]);
  const [discover, setDiscover] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<View>('partners');

  const load = useCallback(async () => {
    setIsLoading(true); setError(null);
    try { setCompanies(await UniversityService.getCompanies()); }
    catch (err: any) { setError(err?.message || 'Failed to load companies.'); }
    finally { setIsLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { UniversityEcosystemService.getOverview().then((e: any) => setDiscover(e?.companies || [])).catch(() => setDiscover([])); }, []);

  const totalApplications = companies.reduce((s, c) => s + c.applications, 0);
  const totalHired = companies.reduce((s, c) => s + c.hired, 0);

  const filteredPartners = useMemo(() => companies.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.industry.toLowerCase().includes(searchTerm.toLowerCase())), [companies, searchTerm]);
  const filteredDiscover = useMemo(() => discover.filter((c: any) =>
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (c.industry || '').toLowerCase().includes(searchTerm.toLowerCase())), [discover, searchTerm]);

  return (
    <>
      <PageHeader title="Companies" description="Partners recruiting from your students, and the wider employer network to discover for campus recruitment." />
      <div className="space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard label="Partner companies" value={isLoading ? '—' : companies.length} icon="handshake" hint="recruiting here" />
          <StatCard label="Applications" value={isLoading ? '—' : totalApplications} icon="assignment_ind" hint="from your students" />
          <StatCard label="Students hired" value={isLoading ? '—' : totalHired} icon="workspace_premium" hint="offers accepted" />
          <StatCard label="Discoverable" value={discover.length} icon="travel_explore" hint="employers on platform" onClick={() => setView('discover')} />
        </div>

        <div>
          <Toolbar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by company or industry…"
            filters={
              <>
                <FilterChip active={view === 'partners'} onClick={() => setView('partners')} count={companies.length}>Partners</FilterChip>
                <FilterChip active={view === 'discover'} onClick={() => setView('discover')} count={discover.length}>Discover</FilterChip>
              </>
            }
          />

          {view === 'partners' ? (
            isLoading ? (
              <div className="grid gap-4"><CardSkeleton /><CardSkeleton /></div>
            ) : error ? (
              <EmptyState icon="cloud_off" title="Couldn't load companies" description={error} actionLabel="Retry" onAction={load} />
            ) : filteredPartners.length === 0 ? (
              <EmptyState icon="apartment"
                title={companies.length === 0 ? 'No recruiting partners yet' : 'No partners match your search'}
                description={companies.length === 0 ? 'This list populates automatically once your students apply to jobs. Explore the Discover tab to find employers to invite for campus recruitment.' : 'Try a different search term.'}
                actionLabel={companies.length === 0 ? 'Discover employers' : undefined}
                onAction={companies.length === 0 ? () => setView('discover') : undefined} />
            ) : (
              <Card className="!p-0 overflow-hidden">
                <table className="w-full text-left text-body-md">
                  <thead className="text-label-sm uppercase tracking-wide text-on-surface-variant border-b border-outline-variant/60">
                    <tr><th className="px-5 py-3 font-semibold">Company</th><th className="px-5 py-3 font-semibold">Industry</th><th className="px-5 py-3 font-semibold">Applications</th><th className="px-5 py-3 font-semibold">Hired</th><th className="px-5 py-3 font-semibold">Open roles</th></tr>
                  </thead>
                  <tbody>
                    {filteredPartners.map(c => (
                      <tr key={c.id} className="border-t border-outline-variant/60 hover:bg-surface-container/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center font-semibold text-on-surface shrink-0 overflow-hidden">{c.logoUrl ? <img src={c.logoUrl} alt="" className="w-full h-full object-cover" /> : c.name[0]}</span>
                            <div className="min-w-0"><p className="font-semibold text-on-surface truncate">{c.name}</p>{c.website && <a href={c.website} target="_blank" rel="noreferrer" className="text-label-sm text-primary hover:underline">{c.website}</a>}</div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-on-surface-variant">{c.industry}</td>
                        <td className="px-5 py-4 font-semibold text-on-surface">{c.applications}</td>
                        <td className="px-5 py-4 font-semibold text-on-surface">{c.hired}</td>
                        <td className="px-5 py-4">{c.openJobs > 0 ? <Badge tone="success">{c.openJobs} open</Badge> : <Badge tone="neutral">None</Badge>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )
          ) : (
            filteredDiscover.length === 0 ? (
              <EmptyState icon="travel_explore" title="No employers to discover yet"
                description="As companies join CareerBridge they'll appear here for you to invite to campus drives and partnerships." />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDiscover.map((c: any) => (
                  <Card key={c.id} className="!p-4">
                    <div className="flex items-center gap-3">
                      {c.logo ? <img src={c.logo} alt="" className="w-11 h-11 rounded-xl object-contain bg-surface-container p-1 shrink-0" /> : <span className="w-11 h-11 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center font-semibold shrink-0">{(c.name || '?').substring(0, 2).toUpperCase()}</span>}
                      <div className="min-w-0"><p className="text-body-md font-semibold text-on-surface truncate">{c.name}</p><p className="text-label-sm text-on-surface-variant truncate">{c.industry}</p></div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      {c.openJobsCount > 0 ? <Badge tone="success">{c.openJobsCount} open roles</Badge> : <Badge tone="neutral">No open roles</Badge>}
                    </div>
                  </Card>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </>
  );
};

export default CompaniesManagement;
