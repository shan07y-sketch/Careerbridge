import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Application } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface ApplicationCardProps {
  application: Application;
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({ application }) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const statuses = {
    applied: { label: 'Applied', color: 'bg-primary-container/10 text-primary dark:text-primary-fixed', width: '33%' },
    interviewing: { label: 'Interviewing', color: 'bg-secondary-container text-primary dark:text-primary-fixed', width: '66%' },
    offer: { label: 'Offer Received', color: 'bg-green-100 text-green-700', width: '100%' },
    rejected: { label: 'Rejected', color: 'bg-error-container/20 text-error', width: '100%' }
  };

  const currentStatus = statuses[application.status];

  return (
    <Card hoverable className="flex flex-col gap-4">
      <div className="flex items-start gap-4">
        {/* Company Logo */}
        <div className="w-14 h-14 bg-surface-container dark:bg-surface-container-high rounded-xl flex items-center justify-center overflow-hidden shrink-0">
          <img className="w-8 h-8 object-contain" alt={application.companyName} src={application.companyLogo} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2 mb-2">
            <div>
              <h4 className="font-bold text-body-lg text-primary dark:text-primary-fixed truncate">
                {application.jobTitle}
              </h4>
              <p className="text-on-surface-variant font-label-md truncate">
                {application.companyName}
              </p>
              <p className="text-[10px] text-on-surface-variant/70 mt-0.5">
                Applied on: {application.dateApplied}
              </p>
            </div>

            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${currentStatus.color}`}>
              {currentStatus.label}
            </span>
          </div>

          {/* Visual timeline bar */}
          <div className="space-y-1 mt-4">
            <div className="flex justify-between text-[9px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
              <span>Applied</span>
              <span>Interview</span>
              <span>Decision</span>
            </div>
            <div className="h-2 w-full bg-surface-container dark:bg-surface-container-low rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  application.status === 'rejected' ? 'bg-error' : 'bg-primary'
                }`}
                style={{ width: currentStatus.width }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Hiring Drawer */}
      {isExpanded && (
        <div className="border-t border-primary/5 pt-4 space-y-4 text-left animate-fade-in">
          {/* Recruiter Assigned & Application Score */}
          <div className="flex justify-between items-center gap-4 text-xs">
            {application.recruiterName && (
              <div className="flex items-center gap-2">
                <img 
                  src={application.recruiterAvatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDdHqAlh7hSx2-wTQEWiGk3qvrGIaN6skh1V09HnEi-7MPasJrX1sN-h55M__i29klAryXx8yvPOqSnJccXzxOJIHshryi7YUL1pHCLP1eYp6oQWY33FTG_vaj-vU567uolKQxQURAGO6-ntV_IpCE7blc3nO0x-t4FwCmog1kiCHjqkxxCGMv6maWybbNYM5eql_uMGenJdwwtN9dzyXFdT_veXoX_Mbf6DRsu6dDvcxYEWL2YV5Boyd2p9RJkn_s6fK3IRrmoD-Y'} 
                  alt={application.recruiterName} 
                  className="w-8 h-8 rounded-full object-cover border" 
                />
                <div>
                  <p className="font-bold text-primary dark:text-primary-fixed">{application.recruiterName}</p>
                  <p className="text-[10px] text-on-surface-variant">Assigned Recruiter</p>
                </div>
              </div>
            )}
            
            <div className="text-right">
              <p className="font-bold text-primary dark:text-primary-fixed">{application.applicationScore || 90}%</p>
              <p className="text-[10px] text-on-surface-variant">Application Score</p>
            </div>
          </div>

          {/* Timeline Process Flow */}
          {application.timeline && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-primary dark:text-primary-fixed uppercase tracking-wider">Hiring Pipeline</p>
              <div className="space-y-3 border-l border-primary/10 pl-3.5 ml-1.5">
                {application.timeline.map((step, idx) => (
                  <div key={idx} className="relative">
                    <div className={`absolute -left-[19.5px] top-1 w-2.5 h-2.5 rounded-full border-2 ${
                      step.active ? 'bg-primary border-primary' : 'bg-surface-container border-primary/30'
                    }`} />
                    <div className="text-xs">
                      <p className={`font-bold ${step.active ? 'text-primary dark:text-primary-fixed' : 'text-on-surface-variant'}`}>
                        {step.stage} <span className="font-normal text-[10px] opacity-60">• {step.date}</span>
                      </p>
                      <p className="text-[10px] text-on-surface-variant/80 mt-0.5">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expected Response & Next action */}
          {(application.requiredAction || application.expectedResponseDate) && (
            <div className="p-3 bg-surface-container dark:bg-surface-container-low rounded-xl text-xs space-y-2">
              {application.requiredAction && (
                <p className="text-on-surface leading-relaxed">
                  <span className="font-bold text-primary">Required Action:</span> {application.requiredAction}
                </p>
              )}
              {application.expectedResponseDate && (
                <p className="text-on-surface-variant text-[11px]">
                  <span className="font-semibold text-primary">Expected Response:</span> {application.expectedResponseDate}
                </p>
              )}
              {application.missingDocuments && application.missingDocuments.length > 0 && (
                <div className="text-[11px] text-error flex items-center gap-1 font-bold pt-1">
                  <span className="material-symbols-outlined text-[14px]">warning</span>
                  <span>Missing document: {application.missingDocuments.join(', ')}</span>
                </div>
              )}
            </div>
          )}

          {/* Activity Log list */}
          {application.activityLog && (
            <div className="space-y-1.5 text-[10px] text-on-surface-variant/70 border-t border-primary/5 pt-3">
              <p className="font-bold text-primary dark:text-primary-fixed uppercase tracking-wider mb-1">Activity Log</p>
              {application.activityLog.map((log, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{log.action}</span>
                  <span>{log.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CTA Buttons bar */}
      <div className="flex gap-2">
        <Button 
          variant="secondary" 
          className="flex-1 py-1.5 text-primary text-xs" 
          size="sm"
          onClick={() => navigate(`/student/jobs/${application.jobId}`)}
        >
          Job Details
        </Button>
        {application.status === 'interviewing' && (
          <Button 
            className="flex-1 py-1.5 text-xs" 
            size="sm"
            onClick={() => navigate(`/student/interview/int_1`)}
          >
            Prep Portal
          </Button>
        )}
        <Button 
          variant="ghost" 
          className="flex-1 py-1.5 text-xs text-on-surface-variant hover:text-primary" 
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="material-symbols-outlined text-[16px] mr-1">
            {isExpanded ? 'expand_less' : 'expand_more'}
          </span>
          {isExpanded ? 'Less Info' : 'Hiring Details'}
        </Button>
      </div>
    </Card>
  );
};

export default ApplicationCard;
