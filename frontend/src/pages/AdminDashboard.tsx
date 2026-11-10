import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Switch } from '@headlessui/react';
import { format, parseISO } from 'date-fns';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowPathIcon,
  BeakerIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  MicrophoneIcon,
  SparklesIcon,
  UserPlusIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { analyticsService } from '../services/analyticsService';
import { useAuth } from '../hooks/useAuth';
import { AdminStats, AdminUser, PaginatedResponse, UserRole } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { PageLoader } from '../components/ui/Spinner';
import { Pagination } from '../components/history/Pagination';
import { clsx, extractErrorMessage, formatDate, formatScore, timeAgo } from '../utils/helpers';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const tooltipStyle = {
  backgroundColor: 'rgb(var(--c-surface-2))',
  border: '1px solid rgb(var(--c-border))',
  borderRadius: '0.5rem',
  color: 'rgb(var(--c-text))',
  fontSize: '0.8rem',
  boxShadow: '0 8px 24px rgba(2, 8, 23, 0.18)',
};

function formatTooltipDate(value: string): string {
  try {
    return format(parseISO(value), 'MMM d, yyyy');
  } catch {
    return value;
  }
}

interface UserControlsProps {
  user: AdminUser;
  isSelf: boolean;
  pending: boolean;
  onRoleChange: (user: AdminUser, role: UserRole) => void;
  onActiveChange: (user: AdminUser, active: boolean) => void;
}

