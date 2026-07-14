import React from 'react';
import DashboardCard from './DashboardCard';

interface MetricCardProps {
  icon: string;
  title: string;
  value: string | number;
  trendText: string;
  subtext: string;
  trendUp?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  title,
  value,
  trendText,
  subtext,
  children,
  className = '',
}) => {
  return (
    <DashboardCard className={`hover:-translate-y-1 transition-all group relative overflow-hidden ${className}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <div className="text-right">
          <span className="text-primary font-bold text-[10px] bg-primary-fixed px-2.5 py-0.5 rounded-full whitespace-nowrap">
            {trendText}
          </span>
        </div>
      </div>
      <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-1 text-left">{title}</p>
      <h3 className="text-3xl font-extrabold text-primary mb-1 text-left">{value}</h3>
      <p className="text-[10px] text-on-surface-variant text-left">{subtext}</p>
      {children && <div className="mt-4">{children}</div>}
    </DashboardCard>
  );
};
export default MetricCard;
