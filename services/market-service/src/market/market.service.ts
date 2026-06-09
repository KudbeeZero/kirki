import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REDIS_CHANNELS } from '@simcoin/types';
import type { Candle, Market, PriceTick } from '@simcoin/types';
import { DatabaseService } from '../database/database.service.js';
import { RedisService } from '../redis/redis.service.js';
import { MarketGateway } from './market.gateway.js';
import { PRICE_PROVIDER, type PriceProvider } from './price-provider.js';

/** The Phase-1 tradable universe. Symbols are upper-case throughout. */
export const SUPPORTED_SYMBOLS = ['BTC', 'ETH', 'SOL', 'ALGO', 'ICP', 'DOGE'] as const;

/** Redis key holding the latest cached tick for a symbol. */
const tickKey = (symbol: string): string => `market:tick:${symbol.toUpperCase()}`;

/** Catalogue rows kept in sync with the `market_data` universe. */
const MARKET_CATALOGUE: Record<string, Pick<Market, 'name' | 'decimals'>> = {
  BTC: { name: 'Bitcoin', decimals: 8 },
  ETH: { name: 'Ethereum', decimals: 8 },
  SOL: { name: 'Solana', decimals: 6 },
  ALGO: { name: 'Algorand', decimals: 6 },
  ICP: { name: 'Internet Computer', decimals: 8 },
  DOGE: { name: 'Dogecoin', decimals: 8 },
};

/**
 * Market data domain service.
 *
 * Owns the ingestion loop (poll provider → cache in Redis → persist to
 * `market_data` → publish a `price.tick` event and fan out over WebSocket) and
 * the read paths used by the HTTP controller. It depends only on the swappable
 * {@link PriceProvider} contract, never on a concrete feed.
 */
@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);
  private readonly pollIntervalMs: number;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
    private readonly gateway: MarketGateway,
    private readonly config: ConfigService,
    @Inject(PRICE_PROVIDER) private readonly provider: PriceProvider,
  ) {
    this.pollIntervalMs = Number(config.get('MARKET_POLL_INTERVAL_MS') ?? 1000);
  }

  /**
   * Start the polling loop. Idempotent — calling twice keeps a single timer.
   * Invoked from {@link MarketModule} on bootstrap.
   */
  startIngestion(): void {
    if (this.timer) return;
    this.logger.log(
      `Starting ingestion via ${this.provider.id} every ${this.pollIntervalMs}ms`,
    );
    this.timer = setInterval(() => {
      void this.ingestOnce().catch((err) =>
        this.logger.warn(`Ingestion cycle failed: ${(err as Error).message}`),
      );
    }, this.pollIntervalMs);
  }

  /** Stop the polling loop. Invoked on module destroy. */
  stopIngestion(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  /**
   * One ingestion cycle: fetch the latest ticks, cache each, persist a
   * snapshot row, then publish + fan out. Exposed (rather than private) so it
   * can be driven deterministically from tests.
   */
  async ingestOnce(): Promise<PriceTick[]> {
    const ticks = await this.provider.fetchTicks([...SUPPORTED_SYMBOLS]);
    for (const tick of ticks) {
      // Cache: latest tick per symbol with a short TTL so a stalled feed expires.
      await this.redis.set(tickKey(tick.symbol), JSON.stringify(tick), 30);
      await this.persistTick(tick);
      // Pub/sub for other services (portfolio MtM, trading limit matching).
      await this.redis.publish(REDIS_CHANNELS.priceTicks, {
        type: 'price.tick',
        payload: { symbol: tick.symbol, price: tick.price, ts: tick.ts },
      });
      // Live fan-out to subscribed WebSocket clients.
      this.gateway.broadcast(tick);
    }
    return ticks;
  }

  /** Persist a tick snapshot. Parameterised SQL only — never interpolation. */
  private async persistTick(tick: PriceTick): Promise<void> {
    await this.db.query(
      `INSERT INTO market_data (symbol, price, change_24h, volume_24h, ts)
       VALUES ($1, $2, $3, $4, $5)`,
      [tick.symbol, tick.price, tick.change24h, tick.volume24h, tick.ts],
    );
  }

  /** List the tradable markets and their static metadata. */
  listMarkets(): Market[] {
    return SUPPORTED_SYMBOLS.map((symbol) => {
      const meta = MARKET_CATALOGUE[symbol];
      return {
        id: symbol.toLowerCase(),
        symbol,
        name: meta?.name ?? symbol,
        quoteCcy: 'USD',
        decimals: meta?.decimals ?? 8,
        isActive: true,
      };
    });
  }

  /**
   * Latest price for a symbol. Reads the Redis cache first (hot path); falls
   * back to the provider on a cache miss. Throws 404 for unknown symbols.
   */
  async getPrice(symbol: string): Promise<PriceTick> {
    const upper = symbol.toUpperCase();
    if (!MARKET_CATALOGUE[upper]) throw new NotFoundException(`Unknown symbol '${symbol}'`);

    const cached = await this.redis.get(tickKey(upper));
    if (cached) return JSON.parse(cached) as PriceTick;

    const [tick] = await this.provider.fetchTicks([upper]);
    if (!tick) throw new NotFoundException(`No price available for '${symbol}'`);
    await this.redis.set(tickKey(upper), JSON.stringify(tick), 30);
    return tick;
  }

  /**
   * Historical OHLC candles for charting, delegated to the provider.
   * @param interval Candle width (defaults to 1h).
   * @param limit Maximum candles returned, newest last (defaults to 100).
   */
  async getCandles(
    symbol: string,
    interval: Candle['interval'] = '1h',
    limit = 100,
  ): Promise<Candle[]> {
    const upper = symbol.toUpperCase();
    if (!MARKET_CATALOGUE[upper]) throw new NotFoundException(`Unknown symbol '${symbol}'`);
    return this.provider.fetchCandles(upper, interval, limit);
  }
}