function UserControls({ user, isSelf, pending, onRoleChange, onActiveChange }: UserControlsProps) {
  const disabled = isSelf || pending;
  const tooltip = isSelf ? 'You cannot modify your own account' : undefined;

  return (
    <div className="flex items-center gap-3">
      <span title={tooltip} className={clsx(disabled && 'cursor-not-allowed')}>
        <select
          value={user.role}
          disabled={disabled}
          onChange={(event) => onRoleChange(user, event.target.value as UserRole)}
          aria-label={`Role for ${user.email}`}
          className="rounded border border-line bg-surface px-2 py-1.5 text-xs font-medium text-ink transition-colors hover:border-graphite-400/60 focus:border-pine-500 focus:outline-none focus:ring-1 focus:ring-pine-500/30 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:border-graphite-500"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </span>
      <span title={tooltip} className={clsx('inline-flex', disabled && 'cursor-not-allowed')}>
        <Switch
          checked={user.is_active}
          disabled={disabled}
          onChange={(checked) => onActiveChange(user, checked)}
          aria-label={`Active status for ${user.email}`}
          className={clsx(
            'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pine-500/35 focus:ring-offset-2 focus:ring-offset-surface',
            user.is_active ? 'bg-pine-500 dark:bg-pine-400' : 'bg-line',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          <span
            className={clsx(
              'inline-block h-3.5 w-3.5 transform rounded-full bg-paper shadow-sm transition-transform dark:bg-graphite-950',
              user.is_active ? 'translate-x-[18px]' : 'translate-x-[3px]'
            )}
          />
        </Switch>
      </span>
      {pending && <ClockIcon className="h-4 w-4 animate-pulse text-pine-500" />}
    </div>
  );
}

export default function AdminDashboard() {
  const { user: currentUser } = useAuth();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [usersData, setUsersData] = useState<PaginatedResponse<AdminUser> | null>(null);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [pendingIds, setPendingIds] = useState<number[]>([]);

  const loadStats = useCallback(async (isRefresh = false) => {
    setStatsError(null);
    setStatsLoading(true);
    try {
      const result = await analyticsService.getAdminStats();
      setStats(result);
      if (isRefresh) toast.success('Platform stats refreshed');
    } catch (err) {
      const message = extractErrorMessage(err);
      setStatsError(message);
      toast.error(message);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async (targetPage: number, term: string) => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      setUsersData(await analyticsService.getAdminUsers(targetPage, term));
    } catch (err) {
      const message = extractErrorMessage(err);
      setUsersError(message);
      toast.error(message);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Debounced search: resets to the first page on every new term.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    loadUsers(page, search);
  }, [page, search, loadUsers]);

  const mutateUser = async (target: AdminUser, patch: { is_active?: boolean; role?: UserRole }) => {
    const snapshot = usersData;
    setPendingIds((ids) => [...ids, target.id]);
    setUsersData((prev) =>
      prev
        ? { ...prev, results: prev.results.map((u) => (u.id === target.id ? { ...u, ...patch } : u)) }
        : prev
    );
    try {
      const updated = await analyticsService.updateAdminUser(target.id, patch);
      setUsersData((prev) =>
        prev
          ? {
              ...prev,
              results: prev.results.map((u) =>
                u.id === target.id ? { ...u, role: updated.role, is_active: updated.is_active } : u
              ),
            }
          : prev
      );
      toast.success(
        patch.role !== undefined
          ? `${target.email} is now ${updated.role === 'admin' ? 'an admin' : 'a regular user'}`
          : `${target.email} ${updated.is_active ? 'activated' : 'deactivated'}`
      );
    } catch (err) {
      setUsersData(snapshot);
      toast.error(extractErrorMessage(err));
    } finally {
      setPendingIds((ids) => ids.filter((id) => id !== target.id));
    }
  };

  if (statsLoading && !stats) return <PageLoader label="Loading platform overview..." />;

  if (statsError && !stats) {
    return (
      <Card className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-red-500/10 text-red-600 dark:text-red-400">
          <ExclamationTriangleIcon className="h-6 w-6" />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Could not load admin stats</h2>
          <p className="mt-1 max-w-sm text-sm text-muted">{statsError}</p>
        </div>
        <Button onClick={() => loadStats()} leftIcon={<ArrowPathIcon className="h-4 w-4" />}>
          Try again
        </Button>
      </Card>
    );
  }

  const totalPages = usersData ? Math.max(1, Math.ceil(usersData.count / 10)) : 1;

  const metrics = stats
    ? [
        { label: 'Total users', value: stats.total_users, icon: UsersIcon },
        { label: 'Active users', value: stats.active_users, icon: CheckBadgeIcon },
        { label: 'New users · 7d', value: stats.new_users_7d, icon: UserPlusIcon },
        { label: 'Total interviews', value: stats.total_interviews, icon: ChatBubbleLeftRightIcon },
        { label: 'Completed', value: stats.completed_interviews, icon: CheckCircleIcon },
        { label: 'Voice sessions', value: stats.total_voice_sessions, icon: MicrophoneIcon },
        { label: 'Resumes analyzed', value: stats.total_resumes, icon: DocumentTextIcon },
        { label: 'Avg interview score', value: formatScore(stats.avg_interview_score), icon: ChartBarIcon },
      ]
    : [];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <PageHeader
          eyebrow="Administration"
          title="Platform overview"
          subtitle="Health, growth, and user access for the whole workspace."
          actions={
            <>
              {stats &&
                (stats.ai_configured ? (
                  <Badge variant="green" size="md">
                    <SparklesIcon className="h-4 w-4" />
                    Gemini connected
                  </Badge>
                ) : (
                  <Badge variant="yellow" size="md">
                    <BeakerIcon className="h-4 w-4" />
                    Demo mode
                  </Badge>
                ))}
              <Button
                variant="secondary"
                size="sm"
                isLoading={statsLoading}
                onClick={() => loadStats(true)}
                leftIcon={<ArrowPathIcon className="h-4 w-4" />}
              >
                Refresh
              </Button>
            </>
          }
        />
      </motion.div>

      {stats && (
        <>
          <motion.div variants={item}>
            <Card padding="none" className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-5 py-3">
                <p className="eyebrow">Platform ledger</p>
                <p className="text-xs text-muted">Live snapshot</p>
              </div>
              <div className="grid grid-cols-2 gap-px bg-line/70 md:grid-cols-4">
                {metrics.map(({ label, value, icon: Icon }) => (
                  <div key={label} className="bg-surface p-5">
                    <div className="flex items-center gap-2 text-muted">
                      <Icon className="h-4 w-4 text-pine-600 dark:text-pine-300" />
                      <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">{label}</span>
                    </div>
                    <p className="mt-3 font-display text-[26px] font-bold leading-none tabular-nums tracking-tight text-ink">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <motion.div variants={item} className="lg:col-span-2">
              <Card className="h-full">
                <div className="mb-5 flex items-end justify-between gap-3 border-b border-line pb-4">
                  <div>
                    <h2 className="font-display text-base font-semibold text-ink">Signups per day</h2>
                    <p className="mt-0.5 text-xs text-muted">New account registrations over the recent period</p>
                  </div>
                  <Badge variant="accent">Growth</Badge>
                </div>
                {stats.signups_per_day.length === 0 ? (
                  <EmptyState
                    icon={<UserPlusIcon className="h-9 w-9" />}
                    title="No signup data yet"
                    description="Daily registration counts will chart here as users join."
                  />
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.signups_per_day} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--c-border))" vertical={false} />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(value: string) => format(parseISO(value), 'MMM d')}
                          tick={{ fontSize: 11, fill: 'rgb(var(--c-muted))' }}
                          axisLine={{ stroke: 'rgb(var(--c-border))' }}
                          tickLine={false}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 11, fill: 'rgb(var(--c-muted))' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={tooltipStyle}
                          cursor={{ fill: 'rgba(47, 111, 104, 0.07)' }}
                          labelFormatter={(label) => formatTooltipDate(String(label))}
                        />
                        <Bar dataKey="count" name="New users" fill="#2f6f68" radius={[2, 2, 0, 0]} maxBarSize={32} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>
            </motion.div>

            <motion.div variants={item}>
              <Card className="h-full">
                <div className="mb-4 border-b border-line pb-4">
                  <h2 className="font-display text-base font-semibold text-ink">Recent activity</h2>
                  <p className="mt-0.5 text-xs text-muted">Latest actions across the platform</p>
                </div>
                {stats.recent_activities.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted">No platform activity recorded yet.</p>
                ) : (
                  <ol className="space-y-4">
                    {stats.recent_activities.slice(0, 8).map((activity) => (
                      <li key={activity.id} className="flex gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-sage-200 text-[11px] font-bold text-pine-700 dark:bg-pine-800/60 dark:text-pine-200">
                          {activity.user[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm leading-snug text-ink">{activity.description}</p>
                          <p className="mt-0.5 truncate text-xs text-muted">
                            {activity.user} · {timeAgo(activity.created_at)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </Card>
            </motion.div>
          </div>
        </>
      )}

      {/* User management */}
      <motion.div variants={item}>
        <Card padding="none">
          <div className="flex flex-col gap-3 border-b border-line p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-base font-semibold text-ink">User management</h2>
              <p className="mt-0.5 text-xs text-muted">
                {usersData ? `${usersData.count} registered users` : 'Manage roles and account access'}
              </p>
            </div>
            <div className="w-full sm:max-w-xs">
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by email or name..."
                leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
                aria-label="Search users"
              />
            </div>
          </div>

          <div className="p-5">
            {usersLoading ? (
              <PageLoader label="Loading users..." />
            ) : usersError ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <ExclamationTriangleIcon className="h-7 w-7 text-red-600 dark:text-red-400" />
                <p className="text-sm text-muted">{usersError}</p>
                <Button variant="secondary" size="sm" onClick={() => loadUsers(page, search)} leftIcon={<ArrowPathIcon className="h-4 w-4" />}>
                  Try again
                </Button>
              </div>
            ) : !usersData || usersData.results.length === 0 ? (
              <EmptyState
                icon={<UsersIcon className="h-9 w-9" />}
                title={search ? 'No matching users' : 'No users yet'}
                description={
                  search
                    ? `No accounts match "${search}". Try a different email or name.`
                    : 'Registered accounts will appear here.'
                }
              />
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-line text-[11px] uppercase tracking-[0.12em] text-muted">
                        <th className="pb-3 pr-4 font-semibold">User</th>
                        <th className="pb-3 pr-4 font-semibold" colSpan={2}>
                          Role / Active
                        </th>
                        <th className="pb-3 pr-4 font-semibold">Interviews</th>
                        <th className="pb-3 pr-4 font-semibold">Voice</th>
                        <th className="pb-3 font-semibold">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {usersData.results.map((u) => (
                        <tr key={u.id} className="transition-colors hover:bg-surface-2/40">
                          <td className="py-3.5 pr-4">
                            <p className="font-medium text-ink">
                              {u.first_name} {u.last_name}
                              {u.id === currentUser?.id && (
                                <span className="ml-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-pine-600 dark:text-pine-300">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="mt-0.5 text-xs text-muted">{u.email}</p>
                          </td>
                          <td className="py-3.5 pr-4" colSpan={2}>
                            <UserControls
                              user={u}
                              isSelf={u.id === currentUser?.id}
                              pending={pendingIds.includes(u.id)}
                              onRoleChange={(target, role) => mutateUser(target, { role })}
                              onActiveChange={(target, is_active) => mutateUser(target, { is_active })}
                            />
                          </td>
                          <td className="py-3.5 pr-4 tabular-nums text-ink">{u.interview_count}</td>
                          <td className="py-3.5 pr-4 tabular-nums text-ink">{u.voice_count}</td>
                          <td className="whitespace-nowrap py-3.5 text-muted">{formatDate(u.date_joined)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile card list */}
                <div className="space-y-3 md:hidden">
                  {usersData.results.map((u) => (
                    <div key={u.id} className="rounded-md border border-line bg-surface p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-ink">
                            {u.first_name} {u.last_name}
                            {u.id === currentUser?.id && (
                              <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-pine-600 dark:text-pine-300">
                                You
                              </span>
                            )}
                          </p>
                          <p className="truncate text-xs text-muted">{u.email}</p>
                        </div>
                        <Badge variant={u.is_active ? 'green' : 'gray'}>{u.is_active ? 'Active' : 'Inactive'}</Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <UserControls
                          user={u}
                          isSelf={u.id === currentUser?.id}
                          pending={pendingIds.includes(u.id)}
                          onRoleChange={(target, role) => mutateUser(target, { role })}
                          onActiveChange={(target, is_active) => mutateUser(target, { is_active })}
                        />
                      </div>
                      <p className="mt-3 border-t border-line pt-2.5 text-xs text-muted">
                        {u.interview_count} interviews · {u.voice_count} voice · joined {formatDate(u.date_joined)}
                      </p>
                    </div>
                  ))}
                </div>

                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} disabled={usersLoading} />
              </>
            )}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
