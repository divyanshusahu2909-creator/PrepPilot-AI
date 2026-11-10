import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  ArrowPathIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  CalendarDaysIcon,
  LanguageIcon,
} from '@heroicons/react/24/outline';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ScoreRing } from '../ui/ScoreRing';
import { VOICE_MODE_LABELS } from '../../utils/constants';
import { formatDate, formatDuration } from '../../utils/helpers';
import { CommunicationReport, VoiceSession } from '../../types';

interface VoiceReportViewProps {
  session: VoiceSession;
  report: CommunicationReport;
  onNewSession: () => void;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: 'easeOut' as const } },
};

export function VoiceReportView({ session, report, onNewSession }: VoiceReportViewProps) {
  const navigate = useNavigate();

  const metrics: Array<{ label: string; value: number }> = [
    { label: 'Fluency', value: report.fluency_score },
    { label: 'Grammar', value: report.grammar_score },
    { label: 'Pronunciation', value: report.pronunciation_score },
    { label: 'Confidence', value: report.confidence_score },
    { label: 'Vocabulary', value: report.vocabulary_score },
  ];

  const userMessages = session.messages.filter((m) => m.speaker === 'user').length;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Report cover */}
      <motion.div variants={item}>
        <Card padding="none" className="overflow-hidden">
          <div className="grid md:grid-cols-[210px_1fr]">
            <div className="flex flex-col items-center justify-center gap-4 border-b border-line bg-surface-2/50 px-6 py-8 md:border-b-0 md:border-r">
              <ScoreRing score={report.overall_score} size={150} label="Communication score" />
              <p className="text-center text-[11px] uppercase tracking-[0.14em] text-muted">
                {userMessages} {userMessages === 1 ? 'answer' : 'answers'}
              </p>
            </div>
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <p className="eyebrow">Voice report</p>
                <span className="text-muted/60">·</span>
                <p className="text-[11px] uppercase tracking-[0.12em] text-muted">{formatDate(report.created_at)}</p>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2.5">
                <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-[30px]">Session report</h1>
                {session.demo && <Badge variant="yellow" size="md">Demo AI</Badge>}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted">{report.detailed_feedback}</p>
              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
                <Badge variant="accent">{VOICE_MODE_LABELS[session.mode] ?? session.mode}</Badge>
                {session.topic && <Badge variant="blue">{session.topic}</Badge>}
                <Badge variant="gray"><ClockIcon className="h-3.5 w-3.5" />{formatDuration(session.duration_seconds)}</Badge>
                <Badge variant="gray">
                  <ChatBubbleLeftRightIcon className="h-3.5 w-3.5" />
                  {userMessages} {userMessages === 1 ? 'answer' : 'answers'}
                </Badge>
                <Badge variant="gray"><CalendarDaysIcon className="h-3.5 w-3.5" />{formatDate(report.created_at)}</Badge>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Metric ledger */}
      <motion.div variants={item}>
        <Card padding="none" className="overflow-hidden">
          <div className="border-b border-line px-5 py-3">
            <p className="eyebrow">Communication ledger</p>
          </div>
          <div className="grid grid-cols-2 gap-px bg-line/70 md:grid-cols-3 lg:grid-cols-5">
            {metrics.map((m) => (
              <div key={m.label} className="flex justify-center bg-surface px-3 py-5 text-ink">
                <ScoreRing score={m.value} size={80} label={m.label} />
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Strengths & improvements */}
      <motion.div variants={item}>
        <Card padding="none">
          <div className="border-b border-line px-5 py-3">
            <p className="eyebrow">Assessor notes</p>
          </div>
          <div className="grid divide-y divide-line md:grid-cols-2 md:divide-x md:divide-y-0">
            <div className="p-5">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded bg-sage-200 text-pine-700 dark:bg-pine-800/60 dark:text-pine-200">
                  <CheckCircleIcon className="h-4 w-4" />
                </span>
                <h3 className="font-display text-sm font-semibold text-ink">Strengths</h3>
              </div>
              {report.strengths.length === 0 ? (
                <p className="text-sm text-muted">Keep practicing to unlock strength insights.</p>
              ) : (
                <ul className="space-y-2.5">
                  {report.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-muted">
                      <CheckCircleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-pine-600 dark:text-pine-300" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="p-5">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded bg-clay-500/10 text-clay-600 dark:text-clay-300">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                </span>
                <h3 className="font-display text-sm font-semibold text-ink">Areas to improve</h3>
              </div>
              {report.improvements.length === 0 ? (
                <p className="text-sm text-muted">No improvement areas flagged — excellent work.</p>
              ) : (
                <ul className="space-y-2.5">
                  {report.improvements.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-muted">
                      <ExclamationTriangleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-clay-500" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Grammar corrections */}
      <motion.div variants={item}>
        <Card padding="none">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <div className="flex items-center gap-2">
              <LanguageIcon className="h-4 w-4 text-pine-600 dark:text-pine-300" />
              <h3 className="font-display text-sm font-semibold text-ink">Grammar corrections</h3>
            </div>
            <span className="text-xs tabular-nums text-muted">{report.grammar_corrections.length}</span>
          </div>
          {report.grammar_corrections.length === 0 ? (
            <p className="flex items-center gap-2 px-5 py-5 text-sm text-pine-700 dark:text-pine-300">
              <CheckCircleIcon className="h-4 w-4" />
              No grammar corrections needed — clean, accurate speaking.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {report.grammar_corrections.map((c, i) => (
                <li key={i} className="space-y-1.5 px-5 py-3.5">
                  <p className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-red-600 line-through dark:text-red-400">{c.original}</span>
                    <ArrowRightIcon className="h-3.5 w-3.5 shrink-0 text-muted" />
                    <span className="font-semibold text-pine-700 dark:text-pine-300">{c.corrected}</span>
                  </p>
                  <p className="text-xs leading-relaxed text-muted">{c.explanation}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </motion.div>

      {/* Actions */}
      <motion.div variants={item} className="flex flex-col gap-3 border-t border-line pb-4 pt-6 sm:flex-row">
        <Button size="lg" onClick={onNewSession} leftIcon={<ArrowPathIcon className="h-4 w-4" />}>
          New session
        </Button>
        <Button size="lg" variant="secondary" onClick={() => navigate('/history')} leftIcon={<ClockIcon className="h-4 w-4" />}>
          History
        </Button>
      </motion.div>
    </motion.div>
  );
}
