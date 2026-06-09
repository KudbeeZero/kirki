# Portfolio API

Holdings, valuation, PnL, and the transaction ledger, served by `portfolio-service`
(`:4003`, P1). Conventions in the [API README](README.md); types from
[`@simcoin/types` · `trading.ts`](../../packages/types/src/trading.ts).

A portfolio is the caller's simulated account for the active season (`portfolios`, scoped
by `season_id`). Mark-to-market value and `pnlPct` are recomputed as prices tick and as
fills land. All endpoints are **bearer**-authenticated and operate on the caller's own
portfolio.

---

## GET /portfolio

The caller's active portfolio with live valuation.

**Response** `200` — `Portfolio`

```json
{
  "id": "…", "userId": "…", "seasonId": "…",
  "cashBalance": "92000.00000000", "startingValue": "100000.00000000",
  "totalValue": "104310.55000000", "pnlPct": "4.31",
  "createdAt": "2026-06-09T00:00:00Z"
}
```

`totalValue` = cash + positions marked at quoted prices; `pnlPct` = (realised +
unrealised) PnL vs `startingValue`, as a percent. Both are derived, not stored columns.

---

## GET /portfolio/positions

Current holdings, one row per asset.

**Response** `200` — `Position[]`

```json
[
  {
    "id": "…", "portfolioId": "…", "symbol": "BTC",
    "quantity": "0.12000000", "avgEntry": "65000.00000000",
    "marketPrice": "67250.42000000", "marketValue": "8070.05000000",
    "unrealizedPnl": "270.05000000"
  }
]
```

`avgEntry` is the cost basis; `unrealizedPnl` = (`marketPrice` − `avgEntry`) × `quantity`.

---

## GET /portfolio/transactions

The immutable ledger (paginated; see [pagination](README.md#pagination)). Newest first
(`transactions_portfolio_idx`).

**Query params** — `type?` (`TxnType`), `symbol?`, `limit?`, `cursor?`.

**Response** `200` — `{ data: Transaction[]; page: {...} }`

```json
{
  "data": [
    {
      "id": "…", "portfolioId": "…", "orderId": "…", "symbol": "BTC",
      "type": "trade_buy", "quantity": "0.01486000", "price": "67250.42000000",
      "cashDelta": "-1000.00000000", "createdAt": "2026-06-09T12:00:01Z"
    },
    {
      "id": "…", "portfolioId": "…", "orderId": null, "symbol": null,
      "type": "season_grant", "quantity": null, "price": null,
      "cashDelta": "100000.00000000", "createdAt": "2026-06-09T00:00:00Z"
    }
  ],
  "page": { "nextCursor": null, "hasMore": false, "limit": 50 }
}
```

`TxnType` ∈ `trade_buy`/`trade_sell`/`season_grant`/`reward`/`adjustment`. `cashDelta` is
signed (+credit / −debit to `cashBalance`).

---

## GET /portfolio/stats

Aggregate performance for the active portfolio.

**Response** `200` — `PortfolioStats`

```json
{
  "totalTrades": 42, "winRate": "0.57",
  "bestTrade": "1240.10000000", "worstTrade": "-380.00000000",
  "realizedPnl": "4310.55000000"
}
```

`winRate` is 0..1; `realizedPnl` is closed-position PnL only (unrealised lives on each
`Position`).
</content>
