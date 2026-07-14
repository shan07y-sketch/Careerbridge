import React from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  className?: string;
  iconClassName?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  className = '',
  iconClassName = '',
  disabled,
  ...props
}) => {
  return (
    <button
      className={`p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${className}`}
      disabled={disabled}
      {...props}
    >
      <span className={`material-symbols-outlined text-lg ${iconClassName}`}>{icon}</span>
    </button>
  );
};
export default IconButton;
