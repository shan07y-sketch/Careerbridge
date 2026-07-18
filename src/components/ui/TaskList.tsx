import React from 'react';

export interface TaskItem {
  id: string;
  label: string;
  hint?: string;
  icon: string;
  done?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * "What should I do next?" — a checklist of pending actions. Completed items
 * read as reassurance; open items each carry a one-tap action.
 */
export const TaskList: React.FC<{ tasks: TaskItem[] }> = ({ tasks }) => (
  <ul className="space-y-2.5">
    {tasks.map((t) => (
      <li key={t.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
        t.done ? 'border-transparent bg-surface-container/50' : 'border-outline-variant/70 bg-surface-container-lowest hover:border-primary/30'
      }`}>
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
          t.done ? 'bg-success-container text-on-success-container' : 'bg-secondary-container text-on-secondary-container'
        }`}>
          <span className="material-symbols-outlined text-[20px]" style={t.done ? { fontVariationSettings: "'FILL' 1" } : undefined}>
            {t.done ? 'check_circle' : t.icon}
          </span>
        </span>
        <div className="flex-1 min-w-0">
          <p className={`text-label-md font-semibold ${t.done ? 'text-on-surface-variant line-through' : 'text-on-surface'}`}>{t.label}</p>
          {t.hint && !t.done && <p className="text-[12px] text-on-surface-variant truncate">{t.hint}</p>}
        </div>
        {!t.done && t.actionLabel && t.onAction && (
          <button onClick={t.onAction} className="shrink-0 text-label-sm font-semibold text-primary hover:underline whitespace-nowrap">
            {t.actionLabel}
          </button>
        )}
      </li>
    ))}
  </ul>
);
