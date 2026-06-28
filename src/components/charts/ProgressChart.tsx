import React from 'react';

interface ProgressChartProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

export const ProgressChart: React.FC<ProgressChartProps> = ({
  percent,
  size = 120,
  strokeWidth = 8,
  label,
  className = '',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle
          className="text-surface-container dark:text-surface-container-high"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          className="text-primary-container dark:text-primary-fixed progress-ring__circle"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%',
            transition: 'stroke-dashoffset 0.5s ease-in-out',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-headline-md font-bold text-primary dark:text-primary-fixed">{percent}%</span>
        {label && <span className="text-[10px] text-on-surface-variant font-bold uppercase mt-0.5">{label}</span>}
      </div>
    </div>
  );
};
export default ProgressChart;
