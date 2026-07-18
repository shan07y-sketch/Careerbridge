/**
 * Minimal mobile UI primitives. Presentation only — zero business logic.
 */
import React, { useRef, useState } from 'react';

/* ── Card ─────────────────────────────────────────────────────────── */

export const Card: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}> = ({ children, onClick, className = '' }) => {
  const cls = `m-card p-4 ${onClick ? 'm-press w-full text-left' : ''} ${className}`;
  if (onClick) {
    return <button onClick={onClick} className={cls}>{children}</button>;
  }
  return <div className={cls}>{children}</div>;
};

/* ── Stat pill ────────────────────────────────────────────────────── */

export const Stat: React.FC<{ icon: string; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
  <div className="m-card p-3 flex flex-col gap-1">
    <span className="material-symbols-outlined text-[20px] text-primary">{icon}</span>
    <span className="text-xl font-bold text-on-surface leading-none">{value}</span>
    <span className="text-[11px] text-on-surface-variant leading-tight">{label}</span>
  </div>
);

/* ── Section heading ──────────────────────────────────────────────── */

export const SectionTitle: React.FC<{ children: React.ReactNode; action?: React.ReactNode }> = ({ children, action }) => (
  <div className="flex items-center justify-between px-1 pt-5 pb-2">
    <h2 className="text-sm font-bold text-on-surface">{children}</h2>
    {action}
  </div>
);

/* ── Chip ─────────────────────────────────────────────────────────── */

export const Chip: React.FC<{
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  tone?: 'neutral' | 'success' | 'warning' | 'error' | 'info';
}> = ({ children, selected, onClick, tone = 'neutral' }) => {
  const tones: Record<string, string> = {
    neutral: selected ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant',
    success: 'bg-success-container text-on-success-container',
    warning: 'bg-warning-container text-on-warning-container',
    error: 'bg-error-container text-on-error-container',
    info: 'bg-info-container text-on-info-container',
  };
  const cls = `inline-flex items-center gap-1 px-3 h-8 rounded-full text-xs font-semibold whitespace-nowrap ${tones[tone]}`;
  if (onClick) return <button onClick={onClick} className={`m-press ${cls}`}>{children}</button>;
  return <span className={cls}>{children}</span>;
};

/* ── Skeleton loading ─────────────────────────────────────────────── */

export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-20' }) => (
  <div className={`m-skeleton ${className}`} aria-hidden="true" />
);

export const SkeletonList: React.FC<{ count?: number; itemClass?: string }> = ({ count = 4, itemClass = 'h-20' }) => (
  <div className="space-y-3 px-4 pt-4" role="status" aria-label="Loading">
    {Array.from({ length: count }, (_, i) => <Skeleton key={i} className={itemClass} />)}
  </div>
);

/* ── Empty & error states ─────────────────────────────────────────── */

export const EmptyState: React.FC<{ icon: string; title: string; hint?: string; action?: React.ReactNode }> = ({ icon, title, hint, action }) => (
  <div className="flex flex-col items-center text-center px-8 py-14">
    <span className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center mb-3">
      <span className="material-symbols-outlined text-[28px] text-on-surface-variant">{icon}</span>
    </span>
    <p className="font-bold text-on-surface text-sm">{title}</p>
    {hint && <p className="text-xs text-on-surface-variant mt-1 max-w-[260px]">{hint}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const ErrorState: React.FC<{ message?: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div className="flex flex-col items-center text-center px-8 py-14">
    <span className="w-14 h-14 rounded-full bg-error-container flex items-center justify-center mb-3">
      <span className="material-symbols-outlined text-[28px] text-on-error-container">wifi_off</span>
    </span>
    <p className="font-bold text-on-surface text-sm">Couldn't load this screen</p>
    <p className="text-xs text-on-surface-variant mt-1 max-w-[280px]">{message || 'Check your connection and try again.'}</p>
    {onRetry && (
      <button onClick={onRetry} className="m-press mt-4 h-11 px-6 rounded-full bg-primary text-on-primary text-sm font-semibold">
        Retry
      </button>
    )}
  </div>
);

/* ── Primary / secondary buttons ──────────────────────────────────── */

export const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'tonal' | 'outline' | 'danger';
  disabled?: boolean;
  full?: boolean;
  icon?: string;
}> = ({ children, onClick, variant = 'primary', disabled, full, icon }) => {
  const variants: Record<string, string> = {
    primary: 'bg-primary text-on-primary',
    tonal: 'bg-primary-container text-on-primary-container',
    outline: 'border border-on-surface/20 text-on-surface',
    danger: 'bg-error-container text-on-error-container',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`m-press h-12 px-5 rounded-full text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-40 ${variants[variant]} ${full ? 'w-full' : ''}`}
    >
      {icon && <span className="material-symbols-outlined text-[20px]">{icon}</span>}
      {children}
    </button>
  );
};

