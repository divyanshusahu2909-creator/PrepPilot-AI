import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AcademicCapIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  FireIcon,
  MicrophoneIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import { analyticsService } from '../services/analyticsService';
import { useAuth } from '../hooks/useAuth';
import { DashboardData, Recommendation, RecentInterview, TaskPriority } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { EmptyState } from '../components/ui/EmptyState';
import { PageLoader } from '../components/ui/Spinner';
import { INTERVIEW_TYPE_LABELS } from '../utils/constants';
import { extractErrorMessage, formatScore, scoreBadgeVariant, timeAgo } from '../utils/helpers';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

const priorityVariant: Record<TaskPriority, 'red' | 'yellow' | 'blue'> = {
  high: 'red',
  medium: 'yellow',
  low: 'blue',
};

const recommendationIcons: Record<Recommendation['type'], typeof AcademicCapIcon> = {
  interview: ChatBubbleLeftRightIcon,
  voice: MicrophoneIcon,
  resume: DocumentTextIcon,
  study: AcademicCapIcon,
};

const tooltipStyle = {
  backgroundColor: 'rgb(var(--c-surface))',
  border: '1px solid rgb(var(--c-border))',
  borderRadius: '0.375rem',
  color: 'rgb(var(--c-text))',
  fontSize: '0.78rem',
  boxShadow: '0 12px 30px -18px rgba(32, 37, 45, 0.35)',
};

function RecentInterviewRow({ interview }: { interview: RecentInterview }) {
  const body = (
    <>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-[13px] font-semibold text-ink">{interview.role}</p>
          <Badge variant="accent">{INTERVIEW_TYPE_LABELS[interview.interview_type] ?? interview.interview_type}</Badge>
          {interview.status === 'in_progress' && <Badge variant="blue">In progress</Badge>}
        </div>
        <p className="mt-1 text-[11px] text-muted">{timeAgo(interview.started_at)}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {interview.overall_score !== null ? (
          <Badge variant={scoreBadgeVariant(interview.overall_score)}>{formatScore(interview.overall_score)}</Badge>
        ) : (
          <Badge variant="gray">No score</Badge>
        )}
        {interview.status !== 'abandoned' && (
          <ArrowRightIcon className="h-3.5 w-3.5 text-muted transition-transform group-hover:translate-x-0.5" />
        )}
      </div>
    </>
  );

  const rowClass =
    'group flex items-center gap-3 rounded-md px-2.5 py-2.5 transition-colors hover:bg-surface-2';

  if (interview.status === 'completed') {
    return (
      <Link to={`/interview/${interview.id}/results`} className={rowClass}>
        {body}
      </Link>
    );
  }
  if (interview.status === 'in_progress') {
    return (
      <Link to={`/interview/${interview.id}`} className={rowClass}>
        {body}
      </Link>
    );
  }
  return <div className="flex items-center gap-3 px-2.5 py-2.5 opacity-70">{body}</div>;
}

