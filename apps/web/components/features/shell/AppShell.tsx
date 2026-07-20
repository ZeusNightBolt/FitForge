'use client';

/**
 * Authed app shell (§2.3): bottom tab bar on mobile, left sidebar on ≥md.
 * Tabs: Today · Workouts · Nutrition · Progress · Settings. The exercises catalog is a secondary
 * destination surfaced in the sidebar (desktop) and linked from Today / Workouts on mobile.
 */
import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  DumbbellIcon,
  AppleIcon,
  TrendingUpIcon,
  SettingsIcon,
  BookIcon,
  type IconProps,
} from '@/components/ui/icons';
import { useProfileName } from '@/lib/demo/useDemo';

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

interface NavItem {
  href: string;
  label: string;
  Icon: (p: IconProps) => React.ReactElement;
  /** also treat these path prefixes as "active" for this tab */
  match: string[];
  primary: boolean;
}

const NAV: NavItem[] = [
  { href: '/today', label: 'Today', Icon: HomeIcon, match: ['/today', '/workout'], primary: true },
  { href: '/routines', label: 'Workouts', Icon: DumbbellIcon, match: ['/routines'], primary: true },
  { href: '/nutrition', label: 'Nutrition', Icon: AppleIcon, match: ['/nutrition'], primary: true },
  { href: '/progress', label: 'Progress', Icon: TrendingUpIcon, match: ['/progress'], primary: true },
  { href: '/settings', label: 'Settings', Icon: SettingsIcon, match: ['/settings'], primary: true },
  { href: '/exercises', label: 'Exercises', Icon: BookIcon, match: ['/exercises'], primary: false },
];

function isActive(pathname: string, item: NavItem): boolean {
  return item.match.some((m) => pathname === m || pathname.startsWith(m + '/'));
}

function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent text-accent-foreground shadow-[var(--shadow-card)]">
        <DumbbellIcon size={18} />
      </span>
      <span className="text-lg font-extrabold tracking-tight">FitForge</span>
    </span>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/today';
  const name = useProfileName();

  return (
    <div className="min-h-dvh md:flex">
      {/* Sidebar (≥md) */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-surface md:flex md:flex-col">
        <div className="px-5 py-5">
          <Wordmark />
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV.map((item) => {
            const active = isActive(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                  active
                    ? 'bg-accent-muted text-accent'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <item.Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 rounded-xl bg-muted px-3 py-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
              {(name || 'Y').slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {name || 'Your profile'}
              </p>
              <p className="text-xs text-muted-foreground">Demo mode</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-[720px] flex-1 px-4 pb-28 pt-4 md:px-8 md:pb-10 md:pt-8">
          {children}
        </main>
      </div>

      {/* Bottom tab bar (mobile) */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface-2/90 backdrop-blur-lg md:hidden"
      >
        <ul className="mx-auto flex max-w-[520px] items-stretch justify-around pb-[env(safe-area-inset-bottom)]">
          {NAV.filter((i) => i.primary).map((item) => {
            const active = isActive(pathname, item);
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors',
                    active ? 'text-accent' : 'text-muted-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'grid h-8 w-14 place-items-center rounded-full transition-colors',
                      active ? 'bg-accent-muted' : 'bg-transparent',
                    )}
                  >
                    <item.Icon size={22} />
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
