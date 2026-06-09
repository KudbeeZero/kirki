'use client';
import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LineChart, ArrowLeftRight, Trophy, GraduationCap } from 'lucide-react';
import { TabBar, BottomSheet, ToastProvider } from '@simcoin/ui';

const TABS = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/markets', label: 'Markets', icon: LineChart },
  { href: '/leaderboard', label: 'Ranks', icon: Trophy },
  { href: '/learn', label: 'Learn', icon: GraduationCap },
];

/**
 * Authenticated app shell: renders the page, the bottom TabBar with the raised
 * center TRADE button, the toast layer, and the trade bottom-sheet. The sheet
 * currently holds a placeholder; step (f) drops the real OrderTicket in here.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [tradeOpen, setTradeOpen] = React.useState(false);

  return (
    <ToastProvider>
      <main className="mx-auto flex min-h-dvh w-full max-w-screen-md flex-col px-4 pb-28 pt-6">
        {children}
      </main>

      <TabBar
        items={TABS}
        activeHref={pathname}
        center={{ label: 'Trade', icon: ArrowLeftRight, onPress: () => setTradeOpen(true) }}
        renderLink={({ href, className, children, ...rest }) => (
          <Link href={href} className={className} {...rest}>
            {children}
          </Link>
        )}
      />

      <BottomSheet open={tradeOpen} onClose={() => setTradeOpen(false)} title="Trade">
        <p className="py-8 text-center text-sm text-muted-foreground">
          The order ticket lands here next. Pick an asset to buy or sell against live prices.
        </p>
      </BottomSheet>
    </ToastProvider>
  );
}
