import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import type { PoolClient } from 'pg';
import { decimal } from '@simcoin/shared';
import { REDIS_CHANNELS } from '@simcoin/types';
import type {
  Order,
  OrderSide,
  PlaceOrderRequest,
  PriceTickEvent,
  UUID,
} from '@simcoin/types';
import { DatabaseService } from '../database/database.service.js';
import { RedisService } from '../redis/redis.service.js';

/** Columns selected to hydrate an {@link Order} domain object. */
const ORDER_COLUMNS = `id, portfolio_id AS "portfolioId", symbol, side, type, status,
        quantity, limit_price AS "limitPrice", filled_qty AS "filledQty",
        avg_fill_price AS "avgFillPrice",
        created_at AS "createdAt", updated_at AS "updatedAt"`;

/**
 * Paper-trading order engine.
 *
 * Responsibilities:
 *  - Validate an order against available cash (buys) or holdings (sells).
 *  - Fill **market** orders immediately at the live price.
 *  - Park **limit** orders and match them as ticks arrive (buy fills at/below
 *    the limit, sell fills at/above it).
 *  - Persist orders + transactions atomically and publish `order.filled` and
 *    `trade.executed` so the portfolio and league services can react.
 *
 * All money math uses the fixed-point `decimal` helpers — never JS `number`.
 */
@Injectable()
export class TradingService implements OnModuleInit {
  private readonly logger = new Logger(TradingService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
  ) {}

  /** Subscribe to the price stream to match resting limit orders. */
  async onModuleInit(): Promise<void> {
    await this.redis.subscribe<{ type: string; payload: PriceTickEvent }>(
      REDIS_CHANNELS.priceTicks,
      (evt) => {
        if (evt.type !== 'price.tick') return;
        void this.matchLimitOrders(evt.payload).catch((err) =>
          this.logger.warn(`Limit matching failed: ${(err as Error).message}`),
        );
      },
    );
  }

  /**
   * Place an order for a user. Market orders fill synchronously; limit orders
   * are persisted `open` and matched later against ticks.
   * @param userId Authenticated caller.
   * @param req Validated order request.
   * @returns The resulting order row (filled or open).
   */
  async placeOrder(userId: UUID, req: PlaceOrderRequest): Promise<Order> {
    this.assertRequestShape(req);
    const portfolioId = await this.portfolioFor(userId);
    const price =
      req.type === 'market'
        ? await this.requireLivePrice(req.symbol)
        : this.requireLimitPrice(req);
    const quantity = this.resolveQuantity(req, price);

    if (decimal.lte(quantity, decimal.ZERO)) {
      throw new BadRequestException('Order quantity must be positive.');
    }

    // Fast-fail affordability check for nicer UX; the authoritative check runs
    // again under row locks inside the settlement transaction.
    await this.validateAffordability(portfolioId, req.symbol, req.side, quantity, price);

    if (req.type === 'market') {
      return this.fillImmediately(userId, portfolioId, req, quantity, price);
    }
    return this.restLimitOrder(portfolioId, req, quantity);
  }

  /**
   * Cancel an open order owned by the caller. Cancelling a non-open order
   * (already filled/cancelled) is a 404 — we never silently no-op a fill.
   */
  async cancelOrder(userId: UUID, orderId: UUID): Promise<{ id: UUID; status: 'cancelled' }> {
    const portfolioId = await this.portfolioFor(userId);
    const { rowCount } = await this.db.query(
      `UPDATE orders SET status = 'cancelled', updated_at = now()
        WHERE id = $1 AND portfolio_id = $2 AND status = 'open'`,
      [orderId, portfolioId],
    );
    if (rowCount === 0) {
      throw new NotFoundException(`No open order '${orderId}' for caller.`);
    }
    return { id: orderId, status: 'cancelled' };
  }

  /** List the caller's orders, newest first, optionally filtered by status. */
  async listOrders(userId: UUID, status?: Order['status']): Promise<Order[]> {
    const portfolioId = await this.portfolioFor(userId);
    const params: unknown[] = [portfolioId];
    let where = 'portfolio_id = $1';
    if (status) {
      params.push(status);
      where += ` AND status = $2`;
    }
    const { rows } = await this.db.query<Order>(
      `SELECT ${ORDER_COLUMNS} FROM orders WHERE ${where} ORDER BY created_at DESC`,
      params,
    );
    return rows;
  }

