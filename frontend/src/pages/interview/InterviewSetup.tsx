import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  UserGroupIcon,
  CpuChipIcon,
  CodeBracketIcon,
  BuildingOfficeIcon,
  MinusIcon,
  PlusIcon,
  RocketLaunchIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { interviewService } from '../../services/interviewService';
import { resumeService } from '../../services/resumeService';
import { INTERVIEW_TYPES, DIFFICULTIES, ROLE_SUGGESTIONS, COMPANY_SUGGESTIONS } from '../../utils/constants';
import { extractErrorMessage, clsx } from '../../utils/helpers';
import { Difficulty, InterviewType, Resume } from '../../types';

const TYPE_ICONS: Record<InterviewType, typeof UserGroupIcon> = {
  hr: UserGroupIcon,
  technical: CpuChipIcon,
  coding: CodeBracketIcon,
  company: BuildingOfficeIcon,
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

function SectionLabel({ index, title, hint }: { index: string; title: string; hint?: string }) {
  return (
    <div className="mb-4 flex items-baseline gap-3">
      <span className="font-display text-xs font-bold tabular-nums text-pine-600 dark:text-pine-300">{index}</span>
      <div>
        <h2 className="text-sm font-semibold tracking-tight text-ink">{title}</h2>
        {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      </div>
    </div>
  );
}

export default function InterviewSetup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [interviewType, setInterviewType] = useState<InterviewType>('hr');
  const [difficulty, setDifficulty] = useState<Difficulty>('intermediate');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [count, setCount] = useState(5);
  const [resumeId, setResumeId] = useState('');
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [resumesLoading, setResumesLoading] = useState(true);
  const [resumesError, setResumesError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [errors, setErrors] = useState<{ role?: string; company?: string }>({});

  const loadResumes = () => {
    setResumesLoading(true);
    setResumesError(null);
    resumeService
      .getResumes()
      .then((data) => setResumes(data.results))
      .catch((err) => setResumesError(extractErrorMessage(err)))
      .finally(() => setResumesLoading(false));
  };

  useEffect(() => {
    const preselect = searchParams.get('resume');
    if (preselect && /^\d+$/.test(preselect)) setResumeId(preselect);
    loadResumes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const needsRole = interviewType !== 'hr';
  const selectedResume = resumes.find((r) => String(r.id) === resumeId);
  const typeLabel = INTERVIEW_TYPES.find((t) => t.value === interviewType)?.label ?? '';
  const difficultyLabel = DIFFICULTIES.find((d) => d.value === difficulty)?.label ?? '';

  const handleStart = async () => {
    if (starting) return;
    const nextErrors: { role?: string; company?: string } = {};
    if (needsRole && !role.trim()) nextErrors.role = 'Please enter the role you are interviewing for.';
    if (interviewType === 'company' && !company.trim()) nextErrors.company = 'Please enter a target company.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error(Object.values(nextErrors)[0] as string);
      return;
    }
    setStarting(true);
    try {
      const session = await interviewService.startSession({
        interview_type: interviewType,
        difficulty,
        role: role.trim() || undefined,
        company: interviewType === 'company' ? company.trim() : company.trim() || undefined,
        resume_id: resumeId ? Number(resumeId) : null,
        total_questions: count,
      });
      toast.success('Interview ready — good luck!');
      navigate(`/interview/${session.id}`);
    } catch (err) {
      toast.error(extractErrorMessage(err));
      setStarting(false);
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <motion.div variants={item}>
        <PageHeader
          eyebrow="Interview studio"
          title="Set up your session"
          subtitle="Choose the room, the pressure, and the context. Your interviewer takes it from there."
        />
      </motion.div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
        {/* Left: configuration */}
        <div className="space-y-8 lg:col-span-2">
          <motion.section variants={item}>
            <SectionLabel index="01" title="Interview format" hint="Each format changes the interviewer's tone and question pool." />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {INTERVIEW_TYPES.map((t) => {
                const Icon = TYPE_ICONS[t.value];
                const selected = interviewType === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => {
                      setInterviewType(t.value);
                      setErrors({});
                    }}
                    aria-pressed={selected}
                    className={clsx(
                      'group relative rounded-md border p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-pine-500/40',
                      selected
                        ? 'border-pine-500 bg-sage-200/50 dark:border-pine-400 dark:bg-pine-800/30'
                        : 'border-line bg-surface hover:border-graphite-400/60 dark:hover:border-graphite-500'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={clsx(
                          'flex h-9 w-9 items-center justify-center rounded transition-colors',
                          selected
                            ? 'bg-pine-500 text-paper dark:bg-pine-400 dark:text-graphite-950'
                            : 'bg-surface-2 text-muted group-hover:text-ink'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      {selected && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-pine-500 text-paper dark:bg-pine-400 dark:text-graphite-950">
                          <CheckIcon className="h-3 w-3" strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-sm font-semibold text-ink">{t.label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted">{t.description}</p>
                  </button>
                );
              })}
            </div>
          </motion.section>

          <motion.section variants={item} className="border-t border-line pt-8">
            <SectionLabel index="02" title="Difficulty" hint="Higher difficulty draws sharper follow-ups and stricter scoring." />
            <div className="inline-flex w-full rounded-md border border-line bg-surface-2/70 p-0.5 sm:w-auto">
              {DIFFICULTIES.map((d) => {
                const selected = difficulty === d.value;
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setDifficulty(d.value)}
                    aria-pressed={selected}
                    className={clsx(
                      'relative flex-1 rounded px-4 py-2 text-[13px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-pine-500/40 sm:flex-none sm:px-6',
                      selected ? 'text-paper dark:text-graphite-950' : 'text-muted hover:text-ink'
                    )}
                  >
                    {selected && (
                      <motion.span
                        layoutId="difficulty-pill"
                        className="absolute inset-0 rounded bg-pine-500 dark:bg-pine-400"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.45 }}
                      />
                    )}
                    <span className="relative z-10">{d.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.section>

          <motion.section variants={item} className="border-t border-line pt-8">
            <SectionLabel index="03" title="Target context" hint="The more specific the target, the more relevant the questions." />
            <Card>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Input
                  label={needsRole ? 'Target role *' : 'Target role (optional)'}
                  placeholder="e.g., Frontend Developer"
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value);
                    if (errors.role) setErrors((prev) => ({ ...prev, role: undefined }));
                  }}
                  list="role-suggestions"
                  error={errors.role}
                  hint={!errors.role && needsRole ? 'Questions are tailored to this role.' : undefined}
                />
                <datalist id="role-suggestions">
                  {ROLE_SUGGESTIONS.map((r) => (
                    <option key={r} value={r} />
                  ))}
                </datalist>
                <div
                  className={clsx(
                    'rounded-md transition-shadow',
                    interviewType === 'company' && 'ring-1 ring-pine-500/40 ring-offset-2 ring-offset-surface'
                  )}
                >
                  <Input
                    label={interviewType === 'company' ? 'Target company *' : 'Company (optional)'}
                    placeholder="e.g., Google"
                    value={company}
                    onChange={(e) => {
                      setCompany(e.target.value);
                      if (errors.company) setErrors((prev) => ({ ...prev, company: undefined }));
                    }}
                    list="company-suggestions"
                    error={errors.company}
                    leftIcon={<BuildingOfficeIcon className="h-5 w-5" />}
                  />
                </div>
                <datalist id="company-suggestions">
                  {COMPANY_SUGGESTIONS.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              {interviewType === 'company' && (
                <p className="mt-4 flex items-start gap-2 border-t border-line pt-4 text-xs leading-relaxed text-muted">
                  <BuildingOfficeIcon className="mt-px h-4 w-4 shrink-0 text-pine-600 dark:text-pine-300" />
                  Company-specific mode tailors questions to the culture and interview style of your target company.
                </p>
              )}
            </Card>
          </motion.section>
        </div>

        {/* Right: session brief */}
        <motion.div variants={item}>
          <Card padding="none" className="sticky top-24 overflow-hidden">
            <div className="bg-pine-900 px-5 py-5 text-paper">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-pine-200/80">Session brief</p>
              <p className="mt-1.5 font-display text-lg font-semibold">{typeLabel}</p>
              <p className="mt-1 text-xs text-pine-100/70">
                {count} questions · {difficultyLabel.toLowerCase()} · ~{count * 2}–{count * 3} min
              </p>
            </div>

            <div className="space-y-5 p-5">
              <div>
                <p className="mb-2 text-[13px] font-semibold text-ink">Number of questions</p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCount((c) => Math.max(3, c - 1))}
                    disabled={count <= 3}
                    aria-label="Fewer questions"
                    className="flex h-9 w-9 items-center justify-center rounded border border-line bg-surface text-ink transition-colors hover:border-pine-500/50 hover:text-pine-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:text-pine-300"
                  >
                    <MinusIcon className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                  <div className="flex-1 text-center">
                    <span className="font-display text-2xl font-bold tabular-nums text-ink">{count}</span>
                    <span className="ml-1.5 text-xs text-muted">of 10</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCount((c) => Math.min(10, c + 1))}
                    disabled={count >= 10}
                    aria-label="More questions"
                    className="flex h-9 w-9 items-center justify-center rounded border border-line bg-surface text-ink transition-colors hover:border-pine-500/50 hover:text-pine-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:text-pine-300"
                  >
                    <PlusIcon className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              <div className="border-t border-line pt-5">
                <Select
                  label="Resume context (optional)"
                  value={resumeId}
                  onChange={(e) => setResumeId(e.target.value)}
                  disabled={resumesLoading}
                  options={[
                    { value: '', label: resumesLoading ? 'Loading resumes…' : 'No resume — general questions' },
                    ...resumes.map((r) => ({ value: String(r.id), label: r.filename })),
                  ]}
                />
                {resumesError ? (
                  <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                    Could not load resumes.{' '}
                    <button type="button" onClick={loadResumes} className="underline underline-offset-2">
                      Retry
                    </button>
                  </p>
                ) : (
                  <p className="mt-1.5 flex items-start gap-1.5 text-xs leading-relaxed text-muted">
                    <DocumentTextIcon className="mt-px h-3.5 w-3.5 shrink-0" />
                    {selectedResume
                      ? 'Questions will reference your resume experience.'
                      : 'Upload a resume in Resume Analyzer for personalised questions.'}
                  </p>
                )}
              </div>

              <dl className="divide-y divide-line border-y border-line text-sm">
                <div className="flex items-center justify-between gap-2 py-2.5">
                  <dt className="text-muted">Format</dt>
                  <dd>
                    <Badge variant="accent">{typeLabel}</Badge>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2 py-2.5">
                  <dt className="text-muted">Difficulty</dt>
                  <dd>
                    <Badge variant={difficulty === 'advanced' ? 'red' : difficulty === 'intermediate' ? 'yellow' : 'green'}>
                      {difficultyLabel}
                    </Badge>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2 py-2.5">
                  <dt className="text-muted">Role</dt>
                  <dd className="max-w-[9rem] truncate font-medium text-ink">{role.trim() || 'General'}</dd>
                </div>
                {interviewType === 'company' && (
                  <div className="flex items-center justify-between gap-2 py-2.5">
                    <dt className="text-muted">Company</dt>
                    <dd className="max-w-[9rem] truncate font-medium text-ink">{company.trim() || '—'}</dd>
                  </div>
                )}
                <div className="flex items-center justify-between gap-2 py-2.5">
                  <dt className="text-muted">Est. time</dt>
                  <dd className="flex items-center gap-1 font-medium text-ink">
                    <ClockIcon className="h-4 w-4 text-muted" />~{count * 2}–{count * 3} min
                  </dd>
                </div>
              </dl>

              <div className="space-y-2">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleStart}
                  isLoading={starting}
                  leftIcon={<RocketLaunchIcon className="h-5 w-5" />}
                >
                  {starting ? 'Preparing your first question…' : 'Start interview'}
                </Button>
                <p className="text-center text-xs leading-relaxed text-muted">
                  Every answer gets instant AI scoring, feedback and a model answer.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
