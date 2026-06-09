import { NotFoundException } from '@nestjs/common';
import type { PriceTick } from '@simcoin/types';
import { REDIS_CHANNELS } from '@simcoin/types';
import { MarketService, SUPPORTED_SYMBOLS } from './market.service.js';
import type { PriceProvider } from './price-provider.js';

/**
 * Drives the ingestion pipeline with a fake provider + fake Redis/DB/gateway,
 * so cache → persist → publish → broadcast is verified without a real feed,
 * database, or socket. This is exactly the swappability the PriceProvider
 * contract exists to enable.
 */
function tick(symbol: string, price: string): PriceTick {
  return { symbol, price, change24h: '1.5', volume24h: '1000', ts: '2026-06-09T10:00:00.000Z' };
}

function makeFakeProvider(ticks: PriceTick[]): PriceProvider {
  return {
    id: 'fake',
    fetchTicks: jest.fn(async (symbols: string[]) =>
      ticks.filter((t) => symbols.includes(t.symbol)),
    ),
    fetchCandles: jest.fn(async () => []),
  };
}

function makeDeps() {
  const redisStore = new Map<string, string>();
  const redis = {
    set: jest.fn(async (k: string, v: string) => {
      redisStore.set(k, v);
    }),
    get: jest.fn(async (k: string) => redisStore.get(k) ?? null),
    publish: jest.fn(async () => undefined),
  };
  const db = { query: jest.fn(async () => ({ rows: [] })) };
  const gateway = { broadcast: jest.fn() };
  const config = { get: jest.fn(() => undefined) };
  return { redis, db, gateway, config, redisStore };
}

function build(provider: PriceProvider) {
  const { redis, db, gateway, config } = makeDeps();
  const svc = new MarketService(
    db as never,
    redis as never,
    gateway as never,
    config as never,
    provider,
  );
  return { svc, redis, db, gateway };
}

describe('MarketService ingestion pipeline', () => {
  it('ingestOnce caches, persists, publishes, and broadcasts each tick', async () => {
    const ticks = [tick('BTC', '65000'), tick('ETH', '3500')];
    const provider = makeFakeProvider(ticks);
    const { svc, redis, db, gateway } = build(provider);

    const result = await svc.ingestOnce();

    expect(result).toHaveLength(2);
    // cached under the per-symbol key with a TTL
    expect(redis.set).toHaveBeenCalledWith('market:tick:BTC', JSON.stringify(ticks[0]), 30);
    // persisted a market_data row per tick (parameterised)
    expect(db.query).toHaveBeenCalledTimes(2);
    // published on the price-ticks channel with the event envelope
    expect(redis.publish).toHaveBeenCalledWith(
      REDIS_CHANNELS.priceTicks,
      expect.objectContaining({ type: 'price.tick' }),
    );
    // fanned out to websocket clients
    expect(gateway.broadcast).toHaveBeenCalledTimes(2);
  });

  it('requests the full Phase-1 universe each cycle', async () => {
    const provider = makeFakeProvider([]);
    const { svc } = build(provider);
    await svc.ingestOnce();
    expect(provider.fetchTicks).toHaveBeenCalledWith([...SUPPORTED_SYMBOLS]);
  });

  it('getPrice serves from the Redis cache when warm', async () => {
    const provider = makeFakeProvider([tick('BTC', '65000')]);
    const { svc } = build(provider);
    await svc.ingestOnce(); // warms cache
    (provider.fetchTicks as jest.Mock).mockClear();

    const price = await svc.getPrice('btc');
    expect(price.price).toBe('65000');
    // served from cache → provider not consulted again
    expect(provider.fetchTicks).not.toHaveBeenCalled();
  });

  it('getPrice falls back to the provider on a cache miss', async () => {
    const provider = makeFakeProvider([tick('SOL', '150')]);
    const { svc } = build(provider);
    const price = await svc.getPrice('SOL');
    expect(price.price).toBe('150');
    expect(provider.fetchTicks).toHaveBeenCalledWith(['SOL']);
  });

  it('rejects unknown symbols with 404', async () => {
    const { svc } = build(makeFakeProvider([]));
    await expect(svc.getPrice('XRP')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lists the full tradable universe with metadata', () => {
    const { svc } = build(makeFakeProvider([]));
    const markets = svc.listMarkets();
    expect(markets).toHaveLength(SUPPORTED_SYMBOLS.length);
    const btc = markets.find((m) => m.symbol === 'BTC');
    expect(btc).toMatchObject({ name: 'Bitcoin', decimals: 8, quoteCcy: 'USD', isActive: true });
  });
});