/* ── Segmented control ────────────────────────────────────────────── */

export function Segmented<T extends string>({ options, value, onChange }: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 p-1 bg-surface-container rounded-full" role="tablist">
      {options.map(o => (
        <button
          key={o.value}
          role="tab"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          className={`flex-1 h-9 rounded-full text-xs font-semibold transition-colors ${
            o.value === value ? 'bg-surface-container-lowest text-primary shadow-card' : 'text-on-surface-variant'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ── Score ring (reports / dashboards) ────────────────────────────── */

export const ScoreRing: React.FC<{ score: number; size?: number; label?: string }> = ({ score, size = 120, label }) => {
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const offset = c - (clamped / 100) * c;
  const tone = clamped >= 70 ? 'text-success' : clamped >= 45 ? 'text-warning' : 'text-error';
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }} role="img" aria-label={`Score ${clamped} out of 100`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={8} className="stroke-surface-container-high" fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r} strokeWidth={8} fill="none" strokeLinecap="round"
          className={`m-ring-animated ${tone}`} stroke="currentColor"
          strokeDasharray={c}
          style={{ ['--ring-c' as string]: `${c}`, ['--ring-o' as string]: `${offset}` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-extrabold text-on-surface leading-none">{clamped}</span>
        {label && <span className="text-[10px] text-on-surface-variant mt-0.5">{label}</span>}
      </div>
    </div>
  );
};

/* ── Linear progress bar ──────────────────────────────────────────── */

export const Progress: React.FC<{ value: number; tone?: 'primary' | 'success' | 'warning' | 'error' }> = ({ value, tone = 'primary' }) => {
  const tones = { primary: 'bg-primary', success: 'bg-success', warning: 'bg-warning', error: 'bg-error' };
  return (
    <div className="h-1.5 rounded-full bg-surface-container-high overflow-hidden" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full transition-all duration-500 ${tones[tone]}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
};

/* ── Expandable section ───────────────────────────────────────────── */

export const Expandable: React.FC<{ title: React.ReactNode; subtitle?: string; children: React.ReactNode }> = ({ title, subtitle, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="m-card overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="m-press w-full flex items-center gap-3 p-4 text-left" aria-expanded={open}>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-on-surface">{title}</div>
          {subtitle && <div className="text-xs text-on-surface-variant truncate">{subtitle}</div>}
        </div>
        <span className={`material-symbols-outlined text-on-surface-variant transition-transform ${open ? 'rotate-180' : ''}`}>expand_more</span>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
};

/* ── Pull to refresh ──────────────────────────────────────────────── */

export const PullToRefresh: React.FC<{ onRefresh: () => Promise<void>; children: React.ReactNode }> = ({ onRefresh, children }) => {
  const startY = useRef<number | null>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY <= 0 && !refreshing) startY.current = e.touches[0].clientY;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0 && window.scrollY <= 0) setPull(Math.min(dy * 0.4, 70));
  };
  const onTouchEnd = async () => {
    const shouldRefresh = pull > 48;
    startY.current = null;
    setPull(0);
    if (shouldRefresh) {
      setRefreshing(true);
      try { await onRefresh(); } finally { setRefreshing(false); }
    }
  };

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      {(pull > 0 || refreshing) && (
        <div className="flex justify-center py-2" style={{ height: refreshing ? 40 : pull }} aria-hidden="true">
          <span className={`material-symbols-outlined text-primary ${refreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pull * 3}deg)` }}>
            progress_activity
          </span>
        </div>
      )}
      {children}
    </div>
  );
};

/* ── Avatar ───────────────────────────────────────────────────────── */

export const Avatar: React.FC<{ src?: string | null; name: string; size?: number }> = ({ src, name, size = 40 }) => {
  const initials = name.split(/\s+/).map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';
  return src ? (
    <img src={src} alt={name} width={size} height={size} className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />
  ) : (
    <span
      className="rounded-full bg-primary-container text-on-primary-container font-bold flex items-center justify-center shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
};
