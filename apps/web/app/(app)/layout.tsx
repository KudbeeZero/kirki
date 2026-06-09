import type { ReactNode } from 'react';
import { AppShell } from './_components/app-shell';

/**
 * Authenticated app shell. Mobile-first: a fixed bottom tab bar with a raised
 * center TRADE action is the primary navigation, matching the eventual native
 * client (apps/mobile). The interactive shell (TabBar, toasts, trade sheet)
 * lives in the client `AppShell`; this layout stays a server component.
 *
 * TODO: guard this layout — read the in-memory session (or attempt a cookie
 * refresh) and redirect to /login when there is no session.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
