import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ArrowPathIcon,
  BriefcaseIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  FunnelIcon,
  LightBulbIcon,
  MinusIcon,
  PlusIcon,
  QueueListIcon,
  SparklesIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Input, Select } from '../components/ui/Input';
import { PageHeader } from '../components/ui/PageHeader';
import { Spinner } from '../components/ui/Spinner';
import { interviewService } from '../services/interviewService';
import { DIFFICULTIES, QUESTION_CATEGORIES, ROLE_SUGGESTIONS } from '../utils/constants';
import { clsx, extractErrorMessage, timeAgo } from '../utils/helpers';
import type { Difficulty, PracticeQuestion, QuestionCategory } from '../types';

const PAGE_SIZE = 10;

const CATEGORY_VARIANT: Record<QuestionCategory, 'accent' | 'blue' | 'green' | 'yellow' | 'gray'> = {
  hr: 'accent',
  technical: 'blue',
  coding: 'green',
  behavioral: 'yellow',
  situational: 'gray',
};

const DIFFICULTY_VARIANT: Record<Difficulty, 'green' | 'yellow' | 'red'> = {
  beginner: 'green',
  intermediate: 'yellow',
  advanced: 'red',
};

const CATEGORY_LABELS = Object.fromEntries(QUESTION_CATEGORIES.map((c) => [c.value, c.label]));
const DIFFICULTY_LABELS = Object.fromEntries(DIFFICULTIES.map((d) => [d.value, d.label]));