function SectionTitle({ title, subtitle, icon }: { title: string; subtitle: string; icon?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-center gap-2.5">
        {icon && <span className="grid h-7 w-7 place-items-center rounded border border-line bg-surface-2 text-accent-600 dark:text-accent-300">{icon}</span>}
        <div>
          <h2 className="font-display text-[15px] font-bold text-ink">{title}</h2>
          <p className="text-[11.5px] text-muted">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    setError(null);
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const result = await analyticsService.getDashboard();
      setData(result);
      if (isRefresh) toast.success('Dashboard refreshed');
    } catch (err) {
      const message = extractErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !data) return <PageLoader label="Loading your dashboard..." />;

  if (error && !data) {
    return (
      <Card className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-md border border-red-500/20 bg-red-500/[0.06] text-red-600 dark:text-red-400">
          <ExclamationTriangleIcon className="h-6 w-6" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-ink">Could not load your dashboard</h2>
          <p className="mt-1 max-w-sm text-sm text-muted">{error}</p>
        </div>
        <Button onClick={() => load()} leftIcon={<ArrowPathIcon className="h-4 w-4" />}>
          Try again
        </Button>
      </Card>
    );
  }

  if (!data) return null;

  const hasTrend = data.weekly_scores.some(
    (point) => point.interview_score !== null || point.voice_score !== null
  );
  const today = format(new Date(), 'EEEE, MMMM d');
  const completedGoals = data.daily_goals.filter((goal) => goal.completed).length;

  const metrics = [
    {
      label: 'Interviews',
      value: data.total_interviews,
      hint: `${data.total_voice_sessions} voice sessions`,
      icon: ChatBubbleLeftRightIcon,
    },
    {
      label: 'Interview score',
      value: formatScore(data.avg_interview_score),
      hint: 'Across completed rounds',
      icon: ChartBarIcon,
    },
    {
      label: 'Communication',
      value: formatScore(data.communication_score),
      hint: 'From voice coaching',
      icon: MicrophoneIcon,
    },
    {
      label: 'Resume score',
      value: formatScore(data.resume_score),
      hint: 'Latest analysis',
      icon: DocumentTextIcon,
    },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Greeting header */}
      <motion.div
        variants={item}
        className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <div className="flex items-center gap-2.5">
            <span className="h-px w-6 bg-accent-500" />
            <span className="eyebrow text-accent-500">Overview</span>
          </div>
          <h1 className="mt-3 font-display text-[28px] font-bold leading-tight tracking-tight text-ink sm:text-[32px]">
            Welcome back, {user?.first_name || 'there'}.
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-muted">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDaysIcon className="h-4 w-4" />
              {today}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded border border-clay-500/20 bg-clay-500/[0.07] px-2 py-0.5 text-[11px] font-semibold text-clay-700 dark:border-clay-500/30 dark:text-clay-300">
              <FireIcon className="h-3.5 w-3.5" />
              {data.interview_streak}-day streak
            </span>
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          isLoading={refreshing}
          onClick={() => load(true)}
          leftIcon={<ArrowPathIcon className="h-4 w-4" />}
        >
          Refresh
        </Button>
      </motion.div>

      {/* Performance ledger */}
      <motion.div variants={item}>
        <Card padding="none" className="overflow-hidden">
          <div className="grid grid-cols-2 gap-px bg-line/70 xl:grid-cols-4">
            {metrics.map((metric) => (
              <div key={metric.label} className="bg-surface p-5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                    {metric.label}
                  </p>
                  <metric.icon className="h-4 w-4 shrink-0 text-muted/60" />
                </div>
                <p className="mt-3 font-display text-[26px] font-bold leading-none tracking-tight text-ink tabular-nums">
                  {metric.value}
                </p>
                <p className="mt-1.5 text-[11px] text-muted">{metric.hint}</p>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Trend + daily goals */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="h-full">
            <SectionTitle
              title="Score trend"
              subtitle="Interview and voice performance over time"
              icon={<ChartBarIcon className="h-4 w-4" />}
            />
            {hasTrend ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.weekly_scores} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--c-border))" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value: string) => format(parseISO(value), 'MMM d')}
                      tick={{ fontSize: 11, fill: 'rgb(var(--c-muted))' }}
                      axisLine={{ stroke: 'rgb(var(--c-border))' }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: 'rgb(var(--c-muted))' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelFormatter={(label) => formatDateSafe(String(label))}
                    />
                    <Legend wrapperStyle={{ fontSize: '0.72rem' }} />
                    <Area
                      type="monotone"
                      dataKey="interview_score"
                      name="Interview score"
                      stroke="#2f6f68"
                      strokeWidth={2}
                      fill="#2f6f68"
                      fillOpacity={0.08}
                      connectNulls
                      dot={{ r: 2.5, fill: '#2f6f68', strokeWidth: 0 }}
                      activeDot={{ r: 4.5 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="voice_score"
                      name="Voice score"
                      stroke="#d97757"
                      strokeWidth={2}
                      fill="#d97757"
                      fillOpacity={0.06}
                      connectNulls
                      dot={{ r: 2.5, fill: '#d97757', strokeWidth: 0 }}
                      activeDot={{ r: 4.5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState
                icon={<ChartBarIcon className="h-9 w-9" />}
                title="No scores yet"
                description="Complete a mock interview or voice session and your progress will appear here."
                action={
                  <Link to="/interview">
                    <Button size="sm">Start an interview</Button>
                  </Link>
                }
              />
            )}
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="h-full">
            <SectionTitle
              title="Daily goals"
              subtitle={`${completedGoals} of ${data.daily_goals.length} completed`}
              icon={<FireIcon className="h-4 w-4" />}
            />
            {data.daily_goals.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">No goals set for today yet.</p>
            ) : (
              <div className="space-y-4">
                {data.daily_goals.map((goal) => (
                  <div key={goal.id}>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-[13px] font-medium text-ink">
                        {goal.completed ? (
                          <CheckCircleSolid className="h-4 w-4 shrink-0 text-pine-500 dark:text-pine-300" />
                        ) : (
                          <span className="h-4 w-4 shrink-0 rounded-full border border-line" />
                        )}
                        {goal.title}
                      </span>
                      <span className="text-[11px] tabular-nums text-muted">
                        {goal.progress}/{goal.target}
                      </span>
                    </div>
                    <ProgressBar value={goal.progress} max={goal.target || 1} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Recommendations + recent */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="h-full">
            <SectionTitle
              title="Recommended next steps"
              subtitle="Personalized nudges from your coach"
              icon={<SparklesIcon className="h-4 w-4" />}
            />

            <div className="mb-4 rounded-md border border-line bg-surface-2/50 px-4 py-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-[12.5px] font-medium text-ink">
                  <AcademicCapIcon className="h-4 w-4 text-accent-600 dark:text-accent-300" />
                  Learning roadmap
                </span>
                {data.learning_progress !== null ? (
                  <span className="font-display text-[13px] font-bold text-pine-600 tabular-nums dark:text-pine-300">
                    {Math.round(data.learning_progress)}%
                  </span>
                ) : (
                  <Link
                    to="/roadmap"
                    className="text-[11px] font-semibold text-pine-600 hover:text-pine-700 dark:text-pine-300 dark:hover:text-pine-200"
                  >
                    Create a roadmap
                  </Link>
                )}
              </div>
              {data.learning_progress !== null ? (
                <ProgressBar value={data.learning_progress} />
              ) : (
                <p className="text-[11.5px] text-muted">
                  Generate a roadmap to track your preparation week by week.
                </p>
              )}
            </div>

            {data.recommendations.length === 0 ? (
              <EmptyState
                icon={<SparklesIcon className="h-9 w-9" />}
                title="You are all caught up"
                description="New recommendations will appear as you practice and improve."
              />
            ) : (
              <div className="divide-y divide-line border-t border-line">
                {data.recommendations.map((rec, index) => {
                  const Icon = recommendationIcons[rec.type];
                  return (
                    <Link
                      key={`${rec.title}-${index}`}
                      to={rec.link}
                      className="group -mx-2 flex items-start gap-3 rounded-sm px-2 py-3.5 transition-colors hover:bg-surface-2/60"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded border border-line bg-surface-2 text-accent-600 dark:text-accent-300">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[13px] font-semibold text-ink">{rec.title}</p>
                          <Badge variant={priorityVariant[rec.priority]}>{rec.priority}</Badge>
                        </div>
                        <p className="mt-1 text-[12px] leading-relaxed text-muted">{rec.description}</p>
                        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                            <ClockIcon className="h-3.5 w-3.5" />~{rec.estimated_minutes} min
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-pine-600 dark:text-pine-300">
                            Get started
                            <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>
        </motion.div>

        <div className="space-y-5">
          <motion.div variants={item}>
            <Card>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="font-display text-[15px] font-bold text-ink">Recent interviews</h2>
                <Link
                  to="/history"
                  className="text-[11px] font-semibold text-pine-600 hover:text-pine-700 dark:text-pine-300 dark:hover:text-pine-200"
                >
                  View all
                </Link>
              </div>
              {data.recent_interviews.length === 0 ? (
                <EmptyState
                  icon={<ChatBubbleLeftRightIcon className="h-9 w-9" />}
                  title="No interviews yet"
                  description="Run your first AI mock interview to see it here."
                  action={
                    <Link to="/interview">
                      <Button size="sm">Start now</Button>
                    </Link>
                  }
                />
              ) : (
                <div className="-mx-2.5 divide-y divide-line/70">
                  {data.recent_interviews.map((interview) => (
                    <RecentInterviewRow key={interview.id} interview={interview} />
                  ))}
                </div>
              )}
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card>
              <div className="mb-3 flex items-center gap-2">
                <ClockIcon className="h-4 w-4 text-clay-500" />
                <h2 className="font-display text-[15px] font-bold text-ink">Recent activity</h2>
              </div>
              {data.recent_activities.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted">Your activity feed is empty for now.</p>
              ) : (
                <ol className="space-y-3.5">
                  {data.recent_activities.slice(0, 6).map((activity) => (
                    <li key={activity.id} className="relative flex gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-clay-500" />
                      <div className="min-w-0">
                        <p className="text-[12.5px] leading-relaxed text-ink">{activity.description}</p>
                        <p className="mt-0.5 text-[11px] text-muted">{timeAgo(activity.created_at)}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function formatDateSafe(value: string): string {
  try {
    return format(parseISO(value), 'MMM d, yyyy');
  } catch {
    return value;
  }
}
