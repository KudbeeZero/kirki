import type { Metadata } from 'next';
import { DashboardView } from '../_components/dashboard-view';

export const metadata: Metadata = { title: 'Home' };

/**
 * Dashboard route. The visual surface lives in the client `DashboardView`
 * (animated balance, season ring, sparklines); this server component owns the
 * route metadata. Data is typed mock for now — see backlog "apps/web dashboard".
 */
export default function DashboardPage() {
  return <DashboardView />;
}
