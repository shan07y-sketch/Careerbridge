import React from 'react';

interface SkeletonProps {
  variant?: 'text' | 'circle' | 'rect';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rect',
  width,
  height,
  className = '',
}) => {
  const styles: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  const baseClass = 'animate-pulse bg-surface-container-high dark:bg-surface-container';
  
  const variantClasses = {
    text: 'h-4 w-full rounded',
    circle: 'rounded-full',
    rect: 'rounded-[12px]'
  };

  return (
    <div
      className={`${baseClass} ${variantClasses[variant]} ${className}`}
      style={styles}
    />
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-surface-container-lowest p-6 rounded-[16px] border border-primary/5 shadow-sm space-y-4">
      <div className="flex gap-4 items-center">
        <Skeleton variant="circle" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
      <Skeleton variant="rect" height={80} />
      <div className="flex gap-2">
        <Skeleton variant="rect" height={36} className="flex-1" />
        <Skeleton variant="rect" height={36} className="flex-1" />
      </div>
    </div>
  );
};
