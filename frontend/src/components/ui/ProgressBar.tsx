import { clsx } from '../../utils/helpers';

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
}

export function ProgressBar({ value, max = 100, className, barClassName }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={clsx('h-1 w-full overflow-hidden rounded-full bg-line/70', className)}>
      <div
        className={clsx('h-full rounded-full bg-accent-500 transition-[width] duration-500', barClassName)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