  // ── Engine internals ───────────────────────────────────────────────────────

  /**
   * Fill a market order atomically: write the order (filled), the transaction,
   * adjust cash and the position, then publish the fill + trade events. Wrapped
   * in a DB tx so a crash can never leave a fill without its cash movement.
   */
  private async fillImmediately(
    userId: UUID,
    portfolioId: UUID,
    req: PlaceOrderRequest,
    quantity: string,
    price: string,
  ): Promise<Order> {
    const { order, realizedPnl, tradeCount } = await this.db.tx(async (client) => {
      const { rows } = await client.query<Order>(
        `INSERT INTO orders
           (portfolio_id, symbol, side, type, status, quantity, limit_price,
            filled_qty, avg_fill_price)
         VALUES ($1, $2, $3, 'market', 'filled', $4, NULL, $4, $5)
         RETURNING ${ORDER_COLUMNS}`,
        [portfolioId, req.symbol, req.side, quantity, price],
      );
      const filled = rows[0]!;
      const settlement = await this.settle(client, {
        portfolioId,
        orderId: filled.id,
        symbol: req.symbol,
        side: req.side,
        quantity,
        price,
      });
      return { order: filled, ...settlement };
    });

    await this.publishFill(userId, order, price, realizedPnl, tradeCount);
    return order;
  }

  /** Persist a limit order in the `open` state to be matched against ticks. */
  private async restLimitOrder(
    portfolioId: UUID,
    req: PlaceOrderRequest,
    quantity: string,
  ): Promise<Order> {
    const { rows } = await this.db.query<Order>(
      `INSERT INTO orders
         (portfolio_id, symbol, side, type, status, quantity, limit_price, filled_qty)
       VALUES ($1, $2, $3, 'limit', 'open', $4, $5, '0')
       RETURNING ${ORDER_COLUMNS}`,
      [portfolioId, req.symbol, req.side, quantity, req.limitPrice],
    );
    return rows[0]!;
  }

  /**
   * On each tick, fill any resting limit orders the price now satisfies:
   * buys at price <= limit, sells at price >= limit. Each order settles in its
   * own transaction so one bad fill cannot roll back the rest of the batch.
   */
  private async matchLimitOrders(tick: PriceTickEvent): Promise<void> {
    const symbol = tick.symbol.toUpperCase();
    const { rows: open } = await this.db.query<{
      id: UUID;
      portfolioId: UUID;
      userId: UUID;
      side: OrderSide;
      quantity: string;
    }>(
      `SELECT o.id, o.portfolio_id AS "portfolioId", p.user_id AS "userId",
              o.side, o.quantity
         FROM orders o
         JOIN portfolios p ON p.id = o.portfolio_id
        WHERE o.symbol = $1 AND o.status = 'open' AND o.type = 'limit'
          AND ( (o.side = 'buy'  AND o.limit_price >= $2)
             OR (o.side = 'sell' AND o.limit_price <= $2) )`,
      [symbol, tick.price],
    );

    for (const o of open) {
      try {
        const result = await this.db.tx(async (client) => {
          // Re-assert the order is still open under a row lock (another tick or
          // a cancel may have raced us) before committing the fill.
          const { rowCount } = await client.query(
            `UPDATE orders
                SET status = 'filled', filled_qty = quantity,
                    avg_fill_price = $2, updated_at = now()
              WHERE id = $1 AND status = 'open'`,
            [o.id, tick.price],
          );
          if (rowCount === 0) return null; // already terminal — skip
          return this.settle(client, {
            portfolioId: o.portfolioId,
            orderId: o.id,
            symbol,
            side: o.side,
            quantity: o.quantity,
            price: tick.price,
          });
        });
        if (!result) continue;
        const { rows } = await this.db.query<Order>(
          `SELECT ${ORDER_COLUMNS} FROM orders WHERE id = $1`,
          [o.id],
        );
        await this.publishFill(
          o.userId,
          rows[0]!,
          tick.price,
          result.realizedPnl,
          result.tradeCount,
        );
      } catch (err) {
        // A resting order that can no longer settle (e.g. the holdings were
        // sold elsewhere) is rejected so it stops matching on every tick.
        await this.db.query(
          `UPDATE orders SET status = 'rejected', updated_at = now()
            WHERE id = $1 AND status = 'open'`,
          [o.id],
        );
        this.logger.warn(`Rejected limit order ${o.id}: ${(err as Error).message}`);
      }
    }
  }

