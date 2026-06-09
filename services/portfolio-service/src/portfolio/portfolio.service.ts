import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { decimal } from '@simcoin/shared';
import { REDIS_CHANNELS } from '@simcoin/types';
import type {
  Portfolio,
  Position,
  PortfolioStats,
  Transaction,
  UUID,
} from '@simcoin/types';
import type { TradeExecutedEvent } from '@simcoin/types';
import { DatabaseService } from '../database/database.service.js';
import { RedisService } from '../redis/redis.service.js';

/**
 * Portfolio domain service.
 *
 * Owns the read model for a user's portfolio: cash, positions, and the derived
 * mark-to-market figures (total value, PnL, win rate). It is the consumer side
 * of the trading flow — it subscribes to `trade.executed` events on Redis and
 * folds each fill into positions and transactions. The trading-service remains
 * the system of record for orders; this service materialises holdings.
 */
@Injectable()
export class PortfolioService implements OnModuleInit {
  private readonly logger = new Logger(PortfolioService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
  ) {}

  /** Subscribe to the trade stream so fills update holdings in near-real-time. */
  async onModuleInit(): Promise<void> {
    await this.redis.subscribe<{ type: string; payload: TradeExecutedEvent }>(
      REDIS_CHANNELS.trades,
      (evt) => {
        if (evt.type !== 'trade.executed') return;
        void this.applyTrade(evt.payload).catch((err) =>
          this.logger.warn(`Failed to apply trade: ${(err as Error).message}`),
        );
      },
    );
  }

  /**
   * Load a user's portfolio with totals marked to the latest prices.
   * @param userId Authenticated caller's id.
   */
  async getPortfolio(userId: UUID): Promise<Portfolio> {
    const { rows } = await this.db.query<Portfolio>(
      `SELECT id, user_id AS "userId", season_id AS "seasonId",
              cash_balance AS "cashBalance", starting_value AS "startingValue",
              created_at AS "createdAt"
         FROM portfolios WHERE user_id = $1 AND season_id IS NOT DISTINCT FROM
              (SELECT id FROM seasons WHERE is_active LIMIT 1)`,
      [userId],
    );
    const base = rows[0];
    if (!base) {
      // TODO(phase-1): auto-provision a portfolio on first login via auth events.
      throw new Error(`No active portfolio for user '${userId}'`);
    }
    const positions = await this.getPositions(userId);
    return this.markToMarket(base, positions);
  }

  /**
   * List a user's open positions, each marked to its latest price.
   * Latest prices are read from the market-service Redis cache.
   */
  async getPositions(userId: UUID): Promise<Position[]> {
    const { rows } = await this.db.query<{
      id: UUID;
      portfolioId: UUID;
      symbol: string;
      quantity: string;
      avgEntry: string;
    }>(
      `SELECT p.id, p.portfolio_id AS "portfolioId", p.symbol,
              p.quantity, p.avg_entry AS "avgEntry"
         FROM positions p
         JOIN portfolios pf ON pf.id = p.portfolio_id
        WHERE pf.user_id = $1 AND p.quantity <> '0'`,
      [userId],
    );

    const positions: Position[] = [];
    for (const row of rows) {
      const marketPrice = await this.latestPrice(row.symbol);
      const marketValue = decimal.mul(row.quantity, marketPrice);
      const costBasis = decimal.mul(row.quantity, row.avgEntry);
      positions.push({
        id: row.id,
        portfolioId: row.portfolioId,
        symbol: row.symbol,
        quantity: row.quantity,
        avgEntry: row.avgEntry,
        marketPrice,
        marketValue,
        unrealizedPnl: decimal.sub(marketValue, costBasis),
      });
    }
    return positions;
  }

  /**
   * Aggregate trading performance for a user: trade count, win rate, best and
   * worst trade, and realised PnL. Derived from the transactions ledger.
   */
  async getStats(userId: UUID): Promise<PortfolioStats> {
    const { rows } = await this.db.query<{
      totalTrades: string;
      wins: string;
      bestTrade: string | null;
      worstTrade: string | null;
      realizedPnl: string | null;
    }>(
      `SELECT COUNT(*)                              AS "totalTrades",
              COUNT(*) FILTER (WHERE realized_pnl > 0) AS "wins",
              MAX(realized_pnl)                     AS "bestTrade",
              MIN(realized_pnl)                     AS "worstTrade",
              COALESCE(SUM(realized_pnl), 0)        AS "realizedPnl"
         FROM transactions t
         JOIN portfolios pf ON pf.id = t.portfolio_id
        WHERE pf.user_id = $1 AND t.type IN ('trade_buy', 'trade_sell')`,
      [userId],
    );
    const r = rows[0];
    const total = Number(r?.totalTrades ?? 0);
    const wins = Number(r?.wins ?? 0);
    return {
      totalTrades: total,
      winRate: total === 0 ? decimal.ZERO : decimal.div(String(wins), String(total)),
      bestTrade: r?.bestTrade ?? decimal.ZERO,
      worstTrade: r?.worstTrade ?? decimal.ZERO,
      realizedPnl: r?.realizedPnl ?? decimal.ZERO,
    };
  }

  /** Page through a user's transaction ledger, newest first. */
  async getTransactions(userId: UUID, limit = 50, offset = 0): Promise<Transaction[]> {
    const { rows } = await this.db.query<Transaction>(
      `SELECT t.id, t.portfolio_id AS "portfolioId", t.order_id AS "orderId",
              t.symbol, t.type, t.quantity, t.price,
              t.cash_delta AS "cashDelta", t.created_at AS "createdAt"
         FROM transactions t
         JOIN portfolios pf ON pf.id = t.portfolio_id
        WHERE pf.user_id = $1
        ORDER BY t.created_at DESC
        LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    );
    return rows;
  }

  /**
   * Fold an executed trade into the portfolio: adjust cash and the position's
   * quantity / average entry, then append a transaction. Runs in a single
   * transaction so cash and holdings can never drift apart.
   */
  private async applyTrade(evt: TradeExecutedEvent): Promise<void> {
    // TODO(phase-1): implement position averaging + cash settlement here.
    // The shape is fixed; the body is intentionally deferred until the trading
    // engine's fill contract is locked. Throwing keeps a partial write from
    // silently corrupting balances.
    this.logger.debug(`trade.executed for portfolio ${evt.portfolioId} (${evt.symbol})`);
    throw new Error('NotImplemented: applyTrade — pending trading engine fill contract');
  }

  /** Compute mark-to-market totals from a base portfolio row and positions. */
  private markToMarket(
    base: Pick<
      Portfolio,
      'id' | 'userId' | 'seasonId' | 'cashBalance' | 'startingValue' | 'createdAt'
    >,
    positions: Position[],
  ): Portfolio {
    const holdingsValue = positions.reduce<string>(
      (acc, p) => decimal.add(acc, p.marketValue),
      decimal.ZERO,
    );
    const totalValue = decimal.add(base.cashBalance, holdingsValue);
    // pnlPct = (totalValue - startingValue) / startingValue
    const pnlPct =
      base.startingValue === decimal.ZERO
        ? decimal.ZERO
        : decimal.div(decimal.sub(totalValue, base.startingValue), base.startingValue);
    return { ...base, totalValue, pnlPct };
  }

  /** Latest price for a symbol from the market-service Redis cache. */
  private async latestPrice(symbol: string): Promise<string> {
    const raw = await this.redis.get(`market:tick:${symbol.toUpperCase()}`);
    if (!raw) return decimal.ZERO;
    return (JSON.parse(raw) as { price: string }).price;
  }
}
