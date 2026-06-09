# Market API

Real, live price data served by `market-service` (`:4002`, P1). Conventions in the
[API README](README.md); types from
[`@simcoin/types` · `market.ts`](../../packages/types/src/market.ts).

The Phase-1 tradable universe (from [`database/seeds/01_reference.sql`](../../database/seeds/01_reference.sql)):
**BTC, ETH, SOL, ALGO, ICP, DOGE**, all quoted in USD. Prices are ingested from the
configured provider (`MARKET_DATA_PROVIDER=coingecko`) every `MARKET_POLL_INTERVAL_MS` and
cached in Redis; the durable series lives in `market_data`.

Live ticks are pushed over the [WebSocket](README.md#base-url) as `PriceTickEvent`; the
REST endpoints below are for snapshots, the universe list, and chart history.

---

## GET /markets

Public. Lists the active tradable universe.

**Response** `200` — `Market[]`

```json
[
  { "id": "…", "symbol": "BTC", "name": "Bitcoin", "quoteCcy": "USD", "decimals": 8, "isActive": true },
  { "id": "…", "symbol": "ETH", "name": "Ethereum", "quoteCcy": "USD", "decimals": 8, "isActive": true }
]
```

---

## GET /markets/:symbol

Public. One market plus its latest cached tick.

**Path params** — `symbol` (e.g. `BTC`).

**Response** `200` — `{ market: Market; tick: PriceTick }`

```json
{
  "market": { "id": "…", "symbol": "BTC", "name": "Bitcoin", "quoteCcy": "USD", "decimals": 8, "isActive": true },
  "tick": { "symbol": "BTC", "price": "67250.42000000", "change24h": "2.13", "volume24h": "31240000000.0000", "ts": "2026-06-09T12:00:01Z" }
}
```

| Error | When |
|-------|------|
| `404 MARKET_NOT_FOUND` | Unknown or inactive `symbol` |

---

## GET /markets/:symbol/candles

Public. OHLC candles for charting, read from `market_data`.

**Query params**

| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `interval` | `1m`\|`5m`\|`15m`\|`1h`\|`4h`\|`1d` | `1h` | Candle bucket |
| `from` | ISO datetime | — | Range start (optional) |
| `to` | ISO datetime | now | Range end (optional) |
| `limit` | int | 200 | Max candles (cap 1000) |

**Response** `200` — `Candle[]`

```json
[
  {
    "symbol": "BTC", "interval": "1h",
    "open": "67010.00000000", "high": "67410.00000000",
    "low": "66880.00000000", "close": "67250.42000000",
    "volume": "1840.50000000", "ts": "2026-06-09T11:00:00Z"
  }
]
```

| Error | When |
|-------|------|
| `404 MARKET_NOT_FOUND` | Unknown `symbol` |
| `400 VALIDATION` | Bad `interval`/range |
</content>
