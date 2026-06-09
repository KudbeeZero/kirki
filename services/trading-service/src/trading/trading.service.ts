import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { decimal } from '@simcoin/shared';
import { REDIS_CHANNELS } from '@simcoin/types';
import type {
  Order,
  PlaceOrderRequest,
  PriceTickEvent,
  UUID,
} from '@simcoin/types';
import { DatabaseService } from '../database/database.service.js';
import { RedisService } from '../redis/redis.service.js';

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

    await this.validateAffordability(portfolioId, req.symbol, req.side, quantity, price);

    if (req.type === 'market') {
      return this.fillImmediately(portfolioId, req, quantity, price);
    }
    return this.restLimitOrder(portfolioId, req, quantity);
  }

  /**
   * Cancel an open order owned by the caller. Idempotent for already-terminal
   * orders is *not* assumed — cancelling a filled order is a 400.
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
      `SELECT id, portfolio_id AS "portfolioId", symbol, side, type, status,
              quantity, limit_price AS "limitPrice", filled_qty AS "filledQty",
              avg_fill_price AS "avgFillPrice",
              created_at AS "createdAt", updated_at AS "updatedAt"
         FROM orders WHERE ${where} ORDER BY created_at DESC`,
      params,
    );
    return rows;
  }

  // ── Engine internals ───────────────────────────────────────────────────────

  /**
   * Fill a market order atomically: write the order (filled), the transaction,
   * adjust cash, then publish the fill + trade events. Wrapped in a DB tx so a
   * crash can never leave a fill without its cash movement.
   */
  private async fillImmediately(
    portfolioId: UUID,
    req: PlaceOrderRequest,
    quantity: string,
    price: string,
  ): Promise<Order> {
    // TODO(phase-1): implement the transactional write + event publish.
    // The validation, pricing, and quantity resolution above are real; the
    // persistence/settlement body is deferred until the orders/transactions
    // migration lands. Throwing prevents acknowledging an unsettled fill.
    this.logger.debug(
      `market fill ${req.side} ${quantity} ${req.symbol} @ ${price} (portfolio ${portfolioId})`,
    );
    throw new Error('NotImplemented: fillImmediately — pending orders/transactions schema');
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
       RETURNING id, portfolio_id AS "portfolioId", symbol, side, type, status,
                 quantity, limit_price AS "limitPrice", filled_qty AS "filledQty",
                 avg_fill_price AS "avgFillPrice",
                 created_at AS "createdAt", updated_at AS "updatedAt"`,
      [portfolioId, req.symbol, req.side, quantity, req.limitPrice],
    );
    return rows[0]!;
  }

  /**
   * On each tick, fill any resting limit orders the price now satisfies:
   * buys at price <= limit, sells at price >= limit.
   */
  private async matchLimitOrders(tick: PriceTickEvent): Promise<void> {
    // TODO(phase-1): SELECT open limit orders for tick.symbol whose limit is
    // crossed by tick.price, then route each through the same settlement path
    // as fillImmediately. Deferred with the persistence layer.
    this.logger.debug(`tick ${tick.symbol} @ ${tick.price} — limit scan pending`);
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
