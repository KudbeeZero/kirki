import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Authenticated app shell. Mobile-first: a fixed bottom tab bar is the primary
 * navigation, matching the eventual native client (apps/mobile).
 *
 * TODO: guard this layout — read the in-memory session (or attempt a cookie
 * refresh) and redirect to /login when there is no session. Auth gating is left
 * to a middleware/provider once the gateway refresh endpoint is wired.
 */
const TABS: Array<{ href: string; label: string }> = [
  { href: '/dashboard', label: 'Portfolio' },
  { href: '/markets', label: 'Markets' },
  { href: '/leaderboard', label: 'Ranks' },
  { href: '/learn', label: 'Learn' },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-screen-md flex-col">
      <main className="flex-1 px-4 pb-24 pt-6">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-card/95 backdrop-blur">
        <ul className="mx-auto flex w-full max-w-screen-md items-stretch justify-around">
          {TABS.map((tab) => (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className="flex flex-col items-center gap-1 py-3 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                {tab.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
