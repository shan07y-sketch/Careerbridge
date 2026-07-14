import React from 'react';
import DashboardCard from './DashboardCard';

interface RecruiterCardProps {
  name: string;
  title: string;
  avatar: string;
  email: string;
  rolesCount: number;
  onContactClick?: () => void;
  className?: string;
}

export const RecruiterCard: React.FC<RecruiterCardProps> = ({
  name,
  title,
  avatar,
  email,
  rolesCount,
  onContactClick,
  className = '',
}) => {
  return (
    <DashboardCard className={`flex flex-col items-center text-center p-6 hover:-translate-y-1 transition-all duration-300 ${className}`}>
      <img
        alt={name}
        className="w-16 h-16 rounded-full object-cover mb-4 ring-2 ring-primary/10"
        src={avatar}
      />
      <h4 className="font-bold text-sm text-primary mb-0.5">{name}</h4>
      <p className="text-xs text-on-surface-variant font-medium mb-3">{title}</p>
      <div className="w-full bg-surface-container-low p-2 rounded-xl text-[10px] uppercase font-bold text-on-surface-variant mb-4">
        <span>Managing {rolesCount} Open Roles</span>
      </div>
      <p className="text-xs text-on-surface-variant font-medium mb-4 truncate w-full">{email}</p>
      {onContactClick && (
        <button
          onClick={onContactClick}
          className="w-full py-2 bg-primary text-white text-xs font-bold rounded-xl hover:opacity-95 transition-all cursor-pointer"
        >
          Message Recruiter
        </button>
      )}
    </DashboardCard>
  );
};
export default RecruiterCard;
