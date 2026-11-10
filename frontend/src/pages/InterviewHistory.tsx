import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ArrowPathIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  MicrophoneIcon,
} from '@heroicons/react/24/outline';
import { interviewService } from '../services/interviewService';
import { voiceService } from '../services/voiceService';
import {
  Difficulty,
  InterviewSessionListItem,
  InterviewStatus,
  PaginatedResponse,
  VoiceSessionListItem,
  VoiceSessionStatus,
} from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { PageLoader } from '../components/ui/Spinner';
import { Pagination } from '../components/history/Pagination';
import { INTERVIEW_TYPE_LABELS, VOICE_MODE_LABELS } from '../utils/constants';
import {
  clsx,
  extractErrorMessage,
  formatDate,
  formatDuration,
  formatScore,
  scoreBadgeVariant,
} from '../utils/helpers';

type Tab = 'mock' | 'voice';

const interviewStatusMeta: Record<InterviewStatus, { label: string; variant: 'green' | 'blue' | 'gray' }> = {
  completed: { label: 'Completed', variant: 'green' },
  in_progress: { label: 'In progress', variant: 'blue' },
  abandoned: { label: 'Abandoned', variant: 'gray' },
};

const voiceStatusMeta: Record<VoiceSessionStatus, { label: string; variant: 'green' | 'blue' | 'gray' }> = {
  completed: { label: 'Completed', variant: 'green' },
  active: { label: 'Active', variant: 'blue' },
  abandoned: { label: 'Abandoned', variant: 'gray' },
};

const difficultyVariant: Record<Difficulty, 'green' | 'yellow' | 'red'> = {
  beginner: 'green',
  intermediate: 'yellow',
  advanced: 'red',
};

function usePagedList<T>(fetcher: (page: number) => Promise<PaginatedResponse<T>>) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedResponse<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (targetPage: number) => {
      setLoading(true);
      setError(null);
      try {
        setData(await fetcher(targetPage));
      } catch (err) {
        const message = extractErrorMessage(err);
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [fetcher]
  );

  useEffect(() => {
    load(page);
  }, [page, load]);

  const totalPages = data ? Math.max(1, Math.ceil(data.count / 10)) : 1;

  return { page, setPage, data, loading, error, totalPages, retry: () => load(page) };
}

function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card className="flex flex-col items-center justify-center gap-4 py-12 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-md border border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-400">
        <ExclamationTriangleIcon className="h-5 w-5" />
      </div>
      <div>
        <h3 className="font-display text-base font-bold text-ink">Could not load sessions</h3>
        <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>
      </div>
      <Button variant="secondary" size="sm" onClick={onRetry} leftIcon={<ArrowPathIcon className="h-4 w-4" />}>
        Try again
      </Button>
    </Card>
  );
}

function ActionLink({ to, children, primary = false }: { to: string; children: React.ReactNode; primary?: boolean }) {
  return (
    <Link
      to={to}
      className={clsx(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine-500/40',
        primary
          ? 'bg-pine-500 text-paper hover:bg-pine-600 dark:bg-pine-400 dark:text-graphite-950 dark:hover:bg-pine-300'
          : 'border border-line bg-surface text-ink hover:border-pine-500/50 hover:text-pine-600 dark:hover:text-pine-300'
      )}
    >
      {children}
      <ArrowRightIcon className="h-3.5 w-3.5" />
    </Link>
  );
}

function RowMeta({
  date,
  duration,
  extra,
}: {
  date: string;
  duration: number;
  extra: string;
}) {
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
      <span className="inline-flex items-center gap-1">
        <CalendarDaysIcon className="h-3.5 w-3.5" />
        {formatDate(date)}
      </span>
      <span className="inline-flex items-center gap-1">
        <ClockIcon className="h-3.5 w-3.5" />
        {formatDuration(duration)}
      </span>
      <span>{extra}</span>
    </div>
  );
}

function MockInterviewRow({ session }: { session: InterviewSessionListItem }) {
  const status = interviewStatusMeta[session.status];
  return (
    <div className="flex flex-col gap-3 p-4 transition-colors hover:bg-surface-2/50 sm:p-5 lg:flex-row lg:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="accent">{INTERVIEW_TYPE_LABELS[session.interview_type] ?? session.interview_type}</Badge>
          <Badge variant={difficultyVariant[session.difficulty]}>{session.difficulty}</Badge>
          {session.demo && <Badge variant="gray">Demo</Badge>}
        </div>
        <p className="mt-2 truncate text-sm font-semibold text-ink">
          {session.role}
          {session.company && <span className="font-normal text-muted"> · {session.company}</span>}
        </p>
        <RowMeta
          date={session.started_at}
          duration={session.duration_seconds}
          extra={`${session.answered_count}/${session.total_questions} answered`}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
        {session.overall_score !== null ? (
          <Badge variant={scoreBadgeVariant(session.overall_score)} size="md">
            {formatScore(session.overall_score)}
          </Badge>
        ) : (
          <span className="px-1 text-sm text-muted">—</span>
        )}
        <Badge variant={status.variant}>{status.label}</Badge>
        {session.status === 'completed' && (
          <ActionLink to={`/interview/${session.id}/results`} primary>
            View results
          </ActionLink>
        )}
        {session.status === 'in_progress' && (
          <ActionLink to={`/interview/${session.id}`} primary>
            Resume
          </ActionLink>
        )}
      </div>
    </div>
  );
}

