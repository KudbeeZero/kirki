# portfolio-service

Owns players' portfolios and positions, and computes the derived performance
figures the rest of the app reads: mark-to-market `totalValue`, PnL, and win
rate. It is the **consumer** side of trading — it subscribes to
`trade.executed` events on Redis and folds each fill into holdings and the
transaction ledger. The trading-service stays the system of record for orders.

## Endpoints (Phase 1)

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/portfolio` | Caller's portfolio, marked to market. |
| `GET` | `/portfolio/positions` | Open positions with unrealised PnL. |
| `GET` | `/portfolio/stats` | Trade count, win rate, best/worst trade, realised PnL. |
| `GET` | `/portfolio/transactions` | Transaction ledger, newest first. `?limit&offset`. |

The authenticated user id arrives as the `x-user-id` header set by the API
gateway after it validates the bearer token. These ports are internal-only.

## Notes

- **Money is exact.** All arithmetic goes through `@simcoin/shared`'s
  fixed-point `decimal` helpers; prices/balances never touch JS `number`.
- **Latest prices** come from the market-service Redis cache (`market:tick:*`).
- **SQL.** Parameterised queries only.

## Run locally

```bash
pnpm --filter @simcoin/portfolio-service dev    # watch mode on :4003
pnpm --filter @simcoin/portfolio-service test   # unit tests
```
