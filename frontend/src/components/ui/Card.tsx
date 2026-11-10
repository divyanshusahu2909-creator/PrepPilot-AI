import React from 'react';
import { clsx } from '../../utils/helpers';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'flat' | 'bordered';
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
  variant = 'default',
  hover = false,
  padding = 'md',
  children,
  className,
  ...props
}: CardProps) {
  const variants = {
    default: 'bg-surface border border-line',
    flat: 'bg-surface-2 border border-line/70',
    bordered: 'bg-transparent border border-line',
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      {...props}
      className={clsx(
        'rounded-lg',
        variants[variant],
        paddings[padding],
        hover &&
          'cursor-pointer transition-[border-color,box-shadow] duration-200 hover:border-accent-500/45 hover:shadow-soft',
        className
      )}
    >
      {children}
    </div>
  );
}
