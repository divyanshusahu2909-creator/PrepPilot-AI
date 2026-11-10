import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  ArrowRightIcon,
  ArrowUpTrayIcon,
  ArrowTrendingUpIcon,
  CpuChipIcon,
  CheckCircleIcon,
  DocumentMagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  MicrophoneIcon,
  ChartBarIcon,
  BookOpenIcon,
  MapIcon,
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { Navbar } from '../components/layout/Navbar';
import { ScoreRing } from '../components/ui/ScoreRing';
import { Logo } from '../components/ui/Logo';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const viewportOnce = { once: true, margin: '-60px' } as const;

const STATS = [
  { value: '120K+', label: 'Interviews practiced' },
  { value: '+31%', label: 'Average score lift' },
  { value: '12K+', label: 'Active learners' },
  { value: '4.9/5', label: 'Learner rating' },
];

const FEATURES = [
  {
    icon: DocumentMagnifyingGlassIcon,
    title: 'AI Resume Analyzer',
    text: 'ATS scoring, skill-gap detection, grammar fixes, and a rewritten summary — before a recruiter sees it.',
  },
  {
    icon: ChatBubbleLeftRightIcon,
    title: 'AI Mock Interviews',
    text: 'HR, technical, coding, and company-specific rounds tailored to your resume, with per-answer scoring.',
  },
  {
    icon: MicrophoneIcon,
    title: 'Voice & Confidence Coach',
    text: 'Real spoken conversations with feedback on pronunciation, grammar, pace, and filler words.',
  },
  {
    icon: ChartBarIcon,
    title: 'Student Dashboard',
    text: 'Score trends, daily goals, and recommendations — your progress story in one clear view.',
  },
  {
    icon: BookOpenIcon,
    title: 'Practice Question Library',
    text: 'Curated HR, technical, coding, and behavioral questions with ideal answers and keywords.',
  },
  {
    icon: MapIcon,
    title: 'Learning Roadmaps',
    text: 'Week-by-week plans for your target role, with prioritized tasks and completion tracking.',
  },
];

const VOICE_BULLETS = [
  {
    title: 'Real-time voice conversation',
    text: 'Speak naturally with an interviewer that listens, responds, and adapts.',
  },
  {
    title: 'Pronunciation & grammar feedback',
    text: 'Every sentence analyzed, with plain-English corrections.',
  },
  {
    title: 'Fluency scoring',
    text: 'Track pace, filler words, and confidence across six dimensions.',
  },
  {
    title: 'Daily speaking exercises',
    text: 'A fresh guided exercise each day to build an unbreakable habit.',
  },
];

const STEPS = [
  {
    icon: ArrowUpTrayIcon,
    number: '01',
    title: 'Upload your resume',
    text: 'Our AI reads your experience and skills, scores the document, and finds what interviewers will probe.',
  },
  {
    icon: CpuChipIcon,
    number: '02',
    title: 'Practice with AI',
    text: 'Run realistic mock interviews and voice sessions personalized to your role, difficulty, and company.',
  },
  {
    icon: ArrowTrendingUpIcon,
    number: '03',
    title: 'Track improvement',
    text: 'Watch scores climb with detailed reports, trend charts, and a roadmap that closes every gap.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Ananya Sharma',
    role: 'Software Engineer, hired at Amazon',
    initials: 'AS',
    quote:
      'I went from freezing on behavioral questions to landing three offers in six weeks. The per-answer feedback showed me exactly what to fix.',
  },
  {
    name: 'Rahul Verma',
    role: 'Final-year CS student, placed at TCS',
    initials: 'RV',
    quote:
      'The voice coach rebuilt my speaking confidence. My fluency score went from 54 to 83, and campus interviews finally felt easy.',
  },
  {
    name: 'Priya Nair',
    role: 'Data Analyst, career switcher',
    initials: 'PN',
    quote:
      'The resume analyzer caught gaps I had missed for months, and the roadmap kept me accountable.',
  },
];

const EQ_BARS = Array.from({ length: 30 }, (_, i) => 0.18 + Math.abs(Math.sin(i * 1.7)) * 0.82);

