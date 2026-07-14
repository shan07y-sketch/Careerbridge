import React from 'react';

interface AIInsightCardProps {
  priority: 'High' | 'Medium' | 'Low';
  confidence: string;
  title: string;
  reason: string;
  buttonText?: string;
  onButtonClick?: () => void;
  className?: string;
}

export const AIInsightCard: React.FC<AIInsightCardProps> = ({
  priority,
  confidence,
  title,
  reason,
  buttonText,
  onButtonClick,
  className = '',
}) => {
  const priorityColor = {
    High: 'bg-error/20 text-white border-white/20',
    Medium: 'bg-secondary-container/20 text-white border-white/20',
    Low: 'bg-primary-fixed/20 text-white border-white/20'
  };

  return (
    <div className={`p-4 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-sm group/card hover:bg-white/15 transition-all text-left ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-bold text-primary-fixed uppercase tracking-widest">{title}</h4>
          <span className={`px-2 py-0.5 text-[9px] font-bold rounded border ${priorityColor[priority]}`}>
            {priority} Priority
          </span>
        </div>
        <span className="text-[10px] bg-primary-fixed text-on-primary-fixed px-2 py-0.5 rounded-full font-bold">
          {confidence} Conf.
        </span>
      </div>
      <p className="text-sm opacity-90 leading-relaxed mb-3 text-white">
        <span className="font-bold text-white">Reason:</span> {reason}
      </p>
      {buttonText && onButtonClick && (
        <button
          type="button"
          onClick={onButtonClick}
          className="w-full py-2 bg-primary-fixed text-on-primary-fixed text-xs font-bold rounded-lg hover:brightness-110 transition-all cursor-pointer"
        >
          {buttonText}
        </button>
      )}
    </div>
  );
};
export default AIInsightCard;