export default function PracticeQuestions() {
  // List state
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<QuestionCategory | ''>('');
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | ''>('');

  // Generate form
  const [genCategory, setGenCategory] = useState<QuestionCategory>('technical');
  const [genDifficulty, setGenDifficulty] = useState<Difficulty>('intermediate');
  const [genRole, setGenRole] = useState('');
  const [genCount, setGenCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [lastDemo, setLastDemo] = useState<boolean | null>(null);

  // Expanded answers
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const generateRef = useRef<HTMLDivElement>(null);

  const loadQuestions = useCallback(
    async (p: number, category: QuestionCategory | '', difficulty: Difficulty | '') => {
      setLoading(true);
      setError(null);
      try {
        const data = await interviewService.getPracticeQuestions(
          p,
          category || undefined,
          difficulty || undefined
        );
        setQuestions(data.results);
        setCount(data.count);
        setHasNext(data.next !== null);
        setHasPrev(data.previous !== null);
      } catch (err) {
        setError(extractErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadQuestions(page, categoryFilter, difficultyFilter);
  }, [page, categoryFilter, difficultyFilter, refreshKey, loadQuestions]);

  const toggleExpanded = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const data = await interviewService.generatePractice(
        genCategory,
        genDifficulty,
        genRole.trim() || undefined,
        genCount
      );
      toast.success(`Generated ${data.questions.length} practice question${data.questions.length === 1 ? '' : 's'}`);
      setLastDemo(data.demo);
      setCategoryFilter('');
      setDifficultyFilter('');
      setPage(1);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  const focusGenerate = () => {
    generateRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => {
      generateRef.current?.querySelector<HTMLSelectElement>('select')?.focus();
    }, 350);
  };

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const filtersActive = categoryFilter !== '' || difficultyFilter !== '';

  return (
    <div>
      <PageHeader
        eyebrow="Question bank"
        title="Practice questions"
        subtitle="Build a personal bank with ideal answers and keyword checklists, then drill until answering feels natural."
        actions={count > 0 ? <Badge variant="blue" size="md">{count} question{count === 1 ? '' : 's'}</Badge> : undefined}
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
              <SparklesIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-semibold text-ink">Generate a fresh set</h2>
              <p className="mt-0.5 text-xs text-muted">Tailored questions with ideal answers and keywords, saved to your bank.</p>
            </div>
          </div>

          <div className="p-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Select
                label="Category"
                options={QUESTION_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
                value={genCategory}
                onChange={(e) => setGenCategory(e.target.value as QuestionCategory)}
              />
              <Select
                label="Difficulty"
                options={DIFFICULTIES.map((d) => ({ value: d.value, label: d.label }))}
                value={genDifficulty}
                onChange={(e) => setGenDifficulty(e.target.value as Difficulty)}
              />
              <div>
                <Input
                  label="Role (optional)"
                  placeholder="e.g. Data Scientist"
                  list="practice-role-suggestions"
                  value={genRole}
                  onChange={(e) => setGenRole(e.target.value)}
                />
                <datalist id="practice-role-suggestions">
                  {ROLE_SUGGESTIONS.map((role) => (
                    <option key={role} value={role} />
                  ))}
                </datalist>
              </div>
              <div>
                <span className="mb-1.5 block text-[13px] font-semibold text-ink">Count</span>
                <div className="flex items-stretch overflow-hidden rounded-md border border-line bg-surface">
                  <button
                    type="button"
                    aria-label="Decrease question count"
                    disabled={genCount <= 1}
                    onClick={() => setGenCount((c) => Math.max(1, c - 1))}
                    className="px-3 text-muted transition-colors hover:bg-surface-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <MinusIcon className="h-4 w-4" />
                  </button>
                  <span className="flex flex-1 items-center justify-center border-x border-line py-2.5 font-display text-sm font-bold tabular-nums text-ink">
                    {genCount}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase question count"
                    disabled={genCount >= 10}
                    onClick={() => setGenCount((c) => Math.min(10, c + 1))}
                    className="px-3 text-muted transition-colors hover:bg-surface-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              <div className="text-xs leading-relaxed text-muted">
                {lastDemo === true ? (
                  <span className="inline-flex flex-wrap items-center gap-2">
                    <Badge variant="yellow">Demo</Badge>
                    Generated with heuristic demo AI — add a Gemini key on the backend for fully tailored questions.
                  </span>
                ) : (
                  <span>1–10 questions per set. New questions are added to the top of your bank.</span>
                )}
              </div>
              <Button
                isLoading={generating}
                leftIcon={<SparklesIcon className="h-4 w-4" />}
                onClick={() => void handleGenerate()}
                className="w-full sm:w-auto"
              >
                {generating ? 'Generating…' : 'Generate questions'}
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Filter bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="mb-4 flex flex-col gap-3 border-y border-line py-3 sm:flex-row sm:items-center"
      >
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
          <FunnelIcon className="h-3.5 w-3.5" />
          Filter
        </span>
        <div className="grid flex-1 gap-3 sm:grid-cols-2">
          <Select
            aria-label="Filter by category"
            options={[{ value: '', label: 'All categories' }, ...QUESTION_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))]}
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value as QuestionCategory | '');
              setPage(1);
            }}
          />
          <Select
            aria-label="Filter by difficulty"
            options={[{ value: '', label: 'All difficulties' }, ...DIFFICULTIES.map((d) => ({ value: d.value, label: d.label }))]}
            value={difficultyFilter}
            onChange={(e) => {
              setDifficultyFilter(e.target.value as Difficulty | '');
              setPage(1);
            }}
          />
        </div>
        {filtersActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCategoryFilter('');
              setDifficultyFilter('');
              setPage(1);
            }}
          >
            Clear
          </Button>
        )}
      </motion.div>

      {/* Question list */}
      {loading ? (
        <Card className="flex items-center justify-center gap-3 py-14">
          <Spinner />
          <span className="text-sm text-muted">Loading your question bank…</span>
        </Card>
      ) : error ? (
        <Card className="py-10 text-center">
          <ExclamationTriangleIcon className="mx-auto mb-2 h-8 w-8 text-red-600 dark:text-red-400" />
          <p className="mb-4 text-sm text-muted">{error}</p>
          <Button
            variant="secondary"
            leftIcon={<ArrowPathIcon className="h-4 w-4" />}
            onClick={() => setRefreshKey((k) => k + 1)}
          >
            Retry
          </Button>
        </Card>
      ) : questions.length === 0 ? (
        <EmptyState
          icon={<QueueListIcon className="h-9 w-9" />}
          title={filtersActive ? 'No questions match your filters' : 'No questions yet'}
          description={
            filtersActive
              ? 'Try widening the category or difficulty — or generate a set that matches.'
              : 'Generate your first set and start drilling with ideal answers and keyword checklists.'
          }
          action={
            filtersActive ? (
              <div className="flex flex-wrap justify-center gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setCategoryFilter('');
                    setDifficultyFilter('');
                    setPage(1);
                  }}
                >
                  Clear filters
                </Button>
                <Button leftIcon={<SparklesIcon className="h-4 w-4" />} onClick={focusGenerate}>
                  Generate a set
                </Button>
              </div>
            ) : (
              <Button leftIcon={<SparklesIcon className="h-4 w-4" />} onClick={focusGenerate}>
                Generate your first set
              </Button>
            )
          }
        />
      ) : (
        <div>
          <Card padding="none" className="overflow-hidden">
            {questions.map((q, i) => {
              const isOpen = expanded.has(q.id);
              return (
                <div key={q.id} className="border-b border-line p-4 last:border-b-0 sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded border border-line bg-surface-2 font-display text-[11px] font-bold tabular-nums text-muted">
                      {(page - 1) * PAGE_SIZE + i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-1.5">
                        <Badge variant={CATEGORY_VARIANT[q.category]}>{CATEGORY_LABELS[q.category] ?? q.category}</Badge>
                        <Badge variant={DIFFICULTY_VARIANT[q.difficulty]}>{DIFFICULTY_LABELS[q.difficulty] ?? q.difficulty}</Badge>
                        {q.role && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted">
                            <BriefcaseIcon className="h-3.5 w-3.5" />
                            {q.role}
                          </span>
                        )}
                        <span className="ml-auto text-xs text-muted">{timeAgo(q.created_at)}</span>
                      </div>
                      <p className="text-sm font-medium leading-relaxed text-ink sm:text-[15px]">{q.question}</p>

                      <button
                        onClick={() => toggleExpanded(q.id)}
                        aria-expanded={isOpen}
                        className={clsx(
                          'mt-3 inline-flex items-center gap-1.5 text-xs font-semibold transition-colors',
                          isOpen ? 'text-pine-600 dark:text-pine-300' : 'text-muted hover:text-ink'
                        )}
                      >
                        <EyeIcon className="h-4 w-4" />
                        {isOpen ? 'Hide ideal answer' : 'Reveal ideal answer'}
                        <ChevronDownIcon className={clsx('h-4 w-4 transition-transform duration-200', isOpen && 'rotate-180')} />
                      </button>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            key="answer"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 rounded border border-pine-500/15 bg-sage-200/30 p-4 dark:bg-pine-800/15">
                              <div className="mb-2 flex items-center gap-2">
                                <LightBulbIcon className="h-4 w-4 text-clay-500" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">Ideal answer</span>
                              </div>
                              <p className="whitespace-pre-line text-sm leading-relaxed text-ink/80 dark:text-paper/80">{q.ideal_answer}</p>
                              {q.keywords.length > 0 && (
                                <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-pine-500/10 pt-3">
                                  <span className="mr-1 inline-flex items-center gap-1 text-xs font-medium text-muted">
                                    <TagIcon className="h-3.5 w-3.5" />
                                    Hit these keywords:
                                  </span>
                                  {q.keywords.map((kw) => (
                                    <Badge key={kw} variant="blue">{kw}</Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              );
            })}
          </Card>

          {/* Pagination */}
          {(hasPrev || hasNext) && (
            <div className="flex items-center justify-between gap-3 pt-4">
              <Button
                variant="secondary"
                size="sm"
                disabled={!hasPrev}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                leftIcon={<ChevronLeftIcon className="h-4 w-4" />}
              >
                Previous
              </Button>
              <span className="text-xs font-medium tabular-nums text-muted">
                Page {page} of {totalPages} · {count} questions
              </span>
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
        </div>
      )}
    </div>
  );
}
