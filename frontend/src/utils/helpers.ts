import { format, formatDistanceToNow, parseISO } from 'date-fns';

export function formatDate(dateString: string): string {
  return format(parseISO(dateString), 'MMM d, yyyy');
}

export function formatDateTime(dateString: string): string {
  return format(parseISO(dateString), 'MMM d, yyyy h:mm a');
}

export function timeAgo(dateString: string): string {
  return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'N/A';
  return `${Math.round(score)}/100`;
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-pine-600 dark:text-pine-300';
  if (score >= 60) return 'text-clay-600 dark:text-clay-300';
  return 'text-red-600 dark:text-red-400';
}

export function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-pine-500';
  if (score >= 60) return 'bg-clay-500';
  return 'bg-red-600';
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.substring(0, length) + '…' : str;
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function extractErrorMessage(error: unknown): string {
  if (!error) return 'An unknown error occurred';
  if (typeof error === 'string') return error;
  if (typeof error === 'object') {
    const e = error as Record<string, unknown>;
    if (e.response && typeof e.response === 'object') {
      const resp = e.response as Record<string, unknown>;
      if (resp.data && typeof resp.data === 'object') {
        const data = resp.data as Record<string, unknown>;
        if (data.detail) return String(data.detail);
        if (data.message) return String(data.message);
        // Collect field errors
        const fieldErrors = Object.entries(data)
          .filter(([, v]) => Array.isArray(v))
          .map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`)
          .join('; ');
        if (fieldErrors) return fieldErrors;
      }
    }
    if (e.message) return String(e.message);
  }
  return 'An unexpected error occurred';
}

export function clsx(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function scoreBadgeVariant(score: number): 'green' | 'yellow' | 'red' {
  if (score >= 75) return 'green';
  if (score >= 50) return 'yellow';
  return 'red';
}
