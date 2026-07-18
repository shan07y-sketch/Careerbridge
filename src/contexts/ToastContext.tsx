import React, { createContext, useContext, useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastType, description?: string) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'success', description?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message, description }]);
    
    // Auto dismiss after 4 seconds
    setTimeout(() => {
      dismissToast(id);
    }, 4000);
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      
      {/* Toast Overlay Container */}
      <div className="fixed bottom-8 inset-x-4 sm:inset-x-auto sm:right-8 z-[9999] flex flex-col gap-3 sm:max-w-sm w-auto sm:w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-4 p-4 rounded-xl shadow-xl border glass-card animate-slide-up bg-white dark:bg-surface-container"
            style={{
              borderColor:
                toast.type === 'success'
                  ? 'rgba(2, 54, 41, 0.15)'
                  : toast.type === 'error'
                  ? 'rgba(186, 26, 26, 0.15)'
                  : 'rgba(101, 94, 76, 0.15)',
            }}
          >
            {/* Icon */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white ${
                toast.type === 'success'
                  ? 'bg-primary dark:bg-primary-container'
                  : toast.type === 'error'
                  ? 'bg-error'
                  : 'bg-secondary'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {toast.type === 'success' ? 'check' : toast.type === 'error' ? 'error' : 'info'}
              </span>
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-label-md text-primary dark:text-primary-fixed">{toast.message}</p>
              {toast.description && (
                <p className="text-label-sm text-on-surface-variant/80 mt-0.5 leading-tight">{toast.description}</p>
              )}
            </div>
            
            {/* Dismiss Button */}
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-on-surface-variant hover:text-primary transition-colors p-0.5"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};
