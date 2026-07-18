import React from 'react';

interface SectionProps {
  /** Section heading — establishes hierarchy below the page header. */
  title?: string;
  description?: string;
  /** Right-aligned actions (e.g. "View all", filters). */
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * A titled content section. Provides the consistent vertical rhythm and a
 * quiet, secondary heading so pages read as a hierarchy of sections rather
 * than a flat wall of cards.
 */
export const Section: React.FC<SectionProps> = ({ title, description, action, children, className = '' }) => (
  <section className={className}>
    {(title || action) && (
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          {title && <h2 className="text-headline-md font-semibold text-on-surface tracking-tight">{title}</h2>}
          {description && <p className="text-label-md text-on-surface-variant mt-0.5">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    )}
    {children}
  </section>
);

/** A subtle "View all →" text link used as a Section action. */
export const ViewAll: React.FC<{ onClick?: () => void; label?: string }> = ({ onClick, label = 'View all' }) => (
  <button onClick={onClick} className="inline-flex items-center gap-1 text-label-md font-semibold text-primary hover:gap-2 transition-all">
    {label}<span className="material-symbols-outlined text-[18px]">arrow_forward</span>
  </button>
);
