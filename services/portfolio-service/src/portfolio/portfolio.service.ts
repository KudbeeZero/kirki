import { Injectable, NotFoundException } from '@nestjs/common';
import { decimal } from '@simcoin/shared';
import type {
  Portfolio,
  Position,
  PortfolioStats,
  Transaction,
  UUID,
} from '@simcoin/types';
import { DatabaseService } from '../database/database.service.js';
import { RedisService } from '../redis/redis.service.js';

/**
 * Portfolio read model.
 *
 * Exposes a user's portfolio: cash, positions, and the derived mark-to-market
 * figures (total value, PnL, win rate). It reads the same Postgres tables that
 * the **trading-service** writes — the trading engine is the single writer and
 * settles each fill (cash + position + ledger row) atomically under row locks,
 * so this service never mutates balances. That keeps cash and holdings from
 * ever drifting apart, and makes this service a pure, side-effect-free view.
 *
 * Latest prices for mark-to-market come from the market-service Redis cache.
 */
@Injectable()
export class PortfolioService {
  constructor(
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Load a user's active-season portfolio with totals marked to latest prices.
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
      throw new NotFoundException(`No active portfolio for user '${userId}'`);
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
   * worst trade, and realised PnL — derived from the transactions ledger.
   * `realized_pnl` is set only on closing (sell) fills, so the win rate is
   * measured over closed trades, not buys.
   */
  async getStats(userId: UUID): Promise<PortfolioStats> {
    const { rows } = await this.db.query<{
      totalTrades: string;
      realizedCount: string;
      wins: string;
      bestTrade: string | null;
      worstTrade: string | null;
      realizedPnl: string | null;
    }>(
      `SELECT COUNT(*)                                      AS "totalTrades",
              COUNT(*) FILTER (WHERE realized_pnl IS NOT NULL) AS "realizedCount",
              COUNT(*) FILTER (WHERE realized_pnl > 0)      AS "wins",
              MAX(realized_pnl)                             AS "bestTrade",
              MIN(realized_pnl)                             AS "worstTrade",
              COALESCE(SUM(realized_pnl), 0)                AS "realizedPnl"
         FROM transactions t
         JOIN portfolios pf ON pf.id = t.portfolio_id
        WHERE pf.user_id = $1 AND t.type IN ('trade_buy', 'trade_sell')`,
      [userId],
    );
    const r = rows[0];
    const total = Number(r?.totalTrades ?? 0);
    const realized = Number(r?.realizedCount ?? 0);
    const wins = Number(r?.wins ?? 0);
    return {
      totalTrades: total,
      winRate: realized === 0 ? decimal.ZERO : decimal.div(String(wins), String(realized)),
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
    const pnlPct = decimal.isZero(base.startingValue)
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
