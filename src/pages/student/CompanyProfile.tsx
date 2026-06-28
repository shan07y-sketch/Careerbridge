import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Company, Job, Recruiter } from '../../types';
import { CompanyService, JobService } from '../../services';
import { PageLayout } from '../../components/layout/PageLayout';
import { JobCard } from '../../components/cards/JobCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';

export const CompanyProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [recruiter, setRecruiter] = useState<Recruiter | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCompanyData = async () => {
      if (!id) return;
      try {
        const comp = await CompanyService.getCompanyById(id);
        setCompany(comp || null);

        if (comp) {
          const companyJobs = await JobService.getJobsByCompanyId(comp.id);
          setJobs(companyJobs);

          const rec = await CompanyService.getRecruiterByCompanyId(comp.id);
          setRecruiter(rec || null);
        }
      } catch (err) {
        console.error('Failed to load company profile', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadCompanyData();
  }, [id]);

  if (isLoading) {
    return (
      <PageLayout>
        <div className="space-y-6 text-left">
          <Skeleton variant="rect" height={150} />
          <Skeleton variant="rect" height={300} />
        </div>
      </PageLayout>
    );
  }

  if (!company) {
    return (
      <PageLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-bold text-primary">Company profile not found</h2>
          <Button variant="secondary" className="mt-4" onClick={() => navigate('/student/jobs')}>
            Back to Jobs
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-6 text-left">
        {/* Banner Card */}
        <section className="bg-white dark:bg-surface-container-lowest rounded-2xl p-8 border border-primary/5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-r from-primary-container to-surface-tint opacity-10"></div>
          <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center">
            <img 
              className="w-20 h-20 rounded-xl bg-surface-container object-contain border p-2 shrink-0" 
              alt={company.name} 
              src={company.logo} 
            />
            <div className="flex-grow text-center md:text-left">
              <h1 className="font-display text-headline-lg text-primary dark:text-primary-fixed leading-tight">{company.name}</h1>
              <p className="text-on-surface-variant font-label-md mt-1">{company.industry} • {company.location}</p>
            </div>
            {recruiter && (
              <Button 
                onClick={() => navigate('/student/messages')}
                leftIcon={<span className="material-symbols-outlined">chat</span>}
              >
                Message Recruiter
              </Button>
            )}
          </div>
        </section>

        {/* Multi-column workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Info */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="space-y-4">
              <h3 className="font-headline-md text-primary dark:text-primary-fixed">About {company.name}</h3>
              <p className="font-body-md text-on-surface-variant leading-relaxed">
                {company.description}
              </p>
            </Card>

            {/* Active openings */}
            <div className="space-y-4">
              <h3 className="font-headline-md text-primary dark:text-primary-fixed">Active Job Openings</h3>
              {jobs.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {jobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              ) : (
                <p className="text-on-surface-variant text-sm bg-white dark:bg-surface-container p-6 rounded-xl text-center border">
                  No active openings for this company at the moment. Check back soon!
                </p>
              )}
            </div>
          </div>

          {/* Side Info */}
          <div className="lg:col-span-4 space-y-6">
            {/* Quick Metrics */}
            <Card className="space-y-4 text-xs text-on-surface-variant">
              <h4 className="font-bold text-label-md text-primary uppercase tracking-wider">Company Highlights</h4>
              <div className="space-y-3">
                <div className="flex justify-between border-b pb-2">
                  <span>Size</span>
                  <span className="font-bold">{company.employeeCount} employees</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span>Headquarters</span>
                  <span className="font-bold">{company.location}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span>Industry</span>
                  <span className="font-bold">{company.industry}</span>
                </div>
                <div className="flex justify-between">
                  <span>Open Roles</span>
                  <span className="font-bold">{jobs.length} positions</span>
                </div>
              </div>
            </Card>

            {/* Recruiter Details Card */}
            {recruiter && (
              <Card className="space-y-4">
                <h4 className="font-bold text-label-md text-primary uppercase tracking-wider">Liaison Contact</h4>
                <div className="flex items-center gap-4">
                  <img className="w-12 h-12 rounded-full object-cover border" alt={recruiter.name} src={recruiter.avatar} />
                  <div>
                    <h4 className="font-bold text-body-lg text-primary dark:text-primary-fixed">{recruiter.name}</h4>
                    <p className="text-xs text-on-surface-variant">Technical Recruiter</p>
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {recruiter.bio}
                </p>
                <Button
                  variant="secondary"
                  className="w-full text-xs text-primary"
                  onClick={() => navigate('/student/messages')}
                >
                  Send Message
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
      <div className="h-10"></div>
    </PageLayout>
  );
};
export default CompanyProfile;
