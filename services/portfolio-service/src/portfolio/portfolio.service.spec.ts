import { NotFoundException } from '@nestjs/common';
import { decimal } from '@simcoin/shared';
import { PortfolioService } from './portfolio.service.js';

/**
 * Verifies the portfolio read model: mark-to-market totals, per-position
 * unrealised PnL, and the win-rate / realised-PnL stats. Backed by an in-memory
 * fake of the shared Postgres tables (the trading-service is the writer) plus a
 * fake of the market-service Redis price cache. Money math runs through the
 * same `decimal` helpers as production, so the assertions are exact.
 */

const USER = '11111111-1111-1111-1111-111111111111';
const PORTFOLIO = '22222222-2222-2222-2222-222222222222';

interface Txn {
  type: 'trade_buy' | 'trade_sell';
  realizedPnl: string | null;
}

function makeDb(data: {
  portfolio: { cashBalance: string; startingValue: string } | null;
  positions: { symbol: string; quantity: string; avgEntry: string }[];
  transactions: Txn[];
}) {
  const run = async (raw: string, _params: unknown[] = []): Promise<{ rows: any[] }> => {
    const sql = raw.replace(/\s+/g, ' ');

    if (sql.includes('FROM portfolios WHERE user_id')) {
      return {
        rows: data.portfolio
          ? [
              {
                id: PORTFOLIO,
                userId: USER,
                seasonId: null,
                cashBalance: data.portfolio.cashBalance,
                startingValue: data.portfolio.startingValue,
                createdAt: '2026-06-09T00:00:00.000Z',
              },
            ]
          : [],
      };
    }

    if (sql.includes('FROM positions p')) {
      return {
        rows: data.positions
          .filter((p) => !decimal.isZero(p.quantity))
          .map((p, i) => ({
            id: `pos-${i}`,
            portfolioId: PORTFOLIO,
            symbol: p.symbol,
            quantity: p.quantity,
            avgEntry: p.avgEntry,
          })),
      };
    }

    if (sql.includes('FROM transactions t') && sql.includes('COUNT(*)')) {
      const trades = data.transactions;
      const realized = trades.filter((t) => t.realizedPnl !== null);
      const wins = realized.filter((t) => decimal.gt(t.realizedPnl!, '0'));
      const pnls = realized.map((t) => t.realizedPnl!);
      const sum = pnls.reduce((a, b) => decimal.add(a, b), decimal.ZERO);
      const best = pnls.length ? pnls.reduce((a, b) => (decimal.gt(b, a) ? b : a)) : null;
      const worst = pnls.length ? pnls.reduce((a, b) => (decimal.lt(b, a) ? b : a)) : null;
      return {
        rows: [
          {
            totalTrades: String(trades.length),
            realizedCount: String(realized.length),
            wins: String(wins.length),
            bestTrade: best,
            worstTrade: worst,
            realizedPnl: sum,
          },
        ],
      };
    }

    throw new Error(`Unhandled SQL in fake: ${sql}`);
  };

  return { query: jest.fn(run) };
}

function makeRedis(prices: Record<string, string>) {
  return {
    get: jest.fn(async (key: string) => {
      const symbol = key.replace('market:tick:', '');
      const price = prices[symbol];
      return price ? JSON.stringify({ symbol, price, ts: '2026-06-09T00:00:00.000Z' }) : null;
    }),
  };
}

function build(data: Parameters<typeof makeDb>[0], prices: Record<string, string>) {
  const db = makeDb(data);
  const redis = makeRedis(prices);
  return new PortfolioService(db as never, redis as never);
}

describe('PortfolioService (read model)', () => {
  it('marks positions to market with unrealised PnL', async () => {
    const svc = build(
      {
        portfolio: { cashBalance: '50000', startingValue: '100000' },
        positions: [
          { symbol: 'BTC', quantity: '1', avgEntry: '60000' },
          { symbol: 'ETH', quantity: '2', avgEntry: '3000' },
        ],
        transactions: [],
      },
      { BTC: '65000', ETH: '3500' },
    );

    const positions = await svc.getPositions(USER);
    const btc = positions.find((p) => p.symbol === 'BTC')!;
    const eth = positions.find((p) => p.symbol === 'ETH')!;

    expect(decimal.eq(btc.marketValue, '65000')).toBe(true);
    expect(decimal.eq(btc.unrealizedPnl, '5000')).toBe(true); // (65000-60000)*1
    expect(decimal.eq(eth.marketValue, '7000')).toBe(true);
    expect(decimal.eq(eth.unrealizedPnl, '1000')).toBe(true); // (3500-3000)*2
  });

  it('computes total value and PnL% across cash + holdings', async () => {
    const svc = build(
      {
        portfolio: { cashBalance: '50000', startingValue: '100000' },
        positions: [
          { symbol: 'BTC', quantity: '1', avgEntry: '60000' },
          { symbol: 'ETH', quantity: '2', avgEntry: '3000' },
        ],
        transactions: [],
      },
      { BTC: '65000', ETH: '3500' },
    );

    const p = await svc.getPortfolio(USER);
    // holdings 72000 + cash 50000 = 122000; (122000-100000)/100000 = 0.22
    expect(decimal.eq(p.totalValue, '122000')).toBe(true);
    expect(decimal.eq(p.pnlPct, '0.22')).toBe(true);
  });

  it('values a missing live price at zero rather than throwing', async () => {
    const svc = build(
      {
        portfolio: { cashBalance: '100000', startingValue: '100000' },
        positions: [{ symbol: 'DOGE', quantity: '1000', avgEntry: '0.1' }],
        transactions: [],
      },
      {}, // no cached price for DOGE
    );
    const [pos] = await svc.getPositions(USER);
    expect(decimal.eq(pos!.marketValue, '0')).toBe(true);
    expect(decimal.eq(pos!.unrealizedPnl, '-100')).toBe(true); // 0 - (1000 * 0.1)
  });

  it('derives win rate over closed trades, plus best/worst/realised PnL', async () => {
    const svc = build(
      {
        portfolio: { cashBalance: '0', startingValue: '100000' },
        positions: [],
        transactions: [
          { type: 'trade_buy', realizedPnl: null },
          { type: 'trade_buy', realizedPnl: null },
          { type: 'trade_sell', realizedPnl: '5000' }, // win
          { type: 'trade_sell', realizedPnl: '-1000' }, // loss
        ],
      },
      {},
    );

    const stats = await svc.getStats(USER);
    expect(stats.totalTrades).toBe(4);
    expect(decimal.eq(stats.winRate, '0.5')).toBe(true); // 1 win / 2 closed
    expect(decimal.eq(stats.bestTrade, '5000')).toBe(true);
    expect(decimal.eq(stats.worstTrade, '-1000')).toBe(true);
    expect(decimal.eq(stats.realizedPnl, '4000')).toBe(true);
  });

  it('reports a zero win rate when there are no closed trades', async () => {
    const svc = build(
      {
        portfolio: { cashBalance: '0', startingValue: '100000' },
        positions: [],
        transactions: [{ type: 'trade_buy', realizedPnl: null }],
      },
      {},
    );
    const stats = await svc.getStats(USER);
    expect(stats.totalTrades).toBe(1);
    expect(decimal.eq(stats.winRate, '0')).toBe(true);
  });

  it('throws NotFound when the user has no active portfolio', async () => {
    const svc = build({ portfolio: null, positions: [], transactions: [] }, {});
    await expect(svc.getPortfolio(USER)).rejects.toBeInstanceOf(NotFoundException);
  });
});
