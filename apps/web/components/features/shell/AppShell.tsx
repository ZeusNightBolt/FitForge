'use client';

/**
 * Authed app shell (§2.3): bottom tab bar on mobile, left sidebar on ≥md.
 * Tabs: Today · Workouts · Nutrition · Progress · Settings. The exercises catalog is a secondary
 * destination surfaced in the sidebar (desktop) and linked from Today / Workouts on mobile.
 */
import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

interface NavItem {
  href: string;
  label: string;
  icon: string;
  /** also treat these path prefixes as "active" for this tab */
  match: string[];
  primary: boolean;
}

const NAV: NavItem[] = [
  { href: '/today', label: 'Today', icon: '\u{1F3E0}', match: ['/today', '/workout'], primary: true },
  { href: '/routines', label: 'Workouts', icon: '\u{1F4AA}', match: ['/routines'], primary: true },
  { href: '/nutrition', label: 'Nutrition', icon: '\u{1F957}', match: ['/nutrition'], primary: true },
  { href: '/progress', label: 'Progress', icon: '\u{1F4C8}', match: ['/progress'], primary: true },
  { href: '/settings', label: 'Settings', icon: '\u{2699}\u{FE0F}', match: ['/settings'], primary: true },
  { href: '/exercises', label: 'Exercises', icon: '\u{1F4D6}', match: ['/exercises'], primary: false },
];

function isActive(pathname: string, item: NavItem): boolean {
  return item.match.some((m) => pathname === m || pathname.startsWith(m + '/'));
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/today';

  return (
    <div className="min-h-dvh md:flex">
      {/* Sidebar (≥md) */}
      <aside className="hidden w-60 shrink-0 border-r border-border bg-surface md:flex md:flex-col">
        <div className="flex items-center gap-2 px-5 py-5">
          <span aria-hidden className="text-2xl">
            {'\u{1F3CB}\u{FE0F}'}
          </span>
          <span className="text-lg font-bold tracking-tight">FitForge</span>
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
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-accent-muted text-accent'
                    : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground',
                )}
              >
                <span aria-hidden className="text-lg">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-5 py-4 text-xs text-muted-foreground">Signed in as Gabe</div>
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
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur md:hidden"
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
                    'flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors',
                    active ? 'text-accent' : 'text-muted-foreground',
                  )}
                >
                  <span aria-hidden className="text-xl leading-none">
                    {item.icon}
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
