import React from 'react';

interface Crumb {
  label: string;
  onClick?: () => void;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Crumb[];
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Shared page header -- every portal page starts with this block:
 * optional breadcrumbs, a strong title, muted description, right-side actions.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, breadcrumbs, actions, className = '' }) => (
  <header className={`mb-8 animate-rise-in ${className}`}>
    {breadcrumbs && breadcrumbs.length > 0 && (
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-label-sm text-on-surface-variant mb-2">
        {breadcrumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="material-symbols-outlined text-[14px]">chevron_right</span>}
            {c.onClick ? (
              <button onClick={c.onClick} className="hover:text-primary transition-colors">{c.label}</button>
            ) : (
              <span className="text-on-surface font-medium">{c.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>
    )}
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-headline-lg font-bold text-on-surface tracking-tight">{title}</h1>
        {description && <p className="text-body-md text-on-surface-variant mt-1 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  </header>
);
