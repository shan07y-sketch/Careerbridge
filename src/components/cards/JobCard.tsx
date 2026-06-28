import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Job } from '../../types';
import { JobService, ApplicationService } from '../../services';
import { useToast } from '../../contexts/ToastContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface JobCardProps {
  job: Job;
  onApplySuccess?: () => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onApplySuccess }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isSaved, setIsSaved] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [showAIExplanation, setShowAIExplanation] = useState(false);

  useEffect(() => {
    const checkSavedState = async () => {
      const saved = await JobService.isJobSaved(job.id);
      setIsSaved(saved);
    };
    checkSavedState();
  }, [job.id]);

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const saved = await JobService.toggleSaveJob(job.id);
    setIsSaved(saved);
    showToast(
      saved ? 'Job added to saved list!' : 'Job removed from saved list.',
      'success'
    );
  };

  const handleApply = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsApplying(true);
    try {
      await ApplicationService.applyToJob(job.id);
      setHasApplied(true);
      showToast(`Successfully applied to ${job.companyName}!`, 'success');
      if (onApplySuccess) onApplySuccess();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Application failed', 'error');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Card hoverable className="flex flex-col gap-4">
      <div className="flex items-start gap-4">
        {/* Company Logo */}
        <div 
          className="w-14 h-14 bg-surface-container dark:bg-surface-container-high rounded-xl flex items-center justify-center overflow-hidden shrink-0 cursor-pointer"
          onClick={() => navigate(`/student/company/${job.companyId}`)}
        >
          <img className="w-8 h-8 object-contain" alt={job.companyName} src={job.companyLogo} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                {job.urgency === 'high' && (
                  <span className="bg-error-container/20 text-error px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 bg-error rounded-full animate-pulse"></span>
                    Hiring Urgently
                  </span>
                )}
                {job.experienceRequired && (
                  <span className="bg-surface-container-high dark:bg-surface-container text-on-surface-variant px-2 py-0.5 rounded text-[9px] font-bold uppercase">
                    {job.experienceRequired}
                  </span>
                )}
              </div>

              <h4 className="font-bold text-body-lg text-primary dark:text-primary-fixed truncate cursor-pointer hover:underline leading-tight" onClick={() => navigate(`/student/jobs/${job.id}`)}>
                {job.title}
              </h4>
              <p className="text-on-surface-variant font-label-md truncate mt-0.5">
                <span className="hover:underline cursor-pointer font-semibold text-primary dark:text-primary-fixed" onClick={() => navigate(`/student/company/${job.companyId}`)}>
                  {job.companyName}
                </span>{' '}
                • {job.location}
              </p>
              
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="text-[10px] text-on-surface-variant/70">Posted: {job.postedTime}</span>
                <span className="text-[10px] text-primary dark:text-primary-fixed font-bold flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[12px] fill-1">star</span> {job.rating}/5
                </span>
                {job.applicantsCount && (
                  <span className="text-[10px] text-on-surface-variant/60">
                    • {job.applicantsCount} applicants
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              <span className="text-primary dark:text-primary-fixed font-bold text-label-md">{job.salaryRange}</span>
              <button 
                onClick={handleSaveToggle}
                className="text-on-surface-variant hover:text-primary transition-colors"
                title={isSaved ? "Remove Bookmark" : "Save Job"}
              >
                <span className={`material-symbols-outlined ${isSaved ? 'text-primary fill-1' : ''}`}>
                  bookmark
                </span>
              </button>
            </div>
          </div>

          {/* Job Tags */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="bg-surface-container dark:bg-surface-container-low px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              {job.type}
            </span>
            <span className="bg-secondary-container/40 dark:bg-primary-container/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-primary dark:text-primary-fixed">
              AI Match: {job.matchRate}%
            </span>
            {job.easyApply && (
              <span className="bg-primary/10 dark:bg-primary-fixed/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-primary dark:text-primary-fixed">
                Easy Apply
              </span>
            )}
            <span className="bg-surface-container dark:bg-surface-container-low px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              {job.workMode}
            </span>
          </div>

          {/* AI Match Explanation Drawer */}
          {showAIExplanation && job.aiMatchExplanation && (
            <div className="mt-3 p-3 bg-primary/5 dark:bg-primary-fixed/5 rounded-xl border border-primary/10 text-xs text-left space-y-2 animate-fade-in">
              <p className="font-semibold text-primary dark:text-primary-fixed flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">auto_awesome</span> AI Matching Details
              </p>
              <p className="text-on-surface-variant leading-relaxed">
                {job.aiMatchExplanation}
              </p>
              {job.skillsMatchSummary && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {job.skillsMatchSummary.map(skill => (
                    <span key={skill} className="bg-white dark:bg-surface-container border border-primary/10 px-2 py-0.5 rounded text-[10px] font-medium text-on-surface-variant">
                      ✓ {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="flex gap-2">
        <Button 
          className="flex-grow py-2 text-xs" 
          size="sm"
          onClick={handleApply}
          disabled={hasApplied}
          isLoading={isApplying}
        >
          {hasApplied ? 'Applied' : 'Apply Now'}
        </Button>
        <Button 
          variant="secondary" 
          className="flex-grow py-2 text-primary text-xs" 
          size="sm"
          onClick={() => navigate(`/student/jobs/${job.id}`)}
        >
          View Details
        </Button>
        {job.aiMatchExplanation && (
          <Button 
            variant="ghost" 
            className="px-3 py-2 text-on-surface-variant hover:text-primary text-xs" 
            size="sm"
            onClick={() => setShowAIExplanation(!showAIExplanation)}
          >
            <span className="material-symbols-outlined text-[18px]">
              {showAIExplanation ? 'keyboard_arrow_up' : 'auto_awesome'}
            </span>
          </Button>
        )}
      </div>
    </Card>
  );
};

export default JobCard;
