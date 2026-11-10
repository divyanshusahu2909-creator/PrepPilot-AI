import { clsx } from '../../utils/helpers';

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={clsx('h-5 w-5 animate-spin text-accent-500', className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function PageLoader({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
      <span className="relative flex h-8 w-8 items-center justify-center">
        <span className="absolute inset-0 rounded-full border border-line" />
        <Spinner className="h-5 w-5" />
      </span>
      <p className="text-[13px] font-medium text-muted">{label}</p>
    </div>
  );
}
