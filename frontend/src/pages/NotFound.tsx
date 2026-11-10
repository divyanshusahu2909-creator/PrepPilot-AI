import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, Squares2X2Icon } from '@heroicons/react/24/outline';
import { Logo } from '../components/ui/Logo';

export default function NotFound() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="texture-paper flex min-h-screen flex-col bg-base">
      <header className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <Link to="/" className="inline-flex w-fit rounded-sm" aria-label="PrepPilot home">
          <Logo />
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-16 sm:px-6">
        <div className="w-full max-w-lg">
          <div className="mb-6 flex items-center gap-3">
            <span className="h-px w-7 bg-clay-500" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-clay-600 dark:text-clay-400">
              Error 404
            </span>
          </div>

          <div className="relative border border-line bg-surface p-7 shadow-soft sm:p-9">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                Notice of non-arrival
              </span>
              <span className="font-display text-[13px] font-bold tabular-nums text-muted/70">404</span>
            </div>

            <h1 className="mt-7 font-display text-[30px] font-bold leading-[1.12] tracking-[-0.03em] text-ink sm:text-[36px]">
              This page missed
              <br />
              its interview.
            </h1>

            <p className="mt-4 text-sm leading-relaxed text-muted">
              The address you followed doesn&rsquo;t exist, or it has been moved. No harm done —
              your practice space is still exactly where you left it.
            </p>

            <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-pine-500 px-5 py-2.5 text-[13px] font-semibold text-paper shadow-paper transition-colors hover:bg-pine-600 dark:bg-pine-400 dark:text-graphite-950 dark:hover:bg-pine-300"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Back to home
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-line bg-transparent px-5 py-2.5 text-[13px] font-semibold text-ink transition-colors hover:border-graphite-300 hover:bg-surface-2 dark:hover:border-graphite-600"
              >
                <Squares2X2Icon className="h-4 w-4" />
                Open dashboard
              </Link>
            </div>
          </div>

          <p className="mt-5 text-center text-[11px] text-muted">
            If you followed a link from an email, it may have expired.
          </p>
        </div>
      </main>

      <footer className="mx-auto w-full max-w-6xl border-t border-line px-4 py-5 text-[11px] text-muted sm:px-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} PrepPilot AI</p>
          <p>Practice deliberately.</p>
        </div>
      </footer>
    </div>
  );
}
