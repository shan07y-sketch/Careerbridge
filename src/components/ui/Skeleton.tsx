import React from 'react';

interface SkeletonProps {
  variant?: 'text' | 'circle' | 'rect';
  width?: string | number;
  height?: string | number;
  className?: string;
}

/** Shimmer skeleton -- consistent loading treatment platform-wide. */
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

  const baseClass = 'skeleton-shimmer';

  const variantClasses = {
    text: 'h-4 w-full rounded-md',
    circle: 'rounded-full',
    rect: 'rounded-xl'
  };

  return (
    <div
      className={`${baseClass} ${variantClasses[variant]} ${className}`}
      style={styles}
      aria-hidden="true"
    />
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-card space-y-4">
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

/** Row skeleton for list/table loading states. */
export const RowSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <div className="space-y-3" role="status" aria-label="Loading">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-outline-variant/60">
        <Skeleton variant="circle" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="45%" />
          <Skeleton variant="text" width="28%" />
        </div>
        <Skeleton variant="rect" width={90} height={32} />
      </div>
    ))}
  </div>
);
