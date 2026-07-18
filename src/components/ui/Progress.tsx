import React from 'react';

/** Slim labelled progress bar used inside cards (profile strength, funnels). */
export const ProgressBar: React.FC<{ value: number; tone?: string; className?: string }> = ({ value, tone = 'bg-primary', className = '' }) => (
  <div className={`w-full h-2 bg-surface-container-high rounded-full overflow-hidden ${className}`}>
    <div className={`h-full rounded-full progress-bar-fill ${tone}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
  </div>
);

/** Compact SVG progress ring for profile strength / scores. */
export const ProgressRing: React.FC<{ value: number; size?: number; stroke?: number; label?: string }> = ({
  value, size = 64, stroke = 6, label,
}) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (Math.max(0, Math.min(100, value)) / 100) * c;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="stroke-surface-container-high" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="stroke-primary" fill="none"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.65,0,0.35,1)' }} />
      </svg>
      <span className="absolute text-label-md font-bold text-on-surface">{label ?? `${Math.round(value)}%`}</span>
    </div>
  );
};
