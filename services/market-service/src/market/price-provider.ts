import type { Candle, PriceTick } from '@simcoin/types';

/** Injection token for the active {@link PriceProvider} implementation. */
export const PRICE_PROVIDER = Symbol('PRICE_PROVIDER');

/**
 * A swappable source of live market data.
 *
 * The market-service depends only on this contract, never on a concrete
 * provider, so CoinGecko can be replaced by Binance, a paid feed, or a mock in
 * tests without touching ingestion, caching, or the WebSocket gateway.
 */
export interface PriceProvider {
  /** Stable provider id, e.g. `'coingecko'`. */
  readonly id: string;

  /**
   * Fetch the latest tick for each requested symbol.
   * @param symbols Upper-case asset symbols, e.g. `['BTC','ETH']`.
   * @returns One {@link PriceTick} per symbol that the provider could resolve.
   */
  fetchTicks(symbols: string[]): Promise<PriceTick[]>;

  /**
   * Fetch historical OHLC candles for charting.
   * @param symbol Upper-case asset symbol.
   * @param interval Candle width.
   * @param limit Maximum number of candles, newest last.
   */
  fetchCandles(
    symbol: string,
    interval: Candle['interval'],
    limit: number,
  ): Promise<Candle[]>;
}
