# market-service

Real-time market data for Simcoin. Ingests **live** prices for the Phase-1
universe (BTC, ETH, SOL, ALGO, ICP, DOGE) from a swappable provider
(CoinGecko by default), caches the latest tick in Redis, persists snapshots to
`market_data`, publishes `price.tick` events on Redis pub/sub, and streams
ticks to clients over a WebSocket gateway.

## Endpoints (Phase 1)

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/markets` | List tradable markets + metadata. |
| `GET` | `/markets/:symbol/price` | Latest price (Redis cache, provider fallback). |
| `GET` | `/markets/:symbol/candles` | Historical OHLC candles. `?interval=1h&limit=100`. |
| `WS`  | `/markets` (Socket.IO) | `subscribe`/`unsubscribe` to per-symbol `price.tick` events. |

## Architecture

- **Swappable feeds.** Everything depends on the `PriceProvider` interface; the
  active implementation is bound to the `PRICE_PROVIDER` token in `AppModule`.
  Replace CoinGecko with Binance, a paid feed, or a mock by changing one line.
- **Ingestion loop.** Polls every `MARKET_POLL_INTERVAL_MS` (default 1000ms):
  fetch ticks → cache in Redis (30s TTL) → persist to `market_data` → publish
  on `REDIS_CHANNELS.priceTicks` → fan out over WebSocket.
- **Money as strings.** All decimals cross the wire as the `Decimal` string type
  from `@simcoin/types`; no `number` math on prices.
- **SQL.** Parameterised queries only — no string interpolation.

## Run locally

```bash
pnpm --filter @simcoin/market-service dev    # watch mode on :4002
pnpm --filter @simcoin/market-service test   # unit tests
```
