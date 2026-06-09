import { BadRequestException } from '@nestjs/common';
import { decimal } from '@simcoin/shared';
import { TradingService } from './trading.service.js';

/**
 * Exercises the paper-trading settlement engine against an in-memory Postgres
 * fake. The fake interprets just the statements the service issues, keeping
 * cash / positions / orders / transactions consistent — so the fill math
 * (cash movement, weighted-average cost basis, realised PnL) is verified
 * without a real database. Money math goes through the same `decimal` helpers
 * the service uses, so there is no float drift in the assertions either.
 */

const USER = '11111111-1111-1111-1111-111111111111';
const PORTFOLIO = '22222222-2222-2222-2222-222222222222';

interface OrderRow {
  id: string;
  portfolioId: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  status: string;
  quantity: string;
  limitPrice: string | null;
  filledQty: string;
  avgFillPrice: string | null;
  createdAt: string;
  updatedAt: string;
}

const squash = (sql: string): string => sql.replace(/\s+/g, ' ').trim();

/** A tiny in-memory store + SQL interpreter covering the engine's statements. */
function makeDb(opts: { cash: string }) {
  let seq = 0;
  const nextId = (): string => `order-${++seq}`;

  const state = {
    cash: opts.cash,
    positions: new Map<string, { quantity: string; avgEntry: string }>(),
    orders: [] as OrderRow[],
    transactions: [] as { portfolioId: string; type: string }[],
  };

  const run = async (raw: string, params: unknown[] = []): Promise<{ rows: any[]; rowCount: number }> => {
    const sql = squash(raw);
    const p = params as string[];

    if (sql.startsWith('INSERT INTO orders')) {
      const isMarket = sql.includes("'market', 'filled'");
      const row: OrderRow = {
        id: nextId(),
        portfolioId: p[0]!,
        symbol: p[1]!,
        side: p[2] as 'buy' | 'sell',
        type: isMarket ? 'market' : 'limit',
        status: isMarket ? 'filled' : 'open',
        quantity: p[3]!,
        limitPrice: isMarket ? null : p[4]!,
        filledQty: isMarket ? p[3]! : '0',
        avgFillPrice: isMarket ? p[4]! : null,
        createdAt: '2026-06-09T00:00:00.000Z',
        updatedAt: '2026-06-09T00:00:00.000Z',
      };
      state.orders.push(row);
      return { rows: [row], rowCount: 1 };
    }

    if (sql.startsWith("UPDATE orders SET status = 'filled'")) {
      const o = state.orders.find((r) => r.id === p[0] && r.status === 'open');
      if (!o) return { rows: [], rowCount: 0 };
      o.status = 'filled';
      o.filledQty = o.quantity;
      o.avgFillPrice = p[1]!;
      return { rows: [], rowCount: 1 };
    }

    if (sql.startsWith("UPDATE orders SET status = 'cancelled'")) {
      const o = state.orders.find((r) => r.id === p[0] && r.portfolioId === p[1] && r.status === 'open');
      if (!o) return { rows: [], rowCount: 0 };
      o.status = 'cancelled';
      return { rows: [], rowCount: 1 };
    }

    if (sql.startsWith("UPDATE orders SET status = 'rejected'")) {
      const o = state.orders.find((r) => r.id === p[0] && r.status === 'open');
      if (o) o.status = 'rejected';
      return { rows: [], rowCount: o ? 1 : 0 };
    }

    if (sql.includes('FROM orders o JOIN portfolios')) {
      const [symbol, price] = p;
      const rows = state.orders
        .filter((o) => o.symbol === symbol && o.status === 'open' && o.type === 'limit')
        .filter((o) =>
          o.side === 'buy'
            ? decimal.gte(o.limitPrice!, price!)
            : decimal.lte(o.limitPrice!, price!),
        )
        .map((o) => ({ id: o.id, portfolioId: o.portfolioId, userId: USER, side: o.side, quantity: o.quantity }));
      return { rows, rowCount: rows.length };
    }

    if (sql.includes('FROM orders WHERE id = $1')) {
      const o = state.orders.find((r) => r.id === p[0]);
      return { rows: o ? [o] : [], rowCount: o ? 1 : 0 };
    }

    if (sql.includes('FROM orders WHERE')) {
      return { rows: state.orders, rowCount: state.orders.length };
    }

    if (sql.startsWith('SELECT id FROM portfolios')) {
      return { rows: [{ id: PORTFOLIO }], rowCount: 1 };
    }

    if (sql.includes('cash_balance AS "cashBalance" FROM portfolios')) {
      return { rows: [{ cashBalance: state.cash }], rowCount: 1 };
    }

    if (sql.includes('UPDATE portfolios SET cash_balance = cash_balance + $2')) {
      state.cash = decimal.add(state.cash, p[1]!);
      return { rows: [], rowCount: 1 };
    }

    if (sql.includes('avg_entry AS "avgEntry"') && sql.includes('FROM positions')) {
      const pos = state.positions.get(p[1]!);
      return { rows: pos ? [pos] : [], rowCount: pos ? 1 : 0 };
    }

    if (sql.startsWith('SELECT quantity FROM positions')) {
      const pos = state.positions.get(p[1]!);
      return { rows: pos ? [{ quantity: pos.quantity }] : [], rowCount: pos ? 1 : 0 };
    }

    if (sql.startsWith('INSERT INTO positions')) {
      state.positions.set(p[1]!, { quantity: p[2]!, avgEntry: p[3]! });
      return { rows: [], rowCount: 1 };
    }

    if (sql.startsWith('INSERT INTO transactions')) {
      state.transactions.push({ portfolioId: p[0]!, type: p[3]! });
      return { rows: [], rowCount: 1 };
    }

    if (sql.includes('count(*)')) {
      const count = state.transactions.filter(
        (t) => t.type === 'trade_buy' || t.type === 'trade_sell',
      ).length;
      return { rows: [{ count: String(count) }], rowCount: 1 };
    }

    throw new Error(`Unhandled SQL in fake: ${sql}`);
  };

  const db = {
    query: jest.fn(run),
    tx: jest.fn(async <T>(fn: (c: { query: typeof run }) => Promise<T>) => fn({ query: run })),
  };
  return { db, state };
}

