import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  HomeIcon, DocumentTextIcon, ChatBubbleLeftRightIcon, MicrophoneIcon,
  MapIcon, QueueListIcon, ClockIcon, UserIcon, Bars3Icon, XMarkIcon,
  SunIcon, MoonIcon, ArrowRightOnRectangleIcon, ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { DemoBanner } from '../ui/DemoBanner';
import { Logo } from '../ui/Logo';
import { clsx } from '../../utils/helpers';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { path: '/resume', label: 'Resume Analyzer', icon: DocumentTextIcon },
  { path: '/interview', label: 'Mock Interview', icon: ChatBubbleLeftRightIcon },
  { path: '/voice', label: 'Voice Coach', icon: MicrophoneIcon },
  { path: '/practice', label: 'Practice Questions', icon: QueueListIcon },
  { path: '/roadmap', label: 'Learning Roadmap', icon: MapIcon },
  { path: '/history', label: 'Interview History', icon: ClockIcon },
  { path: '/profile', label: 'Profile', icon: UserIcon },
];

function NavItem({
  to, label, icon: Icon, onNavigate,
}: {
  to: string;
  label: string;
  icon: typeof HomeIcon;
  onNavigate: () => void;
}) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        clsx(
          'group flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] font-medium transition-colors',
          isActive
            ? 'bg-sage-200/70 text-pine-700 dark:bg-pine-800/45 dark:text-pine-200'
            : 'text-muted hover:bg-surface-2 hover:text-ink'
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={clsx(
              'h-[18px] w-[18px] shrink-0 transition-colors',
              isActive ? 'text-pine-600 dark:text-pine-300' : 'text-muted group-hover:text-ink'
            )}
          />
          <span className="truncate">{label}</span>
        </>
      )}
    </NavLink>
  );
}

export function AppShell() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user
    ? `${user.first_name[0] || ''}${user.last_name[0] || ''}`.toUpperCase() || user.email[0].toUpperCase()
    : '?';

  const closeMobile = () => setMobileOpen(false);

  const activeLabel =
    NAV_ITEMS.find((item) => location.pathname === item.path)?.label ??
    NAV_ITEMS.find((item) => location.pathname.startsWith(`${item.path}/`))?.label ??
    (location.pathname.startsWith('/admin') ? 'Admin Dashboard' : 'Workspace');

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <Link
        to="/dashboard"
        onClick={closeMobile}
        className="flex h-[72px] shrink-0 items-center border-b border-line px-5"
      >
        <Logo />
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <p className="eyebrow px-3 pb-2.5 text-[10px]">Practice</p>
        <div className="space-y-0.5">
          {NAV_ITEMS.slice(0, 1).map(({ path, label, icon }) => (
            <NavItem key={path} to={path} label={label} icon={icon} onNavigate={closeMobile} />
          ))}
        </div>
        <p className="eyebrow px-3 pb-2.5 pt-5 text-[10px]">Prepare</p>
        <div className="space-y-0.5">
          {NAV_ITEMS.slice(1).map(({ path, label, icon }) => (
            <NavItem key={path} to={path} label={label} icon={icon} onNavigate={closeMobile} />
          ))}
        </div>

        {user?.role === 'admin' && (
          <>
            <p className="eyebrow px-3 pb-2.5 pt-5 text-[10px]">Administration</p>
            <NavItem to="/admin" label="Admin Dashboard" icon={ShieldCheckIcon} onNavigate={closeMobile} />
          </>
        )}
      </nav>

      <div className="shrink-0 border-t border-line p-3">
        <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-pine-500 text-[11px] font-bold text-paper">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-ink">{user?.full_name}</p>
            <p className="truncate text-[11px] text-muted">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-clay-600"
            title="Log out"
            aria-label="Log out"
          >
            <ArrowRightOnRectangleIcon className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-base">
      {/* Desktop sidebar */}
      <aside className="hidden border-r border-line bg-surface lg:fixed lg:inset-y-0 lg:flex lg:w-[264px] lg:flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-graphite-950/45"
            onClick={closeMobile}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 w-[280px] border-r border-line bg-surface shadow-lift">
            <button
              onClick={closeMobile}
              className="absolute right-3 top-5 z-10 grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-ink"
              aria-label="Close menu"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-30 border-b border-line bg-base/92 backdrop-blur-md">
          <DemoBanner />
          <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                className="grid h-9 w-9 place-items-center rounded-md border border-line text-ink transition-colors hover:bg-surface lg:hidden"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                <Bars3Icon className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="eyebrow text-[9px]">Workspace</p>
                <p className="truncate font-display text-[13px] font-semibold leading-tight text-ink">
                  {activeLabel}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleTheme}
                className="grid h-9 w-9 place-items-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-ink"
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <SunIcon className="h-[18px] w-[18px]" /> : <MoonIcon className="h-[18px] w-[18px]" />}
              </button>
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-md border border-line bg-surface px-2 py-1 transition-colors hover:border-accent-500/50"
              >
                <div className="grid h-7 w-7 place-items-center rounded-md bg-pine-500 text-[11px] font-bold text-paper">
                  {initials}
                </div>
                <span className="hidden pr-1 text-[13px] font-medium text-ink sm:block">{user?.first_name}</span>
              </Link>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1320px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
