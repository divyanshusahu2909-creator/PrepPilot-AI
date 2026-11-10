import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  ChevronDownIcon,
  ArrowPathIcon,
  ClockIcon,
  HomeIcon,
  CalendarDaysIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ScoreRing } from '../../components/ui/ScoreRing';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { PageLoader } from '../../components/ui/Spinner';
import { interviewService } from '../../services/interviewService';
import { INTERVIEW_TYPE_LABELS } from '../../utils/constants';
import {
  capitalize,
  clsx,
  extractErrorMessage,
  formatDate,
  formatDuration,
  scoreBadgeVariant,
} from '../../utils/helpers';
import { InterviewQuestion, InterviewReport, InterviewSession } from '../../types';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

function recommendationVariant(rec: string): 'green' | 'yellow' | 'red' {
  const r = rec.toLowerCase();
  if (r.includes('no') || r.includes('not') || r.includes('reject')) return 'red';
  if (r.includes('maybe') || r.includes('consider') || r.includes('borderline') || r.includes('lean')) return 'yellow';
  return 'green';
}

function SectionHeading({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-line pb-3">
      <h2 className="font-display text-base font-semibold tracking-tight text-ink">{title}</h2>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </div>
  );
}

function QuestionReviewItem({ question, index }: { question: InterviewQuestion; index: number }) {
  const [open, setOpen] = useState(false);
  const answer = question.answer;
  if (!answer) return null;

  const scores: Array<[string, number]> = [
    ['Overall', answer.overall_score],
    ['Relevance', answer.relevance_score],
    ['Clarity', answer.clarity_score],
    ['Depth', answer.depth_score],
  ];

  return (
    <Card padding="none" className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-surface-2/50 sm:px-5"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-sage-200 font-display text-sm font-bold text-pine-700 dark:bg-pine-800/60 dark:text-pine-200">
          {index + 1}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink">{question.text}</span>
          <span className="mt-1 flex items-center gap-2">
            <Badge variant="blue">{capitalize(question.category)}</Badge>
          </span>
        </span>
        <Badge variant={scoreBadgeVariant(answer.overall_score)} size="md" className="shrink-0">
          {Math.round(answer.overall_score)}/100
        </Badge>
        <ChevronDownIcon
          className={clsx('h-5 w-5 shrink-0 text-muted transition-transform duration-300', open && 'rotate-180')}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 border-t border-line px-4 pb-5 pt-4 sm:px-5">
              <div className="flex flex-wrap gap-2">
                {scores.map(([label, value]) => (
                  <Badge key={label} variant={scoreBadgeVariant(value)}>
                    {label}: {Math.round(value)}
                  </Badge>
                ))}
              </div>
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Your answer</p>
                <p className="whitespace-pre-line rounded border border-line bg-surface-2/60 px-4 py-3 text-sm leading-relaxed text-ink">
                  {answer.text}
                </p>
              </div>
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Feedback</p>
                <p className="text-sm leading-relaxed text-muted">{answer.feedback}</p>
              </div>
              {question.ideal_answer && (
                <div className="border-l-2 border-pine-500 bg-sage-200/30 px-4 py-3 dark:bg-pine-800/15">
                  <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-pine-700 dark:text-pine-200">
                    <LightBulbIcon className="h-3.5 w-3.5" /> Ideal answer
                  </p>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-ink/80 dark:text-paper/80">
                    {question.ideal_answer}
                  </p>
                </div>
              )}
              {question.keywords.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Key points to cover</p>
                  <div className="flex flex-wrap gap-1.5">
                    {question.keywords.map((k) => (
                      <Badge key={k} variant="accent">{k}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export default function InterviewResults() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const id = Number(sessionId);

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!Number.isFinite(id)) {
      setLoadError('Invalid interview session.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      setSession(await interviewService.getSession(id));
    } catch (err) {
      setLoadError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <PageLoader label="Loading your report…" />;

  if (loadError) {
    return (
      <Card className="mx-auto max-w-lg space-y-4 py-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-red-500/10 text-red-600 dark:text-red-400">
          <ExclamationTriangleIcon className="h-6 w-6" />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Could not load this report</h2>
          <p className="mt-1 text-sm text-muted">{loadError}</p>
        </div>
        <div className="flex justify-center gap-3">
          <Button variant="secondary" onClick={() => navigate('/history')}>Interview history</Button>
          <Button onClick={load} leftIcon={<ArrowPathIcon className="h-4 w-4" />}>Retry</Button>
        </div>
      </Card>
    );
  }

  if (!session) return null;
  if (session.status !== 'completed' || !('overall_score' in session.report)) {
    return <Navigate to={`/interview/${session.id}`} replace />;
  }

  const report = session.report as InterviewReport;
  const breakdown = report.category_breakdown;
  const radarData = [
    { subject: 'Technical', score: breakdown.technical },
    { subject: 'Communication', score: breakdown.communication },
    { subject: 'Problem solving', score: breakdown.problem_solving },
    { subject: 'Confidence', score: breakdown.confidence },
  ];
  const answeredQuestions = session.questions.filter((q) => q.answer !== null);

  const lists: Array<{
    title: string;
    entries: string[];
    icon: typeof CheckCircleIcon;
    iconClass: string;
    tileClass: string;
  }> = [
    {
      title: 'Strengths',
      entries: report.strengths,
      icon: CheckCircleIcon,
      iconClass: 'text-pine-600 dark:text-pine-300',
      tileClass: 'bg-sage-200 text-pine-700 dark:bg-pine-800/60 dark:text-pine-200',
    },
    {
      title: 'Weaknesses',
      entries: report.weaknesses,
      icon: ExclamationTriangleIcon,
      iconClass: 'text-clay-600 dark:text-clay-300',
      tileClass: 'bg-clay-500/10 text-clay-600 dark:text-clay-300',
    },
    {
      title: 'Suggestions',
      entries: report.suggestions,
      icon: LightBulbIcon,
      iconClass: 'text-graphite-500 dark:text-graphite-300',
      tileClass: 'bg-surface-2 text-graphite-500 dark:text-graphite-300',
    },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Report cover */}
      <motion.div variants={item}>
        <Card padding="none" className="overflow-hidden">
          <div className="grid md:grid-cols-[210px_1fr]">
            <div className="flex flex-col items-center justify-center gap-4 border-b border-line bg-surface-2/50 px-6 py-8 md:border-b-0 md:border-r">
              <ScoreRing score={report.overall_score} size={150} label="Overall score" />
              <p className="text-center text-[11px] uppercase tracking-[0.14em] text-muted">
                {session.answered_count} of {session.total_questions} answered
              </p>
            </div>
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <p className="eyebrow">Interview report</p>
                {session.completed_at && (
                  <>
                    <span className="text-muted/60">·</span>
                    <p className="text-[11px] uppercase tracking-[0.12em] text-muted">{formatDate(session.completed_at)}</p>
                  </>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2.5">
                <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-[30px]">
                  Performance summary
                </h1>
                <Badge variant={recommendationVariant(report.hiring_recommendation)} size="md">
                  {report.hiring_recommendation}
                </Badge>
                {report.demo && <Badge variant="yellow" size="md">Demo AI</Badge>}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted">{report.summary}</p>
              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
                <Badge variant="accent">{INTERVIEW_TYPE_LABELS[session.interview_type] ?? session.interview_type}</Badge>
                <Badge variant={session.difficulty === 'advanced' ? 'red' : session.difficulty === 'intermediate' ? 'yellow' : 'green'}>
                  {capitalize(session.difficulty)}
                </Badge>
                {session.role && (
                  <Badge variant="gray"><BriefcaseIcon className="h-3.5 w-3.5" />{session.role}</Badge>
                )}
                {session.company && (
                  <Badge variant="gray"><BuildingOfficeIcon className="h-3.5 w-3.5" />{session.company}</Badge>
                )}
                <Badge variant="gray"><ClockIcon className="h-3.5 w-3.5" />{formatDuration(session.duration_seconds)}</Badge>
                {session.completed_at && (
                  <Badge variant="gray"><CalendarDaysIcon className="h-3.5 w-3.5" />{formatDate(session.completed_at)}</Badge>
                )}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Category breakdown */}
      <motion.div variants={item} className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <SectionHeading title="Skill radar" hint="Four dimensions" />
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
                <PolarGrid stroke="rgb(var(--c-border))" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgb(var(--c-muted))', fontSize: 12 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Score" dataKey="score" stroke="#2f6f68" strokeWidth={2} fill="#2f6f68" fillOpacity={0.22} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="flex flex-col justify-center space-y-5">
          <SectionHeading title="Category breakdown" hint="Out of 100" />
          {radarData.map((d, i) => (
            <div key={d.subject}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium text-ink">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: ['#2f6f68', '#d97757', '#6fa79c', '#747a80'][i] }}
                  />
                  {d.subject}
                </span>
                <span className="tabular-nums text-muted">{Math.round(d.score)}/100</span>
              </div>
              <ProgressBar value={d.score} />
            </div>
          ))}
        </Card>
      </motion.div>

      {/* Assessor notes */}
      <motion.div variants={item}>
        <Card padding="none">
          <div className="border-b border-line px-5 py-4">
            <p className="eyebrow">Assessor notes</p>
          </div>
          <div className="grid divide-y divide-line md:grid-cols-3 md:divide-x md:divide-y-0">
            {lists.map(({ title, entries, icon: Icon, iconClass, tileClass }) => (
              <div key={title} className="p-5">
                <div className="mb-3 flex items-center gap-2.5">
                  <span className={clsx('flex h-7 w-7 items-center justify-center rounded', tileClass)}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <h3 className="font-display text-sm font-semibold text-ink">{title}</h3>
                </div>
                {entries.length === 0 ? (
                  <p className="text-sm text-muted">Nothing recorded in this section.</p>
                ) : (
                  <ul className="space-y-2.5">
                    {entries.map((entry, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-muted">
                        <Icon className={clsx('mt-0.5 h-3.5 w-3.5 shrink-0', iconClass)} />
                        <span>{entry}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Question review */}
      <motion.div variants={item} className="space-y-3">
        <SectionHeading title="Question-by-question review" hint={`${answeredQuestions.length} answers`} />
        {answeredQuestions.length === 0 ? (
          <Card className="py-8 text-center text-sm text-muted">No answered questions to review.</Card>
        ) : (
          <div className="space-y-3">
            {answeredQuestions.map((q, i) => (
              <QuestionReviewItem key={q.id} question={q} index={i} />
            ))}
          </div>
        )}
      </motion.div>

      {/* Actions */}
      <motion.div variants={item} className="flex flex-col flex-wrap gap-3 border-t border-line pb-4 pt-6 sm:flex-row">
        <Button onClick={() => navigate('/interview')} leftIcon={<ArrowPathIcon className="h-4 w-4" />} size="lg">
          Practice again
        </Button>
        <Button variant="secondary" size="lg" onClick={() => navigate('/history')} leftIcon={<ClockIcon className="h-4 w-4" />}>
          Interview history
        </Button>
        <Button variant="secondary" size="lg" onClick={() => navigate('/dashboard')} leftIcon={<HomeIcon className="h-4 w-4" />}>
          Dashboard
        </Button>
      </motion.div>
    </motion.div>
  );
}
