/**
 * Sheet — minimal bottom sheet used for menus, confirmations and pickers.
 * Native-feeling replacement for desktop modals on touch devices.
 */
import React, { useEffect } from 'react';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const Sheet: React.FC<SheetProps> = ({ open, onClose, title, children }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title || 'Menu'}>
      <div className="absolute inset-0 bg-on-surface/40" onClick={onClose} />
      <div className="m-sheet absolute bottom-0 inset-x-0 bg-surface-container-lowest rounded-t-3xl px-4 pt-2 m-safe-bottom max-h-[85vh] overflow-y-auto">
        <div className="w-10 h-1 rounded-full bg-on-surface/20 mx-auto my-2.5" aria-hidden="true" />
        {title && <h2 className="text-base font-bold text-on-surface px-1 pb-3">{title}</h2>}
        {children}
      </div>
    </div>
  );
};
