import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface AdminDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  confirmVariant?: 'primary' | 'secondary' | 'ghost' | 'error';
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Thin admin-flavored wrapper around the shared ui/Modal + ui/Button, used
 * for every confirm/destructive/form dialog in the Admin Portal (suspend
 * user, verify company, edit feature flag, etc.) so those actions look and
 * behave consistently without re-deriving modal chrome per screen.
 */
export const AdminDialog: React.FC<AdminDialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  confirmVariant = 'primary',
  isLoading = false,
  size = 'sm',
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size={size}>
      <div className="space-y-5">
        {description && <p className="text-sm text-on-surface-variant leading-relaxed">{description}</p>}
        {children}
        {onConfirm && (
          <div className="flex justify-end gap-3 pt-1">
            <Button variant="ghost" onClick={onClose} disabled={isLoading}>{cancelLabel}</Button>
            <Button variant={confirmVariant} onClick={onConfirm} isLoading={isLoading}>{confirmLabel}</Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AdminDialog;
