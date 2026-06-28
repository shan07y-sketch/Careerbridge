import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { Job, Company, Recruiter } from '../../types';
import { JobService, CompanyService, ApplicationService } from '../../services';
import { useToast } from '../../contexts/ToastContext';
import { PageLayout } from '../../components/layout/PageLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';

export const JobDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [job, setJob] = useState<Job | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [recruiter, setRecruiter] = useState<Recruiter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!id) return;
      try {
        const jobData = await JobService.getJobById(id);
        if (!jobData) {
          showToast('Job opening not found', 'error');
          navigate('/student/jobs');
          return;
        }
        setJob(jobData);

        const compData = await CompanyService.getCompanyById(jobData.companyId);
        if (compData) setCompany(compData);

        const recData = await CompanyService.getRecruiterByCompanyId(jobData.companyId);
        if (recData) setRecruiter(recData);

        const saved = await JobService.isJobSaved(jobData.id);
        setIsSaved(saved);
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
    showToast(
      saved ? 'Job added to saved list!' : 'Job removed from saved list.',
      'success'
    );
  };

  const handleApply = async () => {
    if (!job) return;
    setIsApplying(true);
    try {
      await ApplicationService.applyToJob(job.id);
      setHasApplied(true);
      showToast(`Successfully applied to ${job.companyName}!`, 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Application failed', 'error');
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="space-y-6 text-left">
          <Skeleton variant="rect" height={120} />
          <Skeleton variant="rect" height={300} />
        </div>
      </PageLayout>
    );
  }

  if (!job) return null;

  return (
    <PageLayout>
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant/70 uppercase tracking-wider mb-4 text-left">
        <Link to="/student/dashboard" className="hover:text-primary">Dashboard</Link>
        <span className="material-symbols-outlined text-[12px]">chevron_right</span>
        <Link to="/student/jobs" className="hover:text-primary">Jobs</Link>
        <span className="material-symbols-outlined text-[12px]">chevron_right</span>
        <span className="text-primary truncate">{job.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter text-left items-start">
        {/* Main Details Panel */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 pb-6 border-b border-primary/5">
              <div className="flex gap-4">
                <img 
                  className="w-16 h-16 rounded-xl bg-surface-container dark:bg-surface-container-high object-contain shrink-0" 
                  alt={job.companyName} 
                  src={job.companyLogo} 
                />
                <div>
                  <h1 className="font-display text-headline-lg text-primary dark:text-primary-fixed leading-tight">
                    {job.title}
                  </h1>
                  <p className="text-on-surface-variant font-label-md mt-1">
                    <span className="hover:underline cursor-pointer font-bold text-primary dark:text-primary-fixed" onClick={() => navigate(`/student/company/${job.companyId}`)}>
                      {job.companyName}
                    </span>{' '}
                    • {job.location}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                <span className="text-primary dark:text-primary-fixed font-bold text-headline-md leading-none">{job.salaryRange}</span>
                <span className="text-[10px] text-on-surface-variant/70">Posted {job.postedTime}</span>
              </div>
            </div>

            {/* Quick Metrics Tags */}
            <div className="flex flex-wrap items-center gap-3 py-6 border-b border-primary/5">
              <span className="bg-surface-container px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                {job.type}
              </span>
              <span className="bg-secondary-container/40 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-primary dark:text-primary-fixed">
                AI Match: {job.matchRate}%
              </span>
              <span className="bg-surface-container px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                {job.workMode}
              </span>
              {job.experienceRequired && (
                <span className="bg-surface-container px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  {job.experienceRequired}
                </span>
              )}
              {job.deadline && (
                <span className="bg-error-container/10 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-error">
                  Deadline: {job.deadline}
                </span>
              )}
            </div>

            {/* Job Description */}
            <div className="py-6 space-y-4">
              <h3 className="font-headline-md text-primary dark:text-primary-fixed">Role Description</h3>
              <p className="font-body-md text-on-surface-variant leading-relaxed">
                {job.description}
              </p>
            </div>

            {/* Reporting Manager and Team Details */}
            {(job.reportingManager || job.teamInfo) && (
              <div className="py-6 border-t border-primary/5 space-y-4">
                <h3 className="font-headline-md text-primary dark:text-primary-fixed">Team & Leadership</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {job.reportingManager && (
                    <div className="p-4 bg-surface-container-low dark:bg-surface-container rounded-xl border border-primary/5">
                      <p className="text-on-surface-variant font-bold uppercase tracking-wider text-[9px] mb-1">Direct Manager</p>
                      <p className="font-bold text-primary dark:text-primary-fixed">{job.reportingManager}</p>
                    </div>
                  )}
                  {job.teamInfo && (
                    <div className="p-4 bg-surface-container-low dark:bg-surface-container rounded-xl border border-primary/5">
                      <p className="text-on-surface-variant font-bold uppercase tracking-wider text-[9px] mb-1">Team Assignment</p>
                      <p className="font-bold text-primary dark:text-primary-fixed">{job.teamInfo}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Technologies Stack */}
            {job.technologies && (
              <div className="py-6 border-t border-primary/5 space-y-4">
                <h3 className="font-headline-md text-primary dark:text-primary-fixed">Technologies Stack</h3>
                <div className="flex flex-wrap gap-2">
                  {job.technologies.map(tech => (
                    <span key={tech} className="bg-primary/5 dark:bg-primary-fixed/15 border border-primary/10 px-3.5 py-1.5 rounded-xl text-xs font-bold text-primary dark:text-primary-fixed">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Requirements & Skills */}
            <div className="py-6 border-t border-primary/5 space-y-4">
              <h3 className="font-headline-md text-primary dark:text-primary-fixed">Requirements</h3>
              <ul className="list-disc pl-5 space-y-2 text-on-surface-variant font-body-md">
                {job.requirements.map((req, idx) => (
                  <li key={idx} className="leading-relaxed">{req}</li>
                ))}
              </ul>
            </div>

            {/* Preferred skills if available */}
            {job.preferredSkills && (
              <div className="py-6 border-t border-primary/5 space-y-4">
                <h3 className="font-headline-md text-primary dark:text-primary-fixed">Preferred Skills</h3>
                <ul className="list-disc pl-5 space-y-2 text-on-surface-variant font-body-md">
                  {job.preferredSkills.map((pref, idx) => (
                    <li key={idx} className="leading-relaxed">{pref}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Responsibilities */}
            <div className="py-6 border-t border-primary/5 space-y-4">
              <h3 className="font-headline-md text-primary dark:text-primary-fixed">Key Responsibilities</h3>
              <ul className="list-disc pl-5 space-y-2 text-on-surface-variant font-body-md">
                {job.responsibilities.map((resp, idx) => (
                  <li key={idx} className="leading-relaxed">{resp}</li>
                ))}
              </ul>
            </div>

            {/* Benefits Checklist */}
            {job.benefits && (
              <div className="py-6 border-t border-primary/5 space-y-4">
                <h3 className="font-headline-md text-primary dark:text-primary-fixed">Compensation & Benefits</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {job.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-on-surface-variant">
                      <span className="material-symbols-outlined text-green-600 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      <span className="font-semibold">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hiring stages list */}
            {job.hiringStages && (
              <div className="py-6 border-t border-primary/5 space-y-4">
                <h3 className="font-headline-md text-primary dark:text-primary-fixed">Hiring Process</h3>
                <div className="space-y-3 border-l border-primary/10 pl-4 ml-2">
                  {job.hiringStages.map((stage, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-primary" />
                      <p className="text-xs font-bold text-primary dark:text-primary-fixed leading-none">{stage}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Career Growth Path */}
            <div className="py-6 border-t border-primary/5 space-y-4">
              <h3 className="font-headline-md text-primary dark:text-primary-fixed">Career Growth & Progression</h3>
              <div className="p-4 bg-primary-fixed/10 border border-primary/10 rounded-xl space-y-2 text-xs">
                <p className="font-bold text-primary">Potential Promotion Pathway:</p>
                <p className="text-on-surface-variant leading-relaxed">
                  Junior Software Engineer → Software Engineer II (Avg. 18 months) → Senior Software Engineer (Avg. 3-4 years). CareerBridge members entering this path typically report a 25% salary increase upon promotion to SWE II.
                </p>
              </div>
            </div>

            {/* Bottom Form Actions */}
            <div className="flex gap-4 pt-6 border-t border-primary/5">
              <Button
                className="flex-grow py-3"
                onClick={handleApply}
                disabled={hasApplied}
                isLoading={isApplying}
              >
                {hasApplied ? 'Applied' : 'Apply for this position'}
              </Button>
              <Button
                variant="secondary"
                onClick={handleSaveToggle}
                className="px-6 py-3 border border-primary/10 text-primary"
              >
                <span className="material-symbols-outlined mr-2">
                  {isSaved ? 'bookmark_added' : 'bookmark'}
                </span>
                {isSaved ? 'Saved' : 'Save'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Side Panel: Company Overview & Recruiter */}
        <div className="lg:col-span-4 space-y-gutter">
          {/* Company Brief Card */}
          {company && (
            <Card className="space-y-4">
              <h4 className="font-bold text-label-md text-primary dark:text-primary-fixed uppercase tracking-wider">Company Information</h4>
              <div className="flex items-center gap-4">
                <img 
                  className="w-12 h-12 bg-surface-container rounded-lg object-contain" 
                  alt={company.name} 
                  src={company.logo} 
                />
                <div>
                  <h4 
                    className="font-bold text-body-lg text-primary dark:text-primary-fixed hover:underline cursor-pointer"
                    onClick={() => navigate(`/student/company/${company.id}`)}
                  >
                    {company.name}
                  </h4>
                  <p className="text-xs text-on-surface-variant">{company.industry}</p>
                </div>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3">
                {company.description}
              </p>
              <div className="pt-2 border-t border-primary/5 space-y-2 text-xs text-on-surface-variant">
                <div className="flex justify-between">
                  <span>Size</span>
                  <span className="font-bold">{company.employeeCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Headquarters</span>
                  <span className="font-bold truncate max-w-[150px]">{company.location}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                className="w-full py-2 text-xs text-primary hover:text-primary"
                size="sm"
                onClick={() => navigate(`/student/company/${company.id}`)}
              >
                View Company Profile
              </Button>
            </Card>
          )}

          {/* Recruiter Card */}
          {recruiter && (
            <Card className="space-y-4">
              <h4 className="font-bold text-label-md text-primary dark:text-primary-fixed uppercase tracking-wider">Hiring Coordinator</h4>
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
              
              <div className="pt-2 border-t border-primary/5 space-y-1.5 text-xs text-on-surface-variant font-semibold">
                <div className="flex justify-between">
                  <span>Hiring Manager</span>
                  <span className="font-bold text-primary">Sarah Lin (Director of Engineering)</span>
                </div>
                <div className="flex justify-between">
                  <span>Recruiter Email</span>
                  <span className="font-bold hover:underline cursor-pointer text-primary">recruiting@google.com</span>
                </div>
              </div>

              <Button
                variant="secondary"
                className="w-full py-2 text-primary text-xs"
                size="sm"
                onClick={() => navigate('/student/messages')}
                leftIcon={<span className="material-symbols-outlined text-[16px]">chat</span>}
              >
                Message Recruiter
              </Button>
            </Card>
          )}

          {/* Similar Jobs / People Also Applied */}
          <Card className="space-y-4">
            <h4 className="font-bold text-label-md text-primary dark:text-primary-fixed uppercase tracking-wider">People Also Applied</h4>
            <div className="space-y-3 text-xs text-left">
              {[
                { title: 'Software Engineer II', company: 'Canva', match: 91, logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDN12tATicpUFiiNJ-Occnk1Z0y_3db8Q6b8ZdqGjUX8g0ZtNZRZLHvswIIoAtziTyZoukBgXXjUvRYd6QTtf3s_ggQfDunsE5Sxo7jzntcUAMjPZtau_jZeLoregJGghGsnFOY2dRmVwwsBA1KnycEDzYwQkL-d3_P6CePX8yxZ8PKFam_Z3CvHvg6hLWj3Gvbl8bQu7jkSroA6C263UrhaBALpdrXVQEkRSs-LdqzObMyLayKVxzPEt8gqA7VVaVeRj6cS12_BUQ' },
                { title: 'React Developer', company: 'Figma', match: 88, logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBy9drQIkdcA8UBCiMdEYVbXeZPaxZRg2iNCLFDO0dUPk3qFvoAPlntj1I2UiramQuWf46IimJVw4S6LC4TwBM9L-dEQ3FlxiT-FsPHoN8Qmt6oN4ffDqN74x58Z0hAbnjb_muqhqgszqnCydI2UqUaOIM8ykMHxxxBaBW10Rj39xHM3TIdHf0MVKHc0xUCtJSod1o6xCNdknBGyWvlhvx5VlTwCWd32bMk5IFAeImGneDJB0Q6srNawiPEb1Iq6IJxfDIbSaWHkUI' }
              ].map((sim, i) => (
                <div 
                  key={i} 
                  onClick={() => showToast(`Opening ${sim.title} details...`, 'info')}
                  className="flex items-center gap-3 cursor-pointer hover:bg-surface-container-low p-2 rounded-xl transition-colors"
                >
                  <img className="w-8 h-8 rounded bg-surface-container object-contain" alt={sim.company} src={sim.logo} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-primary truncate text-xs">{sim.title}</p>
                    <p className="text-[10px] text-on-surface-variant font-semibold mt-0.5">{sim.company}</p>
                  </div>
                  <span className="bg-primary/10 text-primary font-bold px-2 py-0.5 rounded text-[8px] uppercase shrink-0">
                    {sim.match}% Match
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="h-10"></div>
    </PageLayout>
  );
};

export default JobDetails;
