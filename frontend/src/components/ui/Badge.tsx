import { clsx } from '../../utils/helpers';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'green' | 'yellow' | 'red' | 'blue' | 'accent' | 'gray';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ children, variant = 'accent', size = 'sm', className }: BadgeProps) {
  const variants = {
    green:
      'bg-sage-200/70 text-pine-700 border-pine-500/20 dark:bg-pine-800/50 dark:text-pine-300 dark:border-pine-600/40',
    yellow:
      'bg-clay-500/10 text-clay-600 border-clay-500/20 dark:bg-clay-500/15 dark:text-clay-300 dark:border-clay-500/30',
    red: 'bg-red-500/10 text-red-700 border-red-500/20 dark:text-red-300 dark:border-red-500/30',
    blue: 'bg-surface-2 text-ink/80 border-line dark:bg-surface-2 dark:text-ink/80',
    accent:
      'bg-accent-500/10 text-accent-700 border-accent-500/25 dark:bg-accent-500/15 dark:text-accent-300 dark:border-accent-500/30',
    gray: 'bg-transparent text-muted border-line',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 whitespace-nowrap rounded border font-semibold tracking-[0.01em]',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}
