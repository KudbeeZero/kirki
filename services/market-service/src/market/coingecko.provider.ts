import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Candle, PriceTick } from '@simcoin/types';
import type { PriceProvider } from './price-provider.js';

/** Maps our trading symbols to CoinGecko coin ids. */
const COINGECKO_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  ALGO: 'algorand',
  ICP: 'internet-computer',
  DOGE: 'dogecoin',
};

/** Maps our candle intervals onto the CoinGecko `days` granularity buckets. */
const INTERVAL_DAYS: Record<Candle['interval'], number> = {
  '1m': 1,
  '5m': 1,
  '15m': 1,
  '1h': 7,
  '4h': 30,
  '1d': 90,
};

/**
 * Live price provider backed by the public CoinGecko REST API.
 *
 * Uses the demo/pro API key from `COINGECKO_API_KEY` when present (raising the
 * rate limit). All decimals are returned as strings to match the wire format.
 */
@Injectable()
export class CoinGeckoProvider implements PriceProvider {
  readonly id = 'coingecko';
  private readonly logger = new Logger(CoinGeckoProvider.name);
  private readonly apiKey?: string;
  private readonly baseUrl = 'https://api.coingecko.com/api/v3';

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('COINGECKO_API_KEY') || undefined;
  }

  async fetchTicks(symbols: string[]): Promise<PriceTick[]> {
    const ids = symbols
      .map((s) => COINGECKO_IDS[s.toUpperCase()])
      .filter(Boolean);
    if (ids.length === 0) return [];

    const url = new URL(`${this.baseUrl}/simple/price`);
    url.searchParams.set('ids', ids.join(','));
    url.searchParams.set('vs_currencies', 'usd');
    url.searchParams.set('include_24hr_change', 'true');
    url.searchParams.set('include_24hr_vol', 'true');

    const data = await this.getJson<Record<string, CoinGeckoSimplePrice>>(url);
    const ts = new Date().toISOString();
    const ticks: PriceTick[] = [];

    for (const symbol of symbols) {
      const id = COINGECKO_IDS[symbol.toUpperCase()];
      const row = id ? data[id] : undefined;
      if (!row) continue;
      ticks.push({
        symbol: symbol.toUpperCase(),
        price: String(row.usd),
        change24h: row.usd_24h_change != null ? String(row.usd_24h_change) : null,
        volume24h: row.usd_24h_vol != null ? String(row.usd_24h_vol) : null,
        ts,
      });
    }
    return ticks;
  }

  async fetchCandles(
    symbol: string,
    interval: Candle['interval'],
    limit: number,
  ): Promise<Candle[]> {
    const id = COINGECKO_IDS[symbol.toUpperCase()];
    if (!id) return [];

    const url = new URL(`${this.baseUrl}/coins/${id}/ohlc`);
    url.searchParams.set('vs_currency', 'usd');
    url.searchParams.set('days', String(INTERVAL_DAYS[interval]));

    // CoinGecko OHLC rows are [ts(ms), open, high, low, close]; volume is not
    // included on this endpoint, so it is reported as '0' for charting parity.
    const rows = await this.getJson<[number, number, number, number, number][]>(url);
    return rows.slice(-limit).map(([ms, open, high, low, close]) => ({
      symbol: symbol.toUpperCase(),
      interval,
      open: String(open),
      high: String(high),
      low: String(low),
      close: String(close),
      volume: '0',
      ts: new Date(ms).toISOString(),
    }));
  }

  private async getJson<T>(url: URL): Promise<T> {
    const headers: Record<string, string> = { accept: 'application/json' };
    if (this.apiKey) headers['x-cg-demo-api-key'] = this.apiKey;

    const res = await fetch(url, { headers });
    if (!res.ok) {
      this.logger.warn(`CoinGecko ${res.status} for ${url.pathname}`);
      throw new Error(`CoinGecko request failed: ${res.status}`);
    }
    return (await res.json()) as T;
  }
}

interface CoinGeckoSimplePrice {
  usd: number;
  usd_24h_change?: number;
  usd_24h_vol?: number;
}