/** Mutable price book; tests can change `prices[symbol]` between calls. */
function makeRedis(prices: Record<string, string>) {
  const published: { channel: string; payload: any }[] = [];
  const redis = {
    get: jest.fn(async (key: string) => {
      const symbol = key.replace('market:tick:', '');
      const price = prices[symbol];
      return price ? JSON.stringify({ symbol, price, ts: '2026-06-09T00:00:00.000Z' }) : null;
    }),
    publish: jest.fn(async (channel: string, payload: unknown) => {
      published.push({ channel, payload });
    }),
    subscribe: jest.fn(async () => undefined),
  };
  return { redis, published };
}

function build(cash: string, prices: Record<string, string> = { BTC: '65000' }) {
  const { db, state } = makeDb({ cash });
  const { redis, published } = makeRedis(prices);
  const svc = new TradingService(db as never, redis as never);
  const matchTick = (symbol: string, price: string) =>
    (svc as unknown as { matchLimitOrders: (t: unknown) => Promise<void> }).matchLimitOrders({
      symbol,
      price,
      ts: '2026-06-09T00:00:00.000Z',
    });
  return { svc, state, published, prices, matchTick };
}

describe('TradingService — market fills', () => {
  it('settles a market buy: debits cash, opens a position, logs the trade', async () => {
    const { svc, state, published } = build('100000', { BTC: '65000' });

    const order = await svc.placeOrder(USER, { symbol: 'BTC', side: 'buy', type: 'market', quantity: '1' });

    expect(order.status).toBe('filled');
    expect(order.avgFillPrice).toBe('65000');
    expect(decimal.eq(state.cash, '35000')).toBe(true);
    expect(state.positions.get('BTC')).toEqual({ quantity: '1', avgEntry: '65000' });

    expect(published.map((e) => e.payload.type)).toEqual(['order.filled', 'trade.executed']);
    const trade = published[1]!.payload.payload;
    expect(trade.realizedPnl).toBeNull();
    expect(trade.tradeCount).toBe(1);
  });

  it('averages cost basis across two buys at different prices', async () => {
    const { svc, state, prices } = build('200000', { BTC: '65000' });
    await svc.placeOrder(USER, { symbol: 'BTC', side: 'buy', type: 'market', quantity: '1' });

    prices.BTC = '75000';
    await svc.placeOrder(USER, { symbol: 'BTC', side: 'buy', type: 'market', quantity: '1' });

    // (1*65000 + 1*75000) / 2 = 70000
    expect(state.positions.get('BTC')).toEqual({ quantity: '2', avgEntry: '70000' });
    expect(decimal.eq(state.cash, '60000')).toBe(true);
  });

  it('computes realised PnL on a sell against the cost basis', async () => {
    const { svc, state, published, prices } = build('100000', { BTC: '60000' });
    await svc.placeOrder(USER, { symbol: 'BTC', side: 'buy', type: 'market', quantity: '1' }); // basis 60000

    prices.BTC = '80000';
    await svc.placeOrder(USER, { symbol: 'BTC', side: 'sell', type: 'market', quantity: '1' });

    // exit 80000 vs basis 60000 → realised PnL 20000; cash 100000-60000+80000 = 120000
    expect(decimal.eq(state.cash, '120000')).toBe(true);
    expect(state.positions.get('BTC')).toEqual({ quantity: '0', avgEntry: '0' });
    const lastTrade = published[published.length - 1]!.payload.payload;
    expect(decimal.eq(lastTrade.realizedPnl, '20000')).toBe(true);
    expect(lastTrade.tradeCount).toBe(2);
  });

  it('rejects a buy that exceeds available cash', async () => {
    const { svc, state } = build('1000', { BTC: '65000' });
    await expect(
      svc.placeOrder(USER, { symbol: 'BTC', side: 'buy', type: 'market', quantity: '1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(decimal.eq(state.cash, '1000')).toBe(true); // untouched
  });

  it('rejects a sell with insufficient holdings', async () => {
    const { svc } = build('100000', { BTC: '65000' });
    await expect(
      svc.placeOrder(USER, { symbol: 'BTC', side: 'sell', type: 'market', quantity: '1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('derives quantity from a USD notional', async () => {
    const { svc, state } = build('100000', { BTC: '50000' });
    await svc.placeOrder(USER, { symbol: 'BTC', side: 'buy', type: 'market', notional: '50000' });
    expect(state.positions.get('BTC')).toEqual({ quantity: '1', avgEntry: '50000' });
  });

  it('rejects an order specifying both quantity and notional', async () => {
    const { svc } = build('100000');
    await expect(
      svc.placeOrder(USER, { symbol: 'BTC', side: 'buy', type: 'market', quantity: '1', notional: '100' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('TradingService — limit orders', () => {
  it('rests a limit order open, then fills it when a tick crosses', async () => {
    const { svc, state, published, matchTick } = build('100000', { BTC: '65000' });

    const order = await svc.placeOrder(USER, {
      symbol: 'BTC',
      side: 'buy',
      type: 'limit',
      quantity: '1',
      limitPrice: '60000',
    });
    expect(order.status).toBe('open');
    expect(published).toHaveLength(0); // nothing settled yet

    // price falls to 59000 → buy limit at 60000 is crossed and fills at the tick
    await matchTick('BTC', '59000');

    expect(state.orders[0]!.status).toBe('filled');
    expect(state.positions.get('BTC')).toEqual({ quantity: '1', avgEntry: '59000' });
    expect(decimal.eq(state.cash, '41000')).toBe(true);
    expect(published.map((e) => e.payload.type)).toEqual(['order.filled', 'trade.executed']);
  });

  it('leaves a limit order open when the tick does not cross', async () => {
    const { svc, state, published, matchTick } = build('100000', { BTC: '65000' });
    await svc.placeOrder(USER, {
      symbol: 'BTC',
      side: 'buy',
      type: 'limit',
      quantity: '1',
      limitPrice: '60000',
    });

    await matchTick('BTC', '61000'); // still above the 60000 buy limit

    expect(state.orders[0]!.status).toBe('open');
    expect(published).toHaveLength(0);
  });
});