function VoiceSessionRow({ session }: { session: VoiceSessionListItem }) {
  const status = voiceStatusMeta[session.status];
  return (
    <div className="flex flex-col gap-3 p-4 transition-colors hover:bg-surface-2/50 sm:p-5 lg:flex-row lg:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="blue">{VOICE_MODE_LABELS[session.mode] ?? session.mode}</Badge>
          {session.demo && <Badge variant="gray">Demo</Badge>}
        </div>
        <p className="mt-2 truncate text-sm font-semibold text-ink">
          {session.topic || 'General speaking practice'}
        </p>
        <RowMeta
          date={session.started_at}
          duration={session.duration_seconds}
          extra={`${session.message_count} messages`}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
        {session.overall_score !== null ? (
          <Badge variant={scoreBadgeVariant(session.overall_score)} size="md">
            {formatScore(session.overall_score)}
          </Badge>
        ) : (
          <span className="px-1 text-sm text-muted">—</span>
        )}
        <Badge variant={status.variant}>{status.label}</Badge>
        {session.status !== 'abandoned' && (
          <ActionLink to={`/voice?session=${session.id}`} primary={session.status === 'active'}>
            {session.status === 'active' ? 'Resume' : 'View session'}
          </ActionLink>
        )}
      </div>
    </div>
  );
}

export default function InterviewHistory() {
  const [tab, setTab] = useState<Tab>('mock');
  const mock = usePagedList<InterviewSessionListItem>(interviewService.getSessions);
  const voice = usePagedList<VoiceSessionListItem>(voiceService.getSessions);

  const tabs: { key: Tab; label: string; icon: typeof ChatBubbleLeftRightIcon }[] = [
    { key: 'mock', label: 'Mock interviews', icon: ChatBubbleLeftRightIcon },
    { key: 'voice', label: 'Voice sessions', icon: MicrophoneIcon },
  ];

  const active = tab === 'mock' ? mock : voice;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Archive"
        title="Interview history"
        subtitle="Every mock interview and voice coaching session you have completed, in one record."
      />

      {/* Tabs */}
      <div className="flex gap-6 border-b border-line" role="tablist" aria-label="History type">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={clsx(
              'relative flex items-center gap-2 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine-500/40',
              tab === key ? 'text-pine-600 dark:text-pine-300' : 'text-muted hover:text-ink'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
            {tab === key && (
              <motion.span
                layoutId="history-tab-underline"
                className="absolute inset-x-0 -bottom-px h-0.5 bg-pine-500 dark:bg-pine-400"
                transition={{ type: 'spring', bounce: 0.15, duration: 0.45 }}
              />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="space-y-4"
        >
          {active.loading ? (
            <PageLoader label={tab === 'mock' ? 'Loading interviews...' : 'Loading voice sessions...'} />
          ) : active.error ? (
            <ErrorPanel message={active.error} onRetry={active.retry} />
          ) : !active.data || active.data.results.length === 0 ? (
            tab === 'mock' ? (
              <EmptyState
                icon={<ChatBubbleLeftRightIcon className="h-10 w-10" />}
                title="No mock interviews yet"
                description="Run your first AI mock interview and start building a track record of improvement."
                action={
                  <Link to="/interview">
                    <Button>Start a mock interview</Button>
                  </Link>
                }
              />
            ) : (
              <EmptyState
                icon={<MicrophoneIcon className="h-10 w-10" />}
                title="No voice sessions yet"
                description="Practice speaking with the voice coach and your sessions will appear here."
                action={
                  <Link to="/voice">
                    <Button>Open voice coach</Button>
                  </Link>
                }
              />
            )
          ) : (
            <>
              <div className="flex items-baseline justify-between">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
                  {active.data.count} {tab === 'mock' ? 'interview' : 'voice session'}
                  {active.data.count === 1 ? '' : 's'} on record
                </p>
              </div>
              <Card padding="none" className="overflow-hidden">
                <div className="divide-y divide-line">
                  {tab === 'mock'
                    ? (active.data.results as InterviewSessionListItem[]).map((session) => (
                        <MockInterviewRow key={session.id} session={session} />
                      ))
                    : (active.data.results as VoiceSessionListItem[]).map((session) => (
                        <VoiceSessionRow key={session.id} session={session} />
                      ))}
                </div>
              </Card>
              <Pagination
                page={active.page}
                totalPages={active.totalPages}
                onPageChange={active.setPage}
                disabled={active.loading}
              />
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
