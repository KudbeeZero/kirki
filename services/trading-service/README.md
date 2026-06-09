# trading-service

The paper-trading order engine. Validates orders against the caller's cash and
holdings, fills **market** orders immediately at the live price, parks **limit**
orders and matches them as price ticks arrive, writes orders + transactions
atomically, and publishes `order.filled` / `trade.executed` for the portfolio
and league services to consume.

## Endpoints (Phase 1)

| Method | Path | Notes |
|--------|------|-------|
| `POST`   | `/orders` | Place a market or limit order. Validated body. |
| `DELETE` | `/orders/:id` | Cancel an open order owned by the caller. |
| `GET`    | `/orders` | List the caller's orders. `?status=open\|filled\|…`. |

The authenticated user id arrives as `x-user-id` from the API gateway.

## Engine model

- **Market orders** fill synchronously at the latest price from the
  market-service Redis cache (`market:tick:*`).
- **Limit orders** are persisted `open`; the service subscribes to
  `REDIS_CHANNELS.priceTicks` and fills a resting order when the tick crosses
  its limit (buy ≤ limit, sell ≥ limit).
- **Atomicity.** Fills write the order, the transaction, and the cash movement
  inside a single DB transaction so a fill can never be acknowledged unsettled.
- **Money** uses `@simcoin/shared`'s fixed-point `decimal` helpers; SQL is
  parameterised only.

## Run locally

```bash
pnpm --filter @simcoin/trading-service dev    # watch mode on :4004
pnpm --filter @simcoin/trading-service test   # unit tests
```
