import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export function Pagination({ page, totalPages, onPageChange, disabled = false }: PaginationProps) {
  if (totalPages <= 1) return null;

  const btn =
    'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink transition-colors hover:border-pine-500/50 hover:text-pine-600 dark:hover:text-pine-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine-500/40 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-line disabled:hover:text-ink';

  return (
    <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
      <button
        type="button"
        className={btn}
        disabled={disabled || page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Previous</span>
      </button>
      <p className="whitespace-nowrap text-xs font-medium uppercase tracking-[0.12em] text-muted">
        Page <span className="font-semibold tabular-nums text-ink">{page}</span> of{' '}
        <span className="font-semibold tabular-nums text-ink">{totalPages}</span>
      </p>
      <button
        type="button"
        className={btn}
        disabled={disabled || page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
