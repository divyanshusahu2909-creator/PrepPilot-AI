import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  CalendarDaysIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleStackIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  MapIcon,
  PlayIcon,
  RectangleStackIcon,
  SparklesIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { PageLoader, Spinner } from '../components/ui/Spinner';
import { ProgressBar } from '../components/ui/ProgressBar';
import { ScoreRing } from '../components/ui/ScoreRing';
import { roadmapService } from '../services/roadmapService';
import { ROADMAP_DURATIONS, ROLE_SUGGESTIONS } from '../utils/constants';
import { clsx, extractErrorMessage, formatDate } from '../utils/helpers';
import type { LearningRoadmap, RoadmapListItem, RoadmapTask, TaskPriority, TaskStatus } from '../types';

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  pending: 'in_progress',
  in_progress: 'completed',
  completed: 'pending',
};

const PRIORITY_VARIANT: Record<TaskPriority, 'red' | 'yellow' | 'gray'> = {
  high: 'red',
  medium: 'yellow',
  low: 'gray',
};

function completionOf(tasks: RoadmapTask[]): number {
  if (tasks.length === 0) return 0;
  return Math.round((tasks.filter((t) => t.status === 'completed').length / tasks.length) * 100);
}

function TaskStatusButton({
  task,
  busy,
  onCycle,
}: {
  task: RoadmapTask;
  busy: boolean;
  onCycle: () => void;
}) {
  const styles: Record<TaskStatus, string> = {
    pending: 'border-line bg-surface text-muted hover:border-graphite-400/60 hover:text-ink',
    in_progress:
      'border-clay-500/40 bg-clay-500/10 text-clay-600 hover:border-pine-500/40 hover:text-pine-600 dark:text-clay-300 dark:hover:text-pine-300',
    completed:
      'border-pine-500/40 bg-sage-200 text-pine-700 hover:border-line hover:text-muted dark:bg-pine-800/50 dark:text-pine-200',
  };
  const labels: Record<TaskStatus, string> = {
    pending: 'Start task (mark in progress)',
    in_progress: 'Mark task complete',
    completed: 'Reset task to pending',
  };
  return (
    <button
      onClick={onCycle}
      disabled={busy}
      title={labels[task.status]}
      aria-label={labels[task.status]}
      className={clsx(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded border transition-colors disabled:opacity-60',
        styles[task.status]
      )}
    >
      {busy ? (
        <Spinner className="h-4 w-4" />
      ) : task.status === 'completed' ? (
        <CheckIcon className="h-4 w-4" />
      ) : task.status === 'in_progress' ? (
        <PlayIcon className="h-4 w-4" />
      ) : (
        <CircleStackIcon className="h-4 w-4" />
      )}
    </button>
  );
}

