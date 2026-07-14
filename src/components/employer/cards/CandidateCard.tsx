import React from 'react';
import DashboardCard from './DashboardCard';

interface CandidateCardProps {
  candidate: {
    id: string;
    name: string;
    university: string;
    location: string;
    matchRate: number;
    avatar: string;
    salary: string;
    score: number;
    skills: string[];
    status: string;
  };
  onMessageClick: () => void;
  onResumeClick: () => void;
  onClick?: () => void;
  className?: string;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  onMessageClick,
  onResumeClick,
  onClick,
  className = '',
}) => {
  return (
    <DashboardCard 
      onClick={onClick}
      className={`flex flex-col hover:-translate-y-1 transition-all duration-300 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-bold rounded-md">
          {candidate.matchRate >= 90 ? 'Top Match' : 'Recently Applied'}
        </span>
        <span className="px-2 py-0.5 bg-surface-container-low text-on-surface-variant text-[9px] font-bold rounded-md">
          {candidate.status}
        </span>
      </div>
      <div className="relative self-center mb-4 mt-2">
        <img
          alt={candidate.name}
          className="w-16 h-16 rounded-full object-cover ring-4 ring-primary/5"
          src={candidate.avatar}
        />
        <div className="absolute -bottom-1 -right-1 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-white">
          {candidate.matchRate}%
        </div>
      </div>
      <div className="text-center mb-4">
        <h4 className="font-bold text-sm text-on-background">{candidate.name}</h4>
        <p className="text-[10px] text-on-surface-variant mb-2">{candidate.university} · {candidate.location}</p>
        <div className="grid grid-cols-2 gap-2 text-[9px] uppercase font-bold text-on-surface-variant bg-surface-container-low/50 p-2 rounded-xl mb-3">
          <div className="text-left border-r border-outline-variant/30 pr-1">
            <p className="opacity-60 text-[8px] mb-0.5">Salary</p>
            <p className="text-primary font-extrabold">{candidate.salary}</p>
          </div>
          <div className="text-left pl-1">
            <p className="opacity-60 text-[8px] mb-0.5">ATS Score</p>
            <p className="text-primary font-extrabold">{candidate.score}/10</p>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-1">
          {candidate.skills.slice(0, 3).map(skill => (
            <span key={skill} className="px-2 py-0.5 bg-secondary-container/50 text-on-secondary-container text-[9px] rounded-md font-bold">
              {skill}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-auto grid grid-cols-2 gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); onMessageClick(); }}
          className="py-2 bg-primary text-white text-[10px] font-bold rounded-xl hover:opacity-95 transition-all cursor-pointer"
        >
          Message
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onResumeClick(); }}
          className="py-2 border border-outline-variant text-on-surface-variant text-[10px] font-bold rounded-xl hover:bg-surface-container-low transition-all cursor-pointer"
        >
          Resume
        </button>
      </div>
    </DashboardCard>
  );
};
export default CandidateCard;
