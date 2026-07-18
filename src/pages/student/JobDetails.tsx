import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Job, Company, Recruiter } from '../../types';
import { JobService, CompanyService, ApplicationService } from '../../services';
import { useToast } from '../../contexts/ToastContext';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageHeader } from '../../components/ui/PageHeader';
import { Section } from '../../components/ui/Section';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';

const List: React.FC<{ items: string[] }> = ({ items }) => (
  <ul className="space-y-2">
    {items.map((it, idx) => (
      <li key={idx} className="flex gap-2.5 text-body-md text-on-surface-variant leading-relaxed">
        <span className="material-symbols-outlined text-[18px] text-primary mt-0.5 shrink-0">check</span>
        <span>{it}</span>
      </li>
    ))}
  </ul>
);

export const JobDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [job, setJob] = useState<Job | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [recruiter, setRecruiter] = useState<Recruiter | null>(null);
  const [similar, setSimilar] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!id) return;
      try {
        const jobData = await JobService.getJobById(id);
        if (!jobData) { showToast('Job opening not found', 'error'); navigate('/student/jobs'); return; }
        setJob(jobData);
        CompanyService.getCompanyById(jobData.companyId).then(c => c && setCompany(c)).catch(() => {});
        CompanyService.getRecruiterByCompanyId(jobData.companyId).then(r => r && setRecruiter(r)).catch(() => {});
        JobService.isJobSaved(jobData.id).then(setIsSaved).catch(() => {});
        JobService.getJobs().then(all => setSimilar(all.filter(j => j.id !== jobData.id).slice(0, 3))).catch(() => {});
      } catch (err) {
        console.error('Failed to load job details', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchJobDetails();
  }, [id, navigate, showToast]);

  const handleSaveToggle = async () => {
    if (!job) return;
    const saved = await JobService.toggleSaveJob(job.id);
    setIsSaved(saved);
    showToast(saved ? 'Job added to saved list.' : 'Job removed from saved list.', 'success');
  };

  const handleApply = async () => {
    if (!job) return;
    setIsApplying(true);
    try {
      await ApplicationService.applyToJob(job.id);
      setHasApplied(true);
      showToast(`Successfully applied to ${job.companyName}.`, 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Application failed', 'error');
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="space-y-6"><Skeleton variant="rect" height={120} /><Skeleton variant="rect" height={300} /></div>
      </PageLayout>
    );
  }
  if (!job) return null;

  return (
    <PageLayout>
      <PageHeader
        title={job.title}
        breadcrumbs={[
          { label: 'Jobs', onClick: () => navigate('/student/jobs') },
          { label: job.companyName },
        ]}
        actions={
          <>
            <Button variant="outline" onClick={handleSaveToggle}
              leftIcon={<span className="material-symbols-outlined text-[19px]">{isSaved ? 'bookmark_added' : 'bookmark'}</span>}>
              {isSaved ? 'Saved' : 'Save'}
            </Button>
            <Button variant="primary" onClick={handleApply} disabled={hasApplied} isLoading={isApplying}>
              {hasApplied ? 'Applied' : 'Apply now'}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          <Card className="!p-6">
            <div className="flex items-start gap-4">
              <img className="w-16 h-16 rounded-xl bg-surface-container object-contain p-1.5 shrink-0" alt={job.companyName} src={job.companyLogo} />
              <div className="min-w-0 flex-grow">
                <button onClick={() => navigate(`/student/company/${job.companyId}`)} className="text-body-lg font-semibold text-on-surface hover:text-primary transition-colors text-left">{job.companyName}</button>
                <p className="text-label-md text-on-surface-variant mt-0.5">{job.location} · Posted {job.postedTime}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge tone="neutral">{job.type}</Badge>
                  <Badge tone="neutral">{job.workMode}</Badge>
                  {job.matchRate ? <Badge tone="brand" icon="auto_awesome">{job.matchRate}% match</Badge> : null}
                  {job.experienceRequired && <Badge tone="neutral">{job.experienceRequired}</Badge>}
                  {job.deadline && <Badge tone="warning" icon="schedule">Closes {job.deadline}</Badge>}
                </div>
              </div>
              <span className="text-body-lg font-semibold text-on-surface shrink-0 hidden sm:block">{job.salaryRange}</span>
            </div>
          </Card>

          <Section title="About the role">
            <Card><p className="text-body-md text-on-surface-variant leading-relaxed whitespace-pre-line">{job.description}</p></Card>
          </Section>

          {job.responsibilities?.length > 0 && (
            <Section title="Key responsibilities"><Card><List items={job.responsibilities} /></Card></Section>
          )}

          {job.requirements?.length > 0 && (
            <Section title="Requirements"><Card><List items={job.requirements} /></Card></Section>
          )}

          {job.preferredSkills && job.preferredSkills.length > 0 && (
            <Section title="Nice to have"><Card><List items={job.preferredSkills} /></Card></Section>
          )}

          {job.technologies && job.technologies.length > 0 && (
            <Section title="Tech stack">
              <Card><div className="flex flex-wrap gap-2">{job.technologies.map(t => <Badge key={t} tone="neutral">{t}</Badge>)}</div></Card>
            </Section>
          )}

          {job.benefits && job.benefits.length > 0 && (
            <Section title="Benefits"><Card><div className="grid sm:grid-cols-2 gap-x-6"><List items={job.benefits} /></div></Card></Section>
          )}

          {job.hiringStages && job.hiringStages.length > 0 && (
            <Section title="Hiring process">
              <Card>
                <ol className="relative border-l border-outline-variant/70 ml-3 space-y-4">
                  {job.hiringStages.map((stage, idx) => (
                    <li key={idx} className="pl-6">
                      <span className="absolute -left-3 w-6 h-6 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-label-sm font-semibold">{idx + 1}</span>
                      <p className="text-body-md font-medium text-on-surface">{stage}</p>
                    </li>
                  ))}
                </ol>
              </Card>
            </Section>
          )}

          <Card className="!p-6 flex flex-col sm:flex-row gap-3">
            <Button variant="primary" className="flex-grow" onClick={handleApply} disabled={hasApplied} isLoading={isApplying}>
              {hasApplied ? 'Applied' : 'Apply for this position'}
            </Button>
            <Button variant="outline" onClick={handleSaveToggle}
              leftIcon={<span className="material-symbols-outlined text-[19px]">{isSaved ? 'bookmark_added' : 'bookmark'}</span>}>
              {isSaved ? 'Saved' : 'Save for later'}
            </Button>
          </Card>
        </div>

        <div className="space-y-8">
          {job.reportingManager || job.teamInfo ? (
            <Card>
              <CardHeader icon="groups" title="Team & leadership" />
              <div className="space-y-3">
                {job.reportingManager && <div><p className="text-label-sm text-on-surface-variant uppercase tracking-wide">Reports to</p><p className="text-body-md text-on-surface mt-0.5">{job.reportingManager}</p></div>}
                {job.teamInfo && <div><p className="text-label-sm text-on-surface-variant uppercase tracking-wide">Team</p><p className="text-body-md text-on-surface mt-0.5">{job.teamInfo}</p></div>}
              </div>
            </Card>
          ) : null}

          {company && (
            <Card>
              <CardHeader icon="business" title="About the company" />
              <div className="flex items-center gap-3">
                <img className="w-12 h-12 rounded-xl bg-surface-container object-contain p-1" alt={company.name} src={company.logo} />
                <div className="min-w-0">
                  <button onClick={() => navigate(`/student/company/${company.id}`)} className="text-body-md font-semibold text-on-surface hover:text-primary transition-colors text-left truncate">{company.name}</button>
                  <p className="text-label-sm text-on-surface-variant">{company.industry}</p>
                </div>
              </div>
              {company.description && <p className="text-label-md text-on-surface-variant leading-relaxed mt-3 line-clamp-4">{company.description}</p>}
              <div className="mt-3 pt-3 border-t border-outline-variant/60 space-y-1.5 text-label-md">
                <div className="flex justify-between"><span className="text-on-surface-variant">Size</span><span className="font-medium text-on-surface">{company.employeeCount}</span></div>
                <div className="flex justify-between"><span className="text-on-surface-variant">HQ</span><span className="font-medium text-on-surface truncate max-w-[150px]">{company.location}</span></div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => navigate(`/student/company/${company.id}`)}>View company profile</Button>
            </Card>
          )}

          {recruiter && (
            <Card>
              <CardHeader icon="support_agent" title="Hiring coordinator" />
              <div className="flex items-center gap-3">
                <img className="w-12 h-12 rounded-full object-cover" alt={recruiter.name} src={recruiter.avatar} />
                <div className="min-w-0">
                  <p className="text-body-md font-semibold text-on-surface truncate">{recruiter.name}</p>
                  <p className="text-label-sm text-on-surface-variant">Recruiter</p>
                </div>
              </div>
              {recruiter.bio && <p className="text-label-md text-on-surface-variant leading-relaxed mt-3">{recruiter.bio}</p>}
              <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => navigate('/student/messages')}
                leftIcon={<span className="material-symbols-outlined text-[16px]">chat</span>}>Message recruiter</Button>
            </Card>
          )}

          {similar.length > 0 && (
            <Card>
              <CardHeader icon="work" title="More roles" />
              <div className="space-y-1">
                {similar.map(s => (
                  <button key={s.id} onClick={() => navigate(`/student/jobs/${s.id}`)}
                    className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-surface-container transition-colors text-left">
                    <img className="w-9 h-9 rounded-lg bg-surface-container object-contain p-1 shrink-0" alt={s.companyName} src={s.companyLogo} />
                    <div className="flex-1 min-w-0">
                      <p className="text-label-md font-medium text-on-surface truncate">{s.title}</p>
                      <p className="text-label-sm text-on-surface-variant truncate">{s.companyName}</p>
                    </div>
                    {s.matchRate ? <span className="text-label-sm font-semibold text-primary shrink-0">{s.matchRate}%</span> : null}
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default JobDetails;
