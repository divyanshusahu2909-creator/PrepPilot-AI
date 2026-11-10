import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MicrophoneIcon,
  DocumentMagnifyingGlassIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Logo } from '../ui/Logo';

const BULLETS = [
  {
    icon: DocumentMagnifyingGlassIcon,
    title: 'A resume that reads well',
    text: 'ATS scoring, skill gaps, and rewrite suggestions in seconds.',
  },
  {
    icon: MicrophoneIcon,
    title: 'A voice that holds up',
    text: 'Speak with a real-time coach and sharpen fluency and confidence.',
  },
  {
    icon: ChartBarIcon,
    title: 'Progress you can see',
    text: 'Score trends and weekly roadmaps that keep you moving forward.',
  },
];

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export default function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex min-h-screen bg-base">
      {/* ---------------- Form area ---------------- */}
      <div className="flex min-h-screen flex-1 flex-col">
        <div className="px-6 pt-6 lg:px-10 lg:pt-8">
          <Link to="/" className="inline-flex w-fit rounded-sm" aria-label="PrepPilot home">
            <Logo />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-[420px]"
          >
            <div className="mb-7">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="h-px w-6 bg-accent-500" />
                <span className="eyebrow text-accent-500">Account access</span>
              </div>
              <h1 className="font-display text-[28px] font-bold leading-tight tracking-tight text-ink sm:text-[32px]">
                {title}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p>
            </div>
            {children}
          </motion.div>
        </div>

        <div className="px-6 pb-6 text-center text-[11px] text-muted lg:px-10">
          © {new Date().getFullYear()} PrepPilot. Practice deliberately.
        </div>
      </div>

      {/* ---------------- Brand panel (desktop only) ---------------- */}
      <div className="relative hidden w-[44%] flex-col justify-between overflow-hidden bg-pine-900 p-10 text-paper lg:flex xl:w-[46%] xl:p-14">
        <div aria-hidden="true" className="texture-paper absolute inset-0 opacity-60" />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #F7F5F0 1px, transparent 1px), linear-gradient(to bottom, #F7F5F0 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />

        <div className="relative z-10 flex items-center justify-between">
          <Logo tone="light" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-paper/50">
            Interview studio
          </span>
        </div>

        <div className="relative z-10 max-w-md">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-paper/60"
          >
            The work before the offer
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="font-display text-[34px] font-bold leading-[1.12] tracking-[-0.03em] xl:text-[42px]"
          >
            Practice like it&rsquo;s
            <br />
            the real thing.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22 }}
            className="mt-5 max-w-sm text-[15px] leading-relaxed text-paper/70"
          >
            Structured mock interviews, honest resume feedback, and a voice coach that listens —
            built for people who want the job, not just the rehearsal.
          </motion.p>

          <div className="mt-10 border-t border-paper/15">
            {BULLETS.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
                className="flex items-start gap-4 border-b border-paper/15 py-4"
              >
                <span className="mt-0.5 font-display text-[11px] font-bold tabular-nums text-clay-300">
                  0{i + 1}
                </span>
                <b.icon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-paper/60" />
                <div>
                  <p className="font-display text-[13.5px] font-semibold text-paper">{b.title}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-paper/60">{b.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.blockquote
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="relative z-10 max-w-md rounded-md bg-paper p-5 text-ink shadow-lift"
        >
          <p className="font-display text-[14px] font-semibold leading-relaxed tracking-[-0.01em]">
            &ldquo;I went from freezing on behavioral questions to three offers in six weeks. The
            voice coach changed everything.&rdquo;
          </p>
          <div className="mt-4 flex items-center gap-3 border-t border-line pt-4">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-pine-500 text-[11px] font-bold text-paper">
              AS
            </div>
            <div>
              <p className="text-[12.5px] font-semibold text-ink">Ananya Sharma</p>
              <p className="text-[11px] text-muted">Software Engineer, hired at Amazon</p>
            </div>
          </div>
        </motion.blockquote>
      </div>
    </div>
  );
}

/* Small shared inline error alert with animated presence. */
export function AuthAlert({ message }: { message: string | null }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -6, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -6, height: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
          role="alert"
        >
          <div className="mb-5 flex items-start gap-3 rounded-md border border-red-500/25 bg-red-500/[0.06] px-4 py-3">
            <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
            <p className="text-[13px] leading-relaxed text-red-700 dark:text-red-300">{message}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
