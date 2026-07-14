import React from 'react';

interface SecondaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'outline' | 'tonal';
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  children,
  leftIcon,
  rightIcon,
  variant = 'outline',
  className = '',
  disabled,
  ...props
}) => {
  const variantClass =
    variant === 'outline'
      ? 'border border-outline-variant/60 text-on-surface-variant hover:bg-surface-container-low'
      : 'bg-secondary-container/50 text-on-secondary-container hover:bg-secondary-container/75';

  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl font-bold text-xs active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${variantClass} ${className}`}
      disabled={disabled}
      {...props}
    >
      {leftIcon && <span className="flex items-center">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="flex items-center">{rightIcon}</span>}
    </button>
  );
};
export default SecondaryButton;
