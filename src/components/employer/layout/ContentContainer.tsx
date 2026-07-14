import React from 'react';

interface ContentContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const ContentContainer: React.FC<ContentContainerProps> = ({ children, className = '' }) => {
  return (
    <div className={`px-10 py-8 max-w-7xl w-full mx-auto space-y-8 flex-grow ${className}`}>
      {children}
    </div>
  );
};
export default ContentContainer;
