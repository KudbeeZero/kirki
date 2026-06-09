import type { Metadata } from 'next';
import type { Portfolio, Position } from '@simcoin/types';
import { Card, CardContent, CardHeader, CardTitle, Stat } from '@simcoin/ui';

export const metadata: Metadata = { title: 'Portfolio' };

/**
 * Portfolio overview: total value, cash, PnL, and open positions.
 *
 * TODO: fetch live data with the SDK once auth gating is in place, e.g.
 *   const portfolio = await api.portfolio.get();
 *   const positions = await api.portfolio.positions();
 * For now we render typed mock data so the layout is real and type-checked.
 */
const MOCK_PORTFOLIO: Portfolio = {
  id: '00000000-0000-0000-0000-000000000001',
  userId: '00000000-0000-0000-0000-0000000000aa',
  seasonId: '00000000-0000-0000-0000-0000000000s1',
  cashBalance: '4250.00',
  startingValue: '10000.00',
  totalValue: '11842.55',
  pnlPct: '18.43',
  createdAt: '2026-06-01T00:00:00.000Z',
};

const MOCK_POSITIONS: Position[] = [
  {
    id: 'p1',
    portfolioId: MOCK_PORTFOLIO.id,
    symbol: 'BTC',
    quantity: '0.0721',
    avgEntry: '61200.00',
    marketPrice: '64850.10',
    marketValue: '4675.69',
    unrealizedPnl: '263.18',
  },
  {
    id: 'p2',
    portfolioId: MOCK_PORTFOLIO.id,
    symbol: 'SOL',
    quantity: '18.4',
    avgEntry: '142.10',
    marketPrice: '157.62',
    marketValue: '2900.21',
    unrealizedPnl: '285.57',
  },
];

function money(value: string): string {
  return Number(value).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export default function DashboardPage() {
  const pnl = Number(MOCK_PORTFOLIO.pnlPct);
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">Portfolio</h1>
        <p className="text-sm text-muted-foreground">Season 1 · simulated balance</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-normal text-muted-foreground">
            Total value
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-end justify-between">
          <span className="text-3xl font-extrabold tabular-nums">
            {money(MOCK_PORTFOLIO.totalValue)}
          </span>
          <span className={pnl >= 0 ? 'text-bull' : 'text-bear'}>
            {pnl >= 0 ? '+' : ''}
            {pnl.toFixed(2)}%
          </span>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="py-4">
            <Stat label="Cash" value={money(MOCK_PORTFOLIO.cashBalance)} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <Stat label="Starting" value={money(MOCK_PORTFOLIO.startingValue)} />
          </CardContent>
        </Card>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Open positions</h2>
        {MOCK_POSITIONS.map((pos) => {
          const upnl = Number(pos.unrealizedPnl);
          return (
            <Card key={pos.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-semibold">{pos.symbol}</p>
                  <p className="text-xs text-muted-foreground">
                    {pos.quantity} @ {money(pos.avgEntry)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono tabular-nums">{money(pos.marketValue)}</p>
                  <p className={`text-xs ${upnl >= 0 ? 'text-bull' : 'text-bear'}`}>
                    {upnl >= 0 ? '+' : ''}
                    {money(pos.unrealizedPnl)}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
