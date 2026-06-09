'use client';
import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LineChart, ArrowLeftRight, Trophy, GraduationCap } from 'lucide-react';
import type { PlaceOrderRequest } from '@simcoin/types';
import { TabBar, BottomSheet, OrderTicket, ToastProvider, useToast } from '@simcoin/ui';
import { api } from '@/lib/api';

const TABS = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/markets', label: 'Markets', icon: LineChart },
  { href: '/leaderboard', label: 'Ranks', icon: Trophy },
  { href: '/learn', label: 'Learn', icon: GraduationCap },
];

const TRADE_SYMBOLS = ['BTC', 'ETH', 'SOL', 'ALGO', 'ICP', 'DOGE'];

/** Offline-friendly fallback prices so the ticket is usable before the gateway. */
const FALLBACK_PRICE: Record<string, number> = {
  BTC: 64850.1,
  ETH: 3344.2,
  SOL: 157.62,
  ALGO: 0.184,
  ICP: 12.4,
  DOGE: 0.142,
};

/**
 * Authenticated app shell. Owns the bottom TabBar (with the raised center TRADE
 * button), the toast layer, and the trade bottom-sheet hosting the OrderTicket.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ShellInner>{children}</ShellInner>
    </ToastProvider>
  );
}

function ShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { toast } = useToast();
  const [tradeOpen, setTradeOpen] = React.useState(false);
  const [symbol, setSymbol] = React.useState('BTC');
  const [price, setPrice] = React.useState<number | null>(null);

  // Fetch the latest price for the selected symbol when the sheet is open.
  React.useEffect(() => {
    if (!tradeOpen) return;
    let active = true;
    setPrice(FALLBACK_PRICE[symbol] ?? null);
    api.markets
      .price(symbol)
      .then((t) => {
        if (active) setPrice(Number(t.price));
      })
      .catch(() => {
        /* gateway not wired — keep fallback */
      });
    return () => {
      active = false;
    };
  }, [tradeOpen, symbol]);

  async function placeOrder(req: PlaceOrderRequest): Promise<void> {
    try {
      await api.trading.placeOrder(req);
    } catch {
      // Backend not wired yet — treat as a successful paper trade so the UX
      // flow is complete. TODO: remove once the trading gateway is live.
    }
    toast({
      title: `${req.side === 'buy' ? 'Bought' : 'Sold'} ${req.symbol}`,
      description: `$${req.notional} market order filled`,
      tone: 'success',
    });
  }

  return (
    <>
      <main className="mx-auto flex min-h-dvh w-full max-w-screen-md flex-col px-4 pb-28 pt-6">
        {children}
      </main>

      <TabBar
        items={TABS}
        activeHref={pathname}
        center={{ label: 'Trade', icon: ArrowLeftRight, onPress: () => setTradeOpen(true) }}
        renderLink={({ href, className, children: c, ...rest }) => (
          <Link href={href} className={className} {...rest}>
            {c}
          </Link>
        )}
      />

      <BottomSheet open={tradeOpen} onClose={() => setTradeOpen(false)} title="Trade">
        <OrderTicket
          symbol={symbol}
          price={price}
          symbols={TRADE_SYMBOLS}
          onSymbolChange={setSymbol}
          onSubmit={placeOrder}
          onClose={() => setTradeOpen(false)}
        />
      </BottomSheet>
    </>
  );
}
