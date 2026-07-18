import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'error' | 'outline' | 'success' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Shared Button -- the single button used across all four portals.
 * primary   solid indigo, main CTA (ideally one per view)
 * secondary tonal indigo chip, supporting actions
 * outline   bordered neutral, secondary CTAs on white cards
 * ghost     borderless, toolbars and table row actions
 * error     destructive confirmation
 * success   confirm/approve flows
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyle =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 active:scale-[0.98] outline-none focus-visible:shadow-focus-brand disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 select-none';

  const variants = {
    primary: 'bg-primary text-on-primary hover:bg-[#0e332d] shadow-card',
    secondary: 'bg-secondary-container text-on-secondary-container hover:bg-primary-container',
    outline: 'bg-surface-container-lowest text-on-surface border border-outline-variant hover:border-primary/40 hover:text-primary',
    ghost: 'bg-transparent text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
    error: 'bg-error text-on-error hover:bg-[#8f2e27] shadow-card',
    success: 'bg-success text-on-success hover:bg-[#155f41] shadow-card',
    // Bronze accent — reserved for rare premium/trust CTAs (verification etc.)
    accent: 'bg-tertiary text-on-tertiary hover:bg-[#836436] shadow-card'
  };

  const sizes = {
    sm: 'px-3.5 py-2 text-label-sm rounded-lg gap-1.5',
    md: 'px-5 py-2.5 text-label-md gap-2',
    lg: 'px-7 py-3.5 text-body-md font-semibold rounded-2xl gap-2'
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {!isLoading && leftIcon && <span className="flex items-center">{leftIcon}</span>}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="flex items-center">{rightIcon}</span>}
    </button>
  );
};