const primaryLink =
  'inline-flex items-center justify-center gap-2 rounded-md bg-pine-500 px-6 py-3 text-sm font-semibold text-paper shadow-paper transition-colors hover:bg-pine-600 dark:bg-pine-400 dark:text-graphite-950 dark:hover:bg-pine-300';
const secondaryLink =
  'inline-flex items-center justify-center gap-2 rounded-md border border-line bg-transparent px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-graphite-300 hover:bg-surface dark:hover:border-graphite-600';

export default function Landing() {
  const { hash } = useLocation();

  useEffect(() => {
    document.documentElement.classList.add('scroll-smooth');
    return () => document.documentElement.classList.remove('scroll-smooth');
  }, []);

  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(hash.slice(1));
    if (el) {
      const timer = window.setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 120);
      return () => window.clearTimeout(timer);
    }
  }, [hash]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-base text-ink">
      <Navbar />

      {/* ================= HERO ================= */}
      <section className="texture-paper relative overflow-hidden border-b border-line">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-14 sm:px-6 sm:pb-24 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <div className="flex items-center gap-3">
              <span className="h-px w-7 bg-accent-500" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-500">
                The interview studio
              </span>
            </div>

            <h1 className="mt-6 font-display text-[42px] font-extrabold leading-[1.02] tracking-[-0.04em] text-ink sm:text-[56px] lg:text-[62px]">
              Walk in prepared.
              <br />
              Walk out{' '}
              <span className="relative inline-block text-pine-600 dark:text-pine-300">
                hired.
                <span
                  aria-hidden="true"
                  className="absolute -bottom-1.5 left-0 h-[3px] w-full bg-clay-400"
                />
              </span>
            </h1>

            <p className="mt-8 max-w-lg text-[15px] leading-relaxed text-muted sm:text-base">
              Realistic mock interviews, a resume that clears ATS filters, and a voice coach that
              builds genuine speaking confidence. One quiet, focused place to prepare — and then
              walk in ready.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link to="/register" className={primaryLink}>
                Start preparing free
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link to="/login" className={secondaryLink}>
                Sign in
              </Link>
            </div>

            <div className="mt-10 flex items-center gap-4 border-t border-line pt-6">
              <div className="flex -space-x-2">
                {[
                  ['AS', 'bg-sage-300 text-pine-800'],
                  ['RV', 'bg-clay-200 text-clay-800'],
                  ['PN', 'bg-pine-200 text-pine-800'],
                  ['JK', 'bg-surface-2 text-ink'],
                ].map(([initials, tone]) => (
                  <div
                    key={initials}
                    className={`grid h-8 w-8 place-items-center rounded-full border-2 border-base text-[10px] font-bold ${tone}`}
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon key={i} className="h-3.5 w-3.5 text-clay-500" />
                  ))}
                </div>
                <p className="mt-1 text-xs text-muted">Loved by 12,000+ learners worldwide</p>
              </div>
            </div>
          </motion.div>

          {/* Session preview */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className="relative mx-auto w-full max-w-[460px] lg:mx-0 lg:justify-self-end"
          >
            <div aria-hidden="true" className="absolute -inset-x-2.5 inset-y-3 rounded-md bg-sand dark:bg-surface-2" />
            <div className="relative rounded-md border border-line bg-surface p-5 shadow-soft sm:p-6">
              <div className="flex items-center justify-between border-b border-line pb-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                    Session 03 · Behavioral
                  </p>
                  <p className="mt-1 font-display text-[13px] font-bold text-ink">
                    Frontend Developer · Intermediate
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded border border-pine-500/20 bg-pine-500/[0.07] px-2 py-1 text-[10px] font-semibold text-pine-700 dark:border-pine-500/30 dark:text-pine-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-pine-500 dark:bg-pine-300" />
                  Live
                </span>
              </div>

              <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-clay-600 dark:text-clay-400">
                Question 3 · Conflict
              </p>
              <p className="mt-2 text-[13.5px] font-medium leading-relaxed text-ink">
                Tell me about a time you resolved a conflict within your team. What was your approach,
                and what was the outcome?
              </p>

              <div className="mt-4 border-l-2 border-line pl-3.5">
                <p className="text-[12px] leading-relaxed text-muted">
                  &ldquo;During our release sprint, two teammates disagreed on the API design. I
                  organized a short working session, mapped both approaches against our latency
                  goals, and we shipped the hybrid solution two days early…&rdquo;
                </p>
              </div>

              <div className="mt-5 flex items-center gap-5 border-t border-line pt-5">
                <div className="shrink-0">
                  <ScoreRing score={86} size={78} />
                </div>
                <div className="min-w-0 flex-1 space-y-3">
                  {[
                    { label: 'Relevance', value: 90 },
                    { label: 'Clarity', value: 84 },
                    { label: 'Depth', value: 82 },
                  ].map((m) => (
                    <div key={m.label}>
                      <div className="mb-1 flex justify-between text-[10px]">
                        <span className="text-muted">{m.label}</span>
                        <span className="font-semibold tabular-nums text-ink">{m.value}</span>
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-line/70">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${m.value}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.9, delay: 0.5 }}
                          className="h-full rounded-full bg-accent-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2 rounded border border-pine-500/15 bg-sage-200/50 px-3 py-2.5 dark:border-pine-500/25 dark:bg-pine-800/40">
                <CheckCircleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-pine-600 dark:text-pine-300" />
                <p className="text-[11px] leading-relaxed text-pine-800 dark:text-pine-200">
                  Strong STAR structure. Add a measurable outcome to push this answer above 90.
                </p>
              </div>
            </div>

            <p className="mt-4 text-center text-[11px] text-muted lg:text-left">
              A real session, scored answer by answer.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ================= STATS ================= */}
      <section className="border-b border-line bg-surface-2/50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-px bg-line/70 lg:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="bg-surface-2/60 px-5 py-7 sm:px-7 sm:py-9">
                <p className="font-display text-[28px] font-bold leading-none tracking-tight text-ink sm:text-[32px]">
                  {stat.value}
                </p>
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section id="features" className="scroll-mt-24 border-b border-line py-20 sm:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.5 }}
            className="lg:sticky lg:top-28 lg:self-start"
          >
            <div className="flex items-center gap-2.5">
              <span className="font-display text-[11px] font-bold tabular-nums text-clay-500">01</span>
              <span className="h-px w-5 bg-line" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
                The product
              </span>
            </div>
            <h2 className="mt-4 font-display text-[30px] font-bold leading-[1.1] tracking-[-0.03em] text-ink sm:text-[38px]">
              One platform.
              <br />
              Every interview skill.
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              Six tools that work together — from the first resume pass to the final round — instead
              of six tabs you have to keep open.
            </p>
            <Link
              to="/register"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-pine-600 transition-colors hover:text-pine-700 dark:text-pine-300 dark:hover:text-pine-200"
            >
              Build your prep plan
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </motion.div>

          <div className="border-t border-line">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewportOnce}
                transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.25) }}
                className="group -mx-3 grid grid-cols-[auto_auto_1fr_auto] items-start gap-4 border-b border-line px-3 py-5 transition-colors hover:bg-surface-2/50 sm:gap-5 sm:py-6"
              >
                <span className="pt-0.5 font-display text-[11px] font-bold tabular-nums text-muted/70">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded border border-line bg-surface text-pine-600 dark:text-pine-300">
                  <feature.icon className="h-[17px] w-[17px]" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-[14.5px] font-bold text-ink">{feature.title}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">{feature.text}</p>
                </div>
                <ArrowRightIcon className="mt-1.5 h-4 w-4 shrink-0 text-muted/0 transition-colors group-hover:text-clay-500" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= VOICE SPOTLIGHT ================= */}
      <section className="border-b border-line bg-sage-200/35 py-20 dark:bg-pine-900/20 sm:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2.5">
              <span className="font-display text-[11px] font-bold tabular-nums text-clay-500">02</span>
              <span className="h-px w-5 bg-line" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
                Voice &amp; confidence
              </span>
            </div>
            <h2 className="mt-4 font-display text-[30px] font-bold leading-[1.1] tracking-[-0.03em] text-ink sm:text-[38px]">
              Great answers only
              <br />
              matter if you can say them.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
              Practice out loud with a coach that hears every word. It listens for pacing, fillers,
              and clarity — then tells you exactly what to work on next.
            </p>

            <ul className="mt-8 divide-y divide-line border-t border-line">
              {VOICE_BULLETS.map((bullet) => (
                <li key={bullet.title} className="grid grid-cols-[auto_1fr] gap-3 py-3.5">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-clay-500" />
                  <div>
                    <p className="text-[13.5px] font-semibold text-ink">{bullet.title}</p>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{bullet.text}</p>
                  </div>
                </li>
              ))}
            </ul>

            <Link to="/register" className={`${primaryLink} mt-8`}>
              Try the voice coach free
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="rounded-lg bg-pine-900 p-5 text-paper shadow-lift sm:p-7"
          >
            <div className="flex items-center justify-between border-b border-paper/15 pb-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-md bg-paper text-pine-700">
                  <MicrophoneIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-display text-[13px] font-semibold">Interview simulation</p>
                  <p className="text-[11px] text-paper/55">Listening to your answer…</p>
                </div>
              </div>
              <span className="rounded border border-paper/20 px-2.5 py-1 font-display text-[11px] font-semibold tabular-nums text-paper/70">
                02:14
              </span>
            </div>

            <div className="mt-7 flex h-24 items-center justify-center gap-[3px] sm:gap-1.5" aria-hidden="true">
              {EQ_BARS.map((height, i) => (
                <motion.span
                  key={i}
                  className={`w-1 rounded-full sm:w-1.5 ${i % 9 === 4 ? 'bg-clay-400' : 'bg-paper/45'}`}
                  style={{ height: `${height * 100}%` }}
                  animate={{ scaleY: [1, 0.4, 0.85, 0.55, 1] }}
                  transition={{
                    duration: 1.6 + (i % 5) * 0.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: (i % 7) * 0.12,
                  }}
                />
              ))}
            </div>

            <div className="mt-7 rounded border border-paper/15 bg-paper/[0.05] px-4 py-3">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-clay-300">
                You said
              </p>
              <p className="text-[12.5px] leading-relaxed text-paper/75">
                &ldquo;I led a team of four engineers to deliver the project ahead of schedule…&rdquo;
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {['Fluency 88', 'Grammar 91'].map((tag) => (
                <span
                  key={tag}
                  className="rounded border border-paper/20 px-2.5 py-1 text-[11px] font-semibold text-paper/70"
                >
                  {tag}
                </span>
              ))}
              <span className="rounded border border-clay-400/40 bg-clay-500/20 px-2.5 py-1 text-[11px] font-semibold text-clay-200">
                Confidence 84
              </span>
              <span className="rounded border border-paper/20 px-2.5 py-1 text-[11px] font-semibold text-paper/70">
                0 filler words
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section id="how-it-works" className="scroll-mt-24 border-b border-line py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
          >
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-display text-[11px] font-bold tabular-nums text-clay-500">03</span>
                <span className="h-px w-5 bg-line" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
                  How it works
                </span>
              </div>
              <h2 className="mt-4 font-display text-[30px] font-bold leading-[1.1] tracking-[-0.03em] text-ink sm:text-[38px]">
                From nervous to interview-ready.
              </h2>
            </div>
            <p className="max-w-xs text-[13px] leading-relaxed text-muted">
              No setup, no schedule. Start with one resume upload and move at your own pace.
            </p>
          </motion.div>

          <div className="mt-12 grid border-t border-line lg:grid-cols-3">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewportOnce}
                transition={{ duration: 0.45, delay: i * 0.1 }}
                className="border-b border-line py-8 lg:border-b-0 lg:border-r lg:px-8 lg:py-10 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0"
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded border border-line bg-surface text-pine-600 dark:text-pine-300">
                    <step.icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="font-display text-[34px] font-bold leading-none text-line dark:text-graphite-700">
                    {step.number}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-[16px] font-bold text-ink">{step.title}</h3>
                <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-muted">{step.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <section
        id="testimonials"
        className="scroll-mt-24 border-b border-line bg-surface-2/40 py-20 sm:py-28"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2.5">
              <span className="font-display text-[11px] font-bold tabular-nums text-clay-500">04</span>
              <span className="h-px w-5 bg-line" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
                Success stories
              </span>
            </div>
            <h2 className="mt-4 font-display text-[30px] font-bold leading-[1.1] tracking-[-0.03em] text-ink sm:text-[38px]">
              Learners who landed the offer.
            </h2>
          </motion.div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
            <motion.figure
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.5 }}
              className="flex flex-col justify-between rounded-lg bg-pine-900 p-7 text-paper sm:p-10"
            >
              <div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon key={i} className="h-4 w-4 text-clay-300" />
                  ))}
                </div>
                <blockquote className="mt-6 font-display text-[20px] font-semibold leading-[1.45] tracking-[-0.02em] sm:text-[24px]">
                  &ldquo;{TESTIMONIALS[0].quote}&rdquo;
                </blockquote>
              </div>
              <figcaption className="mt-8 flex items-center gap-3 border-t border-paper/15 pt-5">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-paper text-[12px] font-bold text-pine-800">
                  {TESTIMONIALS[0].initials}
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-paper">{TESTIMONIALS[0].name}</p>
                  <p className="text-[11.5px] text-paper/60">{TESTIMONIALS[0].role}</p>
                </div>
              </figcaption>
            </motion.figure>

            <div className="border-t border-line">
              {TESTIMONIALS.slice(1).map((t, i) => (
                <motion.figure
                  key={t.name}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewportOnce}
                  transition={{ duration: 0.45, delay: 0.1 + i * 0.08 }}
                  className="border-b border-line py-6 first:pt-6"
                >
                  <blockquote className="text-[13.5px] leading-relaxed text-ink/85">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-4 flex items-center gap-3">
                    <div className="grid h-8 w-8 place-items-center rounded-md border border-line bg-surface text-[10px] font-bold text-pine-700 dark:text-pine-300">
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-[12.5px] font-semibold text-ink">{t.name}</p>
                      <p className="text-[11px] text-muted">{t.role}</p>
                    </div>
                  </figcaption>
                </motion.figure>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-lg bg-pine-800 px-7 py-12 text-paper sm:px-12 sm:py-16"
          >
            <div aria-hidden="true" className="texture-paper absolute inset-0 opacity-60" />
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  'linear-gradient(to right, #F7F5F0 1px, transparent 1px), linear-gradient(to bottom, #F7F5F0 1px, transparent 1px)',
                backgroundSize: '56px 56px',
              }}
            />
            <div className="relative grid gap-9 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-paper/55">
                  Free to start
                </p>
                <h2 className="mt-4 max-w-2xl font-display text-[30px] font-bold leading-[1.12] tracking-[-0.03em] sm:text-[42px]">
                  Your next interview is coming. Be the candidate they can&rsquo;t ignore.
                </h2>
                <p className="mt-4 max-w-lg text-sm leading-relaxed text-paper/65">
                  Join 12,000+ learners practicing deliberately. No credit card, no setup fee, no
                  excuses.
                </p>
              </div>
              <div className="lg:pb-1 lg:text-right">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-paper px-7 py-3.5 text-sm font-semibold text-ink transition-colors hover:bg-sage-100"
                >
                  Start preparing free
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
                <p className="mt-3 text-[11px] text-paper/50">Set up in under two minutes</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-graphite-900 text-paper/60">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
            <div>
              <Link to="/" aria-label="PrepPilot home">
                <Logo tone="light" />
              </Link>
              <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-paper/55">
                A calm, structured interview studio for candidates who prepare like professionals.
              </p>
              <p className="mt-6 text-[11px] uppercase tracking-[0.2em] text-paper/35">
                Practice deliberately.
              </p>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-paper/35">Product</p>
              <nav className="mt-4 flex flex-col gap-2.5 text-[13px]">
                <a href="/#features" className="transition-colors hover:text-paper">Features</a>
                <a href="/#how-it-works" className="transition-colors hover:text-paper">How it works</a>
                <a href="/#testimonials" className="transition-colors hover:text-paper">Stories</a>
              </nav>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-paper/35">Account</p>
              <nav className="mt-4 flex flex-col gap-2.5 text-[13px]">
                <Link to="/login" className="transition-colors hover:text-paper">Sign in</Link>
                <Link to="/register" className="transition-colors hover:text-paper">Create account</Link>
              </nav>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-paper/10 pt-6 text-[11px] text-paper/40 sm:flex-row sm:items-center">
            <p>© {new Date().getFullYear()} PrepPilot AI. All rights reserved.</p>
            <p>Built for candidates who take the work seriously.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
