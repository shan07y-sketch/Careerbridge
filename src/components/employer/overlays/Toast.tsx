import React from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
  const bgColors = {
    success: 'bg-primary-fixed/30 text-primary border-primary-fixed/40',
    error: 'bg-error-container text-on-error-container border-error/10',
    warning: 'bg-secondary-container/60 text-secondary border-secondary-container/70',
    info: 'bg-surface-container text-on-surface-variant border-outline-variant/20',
  };

  const icons = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info',
  };

  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border shadow-lg ${bgColors[type]} animate-slide-up`}>
      <span className="material-symbols-outlined text-lg">{icons[type]}</span>
      <p className="text-xs font-semibold flex-1 text-left">{message}</p>
      {onClose && (
        <button onClick={onClose} className="hover:opacity-70 transition-opacity cursor-pointer">
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      )}
    </div>
  );
};
export default Toast;
