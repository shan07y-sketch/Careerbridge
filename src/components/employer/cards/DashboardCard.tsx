import React from 'react';

interface DashboardCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  children,
  className = '',
  hoverable = true,
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded-3xl border border-primary/5 p-6 shadow-sm ${
        hoverable ? 'hover:shadow-md transition-all duration-300' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
export default DashboardCard;
