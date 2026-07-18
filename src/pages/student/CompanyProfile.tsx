import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Company, Job, Recruiter } from '../../types';
import { CompanyService, JobService } from '../../services';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { Section } from '../../components/ui/Section';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { JobCard } from '../../components/cards/JobCard';

export const CompanyProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [recruiter, setRecruiter] = useState<Recruiter | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) { setIsLoading(false); return; }
      try {
        const comp = await CompanyService.getCompanyById(id);
        setCompany(comp || null);
        if (comp) {
          JobService.getJobsByCompanyId(comp.id).then(setJobs).catch(() => {});
          CompanyService.getRecruiterByCompanyId(comp.id).then(r => setRecruiter(r || null)).catch(() => {});
        }
      } catch (err) {
        console.error('Failed to load company profile', err);
      } finally { setIsLoading(false); }
    };
    load();
  }, [id]);

  if (isLoading) {
    return (<PageLayout><PageHeader title="Company" /><div className="grid gap-4"><CardSkeleton /></div></PageLayout>);
  }
  if (!company) {
    return (
      <PageLayout>
        <PageHeader title="Company" />
        <EmptyState icon="business" title="Company not found"
          description="We couldn't find this company profile. It may have been removed."
          actionLabel="Back to jobs" onAction={() => navigate('/student/jobs')} />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title={company.name}
        description={`${company.industry} · ${company.location}`}
        breadcrumbs={[{ label: 'Jobs', onClick: () => navigate('/student/jobs') }, { label: company.name }]}
        actions={
          <>
            {company.website && <Button variant="outline" onClick={() => window.open(company.website, '_blank', 'noopener')} leftIcon={<span className="material-symbols-outlined text-[19px]">open_in_new</span>}>Website</Button>}
            {recruiter && <Button variant="primary" onClick={() => navigate('/student/messages')} leftIcon={<span className="material-symbols-outlined text-[19px]">chat</span>}>Message recruiter</Button>}
          </>
        }
      />

      <div className="space-y-8">
        <Card className="!p-6">
          <div className="flex items-center gap-4">
            <img className="w-16 h-16 rounded-xl bg-surface-container object-contain p-2 shrink-0" alt={company.name} src={company.logo} />
            <div className="min-w-0">
              <h2 className="text-headline-sm font-semibold text-on-surface truncate">{company.name}</h2>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge tone="neutral" icon="apartment">{company.industry}</Badge>
                <Badge tone="neutral" icon="location_on">{company.location}</Badge>
                {company.rating ? <Badge tone="warning" icon="star">{company.rating.toFixed(1)}</Badge> : null}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard label="Open roles" value={jobs.length} icon="work" hint="apply now" />
          <StatCard label="Company size" value={company.employeeCount} icon="groups" hint="employees" />
          <StatCard label="Rating" value={company.rating ? company.rating.toFixed(1) : '—'} icon="star" hint="from reviews" />
          <StatCard label="Industry" value={company.industry} icon="category" hint="sector" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            <Section title={`About ${company.name}`}>
              <Card><p className="text-body-md text-on-surface-variant leading-relaxed whitespace-pre-line">{company.description}</p></Card>
            </Section>
            <Section title="Open roles" description={jobs.length ? `${jobs.length} active ${jobs.length === 1 ? 'position' : 'positions'}` : undefined}>
              {jobs.length > 0 ? (
                <div className="grid gap-4">{jobs.map(job => <JobCard key={job.id} job={job} />)}</div>
              ) : (
                <EmptyState icon="work_off" title="No active openings"
                  description="This company has no live roles right now. Check back soon, or explore similar companies."
                  actionLabel="Browse all jobs" onAction={() => navigate('/student/jobs')} />
              )}
            </Section>
          </div>

          <div className="space-y-8">
            {recruiter && (
              <Card>
                <CardHeader icon="support_agent" title="Hiring contact" />
                <div className="flex items-center gap-3">
                  <img className="w-12 h-12 rounded-full object-cover shrink-0" alt={recruiter.name} src={recruiter.avatar} />
                  <div className="min-w-0"><p className="text-body-md font-semibold text-on-surface truncate">{recruiter.name}</p><p className="text-label-sm text-on-surface-variant">Recruiter</p></div>
                </div>
                {recruiter.bio && <p className="text-label-md text-on-surface-variant leading-relaxed mt-3">{recruiter.bio}</p>}
                <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/student/messages')}>Send message</Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default CompanyProfile;
