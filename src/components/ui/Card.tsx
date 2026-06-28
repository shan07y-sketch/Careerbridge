import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverable = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`bg-white dark:bg-surface-container-lowest p-6 rounded-[16px] border border-primary/5 shadow-[0_4px_20px_rgba(2,54,41,0.04)] transition-all duration-300 ${
        hoverable ? 'hover:border-primary/20 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(2,54,41,0.06)]' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
