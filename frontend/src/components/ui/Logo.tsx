import { clsx } from '../../utils/helpers';

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  size?: 'sm' | 'md' | 'lg';
  /** Use the light wordmark when placed on a dark/pine panel. */
  tone?: 'auto' | 'light';
}

const markSizes = {
  sm: 'h-7 w-7',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
};

const wordSizes = {
  sm: 'text-[15px]',
  md: 'text-[17px]',
  lg: 'text-[22px]',
};

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 36"
      className={clsx('shrink-0', markSizes.md, className)}
      role="img"
      aria-label="PrepPilot"
    >
      <rect width="36" height="36" rx="8" fill="#2F6F68" />
      <path
        d="M11.75 28.5V9.5h9.4a6.1 6.1 0 0 1 0 12.2h-6.1"
        fill="none"
        stroke="#F7F5F0"
        strokeWidth="4.2"
        strokeLinecap="square"
      />
      <circle cx="28.4" cy="8.9" r="2" fill="#D97757" />
    </svg>
  );
}

export function Logo({ className, showWordmark = true, size = 'md', tone = 'auto' }: LogoProps) {
  return (
    <span className={clsx('inline-flex items-center gap-2.5', className)}>
      <LogoMark className={markSizes[size]} />
      {showWordmark && (
        <span
          className={clsx(
            'font-display font-extrabold leading-none tracking-[-0.035em]',
            wordSizes[size],
            tone === 'light' ? 'text-paper' : 'text-ink'
          )}
        >
          PrepPilot<span className="text-clay-500">.</span>
        </span>
      )}
    </span>
  );
}