  /**
   * Move cash, update the position cost-basis, and write the immutable ledger
   * row for a single fill. MUST run inside a transaction; rows are locked
   * `FOR UPDATE` so concurrent fills on the same portfolio serialise correctly.
   * @returns realized PnL (sells only) and the portfolio's lifetime trade count.
   */
  private async settle(
    client: PoolClient,
    fill: {
      portfolioId: UUID;
      orderId: UUID;
      symbol: string;
      side: OrderSide;
      quantity: string;
      price: string;
    },
  ): Promise<{ realizedPnl: string | null; tradeCount: number }> {
    const { portfolioId, orderId, symbol, side, quantity, price } = fill;
    const notional = decimal.mul(quantity, price);

    // Lock the portfolio's cash, then the position (consistent lock order).
    const { rows: pRows } = await client.query<{ cashBalance: string }>(
      `SELECT cash_balance AS "cashBalance" FROM portfolios WHERE id = $1 FOR UPDATE`,
      [portfolioId],
    );
    const cash = pRows[0]?.cashBalance ?? decimal.ZERO;

    const { rows: posRows } = await client.query<{ quantity: string; avgEntry: string }>(
      `SELECT quantity, avg_entry AS "avgEntry"
         FROM positions WHERE portfolio_id = $1 AND symbol = $2 FOR UPDATE`,
      [portfolioId, symbol],
    );
    const heldQty = posRows[0]?.quantity ?? decimal.ZERO;
    const avgEntry = posRows[0]?.avgEntry ?? decimal.ZERO;

    let cashDelta: string;
    let newQty: string;
    let newAvg: string;
    let realizedPnl: string | null = null;

    if (side === 'buy') {
      if (decimal.gt(notional, cash)) {
        throw new BadRequestException('Insufficient cash for this order.');
      }
      cashDelta = decimal.neg(notional);
      newQty = decimal.add(heldQty, quantity);
      // Weighted-average cost basis across the existing and new lots.
      newAvg = decimal.div(decimal.add(decimal.mul(heldQty, avgEntry), notional), newQty);
    } else {
      if (decimal.gt(quantity, heldQty)) {
        throw new BadRequestException('Insufficient holdings for this order.');
      }
      cashDelta = notional;
      newQty = decimal.sub(heldQty, quantity);
      newAvg = decimal.isZero(newQty) ? decimal.ZERO : avgEntry;
      // Realised PnL on the sold lot = (exit - cost basis) * quantity.
      realizedPnl = decimal.mul(decimal.sub(price, avgEntry), quantity);
    }

    await client.query(
      `UPDATE portfolios SET cash_balance = cash_balance + $2 WHERE id = $1`,
      [portfolioId, cashDelta],
    );

    await client.query(
      `INSERT INTO positions (portfolio_id, symbol, quantity, avg_entry)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (portfolio_id, symbol)
       DO UPDATE SET quantity = $3, avg_entry = $4, updated_at = now()`,
      [portfolioId, symbol, newQty, newAvg],
    );

    await client.query(
      `INSERT INTO transactions
         (portfolio_id, order_id, symbol, type, quantity, price, cash_delta, realized_pnl)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        portfolioId,
        orderId,
        symbol,
        side === 'buy' ? 'trade_buy' : 'trade_sell',
        quantity,
        price,
        cashDelta,
        realizedPnl, // null for buys; (exit - basis) * qty for sells
      ],
    );

    const { rows: countRows } = await client.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM transactions
        WHERE portfolio_id = $1 AND type IN ('trade_buy', 'trade_sell')`,
      [portfolioId],
    );
    return { realizedPnl, tradeCount: Number(countRows[0]?.count ?? '0') };
  }

