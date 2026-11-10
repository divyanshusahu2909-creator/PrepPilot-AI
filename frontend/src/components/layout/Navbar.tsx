import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bars3Icon, XMarkIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { Logo } from '../ui/Logo';

const LINKS = [
  { href: '/#features', label: 'Product' },
  { href: '/#how-it-works', label: 'Method' },
  { href: '/#testimonials', label: 'Stories' },
];

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-base/95 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="rounded-sm" aria-label="PrepPilot home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Main">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative text-[13px] font-medium text-muted transition-colors hover:text-ink after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-accent-500 after:transition-[width] after:duration-200 hover:after:w-full"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <button
            onClick={toggleTheme}
            className="grid h-9 w-9 place-items-center rounded-md border border-transparent text-muted transition-colors hover:border-line hover:bg-surface hover:text-ink"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <SunIcon className="h-[18px] w-[18px]" /> : <MoonIcon className="h-[18px] w-[18px]" />}
          </button>

          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center rounded-md bg-pine-500 px-4 py-2 text-[13px] font-semibold text-paper shadow-paper transition-colors hover:bg-pine-600 dark:bg-pine-400 dark:text-graphite-950 dark:hover:bg-pine-300"
            >
              Open dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden rounded-md px-3 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-surface sm:inline-flex"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="hidden items-center rounded-md bg-pine-500 px-4 py-2 text-[13px] font-semibold text-paper shadow-paper transition-colors hover:bg-pine-600 dark:bg-pine-400 dark:text-graphite-950 dark:hover:bg-pine-300 sm:inline-flex"
              >
                Get started
              </Link>
              <button
                onClick={() => setOpen((v) => !v)}
                className="grid h-9 w-9 place-items-center rounded-md border border-line text-ink md:hidden"
                aria-label={open ? 'Close menu' : 'Open menu'}
                aria-expanded={open}
              >
                {open ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
              </button>
            </>
          )}
        </div>
      </div>

      {open && !isAuthenticated && (
        <div className="border-t border-line bg-base px-4 pb-5 pt-3 md:hidden">
          <nav className="flex flex-col" aria-label="Mobile">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={close}
                className="border-b border-line/70 py-3 text-sm font-medium text-ink last:border-0"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link
              to="/login"
              onClick={close}
              className="inline-flex items-center justify-center rounded-md border border-line bg-surface px-4 py-2.5 text-[13px] font-semibold text-ink"
            >
              Log in
            </Link>
            <Link
              to="/register"
              onClick={close}
              className="inline-flex items-center justify-center rounded-md bg-pine-500 px-4 py-2.5 text-[13px] font-semibold text-paper"
            >
              Get started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
