import { motion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';
import {
  AcademicCapIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LanguageIcon,
  LightBulbIcon,
  PaintBrushIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { ScoreRing } from '../ui/ScoreRing';
import { formatDateTime } from '../../utils/helpers';
import type { ResumeAnalysis } from '../../types';

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const rise: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: 'easeOut' } },
};

function PanelHeading({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h4 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{children}</h4>
      {aside}
    </div>
  );
}

function IssueList({
  title,
  icon,
  issues,
  emptyLabel,
}: {
  title: string;
  icon: ReactNode;
  issues: string[];
  emptyLabel: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="text-graphite-500 dark:text-graphite-300">{icon}</span>
        <h4 className="text-sm font-semibold text-ink">{title}</h4>
        <Badge variant={issues.length ? 'yellow' : 'green'}>{issues.length}</Badge>
      </div>
      {issues.length === 0 ? (
        <p className="mt-2 flex items-center gap-2 text-sm text-pine-700 dark:text-pine-300">
          <CheckCircleIcon className="h-4 w-4 shrink-0" />
          {emptyLabel}
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {issues.map((issue, i) => (
            <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-muted">
              <ExclamationTriangleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-clay-500" />
              <span>{issue}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AnalysisView({ analysis }: { analysis: ResumeAnalysis }) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      {/* Cover + scores */}
      <motion.div variants={rise}>
        <Card padding="none" className="overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-line px-5 py-4">
            <div className="min-w-0">
              <h3 className="truncate font-display text-base font-semibold text-ink">{analysis.resume_filename}</h3>
              <p className="mt-0.5 text-xs text-muted">Analyzed {formatDateTime(analysis.analyzed_at)}</p>
            </div>
            {analysis.demo && (
              <Badge variant="yellow">
                <SparklesIcon className="h-3 w-3" />
                Demo analysis
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-2 divide-x divide-line bg-surface-2/40">
            <div className="flex justify-center py-6">
              <ScoreRing score={analysis.overall_score} size={112} label="Overall score" />
            </div>
            <div className="flex justify-center py-6">
              <ScoreRing score={analysis.ats_score} size={112} label="ATS compatibility" />
            </div>
          </div>
          {analysis.ats_disclaimer && (
            <p className="border-t border-line px-5 py-3 text-xs leading-relaxed text-muted">{analysis.ats_disclaimer}</p>
          )}
        </Card>
      </motion.div>

      {/* Skills */}
      <motion.div variants={rise}>
        <Card padding="none">
          <div className="border-b border-line px-5 py-3">
            <p className="eyebrow">Skills map</p>
          </div>
          <div className="grid divide-y divide-line sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <div className="p-5">
              <PanelHeading aside={<span className="text-xs tabular-nums text-muted">{analysis.skills_found.length}</span>}>
                Detected
              </PanelHeading>
              {analysis.skills_found.length === 0 ? (
                <p className="text-sm text-muted">No explicit skills detected — add a dedicated skills section.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {analysis.skills_found.map((skill) => (
                    <Badge key={skill} variant="green">{skill}</Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="p-5">
              <PanelHeading aside={<span className="text-xs tabular-nums text-muted">{analysis.missing_skills.length}</span>}>
                Worth adding
              </PanelHeading>
              {analysis.missing_skills.length === 0 ? (
                <p className="text-sm text-muted">No obvious gaps for your target role. Nice coverage.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {analysis.missing_skills.map((skill) => (
                    <Badge key={skill} variant="yellow">{skill}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Strengths & weaknesses */}
      <motion.div variants={rise}>
        <Card padding="none">
          <div className="border-b border-line px-5 py-3">
            <p className="eyebrow">Profile read</p>
          </div>
          <div className="grid divide-y divide-line sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <div className="p-5">
              <PanelHeading
                aside={
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-sage-200 text-pine-700 dark:bg-pine-800/60 dark:text-pine-200">
                    <CheckCircleIcon className="h-3.5 w-3.5" />
                  </span>
                }
              >
                Strengths
              </PanelHeading>
              <ul className="space-y-2">
                {analysis.strengths.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-muted">
                    <CheckCircleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-pine-600 dark:text-pine-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-5">
              <PanelHeading
                aside={
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-clay-500/10 text-clay-600 dark:text-clay-300">
                    <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                  </span>
                }
              >
                Weaknesses
              </PanelHeading>
              <ul className="space-y-2">
                {analysis.weaknesses.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-muted">
                    <ExclamationTriangleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-clay-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Section notes */}
      <motion.div variants={rise}>
        <Card padding="none">
          <div className="border-b border-line px-5 py-3">
            <p className="eyebrow">Section notes</p>
          </div>
          <div className="grid sm:grid-cols-2">
            <div className="border-b border-line p-5 sm:border-r">
              <div className="mb-2 flex items-center gap-2">
                <AcademicCapIcon className="h-4 w-4 text-graphite-500 dark:text-graphite-300" />
                <h4 className="text-sm font-semibold text-ink">Education</h4>
              </div>
              <p className="text-sm leading-relaxed text-muted">{analysis.education_feedback}</p>
            </div>
            <div className="border-b border-line p-5">
              <div className="mb-2 flex items-center gap-2">
                <BriefcaseIcon className="h-4 w-4 text-pine-600 dark:text-pine-300" />
                <h4 className="text-sm font-semibold text-ink">Experience</h4>
              </div>
              <p className="text-sm leading-relaxed text-muted">{analysis.experience_feedback}</p>
            </div>
            <div className="border-b border-line p-5 sm:border-b-0 sm:border-r">
              <IssueList
                title="Grammar"
                icon={<LanguageIcon className="h-4 w-4" />}
                issues={analysis.grammar_issues}
                emptyLabel="No grammar issues found."
              />
            </div>
            <div className="p-5">
              <IssueList
                title="Formatting"
                icon={<PaintBrushIcon className="h-4 w-4" />}
                issues={analysis.formatting_issues}
                emptyLabel="Formatting looks clean."
              />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Action plan */}
      <motion.div variants={rise}>
        <Card>
          <div className="mb-4 flex items-center gap-2 border-b border-line pb-3">
            <LightBulbIcon className="h-4 w-4 text-clay-500" />
            <h4 className="font-display text-base font-semibold text-ink">Action plan</h4>
          </div>
          <ol className="space-y-3">
            {analysis.improvements.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-muted">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-sage-200 font-display text-[10px] font-bold text-pine-700 dark:bg-pine-800/60 dark:text-pine-200">
                  {i + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </Card>
      </motion.div>

      {/* Improved summary */}
      {analysis.improved_summary && (
        <motion.div variants={rise}>
          <Card className="bg-sage-200/30 dark:bg-pine-800/15">
            <div className="mb-2 flex items-center gap-2">
              <SparklesIcon className="h-4 w-4 text-pine-600 dark:text-pine-300" />
              <h4 className="font-display text-base font-semibold text-ink">Suggested professional summary</h4>
            </div>
            <blockquote className="border-l-2 border-pine-500 pl-4 text-sm italic leading-relaxed text-ink/75 dark:text-paper/75">
              {analysis.improved_summary}
            </blockquote>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
