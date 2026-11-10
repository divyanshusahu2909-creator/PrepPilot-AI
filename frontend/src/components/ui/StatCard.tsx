import { Card } from './Card';
import { clsx } from '../../utils/helpers';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  hint?: string;
  accent?: 'lime' | 'blue' | 'green' | 'yellow';
}

const accents = {
  lime: 'bg-accent-500/10 text-accent-600 border-accent-500/20 dark:text-accent-300',
  blue: 'bg-surface-2 text-ink/70 border-line',
  green: 'bg-sage-200/60 text-pine-600 border-pine-500/15 dark:bg-pine-800/40 dark:text-pine-300 dark:border-pine-600/40',
  yellow: 'bg-clay-500/10 text-clay-600 border-clay-500/20 dark:text-clay-300',
};

export function StatCard({ label, value, icon, hint, accent = 'lime' }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow truncate">{label}</p>
          <p className="mt-2 font-display text-[28px] font-bold leading-none tracking-tight text-ink tabular-nums">
            {value}
          </p>
          {hint && <p className="mt-2 text-xs text-muted">{hint}</p>}
        </div>
        {icon && (
          <div className={clsx('grid h-9 w-9 shrink-0 place-items-center rounded-md border', accents[accent])}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
