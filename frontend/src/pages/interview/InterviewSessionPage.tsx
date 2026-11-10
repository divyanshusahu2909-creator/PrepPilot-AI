import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ClockIcon,
  PaperAirplaneIcon,
  ChevronDownIcon,
  ArrowRightIcon,
  FlagIcon,
  XCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Input';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { ScoreRing } from '../../components/ui/ScoreRing';
import { Modal } from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Spinner';
import { interviewService } from '../../services/interviewService';
import { INTERVIEW_TYPE_LABELS } from '../../utils/constants';
import { capitalize, clsx, extractErrorMessage, formatDuration } from '../../utils/helpers';
import { AnswerEvaluation, InterviewQuestion, InterviewSession } from '../../types';

type Phase = 'answer' | 'feedback';

const phaseMotion = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -18 },
  transition: { duration: 0.28, ease: 'easeOut' as const },
};

function ConsoleChip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded border border-paper/15 px-2 py-0.5 text-[11px] font-medium text-pine-100/90">
      {children}
    </span>
  );
}

export default function InterviewSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const id = Number(sessionId);

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('answer');
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<AnswerEvaluation | null>(null);
  const [nextQuestion, setNextQuestion] = useState<InterviewQuestion | null>(null);
  const [isLast, setIsLast] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showModelAnswer, setShowModelAnswer] = useState(false);
  const [showAbandon, setShowAbandon] = useState(false);
  const [abandoning, setAbandoning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [questionSeconds, setQuestionSeconds] = useState(0);

  const submittingRef = useRef(false);
  const answerRef = useRef('');
  answerRef.current = answer;

  const load = useCallback(async () => {
    if (!Number.isFinite(id)) {
      setLoadError('Invalid interview session.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const data = await interviewService.getSession(id);
      setSession(data);
      if (data.status === 'in_progress') {
        const wall = Math.max(0, Math.floor((Date.now() - new Date(data.started_at).getTime()) / 1000));
        setElapsed(Math.max(data.duration_seconds, wall));
      } else {
        setElapsed(data.duration_seconds);
      }
    } catch (err) {
      setLoadError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const currentQuestion = session?.questions.find((q) => q.answer === null) ?? null;
  const currentQuestionId = currentQuestion?.id;

  // Reset the per-question timer whenever the question changes.
  useEffect(() => {
    setQuestionSeconds(0);
  }, [currentQuestionId]);

  // Session + per-question timers.
  useEffect(() => {
    if (!session || session.status !== 'in_progress') return;
    const timer = window.setInterval(() => {
      setElapsed((s) => s + 1);
      if (phase === 'answer') setQuestionSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [session, phase]);

  // Warn before leaving with an unsent answer.
  useEffect(() => {
    if (!session || session.status !== 'in_progress' || phase !== 'answer') return;
    const handler = (e: BeforeUnloadEvent) => {
      if (answerRef.current.trim()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [session, phase]);

  const handleSubmit = async () => {
    const text = answer.trim();
    if (!session || !currentQuestion || !text || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const res = await interviewService.submitAnswer(session.id, text, questionSeconds);
      setSession(res.session);
      setEvaluation(res.evaluation);
      setNextQuestion(res.next_question);
      setIsLast(res.is_last);
      setShowModelAnswer(false);
      setPhase('feedback');
      toast.success('Answer evaluated');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const handleContinue = async () => {
    if (!session) return;
    if (isLast || !nextQuestion) {
      if (completing) return;
      setCompleting(true);
      try {
        await interviewService.completeSession(session.id);
        toast.success('Interview complete — your report is ready');
        navigate(`/interview/${session.id}/results`);
      } catch (err) {
        toast.error(extractErrorMessage(err));
        setCompleting(false);
      }
      return;
    }
    // Ensure the next question exists locally even if the response omitted it.
    setSession((prev) => {
      if (!prev) return prev;
      if (prev.questions.some((q) => q.id === nextQuestion.id)) return prev;
      return { ...prev, questions: [...prev.questions, nextQuestion] };
    });
    setAnswer('');
    setEvaluation(null);
    setNextQuestion(null);
    setIsLast(false);
    setPhase('answer');
  };

  const handleAbandon = async () => {
    if (!session || abandoning) return;
    setAbandoning(true);
    try {
      await interviewService.abandonSession(session.id);
      toast.success('Interview abandoned');
      navigate('/interview');
    } catch (err) {
      toast.error(extractErrorMessage(err));
      setAbandoning(false);
    }
  };

  if (loading) return <PageLoader label="Loading your interview…" />;

  if (loadError) {
    return (
      <Card className="mx-auto max-w-lg space-y-4 py-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-red-500/10 text-red-600 dark:text-red-400">
          <ExclamationTriangleIcon className="h-6 w-6" />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Could not load this interview</h2>
          <p className="mt-1 text-sm text-muted">{loadError}</p>
        </div>
        <div className="flex justify-center gap-3">
          <Button variant="secondary" onClick={() => navigate('/interview')}>Back to setup</Button>
          <Button onClick={load} leftIcon={<ArrowPathIcon className="h-4 w-4" />}>Retry</Button>
        </div>
      </Card>
    );
  }

  if (!session) return null;
  if (session.status === 'completed') return <Navigate to={`/interview/${session.id}/results`} replace />;

  if (session.status === 'abandoned') {
    return (
      <Card className="mx-auto max-w-lg space-y-4 py-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-surface-2 text-muted">
          <XCircleIcon className="h-6 w-6" />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">This interview was abandoned</h2>
          <p className="mt-1 text-sm text-muted">
            No report was generated for this session. Start a fresh interview whenever you are ready.
          </p>
        </div>
        <div className="flex justify-center gap-3">
          <Link to="/history"><Button variant="secondary">View history</Button></Link>
          <Link to="/interview"><Button>Start a new interview</Button></Link>
        </div>
      </Card>
    );
  }

  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;
  const displayNumber =
    phase === 'answer'
      ? Math.min(session.answered_count + 1, session.total_questions)
      : Math.max(1, session.answered_count);
  const typeLabel = INTERVIEW_TYPE_LABELS[session.interview_type] ?? session.interview_type;
  const progressPct = session.total_questions > 0 ? (session.answered_count / session.total_questions) * 100 : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Session console */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="overflow-hidden rounded-lg bg-pine-900 text-paper shadow-soft"
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-paper/10 px-5 py-3">
          <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-pine-200/90">
            <span className="h-1.5 w-1.5 rounded-full bg-clay-400" />
            In session
          </span>
          <span className="hidden text-paper/20 sm:inline">/</span>
          <span className="text-xs font-medium text-paper/90">{typeLabel}</span>
          <ConsoleChip>{capitalize(session.difficulty)}</ConsoleChip>
          {session.role && <ConsoleChip>{session.role}</ConsoleChip>}
          {session.company && <ConsoleChip>{session.company}</ConsoleChip>}
          {session.demo && <ConsoleChip>Demo AI</ConsoleChip>}
          <div className="ml-auto flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-sm font-semibold tabular-nums text-paper">
              <ClockIcon className="h-4 w-4 text-pine-200/80" />
              {formatDuration(elapsed)}
            </span>
            <button
              type="button"
              onClick={() => setShowAbandon(true)}
              className="rounded border border-paper/15 px-2.5 py-1 text-[11px] font-semibold text-pine-100/80 transition-colors hover:border-red-300/40 hover:text-red-200"
            >
              Abandon
            </button>
          </div>
        </div>
        <div className="px-5 py-4">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-pine-100">
              Question {displayNumber} of {session.total_questions}
            </span>
            <span className="tabular-nums text-pine-200/60">
              On this question {formatDuration(questionSeconds)}
            </span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-paper/15">
            <div
              className="h-full rounded-full bg-clay-400 transition-[width] duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </motion.div>

      {/* No unanswered question but session still open — offer completion */}
      {!currentQuestion && phase === 'answer' && (
        <Card className="space-y-4 py-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-sage-200 text-pine-700 dark:bg-pine-800/60 dark:text-pine-200">
            <SparklesIcon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">All questions answered</h2>
            <p className="mt-1 text-sm text-muted">Generate your performance report to see scores and feedback.</p>
          </div>
          <Button
            onClick={handleContinue}
            isLoading={completing}
            leftIcon={<FlagIcon className="h-5 w-5" />}
          >
            {completing ? 'Generating report…' : 'Finish and get report'}
          </Button>
        </Card>
      )}

      <AnimatePresence mode="wait">
        {phase === 'answer' && currentQuestion && (
          <motion.div key={`answer-${currentQuestion.id}`} {...phaseMotion} className="space-y-5">
            <Card className="relative pl-6">
              <span className="absolute inset-y-5 left-0 w-0.5 rounded-full bg-pine-500/70" aria-hidden="true" />
              <div className="flex flex-wrap items-center gap-2">
                <p className="eyebrow">Question {displayNumber}</p>
                <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
                  · {capitalize(currentQuestion.category)}
                </span>
              </div>
              <p className="mt-3 font-display text-xl font-semibold leading-snug tracking-tight text-ink sm:text-[26px]">
                {currentQuestion.text}
              </p>
            </Card>

            <Card className="space-y-4">
              <Textarea
                label="Your answer"
                autoFocus
                rows={9}
                placeholder="Structure your answer: set the context, explain your actions, and finish with the result…"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={submitting}
              />
              <div className="flex flex-col justify-between gap-3 border-t border-line pt-4 sm:flex-row sm:items-center">
                <p className="text-xs tabular-nums text-muted">
                  {wordCount} {wordCount === 1 ? 'word' : 'words'} · {answer.length} characters
                  {wordCount > 0 && wordCount < 30 && (
                    <span className="ml-2 text-clay-600 dark:text-clay-300">Aim for 30+ words for a fair evaluation.</span>
                  )}
                </p>
                <Button
                  onClick={handleSubmit}
                  disabled={!answer.trim()}
                  isLoading={submitting}
                  leftIcon={<PaperAirplaneIcon className="h-4 w-4" />}
                  className="w-full sm:w-auto"
                >
                  {submitting ? 'Evaluating your answer…' : 'Submit answer'}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {phase === 'feedback' && evaluation && (
          <motion.div key={`feedback-${evaluation.id}`} {...phaseMotion} className="space-y-5">
            <Card>
              <div className="mb-5 flex items-center justify-between border-b border-line pb-3">
                <p className="eyebrow">Evaluation</p>
                <span className="text-xs text-muted">Question {displayNumber} feedback</span>
              </div>
              <div className="flex flex-col items-center gap-6 sm:flex-row">
                <div className="shrink-0 text-ink">
                  <ScoreRing score={evaluation.overall_score} size={130} label="Answer score" />
                </div>
                <div className="w-full flex-1 space-y-3">
                  {(
                    [
                      ['Relevance', evaluation.relevance_score],
                      ['Clarity', evaluation.clarity_score],
                      ['Depth', evaluation.depth_score],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-ink">{label}</span>
                        <span className="tabular-nums text-muted">{Math.round(value)}/100</span>
                      </div>
                      <ProgressBar value={value} />
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="space-y-5">
              <div>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
                  <SparklesIcon className="h-4 w-4 text-pine-600 dark:text-pine-300" />
                  Coach's note
                </h3>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted">{evaluation.feedback}</p>
              </div>

              {evaluation.suggested_answer && (
                <div className="overflow-hidden rounded-md border border-line">
                  <button
                    type="button"
                    onClick={() => setShowModelAnswer((v) => !v)}
                    className="flex w-full items-center justify-between bg-surface-2/60 px-4 py-3 text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
                    aria-expanded={showModelAnswer}
                  >
                    <span className="flex items-center gap-2">
                      <LightBulbIcon className="h-4 w-4 text-clay-500" />
                      Model answer
                    </span>
                    <ChevronDownIcon
                      className={clsx('h-4 w-4 text-muted transition-transform duration-300', showModelAnswer && 'rotate-180')}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {showModelAnswer && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <p className="whitespace-pre-line border-t border-line bg-sage-200/30 px-4 py-4 text-sm leading-relaxed text-ink/80 dark:bg-pine-800/15 dark:text-paper/80">
                          {evaluation.suggested_answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <div className="flex justify-end border-t border-line pt-4">
                <Button
                  onClick={handleContinue}
                  isLoading={completing}
                  size="lg"
                  className="w-full sm:w-auto"
                  leftIcon={isLast ? <FlagIcon className="h-5 w-5" /> : undefined}
                  rightIcon={!isLast ? <ArrowRightIcon className="h-4 w-4" /> : undefined}
                >
                  {completing
                    ? 'Generating report…'
                    : isLast
                      ? 'Finish and get report'
                      : 'Continue to next question'}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Abandon confirmation */}
      <Modal open={showAbandon} onClose={() => !abandoning && setShowAbandon(false)} title="Abandon this interview?">
        <p className="text-sm leading-relaxed text-muted">
          Your progress will be saved as abandoned and no report will be generated. This cannot be undone.
        </p>
        <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <Button variant="secondary" onClick={() => setShowAbandon(false)} disabled={abandoning}>
            Keep going
          </Button>
          <Button variant="danger" onClick={handleAbandon} isLoading={abandoning}>
            {abandoning ? 'Abandoning…' : 'Abandon interview'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