  /** Emit `order.filled` and the richer `trade.executed` event for a fill. */
  private async publishFill(
    userId: UUID,
    order: Order,
    price: string,
    realizedPnl: string | null,
    tradeCount: number,
  ): Promise<void> {
    const base = {
      orderId: order.id,
      portfolioId: order.portfolioId,
      userId,
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
      price,
      at: new Date().toISOString(),
    };
    await this.redis.publish(REDIS_CHANNELS.trades, { type: 'order.filled', payload: base });
    await this.redis.publish(REDIS_CHANNELS.trades, {
      type: 'trade.executed',
      payload: { ...base, realizedPnl, tradeCount },
    });
  }

  // ── Validation & pricing ────────────────────────────────────────────────────

  /** Reject malformed requests early (exactly one of quantity/notional, etc.). */
  private assertRequestShape(req: PlaceOrderRequest): void {
    const hasQty = req.quantity !== undefined;
    const hasNotional = req.notional !== undefined;
    if (hasQty === hasNotional) {
      throw new BadRequestException('Provide exactly one of `quantity` or `notional`.');
    }
    if (req.type === 'limit' && req.limitPrice === undefined) {
      throw new BadRequestException('`limitPrice` is required for limit orders.');
    }
  }

  /** Resolve order quantity from either an explicit qty or a USD notional. */
  private resolveQuantity(req: PlaceOrderRequest, price: string): string {
    if (req.quantity !== undefined) return req.quantity;
    // notional / price → asset quantity
    return decimal.div(req.notional!, price);
  }

  private requireLimitPrice(req: PlaceOrderRequest): string {
    if (req.limitPrice === undefined) {
      throw new BadRequestException('`limitPrice` is required for limit orders.');
    }
    return req.limitPrice;
  }

  /** Latest price for a symbol from the market-service Redis cache. */
  private async requireLivePrice(symbol: string): Promise<string> {
    const raw = await this.redis.get(`market:tick:${symbol.toUpperCase()}`);
    if (!raw) {
      throw new BadRequestException(`No live price for '${symbol}'; try again shortly.`);
    }
    return (JSON.parse(raw) as { price: string }).price;
  }

  /**
   * Ensure the portfolio can afford the order: buys need enough cash for
   * quantity*price; sells need enough of the held asset.
   */
  private async validateAffordability(
    portfolioId: UUID,
    symbol: string,
    side: PlaceOrderRequest['side'],
    quantity: string,
    price: string,
  ): Promise<void> {
    if (side === 'buy') {
      const { rows } = await this.db.query<{ cashBalance: string }>(
        `SELECT cash_balance AS "cashBalance" FROM portfolios WHERE id = $1`,
        [portfolioId],
      );
      const cash = rows[0]?.cashBalance ?? decimal.ZERO;
      const cost = decimal.mul(quantity, price);
      if (decimal.gt(cost, cash)) {
        throw new BadRequestException('Insufficient cash for this order.');
      }
    } else {
      const { rows } = await this.db.query<{ quantity: string }>(
        `SELECT quantity FROM positions WHERE portfolio_id = $1 AND symbol = $2`,
        [portfolioId, symbol],
      );
      const held = rows[0]?.quantity ?? decimal.ZERO;
      if (decimal.gt(quantity, held)) {
        throw new BadRequestException('Insufficient holdings for this order.');
      }
    }
  }

  /** Resolve the active-season portfolio id for a user. */
  private async portfolioFor(userId: UUID): Promise<UUID> {
    const { rows } = await this.db.query<{ id: UUID }>(
      `SELECT id FROM portfolios
        WHERE user_id = $1
          AND season_id IS NOT DISTINCT FROM (SELECT id FROM seasons WHERE is_active LIMIT 1)`,
      [userId],
    );
    const id = rows[0]?.id;
    if (!id) throw new NotFoundException('No active portfolio for caller.');
    return id;
  }
}
