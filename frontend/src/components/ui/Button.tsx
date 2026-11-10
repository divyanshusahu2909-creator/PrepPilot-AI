import React from 'react';
import { clsx } from '../../utils/helpers';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-md font-semibold tracking-[-0.005em] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-base disabled:opacity-40 disabled:cursor-not-allowed active:translate-y-px';

  const variants = {
    primary:
      'bg-pine-500 text-paper shadow-paper hover:bg-pine-600 dark:bg-pine-400 dark:text-graphite-950 dark:hover:bg-pine-300',
    secondary:
      'border border-line bg-surface text-ink hover:border-graphite-300 hover:bg-surface-2 dark:hover:border-graphite-600',
    danger: 'bg-red-700 text-white hover:bg-red-800',
    ghost: 'text-muted hover:bg-surface-2 hover:text-ink',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-[15px]',
  };

  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={clsx(base, variants[variant], sizes[size], className)}
    >
      {isLoading ? (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
}
