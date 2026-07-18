import React from 'react';

interface AttentionCardProps {
  icon?: string;
  title: string;
  description?: string;
  tone?: 'brand' | 'warning' | 'info';
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
}

const tones = {
  brand: 'brand-wash text-on-primary',
  warning: 'bg-warning-container text-on-warning-container',
  info: 'bg-info-container text-on-info-container',
};

/**
 * The single focal banner at the top of the middle zone — "what requires my
 * attention right now?" Used sparingly (one per page) to preserve hierarchy.
 */
export const AttentionCard: React.FC<AttentionCardProps> = ({
  icon = 'priority_high', title, description, tone = 'brand', actionLabel, onAction, onDismiss,
}) => {
  const onBrand = tone === 'brand';
  return (
    <div className={`relative rounded-2xl p-5 md:p-6 flex flex-wrap items-center gap-5 shadow-card overflow-hidden ${tones[tone]}`}>
      <span className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${onBrand ? 'bg-white/15' : 'bg-white/50'}`}>
        <span className="material-symbols-outlined text-[26px]">{icon}</span>
      </span>
      <div className="flex-1 min-w-[200px]">
        <h3 className="text-body-lg font-semibold">{title}</h3>
        {description && <p className={`text-label-md mt-0.5 ${onBrand ? 'text-white/80' : 'opacity-80'}`}>{description}</p>}
      </div>
      {actionLabel && onAction && (
        <button onClick={onAction}
          className={`shrink-0 px-5 py-2.5 rounded-xl font-semibold text-label-md transition-all active:scale-[0.98] ${
            onBrand ? 'bg-white text-primary hover:bg-white/90' : 'bg-on-surface text-surface hover:opacity-90'
          }`}>
          {actionLabel}
        </button>
      )}
      {onDismiss && (
        <button onClick={onDismiss} className={`absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center ${onBrand ? 'text-white/70 hover:bg-white/10' : 'hover:bg-white/40'}`}>
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      )}
    </div>
  );
};