export default function Roadmap() {
  const [view, setView] = useState<'list' | 'detail'>('list');

  // List
  const [roadmaps, setRoadmaps] = useState<RoadmapListItem[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Generate
  const [genRole, setGenRole] = useState('');
  const [genWeeks, setGenWeeks] = useState(8);
  const [generating, setGenerating] = useState(false);
  const generateRef = useRef<HTMLDivElement>(null);

  // Detail
  const [detailId, setDetailId] = useState<number | null>(null);
  const [detail, setDetail] = useState<LearningRoadmap | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [updatingTaskIds, setUpdatingTaskIds] = useState<Set<number>>(new Set());

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<RoadmapListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadList = useCallback(async (p: number) => {
    setListLoading(true);
    setListError(null);
    try {
      const data = await roadmapService.getRoadmaps(p);
      setRoadmaps(data.results);
      setCount(data.count);
      setHasNext(data.next !== null);
      setHasPrev(data.previous !== null);
    } catch (err) {
      setListError(extractErrorMessage(err));
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadList(page);
  }, [page, refreshKey, loadList]);

  const openRoadmap = useCallback(async (id: number) => {
    setDetailId(id);
    setView('detail');
    setDetailLoading(true);
    setDetailError(null);
    setDetail(null);
    try {
      const data = await roadmapService.getRoadmap(id);
      setDetail(data);
    } catch (err) {
      setDetailError(extractErrorMessage(err));
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const backToList = () => {
    setView('list');
    setDetail(null);
    setDetailId(null);
    setRefreshKey((k) => k + 1);
  };

  const handleGenerate = async () => {
    const role = genRole.trim();
    if (!role) {
      toast.error('Enter a target role to build your roadmap.');
      return;
    }
    setGenerating(true);
    try {
      const roadmap = await roadmapService.generateRoadmap(role, genWeeks);
      toast.success(`Your ${roadmap.duration_weeks}-week roadmap is ready`);
      setRoadmaps((prev) => [
        {
          id: roadmap.id,
          target_role: roadmap.target_role,
          duration_weeks: roadmap.duration_weeks,
          demo: roadmap.demo,
          created_at: roadmap.created_at,
          completion_percentage: roadmap.completion_percentage,
          task_count: roadmap.tasks.length,
        },
        ...prev.filter((r) => r.id !== roadmap.id),
      ]);
      setCount((c) => c + 1);
      setGenRole('');
      setDetailId(roadmap.id);
      setDetail(roadmap);
      setDetailError(null);
      setView('detail');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await roadmapService.deleteRoadmap(deleteTarget.id);
      toast.success('Roadmap deleted');
      if (detailId === deleteTarget.id) {
        setView('list');
        setDetail(null);
        setDetailId(null);
      }
      setDeleteTarget(null);
      if (roadmaps.length === 1 && page > 1) setPage((p) => p - 1);
      else setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const cycleTask = async (task: RoadmapTask) => {
    if (!detail || updatingTaskIds.has(task.id)) return;
    const roadmapId = detail.id;
    const nextStatus = NEXT_STATUS[task.status];
    const prevStatus = task.status;
    const prevCompletedAt = task.completed_at;

    setUpdatingTaskIds((prev) => new Set(prev).add(task.id));
    // Optimistic update
    setDetail((prev) => {
      if (!prev || prev.id !== roadmapId) return prev;
      const tasks = prev.tasks.map((t) =>
        t.id === task.id
          ? { ...t, status: nextStatus, completed_at: nextStatus === 'completed' ? new Date().toISOString() : null }
          : t
      );
      return { ...prev, tasks, completion_percentage: completionOf(tasks) };
    });

    try {
      const result = await roadmapService.updateTaskStatus(roadmapId, task.id, nextStatus);
      setDetail((prev) =>
        prev && prev.id === roadmapId
          ? {
              ...prev,
              tasks: prev.tasks.map((t) => (t.id === result.task.id ? result.task : t)),
              completion_percentage: result.completion_percentage,
            }
          : prev
      );
      toast.success(
        nextStatus === 'completed'
          ? 'Task completed — keep the momentum going!'
          : nextStatus === 'in_progress'
            ? 'Task marked in progress'
            : 'Task reset to pending',
        { duration: 2000 }
      );
    } catch (err) {
      toast.error(extractErrorMessage(err));
      // Rollback
      setDetail((prev) => {
        if (!prev || prev.id !== roadmapId) return prev;
        const tasks = prev.tasks.map((t) =>
          t.id === task.id ? { ...t, status: prevStatus, completed_at: prevCompletedAt } : t
        );
        return { ...prev, tasks, completion_percentage: completionOf(tasks) };
      });
    } finally {
      setUpdatingTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    }
  };

  const weeks = useMemo(() => {
    if (!detail) return [];
    const map = new Map<number, RoadmapTask[]>();
    for (const task of detail.tasks) {
      const list = map.get(task.week_number) ?? [];
      list.push(task);
      map.set(task.week_number, list);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([week, tasks]) => ({
        week,
        tasks: [...tasks].sort((a, b) => (a.day_number ?? 99) - (b.day_number ?? 99)),
        done: tasks.filter((t) => t.status === 'completed').length,
      }));
  }, [detail]);

  const focusGenerate = () => {
    generateRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => {
      generateRef.current?.querySelector<HTMLInputElement>('input')?.focus();
    }, 350);
  };

  const completedCount = detail?.tasks.filter((t) => t.status === 'completed').length ?? 0;
  const totalHours = detail ? Math.round(detail.tasks.reduce((sum, t) => sum + t.estimated_hours, 0)) : 0;

  return (
    <div>
      <AnimatePresence mode="wait">
        {view === 'list' ? (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <PageHeader
              eyebrow="Study plan"
              title="Learning roadmap"
              subtitle="Turn a target role into a week-by-week study plan with trackable tasks and curated resources."
              actions={count > 0 ? <Badge variant="blue" size="md">{count} roadmap{count === 1 ? '' : 's'}</Badge> : undefined}
            />

            {/* Generate */}
            <motion.div
              ref={generateRef}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-6"
            >
              <Card padding="none" className="overflow-hidden">
                <div className="flex items-center gap-3 border-b border-line px-5 py-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded border border-line bg-surface-2 text-pine-600 dark:text-pine-300">
                    <MapIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-base font-semibold text-ink">Build a new roadmap</h2>
                    <p className="mt-0.5 text-xs text-muted">AI breaks the role into weekly milestones with daily tasks and resources.</p>
                  </div>
                </div>
                <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_220px_auto] lg:items-end">
                  <div>
                    <Input
                      label="Target role"
                      placeholder="e.g. Backend Developer"
                      list="roadmap-role-suggestions"
                      value={genRole}
                      onChange={(e) => setGenRole(e.target.value)}
                    />
                    <datalist id="roadmap-role-suggestions">
                      {ROLE_SUGGESTIONS.map((role) => (
                        <option key={role} value={role} />
                      ))}
                    </datalist>
                  </div>
                  <Select
                    label="Duration"
                    options={ROADMAP_DURATIONS.map((d) => ({ value: String(d.value), label: d.label }))}
                    value={String(genWeeks)}
                    onChange={(e) => setGenWeeks(Number(e.target.value))}
                  />
                  <Button
                    isLoading={generating}
                    disabled={!genRole.trim()}
                    leftIcon={<SparklesIcon className="h-4 w-4" />}
                    onClick={() => void handleGenerate()}
                    className="w-full lg:mb-0.5 lg:w-auto"
                  >
                    {generating ? 'Building your roadmap…' : 'Generate roadmap'}
                  </Button>
                </div>
              </Card>
            </motion.div>

            {/* Roadmap list */}
            {listLoading ? (
              <Card className="flex items-center justify-center gap-3 py-14">
                <Spinner />
                <span className="text-sm text-muted">Loading your roadmaps…</span>
              </Card>
            ) : listError ? (
              <Card className="py-10 text-center">
                <ExclamationTriangleIcon className="mx-auto mb-2 h-8 w-8 text-red-600 dark:text-red-400" />
                <p className="mb-4 text-sm text-muted">{listError}</p>
                <Button variant="secondary" leftIcon={<ArrowPathIcon className="h-4 w-4" />} onClick={() => setRefreshKey((k) => k + 1)}>
                  Retry
                </Button>
              </Card>
            ) : roadmaps.length === 0 ? (
              <EmptyState
                icon={<MapIcon className="h-9 w-9" />}
                title="No roadmaps yet"
                description="Pick a target role and a timeline above — you'll get a structured week-by-week plan you can actually follow."
                action={
                  <Button leftIcon={<SparklesIcon className="h-4 w-4" />} onClick={focusGenerate}>
                    Build my first roadmap
                  </Button>
                }
              />
            ) : (
              <>
                <Card padding="none" className="overflow-hidden">
                  {roadmaps.map((roadmap) => (
                    <div key={roadmap.id} className="border-b border-line p-4 last:border-b-0 sm:p-5">
                      <div className="flex flex-wrap items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-line bg-surface-2 text-pine-600 dark:text-pine-300">
                          <MapIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-sm font-semibold text-ink" title={roadmap.target_role}>{roadmap.target_role}</h3>
                            {roadmap.demo && <Badge variant="yellow">Demo</Badge>}
                          </div>
                          <p className="mt-0.5 text-xs text-muted">Created {formatDate(roadmap.created_at)}</p>
                          <div className="mt-2.5 flex flex-wrap items-center gap-2">
                            <Badge variant="blue">
                              <CalendarDaysIcon className="h-3 w-3" />
                              {roadmap.duration_weeks} weeks
                            </Badge>
                            <Badge variant="gray">
                              <RectangleStackIcon className="h-3 w-3" />
                              {roadmap.task_count} tasks
                            </Badge>
                          </div>
                          <div className="mt-3 flex items-center gap-3">
                            <div className="w-full max-w-xs">
                              <ProgressBar value={roadmap.completion_percentage} />
                            </div>
                            <span className="text-xs font-semibold tabular-nums text-ink">
                              {Math.round(roadmap.completion_percentage)}%
                            </span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button size="sm" onClick={() => void openRoadmap(roadmap.id)}>
                            Open
                          </Button>
                          <button
                            onClick={() => setDeleteTarget(roadmap)}
                            className="rounded p-2 text-muted transition-colors hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                            aria-label={`Delete ${roadmap.target_role} roadmap`}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </Card>
                {(hasPrev || hasNext) && (
                  <div className="flex items-center justify-between gap-3 pt-5">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={!hasPrev}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      leftIcon={<ChevronLeftIcon className="h-4 w-4" />}
                    >
                      Previous
                    </Button>
                    <span className="text-xs font-medium tabular-nums text-muted">Page {page} · {count} roadmaps</span>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={!hasNext}
                      onClick={() => setPage((p) => p + 1)}
                      rightIcon={<ChevronRightIcon className="h-4 w-4" />}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="detail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Button variant="ghost" size="sm" className="-ml-2 mb-4" leftIcon={<ArrowLeftIcon className="h-4 w-4" />} onClick={backToList}>
              All roadmaps
            </Button>

            {detailLoading ? (
              <PageLoader label="Loading your roadmap…" />
            ) : detailError ? (
              <Card className="py-10 text-center">
                <ExclamationTriangleIcon className="mx-auto mb-2 h-8 w-8 text-red-600 dark:text-red-400" />
                <p className="mb-4 text-sm text-muted">{detailError}</p>
                <Button
                  variant="secondary"
                  leftIcon={<ArrowPathIcon className="h-4 w-4" />}
                  onClick={() => detailId !== null && void openRoadmap(detailId)}
                >
                  Retry
                </Button>
              </Card>
            ) : detail ? (
              <div className="space-y-6">
                {/* Plan cover */}
                <Card padding="none">
                  <div className="grid sm:grid-cols-[1fr_auto]">
                    <div className="p-6">
                      <p className="eyebrow">Learning plan</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <h1 className="font-display text-xl font-bold tracking-tight text-ink sm:text-2xl">{detail.target_role}</h1>
                        {detail.demo && <Badge variant="yellow">Demo plan</Badge>}
                      </div>
                      <p className="mt-1 text-sm text-muted">
                        {detail.duration_weeks}-week plan · created {formatDate(detail.created_at)}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Badge variant="green" size="md">
                          <CheckIcon className="h-3.5 w-3.5" />
                          {completedCount}/{detail.tasks.length} tasks done
                        </Badge>
                        <Badge variant="blue" size="md">
                          <ClockIcon className="h-3.5 w-3.5" />
                          ~{totalHours}h total effort
                        </Badge>
                        <Badge variant="accent" size="md">
                          <CalendarDaysIcon className="h-3.5 w-3.5" />
                          {weeks.length} weeks
                        </Badge>
                      </div>
                      <div className="mt-5 flex items-center gap-3">
                        <ProgressBar value={detail.completion_percentage} />
                        <span className="text-sm font-semibold tabular-nums text-ink">{Math.round(detail.completion_percentage)}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center border-t border-line bg-surface-2/40 p-6 sm:border-l sm:border-t-0">
                      <ScoreRing score={detail.completion_percentage} size={110} label="Complete" />
                    </div>
                  </div>
                </Card>

                {/* Weeks */}
                {weeks.length === 0 ? (
                  <EmptyState
                    icon={<RectangleStackIcon className="h-9 w-9" />}
                    title="This roadmap has no tasks"
                    description="Try generating a new roadmap for this role."
                    action={<Button variant="secondary" onClick={backToList}>Back to roadmaps</Button>}
                  />
                ) : (
                  weeks.map(({ week, tasks, done }) => (
                    <section key={week}>
                      <div className="mb-2.5 flex items-center gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-pine-500 font-display text-[11px] font-bold text-paper dark:bg-pine-400 dark:text-graphite-950">
                          {week}
                        </span>
                        <h2 className="shrink-0 font-display text-sm font-semibold text-ink">Week {week}</h2>
                        <div className="hidden max-w-[160px] flex-1 sm:block">
                          <ProgressBar value={tasks.length ? (done / tasks.length) * 100 : 0} />
                        </div>
                        <Badge variant={done === tasks.length && tasks.length > 0 ? 'green' : 'gray'} className="ml-auto">
                          {done}/{tasks.length} done
                        </Badge>
                      </div>
                      <Card padding="none" className="overflow-hidden">
                        {tasks.map((task) => (
                          <div
                            key={task.id}
                            className={clsx(
                              'border-b border-line p-4 transition-colors last:border-b-0',
                              task.status === 'completed' && 'bg-sage-200/25 dark:bg-pine-800/15'
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <TaskStatusButton
                                task={task}
                                busy={updatingTaskIds.has(task.id)}
                                onCycle={() => void cycleTask(task)}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3
                                    className={clsx(
                                      'text-sm font-semibold',
                                      task.status === 'completed'
                                        ? 'text-muted line-through decoration-pine-500/50'
                                        : 'text-ink'
                                    )}
                                  >
                                    {task.title}
                                  </h3>
                                  <Badge variant={PRIORITY_VARIANT[task.priority]}>{task.priority}</Badge>
                                  {task.status === 'in_progress' && <Badge variant="yellow">In progress</Badge>}
                                </div>
                                {task.description && (
                                  <p className="mt-1 text-sm leading-relaxed text-muted">{task.description}</p>
                                )}
                                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted">
                                  {task.day_number !== null && (
                                    <span className="inline-flex items-center gap-1">
                                      <CalendarDaysIcon className="h-3.5 w-3.5" />
                                      Day {task.day_number}
                                    </span>
                                  )}
                                  <span className="inline-flex items-center gap-1">
                                    <ClockIcon className="h-3.5 w-3.5" />
                                    {task.estimated_hours}h
                                  </span>
                                  {task.resource_url && (
                                    <a
                                      href={task.resource_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 font-semibold text-pine-600 hover:underline dark:text-pine-300"
                                    >
                                      Resource
                                      <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                                    </a>
                                  )}
                                  {task.status === 'completed' && task.completed_at && (
                                    <span className="inline-flex items-center gap-1 text-pine-700 dark:text-pine-300">
                                      <CheckIcon className="h-3.5 w-3.5" />
                                      Completed {formatDate(task.completed_at)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </Card>
                    </section>
                  ))
                )}
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <Modal open={deleteTarget !== null} onClose={() => !deleting && setDeleteTarget(null)} title="Delete roadmap?">
        <p className="text-sm leading-relaxed text-muted">
          The <span className="font-semibold text-ink">{deleteTarget?.target_role}</span> roadmap and all its task
          progress will be permanently removed. This cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="danger" isLoading={deleting} leftIcon={<TrashIcon className="h-4 w-4" />} onClick={() => void confirmDelete()}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
