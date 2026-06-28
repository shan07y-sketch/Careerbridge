import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Mentor } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface MentorCardProps {
  mentor: Mentor;
}

export const MentorCard: React.FC<MentorCardProps> = ({ mentor }) => {
  const navigate = useNavigate();

  return (
    <Card hoverable className="flex flex-col h-full justify-between">
      <div>
        {/* Mentor profile */}
        <div className="flex items-center gap-4 mb-4">
          <img
            className="w-14 h-14 rounded-full border-2 border-primary-fixed object-cover"
            alt={mentor.name}
            src={mentor.avatar}
          />
          <div>
            <h4 className="font-bold text-body-lg text-primary dark:text-primary-fixed">{mentor.name}</h4>
            <p className="text-on-surface-variant font-label-md leading-tight">
              {mentor.role} • <span className="font-semibold">{mentor.companyName}</span>
            </p>
            <div className="flex items-center gap-1 mt-1 text-xs text-on-surface-variant/70">
              <span className="material-symbols-outlined text-[14px] fill-1 text-primary">star</span>
              <span className="font-bold text-primary">{mentor.rating}</span>
              <span>({mentor.reviewsCount} reviews)</span>
            </div>
          </div>
        </div>

        {/* Bio */}
        <p className="text-sm text-on-surface-variant line-clamp-3 mb-4 leading-relaxed">
          {mentor.bio}
        </p>

        {/* Expertise tags */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {mentor.expertise.map((exp) => (
            <span
              key={exp}
              className="bg-secondary-container/40 dark:bg-primary-container/20 text-primary dark:text-primary-fixed px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
            >
              {exp}
            </span>
          ))}
        </div>
      </div>

      <Button
        variant="secondary"
        className="w-full py-2 text-primary"
        size="sm"
        onClick={() => navigate(`/student/mentor/${mentor.id}`)}
      >
        Book Session
      </Button>
    </Card>
  );
};
export default MentorCard;
