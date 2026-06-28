import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Recruiter } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface RecruiterCardProps {
  recruiter: Recruiter;
}

export const RecruiterCard: React.FC<RecruiterCardProps> = ({ recruiter }) => {
  const navigate = useNavigate();

  const handleMessage = () => {
    // Navigate to messages and select thread
    navigate('/student/messages');
  };

  return (
    <Card hoverable className="flex flex-col md:flex-row gap-6 items-start">
      <img
        className="w-20 h-20 rounded-full border-2 border-primary-fixed object-cover shrink-0"
        alt={recruiter.name}
        src={recruiter.avatar}
      />
      <div className="flex-1 space-y-3">
        <div>
          <h4 className="font-bold text-body-lg text-primary dark:text-primary-fixed">{recruiter.name}</h4>
          <p className="text-on-surface-variant font-label-md">
            Technical Recruiter at <span className="font-bold text-primary dark:text-primary-fixed hover:underline cursor-pointer" onClick={() => navigate(`/student/company/${recruiter.companyId}`)}>{recruiter.companyName}</span>
          </p>
        </div>
        
        <p className="text-sm text-on-surface-variant leading-relaxed">
          {recruiter.bio}
        </p>

        <div className="flex flex-wrap gap-4 text-xs text-on-surface-variant">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">mail</span>
            {recruiter.email}
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">phone</span>
            {recruiter.phone}
          </span>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            onClick={handleMessage}
            leftIcon={<span className="material-symbols-outlined text-[16px]">chat</span>}
          >
            Send Message
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/student/company/${recruiter.companyId}`)}
          >
            View Open Jobs
          </Button>
        </div>
      </div>
    </Card>
  );
};
export default RecruiterCard;
